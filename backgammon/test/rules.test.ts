import { describe, expect, test } from 'bun:test'
import { BAR, CHECKERS, OFF, across, inContact, isSound, pips, startBoard, winKind, type Side } from '@shared/backgammon/board'
import {
  allPlays,
  applyMove,
  diceOf,
  isLegalPlay,
  isLegalStart,
  legalMoves,
  movesThisTurn,
  routesFrom,
  target,
  type Move,
} from '@shared/backgammon/moves'

/** A side from its points ({point: checkers}); whatever is left of the 15 is borne off. */
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

const mv = (from: number, to: number, die: number): Move => ({ from, to, die })
const has = (moves: Move[], m: Move) => moves.some((x) => x.from === m.from && x.to === m.to && x.die === m.die)

describe('the board', () => {
  test('sets up 2-5-3-5 for each side, 167 pips each, one checker per point at most from one side', () => {
    const [a, b] = startBoard()
    expect(a[24]).toBe(2)
    expect(a[13]).toBe(5)
    expect(a[8]).toBe(3)
    expect(a[6]).toBe(5)
    expect(pips(a)).toBe(167)
    expect(pips(b)).toBe(167)
    expect(isSound([a, b])).toBe(true)
    expect(inContact(a, b)).toBe(true)
  })

  test('one side’s 24-point is the other’s 1-point', () => {
    expect(across(24)).toBe(1)
    expect(across(13)).toBe(12)
  })

  test('scores a single game, a gammon and a backgammon', () => {
    expect(winKind(side({ 3: 10 }))).toBe(1)
    expect(winKind(side({ 3: 15 }))).toBe(2)
    expect(winKind(side({ 3: 14, 20: 1 }))).toBe(3)
    expect(winKind(side({ 3: 14, [BAR]: 1 }))).toBe(3)
  })
})

describe('moving', () => {
  test('two or more on a point block it; one is a blot, hit to the bar', () => {
    const me = side({ 13: 2 })
    const them = side({ [across(8)]: 2, [across(9)]: 1 })
    expect(target(me, them, 13, 5)).toBeNull()
    expect(target(me, them, 13, 4)).toBe(9)
    const after = applyMove(me, them, mv(13, 9, 4))
    expect(after.hit).toBe(true)
    expect(after.them[BAR]).toBe(1)
    expect(after.them[across(9)]).toBe(0)
  })

  test('a single die jumps over a blocked point to an open one', () => {
    const me = side({ 13: 1 })
    const them = side({ [across(10)]: 2, [across(11)]: 2, [across(12)]: 2 })
    expect(target(me, them, 13, 6)).toBe(7)
  })

  test('the opening 3-1 can make the 5-point', () => {
    const [me, them] = startBoard()
    const plays = allPlays(me, them, diceOf([3, 1]))
    expect(plays.some((p) => p.me[5] === 2 && p.me[8] === 2 && p.me[6] === 4)).toBe(true)
    expect(movesThisTurn(me, them, [3, 1])).toBe(2)
  })

  test('a checker on the bar enters before anything else; a shut board passes the turn', () => {
    const me = side({ [BAR]: 1, 13: 5 })
    const open = side({ [across(19)]: 2, [across(20)]: 2 })
    expect(legalMoves(me, open, [6, 5], []).every((m) => m.from === BAR)).toBe(true)
    expect(has(legalMoves(me, open, [6, 4], []), mv(BAR, 21, 4))).toBe(true)
    const shut = side({ 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2 })
    expect(movesThisTurn(me, shut, [6, 5])).toBe(0)
  })

  test('with two on the bar and one entry open, only one checker enters and nothing else moves', () => {
    const me = side({ [BAR]: 2, 13: 5 })
    const them = side({ [across(19)]: 2 })
    // 6 is blocked (their 6 = our 19), 5 enters on our 20.
    expect(movesThisTurn(me, them, [6, 5])).toBe(1)
    expect(legalMoves(me, them, [6, 5], [])).toEqual([mv(BAR, 20, 5)])
  })

  test('both dice must be used when they can: a 6 that leaves the 5 unplayable is not allowed', () => {
    // 13→7 with the 6 leaves 7→2 and 10→5, both blocked. 10→4 with the 6 lets 13→8 take the 5.
    const me = side({ 13: 1, 10: 1 })
    const them = side({ [across(5)]: 2, [across(2)]: 2 })
    expect(movesThisTurn(me, them, [6, 5])).toBe(2)
    const first = legalMoves(me, them, [6, 5], [])
    expect(has(first, mv(13, 7, 6))).toBe(false)
    expect(has(first, mv(10, 4, 6))).toBe(true)
    expect(has(first, mv(13, 8, 5))).toBe(true)
  })

  test('when either die can go but not both, it must be the higher', () => {
    // 12→6 then 6→2, or 12→8 then 8→2: the 2 is blocked, so one die only.
    const me = side({ 12: 1 })
    const them = side({ [across(2)]: 2 })
    expect(movesThisTurn(me, them, [6, 4])).toBe(1)
    expect(legalMoves(me, them, [6, 4], [])).toEqual([mv(12, 6, 6)])
    expect(allPlays(me, them, diceOf([6, 4])).map((p) => p.moves)).toEqual([[mv(12, 6, 6)]])
  })

  test('if only the lower die can be played, that one is played', () => {
    const me = side({ 12: 1 })
    const them = side({ [across(6)]: 2, [across(2)]: 2 })
    // 12−6 = 6 blocked; 12−4 = 8 open, then 8−6 = 2 blocked.
    expect(legalMoves(me, them, [6, 4], [])).toEqual([mv(12, 8, 4)])
  })

  test('a double is four moves, cut short where the board stops it', () => {
    const [me, them] = startBoard()
    expect(movesThisTurn(me, them, [3, 3])).toBe(4)
    const stuck = side({ 13: 1 })
    const wall = side({ [across(7)]: 2 })
    // 13→10→7 blocked: only one 3 can be played by the lone checker.
    expect(movesThisTurn(stuck, wall, [3, 3])).toBe(1)
  })
})

