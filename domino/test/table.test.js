// The host's table over a fake relay: `to` messages reach their one phone,
// a room-wide one every phone, as گعدة's relay does.
const { describe, expect, test } = require('bun:test')
const D = require('../rules.js')
const R = require('../room.js')

class Phone {
  constructor(id, host) { this.id = id; this.host = host; this.room = null; this.errors = []; this.heard = [] }
  hear(wire) {
    this.heard.push(wire)
    if (wire.k === 'view') this.room = wire.room
    if (wire.k === 'error') this.errors.push(wire.message)
  }
  send(wire) { this.host().receive(this.id, wire) }
  act(action) { this.send({ k: 'act', action }) }
  async until(check, ms = 3000) {
    const end = Date.now() + ms
    while (!check(this)) {
      if (Date.now() > end) throw new Error(`timeout on ${this.id}: ${JSON.stringify(this.room && this.room.view)}`)
      await new Promise((r) => setTimeout(r, 15))
    }
  }
}

function tableOf(n, extra = {}) {
  const members = Array.from({ length: n }, (_, seat) => ({ id: `ply_${seat}`, nickname: `P${seat}`, role: seat === 0 ? 'host' : 'player', seat, connected: true }))
  const phones = []
  const posts = []
  let table = null
  const deliver = (post) => {
    posts.push({ at: Date.now(), post })
    for (const p of phones) if (p.id !== 'ply_0' && (post.to === null || post.to === p.id)) p.hear(post.data)
  }
  table = new R.Table(Object.assign({
    code: 'K7M2', hostId: 'ply_0', members, deliver,
    local: (view) => { phones[0].room = view },
    refused: (text) => { phones[0].errors.push(text) },
  }, extra))
  members.forEach((m) => phones.push(new Phone(m.id, () => table)))
  table.open()
  phones.slice(1).forEach((p) => p.send({ k: 'sync' }))
  return { table, phones, posts, members }
}

describe('the table', () => {
  test('a guest cannot start; the host starts once a second page is up', async () => {
    const { table, phones } = tableOf(3)
    phones[1].send({ k: 'start', options: { target: 50 } })
    await phones[1].until((p) => p.errors.length > 0)
    expect(phones[0].room.stage).toBe('lobby')
    phones[0].send({ k: 'start', options: { target: 50 } })
    await Promise.all(phones.map((p) => p.until((q) => q.room && q.room.stage === 'playing')))
    expect(phones.map((p) => p.room.view.seat)).toEqual([0, 1, 2])
    expect(phones[0].room.view.target).toBe(50)
    table.dispose()
  })

  test('every phone hears only its own hand', async () => {
    const { table, phones } = tableOf(4)
    phones[0].send({ k: 'start', options: { target: 100 } })
    await Promise.all(phones.map((p) => p.until((q) => q.room && q.room.view)))
    for (const p of phones.slice(1)) {
      const views = p.heard.filter((w) => w.k === 'view' && w.room.view)
      expect(views.every((w) => w.room.you === p.id)).toBe(true)
      const others = table.state.players.filter((x) => x.id !== p.id).flatMap((x) => x.hand)
      const mine = p.room.view.hand.map((t) => t.join())
      expect(others.some((t) => mine.includes(t.join()))).toBe(false)
    }
    // Exactly one phone is told it is their turn.
    expect(phones.filter((p) => p.room.yourTurn).length).toBe(1)
    table.dispose()
  })

  test('a whole match over the relay, every phone playing the computer’s way', async () => {
    const { table, phones } = tableOf(3)
    phones[0].send({ k: 'start', options: { target: 50 } })
    await Promise.all(phones.map((p) => p.until((q) => q.room && q.room.view)))
    for (let i = 0; i < 3000 && table.state.phase !== 'match'; i++) {
      const s = table.state
      if (s.phase === 'round') { phones[1].act({ type: 'next' }); continue }
      const mover = phones[s.turn]
      await mover.until((p) => p.room.view.turn === s.turn && p.room.view.last.n === s.last.n)
      const v = mover.room.view
      // The phone decides from its own view alone, as the page does.
      const own = { players: v.players.map((p, i) => ({ hand: i === v.seat ? v.hand : [] })), board: v.board, left: v.left, right: v.right, boneyard: Array(v.boneyard).fill([0, 0]), turn: v.turn, phase: v.phase }
      mover.act(D.aiAction(own, v.seat))
    }
    expect(table.state.phase).toBe('match')
    expect(phones.flatMap((p) => p.errors)).toEqual([])
    const scores = table.scores()
    expect(scores.map((x) => x.player)).toEqual(['ply_0', 'ply_1', 'ply_2'])
    expect(Math.max(...scores.map((x) => x.score))).toBeGreaterThanOrEqual(50)
    table.dispose()
  }, 20000)

  test('the clock plays a quiet turn the computer’s way, and deals the next round', () => {
    let now = 1_000_000
    const { table, phones } = tableOf(2, { now: () => now })
    phones[0].send({ k: 'start', options: { target: 150 } })
    const before = table.state.last.n
    now = table.until
    table.wake()
    expect(table.state.last.n).toBeGreaterThan(before)
    // Force a round's end, then let the clock deal.
    table.state.phase = 'round'
    table.state.result = { winner: 0, gained: 0, blocked: false, hands: [[], []] }
    now = table.until = now + 1
    table.wake()
    expect(table.state.phase).toBe('play')
    expect(table.state.round).toBe(2)
    table.dispose()
  })

  test('a host reload picks the match back up from its snapshot', () => {
    let saved = null
    const first = tableOf(2, { save: (s) => { saved = s } })
    first.phones[0].send({ k: 'start', options: { target: 100 } })
    const hand = first.table.state.players[1].hand.map((t) => t.join())
    first.table.dispose()
    let seen = null
    const again = new R.Table({ code: 'K7M2', hostId: 'ply_0', members: first.members, deliver: () => {}, local: (v) => { seen = v }, restore: saved })
    again.open()
    expect(seen.stage).toBe('playing')
    expect(again.state.players[1].hand.map((t) => t.join())).toEqual(hand)
    again.dispose()
  })

  test('the host keeps under the relay budget', async () => {
    const { table, phones, posts } = tableOf(4)
    phones[0].send({ k: 'start', options: { target: 100 } })
    for (let i = 0; i < 30; i++) for (const p of phones.slice(1)) { p.send({ k: 'sync' }); p.act({ type: 'pass' }) }
    await phones[3].until((p) => p.errors.length > 0, 5000)
    for (const { at } of posts) expect(posts.filter((p) => p.at > at - 1000 && p.at <= at).length).toBeLessThanOrEqual(40)
    table.dispose()
  })
})
