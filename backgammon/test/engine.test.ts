import { afterEach, describe, expect, test } from 'bun:test'
import { isRefusal, type Ctx } from '@engine/engine'
import { backgammon } from '@engine/games/backgammon'
import { AWAY_MS, type State } from '@engine/games/backgammon/rules'
import { BAR, CHECKERS, OFF, across, type Side } from '@shared/backgammon/board'
import { bestPlay } from '@shared/backgammon/bot'
import { diceOf } from '@shared/backgammon/moves'
import type { BgOptions } from '@shared/protocol'
import { setDieSource } from '@shared/random'

const IDS = ['p0', 'p1'] as const

function ctxOf(now = 1_000_000, connected: readonly string[] = IDS): Ctx {
  return { ids: [...IDS], names: { p0: 'زينب', p1: 'علي' }, connected: new Set(connected), hostId: 'p0', now }
}

/** The dice come out in this order. */
function load(...dice: number[]) {
  let i = 0
  setDieSource(() => {
    const d = dice[i++]
    if (d === undefined) throw new Error('ran out of loaded dice')
    return d
  })
}

afterEach(() => {
  setDieSource(null)
})

function side(spec: Record<number, number>): Side {
  const s = Array.from({ length: 26 }, () => 0)
  let used = 0
  for (const [p, n] of Object.entries(spec)) {
    s[Number(p)] = n
    used += n
  }
  s[OFF] = CHECKERS - used
  return s
}

function act(s: State, who: string, action: unknown, ctx = ctxOf()): State {
  const next = backgammon.act(s, ctx, who, action)
  if (isRefusal(next)) throw new Error(`${who} ${JSON.stringify(action)} refused: ${next.error}`)
  return backgammon.settle(next, ctx)
}

const refused = (s: State, who: string, action: unknown) => isRefusal(backgammon.act(s, ctxOf(), who, action))

/** `who` throws these two dice. */
function rollAs(s: State, who: string, a: number, b: number): State {
  load(a, b)
  return act(s, who, { type: 'roll' })
}

function start(options: BgOptions, opening: [number, number] = [5, 3]): State {
  load(...opening)
  return backgammon.start(ctxOf(), options)
}

/** Seat 0 to roll on a board of our choosing. */
function setUp(options: BgOptions, me: Side, them: Side, extra: Partial<State> = {}): State {
  const s = start(options)
  return { ...s, board: [me, them], phase: 'roll', turn: 0, dice: null, staged: [], ...extra }
}

const ONE: BgOptions = { length: 1, cube: true }
const FIVE: BgOptions = { length: 5, cube: true }

describe('the opening', () => {
  test('the higher die moves first with both numbers; ties are thrown again', () => {
    load(4, 4, 2, 6)
    const s = backgammon.start(ctxOf(), ONE)
    expect(s.opening).toEqual({ dice: [2, 6], ties: 1 })
    expect(s.turn).toBe(1)
    expect(s.phase).toBe('move')
    expect(s.dice).toEqual([6, 2])
    expect(s.gameNo).toBe(1)
  })

  test('the starter plays the opening; the other side then rolls', () => {
    const s = start(ONE, [6, 5])
    expect(s.turn).toBe(0)
    expect(refused(s, 'p0', { type: 'play', moves: [{ from: 24, to: 18, die: 6 }] })).toBe(true)
    expect(refused(s, 'p1', { type: 'play', moves: [{ from: 24, to: 18, die: 6 }, { from: 18, to: 13, die: 5 }] })).toBe(true)
    const next = act(s, 'p0', { type: 'play', moves: [{ from: 24, to: 18, die: 6 }, { from: 18, to: 13, die: 5 }] })
    expect(next.board[0][24]).toBe(1)
    expect(next.board[0][13]).toBe(6)
    expect(next.turn).toBe(1)
    expect(next.phase).toBe('roll')
    expect(next.last?.moves).toHaveLength(2)
  })

  test('staged moves are shown to the other phone, and must be a legal start', () => {
    const s = start(ONE, [6, 5])
    const staged = act(s, 'p0', { type: 'stage', moves: [{ from: 24, to: 18, die: 6 }] })
    expect(staged.staged).toEqual([{ from: 24, to: 18, die: 6 }])
    expect(refused(s, 'p0', { type: 'stage', moves: [{ from: 24, to: 19, die: 5 }] })).toBe(true)
    expect(refused(s, 'p0', { type: 'stage', moves: [{ from: 24, to: 18, die: 6 }, 'x'] })).toBe(true)
  })
})

