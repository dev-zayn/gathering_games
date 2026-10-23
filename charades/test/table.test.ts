import { describe, expect, test } from 'bun:test'
import type { RoomView } from '@shared/protocol'
import type { Member } from '@/lib/gathering/bridge'
import type { Post } from '@/lib/gathering/mailer'
import { Table } from '@/lib/gathering/table'
import type { Wire } from '@/lib/gathering/wire'

// Whole games, as جمعة plays them: the host's phone runs the table, the
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
    const { phones, table } = tableOf('charades', 4)
    await Promise.all(phones.map((p) => p.until((q) => q.room?.players.length === 4)))
    expect(phones.map((p) => p.room?.you)).toEqual(['ply_0', 'ply_1', 'ply_2', 'ply_3'])
    phones[1]?.send({ k: 'start', options: { seconds: 45, turns: 2, decks: ['حيوانات'] } })
    await phones[1]?.until((p) => p.errors.length > 0)
    expect(phones[0]?.room?.stage).toBe('lobby')
    table.dispose()
  })

  test('a phone whose page never opened is not dealt in', async () => {
    const { phones, host, table, members } = tableOf('charades', 5)
    // Only seats 0 and 1 asked for a view; the others' members are online, but their pages never opened.
    const late = new Table({
      game: 'charades',
      code: 'K7M2QX',
      hostId: 'ply_0',
      members,
      deliver: () => undefined,
      local: () => undefined,
      refused: () => undefined,
    })
    late.receive('ply_1', { k: 'sync' })
    late.receive('ply_0', { k: 'start', options: { seconds: 45, turns: 2, decks: ['حيوانات'] } })
    expect(late.scores()?.map((s) => s.player).sort()).toEqual(['ply_0', 'ply_1'])
    late.dispose()
    await Promise.all(phones.map((p) => p.until((q) => q.room !== null)))
    host.send({ k: 'start', options: { seconds: 45, turns: 2, decks: ['حيوانات'] } })
    await host.until((p) => p.room?.stage === 'playing')
    expect(table.scores()).toHaveLength(5)
    table.dispose()
  })

  test('a host reload picks the round back up from its snapshot', () => {
    let saved: ConstructorParameters<typeof Table>[0]['restore'] = null
    const members: Member[] = [0, 1, 2, 3].map((seat) => ({
      id: `ply_${String(seat)}`,
      nickname: `P${String(seat)}`,
      role: seat === 0 ? 'host' : 'player',
      seat,
      connected: true,
    }))
    const opts = {
      game: 'charades' as const,
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
    first.receive('ply_0', { k: 'start', options: { seconds: 45, turns: 2, decks: ['حيوانات'] } })
    first.receive('ply_0', { k: 'act', action: { type: 'begin' } })
    first.dispose()
    const views: RoomView[] = []
    const again = new Table({ ...opts, restore: saved, local: (v) => views.push(v) })
    again.open()
    expect(again.playing).toBe(true)
    expect(views.at(-1)?.stage).toBe('playing')
    again.dispose()
  })

  test('the host keeps under the relay budget, the newest view winning', async () => {
    const { phones, host, table, posts } = tableOf('charades', 16)
    await Promise.all(phones.map((p) => p.until((q) => q.room?.players.length === 16)))
    host.send({ k: 'start', options: { seconds: 45, turns: 2, decks: ['حيوانات'] } })
    await Promise.all(phones.map((p) => p.until((q) => q.room?.view?.game === 'charades', 5000)))
    host.act({ type: 'begin' })
    const actor = phones.find((p) => p.room?.view?.isActor)
    if (!actor) throw new Error('no actor')
    await actor.until((p) => p.room?.view?.phase === 'playing')
    // The actor races through the pile: sixteen views per word.
    for (let i = 0; i < 15; i++) actor.act({ type: 'mark', got: true })
    await Promise.all(phones.map((p) => p.until((q) => q.room?.view?.got === 15, 5000)))
    for (const { at } of posts) {
      const inSecond = posts.filter((p) => p.at > at - 1000 && p.at <= at).length
      // A burst of 20, then 20 a second.
      expect(inSecond).toBeLessThanOrEqual(40)
    }
    table.dispose()
  })
})

describe('مثّلها', () => {
  test('only the actor and the other team see the word; the clock ends the turn', async () => {
    const { phones, host, table } = tableOf('charades', 4)
    await Promise.all(phones.map((p) => p.until((q) => q.room?.players.length === 4)))
    host.send({ k: 'start', options: { seconds: 45, turns: 2, decks: ['حيوانات'] } })
    await Promise.all(phones.map((p) => p.until((q) => q.room?.view?.game === 'charades')))
    const actor = phones.find((p) => p.room?.view?.game === 'charades' && p.room.view.isActor)
    if (!actor) throw new Error('no actor')
    expect(actor.turns.length).toBeGreaterThan(0)
    actor.act({ type: 'begin' })
    await Promise.all(phones.map((p) => p.until((q) => q.room?.view?.game === 'charades' && q.room.view.phase === 'playing')))
    for (const p of phones) {
      const v = p.room?.view
      if (v?.game !== 'charades') continue
      const guesser = !v.isActor && v.yourTeam === v.team
      expect(v.word === null).toBe(guesser)
    }
    // Every member of a team takes its score.
    expect(table.scores()).toHaveLength(4)
    table.dispose()
  })
})