describe('bearing off', () => {
  test('only once all fifteen are home', () => {
    const me = side({ 6: 4, 7: 1 })
    expect(target(me, side({}), 6, 6)).toBeNull()
    expect(target(side({ 6: 5 }), side({}), 6, 6)).toBe(OFF)
  })

  test('a higher die takes the highest checker; not while checkers sit above the die’s point', () => {
    const me = side({ 3: 2, 5: 1 })
    // A 6 with nothing on the 6: the highest (5) comes off.
    expect(target(me, side({}), 5, 6)).toBe(OFF)
    expect(target(me, side({}), 3, 6)).toBeNull()
    // A 4 with a checker on the 5: the 4 must be moved inside (5→1), not used to bear off the 3.
    expect(target(me, side({}), 3, 4)).toBeNull()
    expect(target(me, side({}), 5, 4)).toBe(1)
  })

  test('bearing off is not forced when another move is legal', () => {
    const me = side({ 6: 2, 2: 1 })
    const moves = legalMoves(me, side({}), [6, 4], [])
    expect(has(moves, mv(6, OFF, 6))).toBe(true)
    expect(has(moves, mv(6, 2, 4))).toBe(true)
  })

  test('a checker hit while bearing off must come round again before more come off', () => {
    const me = side({ [BAR]: 1, 2: 3 })
    const moves = legalMoves(me, side({}), [6, 1], [])
    expect(moves.every((m) => m.from === BAR)).toBe(true)
  })
})

describe('a whole turn', () => {
  test('is legal only when it plays every die it can, in the turn’s order', () => {
    const [me, them] = startBoard()
    expect(isLegalPlay(me, them, [6, 5], [mv(24, 18, 6), mv(18, 13, 5)])).toBe(true)
    expect(isLegalPlay(me, them, [6, 5], [mv(24, 18, 6)])).toBe(false)
    expect(isLegalStart(me, them, [6, 5], [mv(24, 18, 6)])).toBe(true)
    expect(isLegalPlay(me, them, [6, 5], [mv(24, 18, 5)])).toBe(false)
    expect(isLegalPlay(me, them, [6, 5], [mv(6, 0, 6), mv(6, 1, 5)])).toBe(false)
  })

  test('a doubles play keeps every distinct board once', () => {
    const [me, them] = startBoard()
    const plays = allPlays(me, them, diceOf([6, 6]))
    const keys = new Set(plays.map((p) => p.me.join()))
    expect(keys.size).toBe(plays.length)
    expect(plays.every((p) => p.moves.length === 4)).toBe(true)
  })
})

describe('routes for the board’s taps', () => {
  test('a checker reaches one die’s point and both dice’s point', () => {
    const [me, them] = startBoard()
    const routes = routesFrom(me, them, [6, 5], [], 13)
    expect(routes.get(7)?.map((m) => m.die)).toEqual([6])
    expect(routes.get(8)?.map((m) => m.die)).toEqual([5])
    expect(routes.get(2)?.length).toBe(2)
    // From the 24 the 5 lands on their 6-point: shut, so only the 6 and the 6-then-5.
    const back = routesFrom(me, them, [6, 5], [], 24)
    expect([...back.keys()].sort((a, b) => a - b)).toEqual([13, 18])
  })

  test('the long way is closed when both landings in between are blocked', () => {
    const me = side({ 13: 1 })
    const them = side({ [across(7)]: 2, [across(8)]: 2 })
    const routes = routesFrom(me, them, [6, 5], [], 13)
    expect(routes.has(2)).toBe(false)
  })

  test('a path that hits nobody on the way beats one that does', () => {
    const me = side({ 13: 1 })
    const them = side({ [across(7)]: 1 })
    const route = routesFrom(me, them, [6, 5], [], 13).get(2)
    expect(route?.[0]?.to).toBe(8)
  })

  test('bearing off with either die prefers the smaller', () => {
    const me = side({ 3: 1, 1: 1 })
    const route = routesFrom(me, side({}), [6, 4], [], 3).get(OFF)
    expect(route).toEqual([mv(3, OFF, 4)])
  })
})