describe('a roll', () => {
  test('with no legal move passes the turn at once', () => {
    const me = side({ [BAR]: 1, 13: 4 })
    const shut = side({ 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2 })
    const s = rollAs(setUp(ONE, me, shut), 'p0', 3, 5)
    expect(s.turn).toBe(1)
    expect(s.phase).toBe('roll')
    expect(s.last).toMatchObject({ seat: 0, dice: [3, 5], blocked: true })
  })

  test('only on your own turn', () => {
    const s = setUp(ONE, side({ 6: 15 }), side({ 6: 15 }))
    expect(refused(s, 'p1', { type: 'roll' })).toBe(true)
    expect(refused(s, 'x', { type: 'roll' })).toBe(true)
  })
})

describe('the cube', () => {
  const race = () => setUp(ONE, side({ 6: 5, 5: 5, 4: 5 }), side({ 6: 5, 5: 5, 3: 5 }))

  test('double, take: the cube doubles and goes to the taker; the doubler rolls and may not double again', () => {
    let s = act(race(), 'p0', { type: 'double' })
    expect(s.phase).toBe('double')
    expect(refused(s, 'p0', { type: 'take' })).toBe(true)
    s = act(s, 'p1', { type: 'take' })
    expect(s.cube).toEqual({ value: 2, owner: 1 })
    expect(s.phase).toBe('roll')
    expect(s.turn).toBe(0)
    expect(refused(s, 'p0', { type: 'double' })).toBe(true)
    expect(backgammon.view(s, ctxOf(), 'p0').view.canDouble).toBe(false)
  })

  test('the holder redoubles on their own turn', () => {
    const s = { ...race(), turn: 1 as const, cube: { value: 2, owner: 1 as const } }
    const next = act(act(s, 'p1', { type: 'double' }), 'p0', { type: 'take' })
    expect(next.cube).toEqual({ value: 4, owner: 0 })
  })

  test('double, pass: the doubler wins at the value before the double', () => {
    const s = act(act({ ...race(), cube: { value: 2, owner: 0 } }, 'p0', { type: 'double' }), 'p1', { type: 'pass' })
    expect(s.phase).toBe('over')
    expect(s.result).toEqual({ winner: 0, kind: 1, cube: 2, points: 2, passed: true })
    expect(backgammon.scores(s)).toEqual([
      { player: 'p0', score: 2 },
      { player: 'p1', score: 0 },
    ])
  })

  test('no cube when the game is played without one, nor past 64', () => {
    expect(refused({ ...race(), options: { length: 1, cube: false } }, 'p0', { type: 'double' })).toBe(true)
    expect(refused({ ...race(), cube: { value: 64, owner: 0 } }, 'p0', { type: 'double' })).toBe(true)
  })
})

describe('winning', () => {
  /** Seat 0 has one checker left on its 1-point and rolls 2-1. */
  function last(them: Side, cube = 1) {
    const s = rollAs(setUp(ONE, side({ 1: 1 }), them, { cube: { value: cube, owner: 1 } }), 'p0', 2, 1)
    return act(s, 'p0', { type: 'play', moves: [{ from: 1, to: OFF, die: 2 }] })
  }

  test('a single game counts the cube', () => {
    expect(last(side({ 6: 10 }), 2).result).toMatchObject({ winner: 0, kind: 1, points: 2 })
  })

  test('a gammon (مارس) counts double, a backgammon (مارس كبير) triple', () => {
    expect(last(side({ 6: 15 })).result).toMatchObject({ kind: 2, points: 2 })
    expect(last(side({ 6: 14, 20: 1 }), 4).result).toMatchObject({ kind: 3, points: 12 })
  })
})

describe('a match', () => {
  test('ends at its length, with the Crawford game once a side is one short', () => {
    // A 5-point match: seat 0 at 2 wins a gammon → 4, one short of 5.
    let s = setUp(FIVE, side({ 1: 1 }), side({ 6: 15 }), { score: [2, 1] })
    s = act(rollAs(s, 'p0', 2, 1), 'p0', { type: 'play', moves: [{ from: 1, to: OFF, die: 2 }] })
    expect(s.phase).toBe('between')
    expect(s.score).toEqual([4, 1])
    expect(s.crawford).toBe(true)
    // The next game: no doubling in it.
    load(6, 1)
    s = act(s, 'p1', { type: 'next' })
    expect(s.gameNo).toBe(2)
    s = { ...s, phase: 'roll', turn: 1, dice: null }
    expect(refused(s, 'p1', { type: 'double' })).toBe(true)
    // Seat 1 takes the Crawford game: doubling is back for the game after it.
    s = rollAs({ ...s, board: [side({ 6: 10 }), side({ 1: 1 })] }, 'p1', 2, 1)
    s = act(s, 'p1', { type: 'play', moves: [{ from: 1, to: OFF, die: 2 }] })
    expect(s.score).toEqual([4, 2])
    expect(s.crawford).toBe(false)
    expect(s.crawfordDone).toBe(true)
  })

  test('the clock deals the next game after the pause', () => {
    let s = setUp(FIVE, side({ 1: 1 }), side({ 6: 10 }))
    s = act(rollAs(s, 'p0', 2, 1), 'p0', { type: 'play', moves: [{ from: 1, to: OFF, die: 2 }] })
    expect(s.phase).toBe('between')
    load(3, 4)
    const woke = backgammon.wake?.(s, ctxOf(s.until))
    expect(woke?.phase).toBe('move')
    expect(woke?.gameNo).toBe(s.gameNo + 1)
    expect(woke?.cube).toEqual({ value: 1, owner: null })
  })
})

