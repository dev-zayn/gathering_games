import { describe, expect, test } from 'bun:test'
import type { MafiaView, RoomView } from '@shared/protocol'
import type { Member } from '@/lib/gathering/bridge'
import type { Post } from '@/lib/gathering/mailer'
import { Table } from '@/lib/gathering/table'
import type { Wire } from '@/lib/gathering/wire'

// Whole games, as گعدة plays them: the host's phone runs the table, the
// other phones talk to it through a relay that keeps `to` messages to
// their one phone, as the platform's does.

class Phone {
  room: RoomView | null = null
  errors: string[] = []
  /** Everything the relay handed this phone, to check no secret leaked. */
  heard: string[] = []
  turns: string[] = []
  readonly id: string
  private readonly host: () => Table
  constructor(id: string, host: () => Table) {
    this.id = id
    this.host = host
  }
  hear(wire: Wire) {
    this.heard.push(JSON.stringify(wire))
    if (wire.k === 'view') this.see(wire.room)
    if (wire.k === 'error') this.errors.push(wire.message)
  }
  see(room: RoomView) {
    if (room.yourTurn && room.yourTurn !== this.room?.yourTurn) this.turns.push(room.yourTurn)
    this.room = room
  }
  send(wire: Wire) {
    this.host().receive(this.id, wire)
  }
  act(action: unknown) {
    this.send({ k: 'act', action })
  }
  mafia = (): MafiaView => {
    const view = this.room?.view
    if (!view) throw new Error(`no view on ${this.id}`)
    return view
  }
  async until(check: (p: Phone) => boolean, ms = 3000) {
    const end = Date.now() + ms
    while (!check(this)) {
      if (Date.now() > end) throw new Error(`timeout on ${this.id}; view=${JSON.stringify(this.room?.view)}`)
      await new Promise((r) => setTimeout(r, 20))
    }
  }
}

function tableOf(game: RoomView['game'], n: number) {
  const members: Member[] = Array.from({ length: n }, (_, seat) => ({
    id: `ply_${String(seat)}`,
    nickname: `P${String(seat)}`,
    role: seat === 0 ? 'host' : 'player',
    seat,
    connected: true,
  }))
  const phones: Phone[] = []
  const posts: { at: number; post: Post }[] = []
  const deliver = (post: Post) => {
    posts.push({ at: Date.now(), post })
    for (const p of phones) {
      if (p.id === members[0]?.id) continue
      if (post.to === null || post.to === p.id) p.hear(post.data as Wire)
    }
  }
  let host: Table | null = null
  const getHost = () => {
    if (!host) throw new Error('no host')
    return host
  }
  host = new Table({
    game,
    code: 'K7M2QX',
    hostId: 'ply_0',
    members,
    deliver,
    local: (view) => {
      phones[0]?.see(view)
    },
    refused: (message) => {
      phones[0]?.errors.push(message)
    },
  })
  members.forEach((m) => phones.push(new Phone(m.id, getHost)))
  host.open()
  // Every guest's page comes up and asks for its view.
  phones.slice(1).forEach((p) => {
    p.send({ k: 'sync' })
  })
  const [first] = phones
  if (!first) throw new Error('no phones')
  return { phones, host: first, table: host, posts, members }
}

