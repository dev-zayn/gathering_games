import { describe, expect, test } from 'bun:test'
import { isRefusal, type Ctx } from '@engine/engine'
import { CARDS, common } from '@engine/games/spot-it/deck'
import { spotIt } from '@engine/games/spot-it'
import { COUNTDOWN_MS, DEALS, FREEZE_MS, REVEAL_MS, WINDOW_MS, hasSet, type State } from '@engine/games/spot-it/rules'
import { SYMBOLS } from '@shared/data/spot-symbols'
import type { SpotMode, SpotView } from '@shared/protocol'

// لگطها's rules on a clock of the test's own: the engine is pure, so a
// whole mini-game plays in a loop, every tap stamped where the test says.

function tableAt(mode: SpotMode, players: number) {
  const ids = Array.from({ length: players }, (_, i) => `ply_${String(i)}`)
  let now = 1_000_000
  const ctx = (): Ctx => ({
    ids,
    names: Object.fromEntries(ids.map((id, i) => [id, `P${String(i)}`])),
    connected: new Set(ids),
    hostId: 'ply_0',
    now,
  })
  const options = spotIt.options({ mode })
  if (isRefusal(options)) throw new Error(options.error)
  let s: State = spotIt.start(ctx(), options)
  const t = {
    ids,
    get s() {
      return s
    },
    get now() {
      return now
    },
    /** The clock moves on, and the host's timers with it. */
    to(at: number) {
      now = at
      s = spotIt.settle(s, ctx())
    },
    act(id: string, action: Record<string, unknown>) {
      const r = spotIt.act(s, ctx(), id, { type: 'spot', at: now, ...action })
      if (!isRefusal(r)) s = r
      return r
    },
    view: (id: string) => spotIt.view(s, ctx(), id).view,
  }
  t.to(now + COUNTDOWN_MS)
  return t
}

/** A claim a sharp-eyed player could make from their view, if any. */
function rightClaim(v: SpotView): Record<string, unknown> | null {
  const pair = (a: SpotView['center'], b: SpotView['center']) => (a && b ? common(a.id, b.id) : null)
  switch (v.mode) {
    case 'tower':
    case 'well': {
      const symbol = pair(v.center, v.mine)
      return symbol === null || !v.center || !v.mine ? null : { symbol, seen: [v.center.id, v.mine.id] }
    }
    case 'gift':
    case 'potato': {
      const main = v.mode === 'gift' ? v.center : v.mine
      for (const seat of v.seats) {
        const symbol = pair(main, seat.top)
        if (symbol !== null && main && seat.top) return { symbol, target: seat.id, seen: [main.id, seat.top.id] }
      }
      return null
    }
    case 'triplet': {
      const counts = new Map<number, number>()
      for (const c of v.grid) for (const sym of c.symbols) counts.set(sym, (counts.get(sym) ?? 0) + 1)
      const symbol = [...counts].find(([, n]) => n >= 3)?.[0]
      return symbol === undefined ? null : { symbol, seen: v.grid.map((c) => c.id) }
    }
  }
}

/** Bots play the mini-game out: each beat a random player makes a right catch. */
function playOut(mode: SpotMode, players: number) {
  const t = tableAt(mode, players)
  for (let beat = 0; beat < 2000 && t.s.phase !== 'over'; beat++) {
    if (t.s.phase === 'countdown') {
      t.to(t.s.until)
      continue
    }
    const order = [...t.ids].sort(() => Math.random() - 0.5)
    const by = order.find((id) => rightClaim(t.view(id)) !== null)
    if (!by) throw new Error(`${mode}: nobody can catch; state=${JSON.stringify(t.s)}`)
    const claim = rightClaim(t.view(by))
    expect(isRefusal(t.act(by, claim ?? {}))).toBe(false)
    t.to(t.now + WINDOW_MS + REVEAL_MS)
  }
  expect(t.s.phase).toBe('over')
  return t
}

describe('the deck', () => {
  test('57 cards of 8, any two sharing exactly one symbol, every symbol on 8 cards', () => {
    expect(CARDS).toHaveLength(57)
    expect(SYMBOLS).toHaveLength(57)
    for (const card of CARDS) expect(new Set(card).size).toBe(8)
    for (let a = 0; a < CARDS.length; a++) {
      for (let b = a + 1; b < CARDS.length; b++) {
        const one = CARDS[a]?.filter((s) => CARDS[b]?.includes(s)) ?? []
        expect(one).toHaveLength(1)
      }
    }
    for (let sym = 0; sym < 57; sym++) expect(CARDS.filter((c) => c.includes(sym))).toHaveLength(8)
  })
})

