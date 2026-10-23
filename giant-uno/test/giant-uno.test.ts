import { describe, expect, test } from 'bun:test'
import { isRefusal, type Ctx } from '@engine/engine'
import { giantUno } from '@engine/games/giant-uno'
import { HAND_SIZE, fits, type State } from '@engine/games/giant-uno/rules'
import { COLORS, DECK, cardOf, handPoints, pointsOf } from '@shared/data/deck'
import type { UnoColor, UnoKind, UnoOptions } from '@shared/protocol'

const ONE: UnoOptions = { target: 0, scoring: 'winner', house: 'again' }

function ctxOf(n: number, now = 1_000_000): Ctx {
  const ids = Array.from({ length: n }, (_, i) => `p${String(i)}`)
  return { ids, names: Object.fromEntries(ids.map((id) => [id, id.toUpperCase()])), connected: new Set(ids), hostId: 'p0', now }
}

/** A card of this kind and colour (the first one in the deck). */
function find(kind: UnoKind, color: UnoColor | null = null, value: number | null = null): number {
  const card = DECK.find((c) => c.kind === kind && c.color === color && (value === null || c.value === value))
  if (!card) throw new Error(`no ${kind}`)
  return card.id
}

/** All 108 cards: the given hands and top, everything else in the pile. */
function table(n: number, hands: number[][], top: number, color: UnoColor, options: UnoOptions = ONE): { s: State; ctx: Ctx } {
  const ctx = ctxOf(n)
  const s = giantUno.start(ctx, options)
  const used = new Set([top, ...hands.flat()])
  s.hands = Object.fromEntries(ctx.ids.map((id, i) => [id, [...(hands[i] ?? [])]]))
  s.discard = [top]
  s.pile = DECK.map((c) => c.id).filter((id) => !used.has(id))
  s.color = color
  s.turn = 0
  s.dir = 1
  s.phase = 'play'
  s.until = ctx.now + 30_000
  s.called = {}
  s.exposed = null
  s.drawn = null
  return { s, ctx }
}

function act(s: State, ctx: Ctx, who: string, action: unknown): State {
  const next = giantUno.act(s, ctx, who, action)
  if (isRefusal(next)) throw new Error(`${who} ${JSON.stringify(action)} refused: ${next.error}`)
  return giantUno.settle(next, ctx)
}

/** The clock's call, at the time it is due. */
function wake(s: State, ctx: Ctx): State {
  if (!giantUno.wake) throw new Error('no clock')
  return giantUno.wake(s, ctx)
}

const refused = (s: State, ctx: Ctx, who: string, action: unknown) => isRefusal(giantUno.act(s, ctx, who, action))
const count = (s: State) => s.pile.length + s.discard.length + Object.values(s.hands).reduce((n, h) => n + h.length, 0)
const turnOf = (s: State) => s.ids[s.turn]

const R5 = find('number', 'red', 5)
const R7 = find('number', 'red', 7)
const B7 = find('number', 'blue', 7)
const G2 = find('number', 'green', 2)
const Y3 = find('number', 'yellow', 3)
const B1 = find('number', 'blue', 1)

describe('the deck', () => {
  test('is the box: 108 cards, 19 numbers and 6 symbols a colour, 8 wilds', () => {
    expect(DECK).toHaveLength(108)
    for (const color of COLORS) {
      const mine = DECK.filter((c) => c.color === color)
      expect(mine.filter((c) => c.kind === 'number')).toHaveLength(19)
      expect(mine.filter((c) => c.kind === 'number' && c.value === 0)).toHaveLength(1)
      for (const kind of ['skip', 'reverse', 'draw2'] as const) expect(mine.filter((c) => c.kind === kind)).toHaveLength(2)
    }
    expect(DECK.filter((c) => c.kind === 'wild')).toHaveLength(2)
    expect(DECK.filter((c) => c.kind === 'wild4')).toHaveLength(4)
    expect(DECK.filter((c) => c.kind === 'custom')).toHaveLength(2)
  })

  test('scores the box’s example at 141', () => {
    const held = [find('number', 'red', 8), find('number', 'blue', 3), find('skip', 'green'), find('draw2', 'yellow'), find('wild4'), find('custom')]
    expect(handPoints(held)).toBe(141)
    expect(pointsOf(cardOf(find('wild')))).toBe(50)
  })

  test('a card fits on colour, number or symbol; a wild on anything; a called wild by its colour only', () => {
    expect(fits(cardOf(R5), cardOf(R7), 'red')).toBe(true)
    expect(fits(cardOf(B7), cardOf(R7), 'red')).toBe(true)
    expect(fits(cardOf(G2), cardOf(R7), 'red')).toBe(false)
    expect(fits(cardOf(find('reverse', 'red')), cardOf(find('reverse', 'yellow')), 'yellow')).toBe(true)
    expect(fits(cardOf(find('wild4')), cardOf(R7), 'red')).toBe(true)
    expect(fits(cardOf(B7), cardOf(find('wild')), 'green')).toBe(false)
    expect(fits(cardOf(G2), cardOf(find('wild')), 'green')).toBe(true)
  })
})