describe('the table', () => {
  test('every phone gets its own view; a guest cannot start', async () => {
    const { phones, table } = tableOf('mafia', 5)
    await Promise.all(phones.map((p) => p.until((q) => q.room?.players.length === 5)))
    expect(phones.map((p) => p.room?.you)).toEqual(['ply_0', 'ply_1', 'ply_2', 'ply_3', 'ply_4'])
    phones[1]?.send({ k: 'start', options: { doctor: true, detective: true } })
    await phones[1]?.until((p) => p.errors.length > 0)
    expect(phones[0]?.room?.stage).toBe('lobby')
    table.dispose()
  })

  test('a phone whose page never opened is not dealt in', async () => {
    const { phones, host, table, members } = tableOf('mafia', 6)
    // Only seats 0 and 1 asked for a view; the others' members are online, but their pages never opened.
    const late = new Table({
      game: 'mafia',
      code: 'K7M2QX',
      hostId: 'ply_0',
      members,
      deliver: () => undefined,
      local: () => undefined,
      refused: () => undefined,
    })
    late.receive('ply_1', { k: 'sync' })
    late.receive('ply_0', { k: 'start', options: { doctor: true, detective: true } })
    expect(late.scores()?.map((s) => s.player)).toEqual(['ply_0', 'ply_1'])
    late.dispose()
    await Promise.all(phones.map((p) => p.until((q) => q.room !== null)))
    host.send({ k: 'start', options: { doctor: true, detective: true } })
    await host.until((p) => p.room?.stage === 'playing')
    expect(table.scores()).toHaveLength(6)
    table.dispose()
  })

  test('a host reload picks the round back up from its snapshot', () => {
    let saved: ConstructorParameters<typeof Table>[0]['restore'] = null
    const members: Member[] = [0, 1, 2, 3, 4].map((seat) => ({
      id: `ply_${String(seat)}`,
      nickname: `P${String(seat)}`,
      role: seat === 0 ? 'host' : 'player',
      seat,
      connected: true,
    }))
    const opts = {
      game: 'mafia' as const,
      code: 'K7M2QX',
      hostId: 'ply_0',
      members,
      deliver: () => undefined,
      local: () => undefined,
      refused: () => undefined,
      save: (s: NonNullable<typeof saved>) => {
        saved = s
      },
    }
    const first = new Table(opts)
    members.slice(1).forEach((m) => {
      first.receive(m.id, { k: 'sync' })
    })
    first.receive('ply_0', { k: 'start', options: { doctor: true, detective: true } })
    first.receive('ply_1', { k: 'act', action: { type: 'seen' } })
    first.dispose()
    const views: RoomView[] = []
    const again = new Table({ ...opts, restore: saved, local: (v) => views.push(v) })
    again.open()
    expect(again.playing).toBe(true)
    expect(views.at(-1)?.stage).toBe('playing')
    again.dispose()
  })

  test('the host keeps under the relay budget, the newest view winning', async () => {
    const { phones, host, table, posts } = tableOf('mafia', 16)
    await Promise.all(phones.map((p) => p.until((q) => q.room?.players.length === 16)))
    host.send({ k: 'start', options: { doctor: true, detective: true } })
    await Promise.all(phones.map((p) => p.until((q) => q.room?.view?.game === 'mafia', 5000)))
    // Everyone looks at their card at once: 15 views per look.
    for (const p of phones) p.act({ type: 'seen' })
    await Promise.all(phones.map((p) => p.until((q) => q.mafia().phase === 'night', 5000)))
    for (const { at } of posts) {
      const inSecond = posts.filter((p) => p.at > at - 1000 && p.at <= at).length
      // A burst of 20, then 20 a second.
      expect(inSecond).toBeLessThanOrEqual(40)
    }
    table.dispose()
  })
})

describe('المافيا', () => {
  test('roles are private and the night resolves once everyone acts', async () => {
    const { phones, host, table } = tableOf('mafia', 5)
    await Promise.all(phones.map((p) => p.until((q) => q.room?.players.length === 5)))
    host.send({ k: 'start', options: { doctor: true, detective: true } })
    await Promise.all(phones.map((p) => p.until((q) => q.room?.view?.game === 'mafia')))
    const views = () => phones.map((p) => p.mafia())
    expect(views().filter((v) => v.role === 'mafia')).toHaveLength(1)
    expect(views().filter((v) => v.role !== 'mafia').every((v) => v.partners.length === 0)).toBe(true)
    // No phone was sent another's role.
    for (const p of phones.slice(1)) {
      const others = p.heard.filter((h) => h.includes('"role":"mafia"'))
      expect(others.length === 0 || p.mafia().role === 'mafia').toBe(true)
    }
    phones.forEach((p) => {
      p.act({ type: 'seen' })
    })
    await Promise.all(phones.map((p) => p.until((q) => q.mafia().phase === 'night')))
    for (const p of phones) p.act({ type: 'night', target: p.mafia().targets[0]?.id })
    await host.until((p) => ['dawn', 'over'].includes(p.mafia().phase))
    table.dispose()
  })
})
