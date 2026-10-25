import { describe, expect, test } from 'bun:test'
import { bestPlay } from '@shared/backgammon/bot'
import { diceOf } from '@shared/backgammon/moves'
import type { BgView, RoomView } from '@shared/protocol'
import type { Member } from '@/lib/gathering/bridge'
import type { Post } from '@/lib/gathering/mailer'
import { Table } from '@/lib/gathering/table'
import type { Wire } from '@/lib/gathering/wire'

const ONE_GAME = { length: 1, cube: true }

// Whole games, as گعدة plays them: the host's phone runs the table, the
// other phone talks to it through a relay that keeps `to` messages to
// their one phone, as the platform's does.

class Phone {
  room: RoomView | null = null
  errors: string[] = []
  /** Everything the relay handed this phone. */
  heard: string[] = []
  turns: string[] = []
  readonly id: string
  private readonly host: () => Table
  constructor(id: string, host: () => Table) {
    this.id = id
    this.host = host
  }
  get view(): BgView | null {
    return this.room?.view ?? null
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

function membersOf(n: number): Member[] {
  return Array.from({ length: n }, (_, seat) => ({
    id: `ply_${String(seat)}`,
    nickname: `P${String(seat)}`,
    role: seat === 0 ? 'host' : 'player',
    seat,
    connected: true,
  }))
}

function tableOf(n: number) {
  const members = membersOf(n)
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
    game: 'backgammon',
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
  // The guest's page comes up and asks for its view.
  phones.slice(1).forEach((p) => {
    p.send({ k: 'sync' })
  })
  const [first, second] = phones
  if (!first || !second) throw new Error('no phones')
  return { phones, host: first, guest: second, table: host, posts }
}

/** The phone whose turn it is plays it the bot's way. */
function playTurn(phones: Phone[]) {
  for (const p of phones) {
    const v = p.view
    if (v?.seat == null || p.room?.yourTurn === null) continue
    const me = v.board[v.seat]
    const them = v.board[v.seat === 0 ? 1 : 0]
    if (v.phase === 'roll') p.act({ type: 'roll' })
    else if (v.phase === 'double') p.act({ type: 'take' })
    else if (v.phase === 'move' && v.dice) p.act({ type: 'play', moves: bestPlay(me, them, diceOf(v.dice)) })
    return
  }
}

describe('the table', () => {
  test('each phone gets its own seat; a guest cannot start', async () => {
    const { phones, guest, table } = tableOf(2)
    await Promise.all(phones.map((p) => p.until((q) => q.room?.players.length === 2)))
    expect(phones.map((p) => p.room?.you)).toEqual(['ply_0', 'ply_1'])
    guest.send({ k: 'start', options: ONE_GAME })
    await guest.until((p) => p.errors.length > 0)
    expect(phones[0]?.room?.stage).toBe('lobby')
    table.dispose()
  })

  test('the box does not open before the other side’s page is up', () => {
    const errors: string[] = []
    const lone = new Table({
      game: 'backgammon',
      code: 'K7M2QX',
      hostId: 'ply_0',
      members: membersOf(2),
      deliver: () => undefined,
      local: () => undefined,
      refused: (m) => errors.push(m),
    })
    lone.receive('ply_0', { k: 'start', options: ONE_GAME })
    expect(lone.playing).toBe(false)
    expect(errors).toHaveLength(1)
    lone.receive('ply_1', { k: 'sync' })
    lone.receive('ply_0', { k: 'start', options: ONE_GAME })
    expect(lone.playing).toBe(true)
    lone.dispose()
  })

  test('a whole game over the relay: the turn told to one phone at a time', async () => {
    const { phones, host, guest, table } = tableOf(2)
    await Promise.all(phones.map((p) => p.until((q) => q.room?.players.length === 2)))
    host.send({ k: 'start', options: { length: 1, cube: false } })
    await Promise.all(phones.map((p) => p.until((q) => q.view?.game === 'backgammon')))
    expect(host.view?.seat).toBe(0)
    expect(guest.view?.seat).toBe(1)
    for (let i = 0; i < 2000 && host.view?.phase !== 'over'; i++) {
      expect(phones.filter((p) => p.room?.yourTurn !== null)).toHaveLength(1)
      const before = host.room
      playTurn(phones)
      expect(host.room).not.toBe(before)
      // The guest's view catches up with the host's before the next move.
      const key = (v: BgView | null) => JSON.stringify([v?.board, v?.phase, v?.turn, v?.dice, v?.last?.n])
      await guest.until((p) => key(p.view) === key(host.view), 2000)
    }
    expect(host.view?.phase).toBe('over')
    expect(host.errors).toEqual([])
    expect(guest.errors).toEqual([])
    const scores = table.scores()
    expect(scores?.map((s) => s.player)).toEqual(['ply_0', 'ply_1'])
    expect(scores?.some((s) => s.score > 0)).toBe(true)
    table.dispose()
  }, 30_000)

  test('a host reload picks the game back up from its snapshot', () => {
    let saved: ConstructorParameters<typeof Table>[0]['restore'] = null
    const opts = {
      game: 'backgammon' as const,
      code: 'K7M2QX',
      hostId: 'ply_0',
      members: membersOf(2),
      deliver: () => undefined,
      local: () => undefined,
      refused: () => undefined,
      save: (s: NonNullable<typeof saved>) => {
        saved = s
      },
    }
    const first = new Table(opts)
    first.receive('ply_1', { k: 'sync' })
    first.receive('ply_0', { k: 'start', options: ONE_GAME })
    first.dispose()
    const views: RoomView[] = []
    const again = new Table({ ...opts, restore: saved, local: (v) => views.push(v) })
    again.open()
    expect(again.playing).toBe(true)
    expect(views.at(-1)?.view?.board[0]?.[13]).toBe(5)
    again.dispose()
  })

  test('the host keeps under the relay budget, the newest view winning', async () => {
    const { phones, host, guest, table, posts } = tableOf(2)
    await Promise.all(phones.map((p) => p.until((q) => q.room?.players.length === 2)))
    host.send({ k: 'start', options: ONE_GAME })
    await guest.until((q) => q.view?.game === 'backgammon')
    // The guest asks again and again, and stages a move that is never legal (a refusal each time).
    for (let i = 0; i < 60; i++) {
      guest.send({ k: 'sync' })
      guest.act({ type: 'stage', moves: [{ from: 6, to: 1, die: 4 }] })
    }
    await guest.until((q) => q.errors.length > 0, 5000)
    for (const { at } of posts) {
      const inSecond = posts.filter((p) => p.at > at - 1000 && p.at <= at).length
      // A burst of 20, then 20 a second.
      expect(inSecond).toBeLessThanOrEqual(40)
    }
    table.dispose()
  })
})