describe('the race', () => {
  test('the cards stay face down through the countdown, then a catch waits out its window', () => {
    const t = tableAt('tower', 2)
    const v = t.view('ply_1')
    expect(v.phase).toBe('play')
    const claim = rightClaim(v)
    t.act('ply_1', claim ?? {})
    expect(t.s.queue).toHaveLength(1)
    t.to(t.now + WINDOW_MS)
    const after = t.view('ply_1')
    expect(after.count).toBe(2)
    expect(after.last?.you).toBe(true)
    expect(after.center?.at).toBe(t.now + REVEAL_MS)
  })

  test('the earliest tap wins, not the nearest phone; the later one is late, not wrong', () => {
    const t = tableAt('well', 2)
    const start = t.now
    const near = rightClaim(t.view('ply_0'))
    const far = rightClaim(t.view('ply_1'))
    // The host's tap arrives first but was made later than the guest's.
    t.to(start + 100)
    t.act('ply_0', { ...near, at: start + 100 })
    t.to(start + 150)
    t.act('ply_1', { ...far, at: start + 60 })
    t.to(start + 100 + WINDOW_MS)
    expect(t.s.last?.by).toBe('ply_1')
    expect(t.s.frozen.ply_0).toBeUndefined()
  })

  test('a wrong tap freezes; a tap while frozen is refused', () => {
    const t = tableAt('tower', 2)
    const v = t.view('ply_1')
    const right = rightClaim(v)
    const wrong = v.mine?.symbols.find((sym) => sym !== right?.symbol) ?? -1
    t.act('ply_1', { symbol: wrong, seen: right?.seen })
    expect(t.s.frozen.ply_1).toBe(t.now + FREEZE_MS)
    expect(isRefusal(t.act('ply_1', right ?? {}))).toBe(true)
    t.to(t.now + FREEZE_MS)
    expect(isRefusal(t.act('ply_1', right ?? {}))).toBe(false)
  })

  test('a tap on cards that changed since is late, never a freeze', () => {
    const t = tableAt('tower', 3)
    const old = rightClaim(t.view('ply_2'))
    t.act('ply_1', rightClaim(t.view('ply_1')) ?? {})
    t.to(t.now + WINDOW_MS)
    const r = t.act('ply_2', { symbol: 0, seen: old?.seen })
    expect(isRefusal(r)).toBe(true)
    expect(t.s.frozen.ply_2).toBeUndefined()
  })

  test('nobody taps in the countdown, and a watcher is not dealt in', () => {
    const ctx: Ctx = { ids: ['ply_0', 'ply_1'], names: {}, connected: new Set(['ply_0', 'ply_1']), hostId: 'ply_0', now: 0 }
    const s = spotIt.start(ctx, { mode: 'tower' })
    const right = rightClaim(spotIt.view(s, ctx, 'ply_1').view)
    expect(isRefusal(spotIt.act(s, ctx, 'ply_1', { type: 'spot', ...right }))).toBe(true)
    expect(spotIt.view(s, ctx, 'ply_9').view.dealt).toBe(false)
    expect(isRefusal(spotIt.act(spotIt.settle(s, { ...ctx, now: COUNTDOWN_MS }), ctx, 'ply_9', { type: 'spot', symbol: 0 }))).toBe(true)
  })
})

describe('the five mini-games, played out', () => {
  test('the tower: the whole deck shared out, the tallest tower first', () => {
    const t = playOut('tower', 4)
    const total = t.ids.reduce((n, id) => n + (t.s.piles[id]?.length ?? 0), 0)
    expect(total).toBe(57)
    const scores = spotIt.scores(t.s)
    const best = Math.max(...scores.map((x) => x.score))
    expect(t.view('ply_0').winners).toEqual(scores.filter((x) => x.score === best).map((x) => `P${x.player.slice(4)}`))
  })

  test('the well: over the moment one pile empties; that player scores best', () => {
    const t = playOut('well', 3)
    const scores = spotIt.scores(t.s)
    const winner = scores.find((x) => x.score === 0)
    expect(winner).toBeDefined()
    expect(scores.every((x) => x.score <= 0)).toBe(true)
  })

  test('the hot potato: five deals, each lost by the one left holding them', () => {
    const t = playOut('potato', 4)
    expect(t.s.deal).toBe(DEALS)
    const lost = spotIt.scores(t.s).reduce((n, x) => n - x.score, 0)
    // Each deal ends with all four of its cards in one hand.
    expect(lost).toBe(DEALS * 4)
  })

  test('the poisoned gift: the middle card always goes to someone else', () => {
    const t = playOut('gift', 3)
    const total = t.ids.reduce((n, id) => n + (t.s.piles[id]?.length ?? 0), 0)
    expect(total).toBe(57)
    expect(t.view('ply_0').lowWins).toBe(true)
  })

  test('the triplet: sets of three until none is left to find', () => {
    const t = playOut('triplet', 2)
    const taken = t.ids.reduce((n, id) => n + (t.s.score[id] ?? 0), 0)
    expect(taken % 3).toBe(0)
    expect(taken + t.s.grid.length).toBe(57)
    expect(hasSet(t.s.grid)).toBe(false)
  })
})