describe('a deal', () => {
  test('seven each, all 108 accounted for, never a Draw Four turned up', () => {
    for (let i = 0; i < 300; i++) {
      const ctx = ctxOf(2 + (i % 9))
      const s = giantUno.start(ctx, ONE)
      expect(count(s)).toBe(108)
      expect(cardOf(s.discard[0] ?? -1).kind).not.toBe('wild4')
      const drawn = cardOf(s.discard[0] ?? -1).kind === 'draw2' ? 2 : 0
      expect(Object.values(s.hands).reduce((n, h) => n + h.length, 0)).toBe(ctx.ids.length * HAND_SIZE + drawn)
    }
  })

  test('the card turned up acts on the start', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 4000 && seen.size < 5; i++) {
      const ctx = ctxOf(4)
      const s = giantUno.start(ctx, ONE)
      const left = (s.dealer + 1) % 4
      const kind = cardOf(s.discard[0] ?? -1).kind
      if (kind === 'skip') expect(s.turn).toBe((s.dealer + 2) % 4)
      if (kind === 'reverse') expect([s.turn, s.dir]).toEqual([s.dealer, -1])
      if (kind === 'draw2') {
        expect(s.hands[s.ids[left] ?? '']).toHaveLength(9)
        expect(s.turn).toBe((s.dealer + 2) % 4)
      }
      if (kind === 'wild' || kind === 'custom') expect([s.phase, s.turn]).toEqual(['color', left])
      if (kind === 'number') expect(s.turn).toBe(left)
      seen.add(kind === 'custom' ? 'wild' : kind)
    }
    expect(seen.size).toBe(5)
  })
})

describe('turns', () => {
  test('a card that does not fit is refused, and only on your turn', () => {
    const { s, ctx } = table(3, [[G2, R5], [B1], [Y3]], R7, 'red')
    expect(refused(s, ctx, 'p0', { type: 'play', card: G2 })).toBe(true)
    expect(refused(s, ctx, 'p1', { type: 'play', card: B1 })).toBe(true)
    const t = act(s, ctx, 'p0', { type: 'play', card: R5 })
    expect([turnOf(t), t.color]).toEqual(['p1', 'red'])
  })

  test('skip, reverse and draw two', () => {
    const skip = table(3, [[find('skip', 'red'), R5], [B1], [Y3]], R7, 'red')
    expect(turnOf(act(skip.s, skip.ctx, 'p0', { type: 'play', card: find('skip', 'red') }))).toBe('p2')

    const rev = table(3, [[find('reverse', 'red'), R5], [B1], [Y3]], R7, 'red')
    const r = act(rev.s, rev.ctx, 'p0', { type: 'play', card: find('reverse', 'red') })
    expect([turnOf(r), r.dir]).toEqual(['p2', -1])

    const d2 = table(3, [[find('draw2', 'red'), R5], [B1], [Y3]], R7, 'red')
    const d = act(d2.s, d2.ctx, 'p0', { type: 'play', card: find('draw2', 'red') })
    expect([turnOf(d), d.hands.p1?.length]).toEqual(['p2', 3])
  })

  test('two at the table: a reverse, a skip and a draw two all bring the turn back', () => {
    for (const kind of ['reverse', 'skip', 'draw2'] as const) {
      const { s, ctx } = table(2, [[find(kind, 'red'), R5], [B1]], R7, 'red')
      expect(turnOf(act(s, ctx, 'p0', { type: 'play', card: find(kind, 'red') }))).toBe('p0')
    }
  })

  test('a drawn card that fits may be played, and only it; one that does not ends the turn', () => {
    const { s, ctx } = table(3, [[R5, G2], [B1], [Y3]], R7, 'red')
    s.pile.push(find('number', 'red', 9))
    const t = act(s, ctx, 'p0', { type: 'draw' })
    expect(t.drawn).toBe(find('number', 'red', 9))
    expect(refused(t, ctx, 'p0', { type: 'play', card: R5 })).toBe(true)
    expect(turnOf(act(t, ctx, 'p0', { type: 'pass' }))).toBe('p1')
    expect(turnOf(act(t, ctx, 'p0', { type: 'play', card: find('number', 'red', 9) }))).toBe('p1')

    const miss = table(3, [[R5], [B1], [Y3]], R7, 'red')
    miss.s.pile.push(find('number', 'green', 9))
    const m = act(miss.s, miss.ctx, 'p0', { type: 'draw' })
    expect([turnOf(m), m.drawn, m.hands.p0?.length]).toEqual(['p1', null, 2])
  })

  test('the pile runs out: the discards under the top are shuffled into a new one', () => {
    const { s, ctx } = table(2, [[G2], [B1]], R7, 'red')
    s.discard = [...s.pile, R7]
    s.pile = []
    const t = act(s, ctx, 'p0', { type: 'draw' })
    expect(t.discard).toEqual([R7])
    expect(count(t)).toBe(108)
  })
})