describe('the clock', () => {
  test('a quiet roll throws itself; a quiet move plays الحجّي’s choice from what was staged', () => {
    const s = start(ONE, [6, 5])
    const staged = act(s, 'p0', { type: 'stage', moves: [{ from: 24, to: 18, die: 6 }] })
    const woke = backgammon.wake?.(staged, ctxOf(staged.until))
    expect(woke?.turn).toBe(1)
    expect(woke?.last?.moves[0]).toEqual({ from: 24, to: 18, die: 6 })
    expect(woke?.last?.moves).toHaveLength(2)
    if (!woke) throw new Error('no clock')
    load(3, 1)
    const rolled = backgammon.wake?.(woke, ctxOf(woke.until))
    expect(rolled?.phase).toBe('move')
    expect(rolled?.dice).toEqual([3, 1])
  })

  test('before the deadline nothing happens', () => {
    const s = start(ONE, [6, 5])
    expect(backgammon.wake?.(s, ctxOf(s.until - 1))).toBe(s)
  })

  test('a phone that dropped out gets the away time', () => {
    const s = start(ONE, [6, 5])
    const cut = backgammon.settle(s, ctxOf(1_000_000, ['p1']))
    expect(cut.until).toBe(1_000_000 + AWAY_MS)
  })

  test('a quiet answer to a double is the one الحجّي would give', () => {
    const behind = setUp(ONE, side({ 6: 5, 5: 5, 4: 5 }), side({ 13: 5, 12: 5, 11: 5 }))
    const doubled = act(behind, 'p0', { type: 'double' })
    const answered = backgammon.wake?.(doubled, ctxOf(doubled.until))
    expect(answered?.phase).toBe('over')
    expect(answered?.result?.passed).toBe(true)
  })
})

describe('each phone’s view', () => {
  test('says whose turn it is and nothing to the other', () => {
    const s = start(ONE, [6, 5])
    const mine = backgammon.view(s, ctxOf(), 'p0')
    const theirs = backgammon.view(s, ctxOf(), 'p1')
    expect(mine.yourTurn).toBe('دورك')
    expect(theirs.yourTurn).toBeNull()
    expect(mine.view.seat).toBe(0)
    expect(theirs.view.seat).toBe(1)
    expect(mine.view.sides.map((x) => x.name)).toEqual(['زينب', 'علي'])
  })

  test('asks the other side to answer a double', () => {
    const s = act(setUp(ONE, side({ 6: 15 }), side({ 6: 15 })), 'p0', { type: 'double' })
    expect(backgammon.view(s, ctxOf(), 'p1').yourTurn).toContain('ضاعف')
    expect(backgammon.view(s, ctxOf(), 'p0').yourTurn).toBeNull()
  })
})

describe('الحجّي', () => {
  test('hits a blot in his home when it is free, and makes a point rather than leaving two blots', () => {
    // The 3-1 opening: make the 5-point.
    const [me, them] = [side({ 24: 2, 13: 5, 8: 3, 6: 5 }), side({ 24: 2, 13: 5, 8: 3, 6: 5 })]
    const play = bestPlay(me, them, diceOf([3, 1]))
    expect(play.map((m) => `${String(m.from)}/${String(m.to)}`).sort()).toEqual(['6/5', '8/5'])
    // A blot of theirs on our 5-point with a 2 to hit it from the 7.
    const blot = side({ 7: 2, 6: 4, 13: 5, 24: 2, 8: 2 })
    const theirs = side({ [across(5)]: 1, 24: 2, 13: 5, 8: 3, 6: 4 })
    const hit = bestPlay(blot, theirs, diceOf([2, 2]))
    expect(hit.some((m) => m.to === 5)).toBe(true)
  })
})