describe('the Wild Draw Four', () => {
  test('challenged when it was fair: the challenger draws six and loses the turn', () => {
    const { s, ctx } = table(3, [[find('wild4'), G2, B1], [Y3], [B7]], R7, 'red')
    const t = act(s, ctx, 'p0', { type: 'play', card: find('wild4'), color: 'blue' })
    expect([t.phase, turnOf(t)]).toEqual(['challenge', 'p1'])
    const c = act(t, ctx, 'p1', { type: 'challenge' })
    expect([c.hands.p1?.length, turnOf(c), c.shown?.of]).toEqual([7, 'p2', 'p0'])
  })

  test('challenged when they held the colour: they draw four, and the challenger plays', () => {
    const { s, ctx } = table(3, [[find('wild4'), R5, B1], [Y3], [B7]], R7, 'red')
    const t = act(s, ctx, 'p0', { type: 'play', card: find('wild4'), color: 'blue' })
    const c = act(t, ctx, 'p1', { type: 'challenge' })
    expect([c.hands.p0?.length, c.hands.p1?.length, turnOf(c), c.phase]).toEqual([6, 1, 'p1', 'play'])
  })

  test('accepted: four cards and the turn passes', () => {
    const { s, ctx } = table(3, [[find('wild4'), R5], [Y3], [B7]], R7, 'red')
    const t = act(act(s, ctx, 'p0', { type: 'play', card: find('wild4'), color: 'green' }), ctx, 'p1', { type: 'accept' })
    expect([t.hands.p1?.length, turnOf(t), t.color]).toEqual([5, 'p2', 'green'])
  })
})

describe('«وحدة!»', () => {
  test('down to one without it: caught before the next move, two cards', () => {
    const { s, ctx } = table(3, [[R5, G2], [B1, B7], [Y3]], R7, 'red')
    const t = act(s, ctx, 'p0', { type: 'play', card: R5 })
    expect(t.exposed).toBe('p0')
    expect(refused(t, ctx, 'p0', { type: 'catch', who: 'p0' })).toBe(true)
    const c = act(t, ctx, 'p2', { type: 'catch', who: 'p0' })
    expect([c.hands.p0?.length, c.exposed]).toEqual([3, null])
  })

  test('said in time, or the next move made: nobody can catch them', () => {
    const R3 = find('number', 'red', 3)
    const { s, ctx } = table(3, [[R5, G2], [R3, B1], [Y3]], R7, 'red')
    const called = act(act(s, ctx, 'p0', { type: 'call' }), ctx, 'p0', { type: 'play', card: R5 })
    expect(called.exposed).toBeNull()
    expect(refused(called, ctx, 'p1', { type: 'catch', who: 'p0' })).toBe(true)

    const late = act(act(s, ctx, 'p0', { type: 'play', card: R5 }), ctx, 'p1', { type: 'play', card: R3 })
    expect(refused(late, ctx, 'p2', { type: 'catch', who: 'p0' })).toBe(true)

    const saved = act(act(s, ctx, 'p0', { type: 'play', card: R5 }), ctx, 'p0', { type: 'call' })
    expect(refused(saved, ctx, 'p1', { type: 'catch', who: 'p0' })).toBe(true)
  })

  test('cannot be said holding three', () => {
    const { s, ctx } = table(2, [[R5, G2, B1], [Y3]], R7, 'red')
    expect(refused(s, ctx, 'p0', { type: 'call' })).toBe(true)
  })
})

describe('going out and the score', () => {
  test('one hand: the last card scores what the others hold; a last Draw Two still lands', () => {
    const { s, ctx } = table(3, [[find('draw2', 'red')], [B7, find('wild')], [Y3]], R7, 'red')
    s.pile.push(G2, B1)
    const t = act(s, ctx, 'p0', { type: 'play', card: find('draw2', 'red') })
    expect(t.phase).toBe('over')
    expect(t.result?.points).toBe(7 + 50 + 2 + 1 + 3)
    expect(giantUno.scores(t)).toEqual([
      { player: 'p0', score: 63 },
      { player: 'p1', score: -60 },
      { player: 'p2', score: -3 },
    ])
    expect(giantUno.view(t, ctx, 'p2').view.winners).toEqual(['P0'])
  })

  test('to a target: the next hand waits, then deals; reaching it ends the round', () => {
    const opts: UnoOptions = { target: 200, scoring: 'winner', house: 'again' }
    const { s, ctx } = table(2, [[R5], [find('wild'), find('wild4')]], R7, 'red', opts)
    const t = act(s, ctx, 'p0', { type: 'play', card: R5 })
    expect([t.phase, t.totals.p0]).toEqual(['between', 100])
    const next = wake(t, { ...ctx, now: t.until })
    expect([next.phase === 'between', next.handNo, count(next)]).toEqual([false, 2, 108])

    const end = table(2, [[R5], [find('wild'), find('wild4')]], R7, 'red', opts)
    end.s.totals.p0 = 150
    expect(act(end.s, end.ctx, 'p0', { type: 'play', card: R5 }).phase).toBe('over')
  })

  test('the fewest win under the other count', () => {
    const opts: UnoOptions = { target: 0, scoring: 'low', house: 'again' }
    const { s, ctx } = table(3, [[R5], [B7], [find('wild')]], R7, 'red', opts)
    const t = act(s, ctx, 'p0', { type: 'play', card: R5 })
    expect(giantUno.scores(t).map((r) => r.score)).toEqual([-0, -7, -50])
  })
})

describe('the house rule on the blank cards', () => {
  const custom = find('custom')
  test('again: the same player goes on', () => {
    const { s, ctx } = table(3, [[custom, R5], [B1], [Y3]], R7, 'red')
    const t = act(s, ctx, 'p0', { type: 'play', card: custom, color: 'green' })
    expect([turnOf(t), t.color]).toEqual(['p0', 'green'])
  })

  test('swap: the hands change places', () => {
    const { s, ctx } = table(3, [[custom, R5], [B1, B7, G2], [Y3]], R7, 'red', { ...ONE, house: 'swap' })
    expect(refused(s, ctx, 'p0', { type: 'play', card: custom, color: 'blue' })).toBe(true)
    const t = act(s, ctx, 'p0', { type: 'play', card: custom, color: 'blue', target: 'p1' })
    expect([t.hands.p0, t.hands.p1, t.exposed]).toEqual([[B1, B7, G2], [R5], null])
  })

  test('hunt: the next player draws until the colour turns up, and is skipped', () => {
    const { s, ctx } = table(3, [[custom, R5], [B1], [Y3]], R7, 'red', { ...ONE, house: 'hunt' })
    // Drawn from the top (the end): blue, yellow, then green.
    s.pile.push(find('number', 'green', 4), find('number', 'yellow', 9), find('number', 'blue', 9))
    const t = act(s, ctx, 'p0', { type: 'play', card: custom, color: 'green' })
    expect([t.hands.p1?.length, turnOf(t)]).toEqual([4, 'p2'])
  })

  test('dump: every card of the colour goes down with it', () => {
    const { s, ctx } = table(3, [[custom, R5, find('number', 'red', 1), G2], [B1], [Y3]], R7, 'red', { ...ONE, house: 'dump' })
    const t = act(s, ctx, 'p0', { type: 'play', card: custom, color: 'red' })
    expect([t.hands.p0, t.discard.at(-1), t.color, t.exposed]).toEqual([[G2], custom, 'red', 'p0'])
  })
})

describe('the clock', () => {
  test('a turn run out draws one and passes; a Draw Four left unanswered is drawn', () => {
    const { s, ctx } = table(3, [[R5], [B1], [Y3]], R7, 'red')
    const t = wake(s, { ...ctx, now: s.until })
    expect([t.hands.p0?.length, turnOf(t)]).toEqual([2, 'p1'])

    const w = table(3, [[find('wild4'), G2], [B1], [Y3]], R7, 'red')
    const played = act(w.s, w.ctx, 'p0', { type: 'play', card: find('wild4'), color: 'blue' })
    const drawn = wake(played, { ...w.ctx, now: played.until })
    expect([drawn.hands.p1?.length, turnOf(drawn)]).toEqual([5, 'p2'])
  })

  test('a player whose phone is gone gets five seconds', () => {
    const { s, ctx } = table(3, [[R5], [B1], [Y3]], R7, 'red')
    const away = giantUno.settle(s, { ...ctx, connected: new Set(['p1', 'p2']) })
    expect(away.until).toBe(ctx.now + 5000)
  })
})

describe('what each phone sees', () => {
  test('its own hand, and only the count of anyone else’s', () => {
    const ctx = ctxOf(4)
    const s = giantUno.start(ctx, ONE)
    for (const id of ctx.ids) {
      const { view } = giantUno.view(s, ctx, id)
      expect(view.hand.map((c) => c.id)).toEqual(s.hands[id] ?? [])
      expect(view.seats.map((x) => x.count)).toEqual(ctx.ids.map((p) => s.hands[p]?.length ?? 0))
      expect(JSON.stringify(view.seats)).not.toContain('"cards"')
    }
  })
})

describe('bots play it out', () => {
  /** A random move that is allowed, as a careless player would make it. */
  function botMove(s: State, ctx: Ctx): { who: string; action: Record<string, unknown> } {
    const who = s.ids[s.turn] ?? ''
    const others = s.ids.filter((id) => id !== who)
    const exposed = s.exposed
    if (exposed && Math.random() < 0.3) return { who: others.find((id) => id !== exposed) ?? who, action: { type: 'catch', who: exposed } }
    if ((s.hands[who]?.length ?? 0) <= 2 && !s.called[who] && Math.random() < 0.6) return { who, action: { type: 'call' } }
    if (s.phase === 'color') return { who, action: { type: 'color', color: COLORS[Math.floor(Math.random() * 4)] } }
    if (s.phase === 'challenge') return { who, action: { type: Math.random() < 0.3 ? 'challenge' : 'accept' } }
    const { view } = giantUno.view(s, ctx, who)
    if (view.playable.length > 0 && Math.random() < 0.9) {
      const card = view.playable[Math.floor(Math.random() * view.playable.length)]
      return { who, action: { type: 'play', card, color: COLORS[Math.floor(Math.random() * 4)], target: others[0] } }
    }
    return { who, action: { type: view.drawn !== null ? 'pass' : 'draw' } }
  }

  test('500 games of every size and rule, 108 cards all the way, every one decided', () => {
    const houses = ['again', 'swap', 'hunt', 'dump', 'wild'] as const
    for (let g = 0; g < 500; g++) {
      const n = 2 + (g % 9)
      const ctx = ctxOf(n)
      const opts: UnoOptions = { target: g % 5 === 0 ? 200 : 0, scoring: g % 2 ? 'winner' : 'low', house: houses[g % 5] ?? 'again' }
      let s = giantUno.start(ctx, opts)
      let moves = 0
      while (s.phase !== 'over') {
        if (s.phase === 'between') s = wake(s, { ...ctx, now: s.until })
        else {
          const { who, action } = botMove(s, ctx)
          s = act(s, ctx, who, action)
        }
        expect(count(s)).toBe(108)
        moves++
        if (moves > 20_000) throw new Error(`game ${String(g)} never ended`)
      }
      expect(giantUno.view(s, ctx, 'p0').view.winners.length).toBeGreaterThan(0)
    }
  })
})
