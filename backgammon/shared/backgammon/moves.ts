// Which moves a roll allows, by the box's rules: each die is a move of its
// own; a checker may land on an open point, its own, or a lone opposing
// checker (a blot, hit to the bar); two or more opposing checkers block a
// point. Checkers on the bar enter first. Bearing off starts once all
// fifteen are home. A player must use as many dice as can be used; when
// only one of two different dice can be played, it must be the higher one
// if that one can be played. Doubles are played four times.

import { BAR, HOME, OFF, across, allHome, type Side } from './board'

/** One die's move of one checker, in the mover's numbering (25 the bar, 0 off). */
export interface Move {
  from: number
  to: number
  die: number
}

/** The dice a roll gives to play: two, or four of a double. */
export const diceOf = (roll: readonly [number, number]): number[] =>
  roll[0] === roll[1] ? [roll[0], roll[0], roll[0], roll[0]] : [roll[0], roll[1]]

/** The dice still to play once these moves are made. */
export function diceLeft(roll: readonly [number, number], moves: readonly Move[]): number[] {
  const left = diceOf(roll)
  for (const m of moves) {
    const i = left.indexOf(m.die)
    if (i >= 0) left.splice(i, 1)
  }
  return left
}

/** Where a checker on `from` goes with `die`, or null when it may not. */
export function target(me: Side, them: Side, from: number, die: number): number | null {
  if ((me[from] ?? 0) === 0) return null
  // A checker on the bar must enter before anything else moves.
  if ((me[BAR] ?? 0) > 0 && from !== BAR) return null
  const to = from - die
  if (to >= 1) return (them[across(to)] ?? 0) >= 2 ? null : to
  if (!allHome(me)) return null
  if (to === 0) return OFF
  // A die higher than the point: only from the highest point that holds a checker.
  for (let p = from + 1; p <= HOME; p++) if ((me[p] ?? 0) > 0) return null
  return OFF
}

/** The board after one move: a lone checker it lands on goes to its own bar. Inputs stay as they were. */
export function applyMove(me: Side, them: Side, move: Move): { me: Side; them: Side; hit: boolean } {
  const mine = me.slice()
  const theirs = them.slice()
  mine[move.from] = (mine[move.from] ?? 0) - 1
  mine[move.to] = (mine[move.to] ?? 0) + 1
  let hit = false
  if (move.to !== OFF && (theirs[across(move.to)] ?? 0) === 1) {
    theirs[across(move.to)] = 0
    theirs[BAR] = (theirs[BAR] ?? 0) + 1
    hit = true
  }
  return { me: mine, them: theirs, hit }
}

export function applyMoves(me: Side, them: Side, moves: readonly Move[]): { me: Side; them: Side; hits: number } {
  let pos = { me, them }
  let hits = 0
  for (const m of moves) {
    const next = applyMove(pos.me, pos.them, m)
    if (next.hit) hits++
    pos = next
  }
  return { ...pos, hits }
}

/** The places a checker could start from: only the bar while one waits there. */
function sources(me: Side): number[] {
  if ((me[BAR] ?? 0) > 0) return [BAR]
  const out: number[] = []
  for (let p = 24; p >= 1; p--) if ((me[p] ?? 0) > 0) out.push(p)
  return out
}

/** Each die value once, the higher first: a play that ends the same either way is kept with the higher die (the rule's pick). */
const distinct = (dice: readonly number[]): number[] => [...new Set(dice)].sort((a, b) => b - a)

const without = (dice: readonly number[], die: number): number[] => {
  const i = dice.indexOf(die)
  return i < 0 ? [...dice] : [...dice.slice(0, i), ...dice.slice(i + 1)]
}

/** Every single move these dice allow right now, before the turn's rules narrow them. */
function singles(me: Side, them: Side, dice: readonly number[]): Move[] {
  const out: Move[] = []
  for (const die of distinct(dice)) {
    for (const from of sources(me)) {
      const to = target(me, them, from, die)
      if (to !== null) out.push({ from, to, die })
    }
  }
  return out
}

/** How many of these dice can be played from here, at most. */
export function maxPlayable(me: Side, them: Side, dice: readonly number[]): number {
  if (dice.length === 0) return 0
  let best = 0
  for (const move of singles(me, them, dice)) {
    const next = applyMove(me, them, move)
    best = Math.max(best, 1 + maxPlayable(next.me, next.them, without(dice, move.die)))
    if (best === dice.length) return best
  }
  return best
}

/** How many moves this roll's turn has: the most dice that can be played. */
export const movesThisTurn = (me: Side, them: Side, roll: readonly [number, number]): number =>
  maxPlayable(me, them, diceOf(roll))

/**
 * The moves that may come next, after `made` (moves already played this
 * turn, all legal): those that still let the turn use as many dice as
 * possible, and the higher die when only one of two can be used.
 */
export function legalMoves(me0: Side, them0: Side, roll: readonly [number, number], made: readonly Move[]): Move[] {
  const total = movesThisTurn(me0, them0, roll)
  const need = total - made.length
  if (need <= 0) return []
  const { me, them } = applyMoves(me0, them0, made)
  const left = diceLeft(roll, made)
  let moves = singles(me, them, left).filter((move) => {
    if (need === 1) return true
    const next = applyMove(me, them, move)
    return maxPlayable(next.me, next.them, without(left, move.die)) >= need - 1
  })
  if (total === 1 && roll[0] !== roll[1]) {
    const high = Math.max(roll[0], roll[1])
    if (moves.some((m) => m.die === high)) moves = moves.filter((m) => m.die === high)
  }
  return moves
}

const sameMove = (a: Move, b: Move) => a.from === b.from && a.to === b.to && a.die === b.die

/** These moves are a legal start of the turn (every one of them allowed in its turn). */
export function isLegalStart(me: Side, them: Side, roll: readonly [number, number], moves: readonly Move[]): boolean {
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i]
    if (!move || !legalMoves(me, them, roll, moves.slice(0, i)).some((m) => sameMove(m, move))) return false
  }
  return true
}

/** These moves are the whole turn: a legal start that leaves nothing more to play. */
export const isLegalPlay = (me: Side, them: Side, roll: readonly [number, number], moves: readonly Move[]): boolean =>
  isLegalStart(me, them, roll, moves) && moves.length === movesThisTurn(me, them, roll)

/** A whole turn's moves and the board it leaves. */
export interface Play {
  moves: Move[]
  me: Side
  them: Side
}

/**
 * Every distinct way to play these dice (one per board it can leave):
 * `diceOf(roll)` for a whole turn, or the dice a turn still has left. As
 * many dice as possible, and when only one of two different dice can go,
 * the higher. For the computer player and the clock.
 */
export function allPlays(me: Side, them: Side, dice: readonly number[]): Play[] {
  const done = new Map<string, Play>()
  const seen = new Set<string>()
  let longest = 0
  const walk = (mine: Side, theirs: Side, dice: number[], path: Move[]) => {
    const key = `${mine.join()}|${theirs.join()}|${String(dice.length)}`
    if (seen.has(key)) return
    seen.add(key)
    const options = singles(mine, theirs, dice)
    if (options.length === 0 || dice.length === 0) {
      if (path.length < longest) return
      if (path.length > longest) {
        longest = path.length
        done.clear()
      }
      const end = `${mine.join()}|${theirs.join()}`
      if (!done.has(end)) done.set(end, { moves: path, me: mine, them: theirs })
      return
    }
    for (const move of options) {
      const next = applyMove(mine, theirs, move)
      walk(next.me, next.them, without(dice, move.die), [...path, move])
    }
  }
  walk(me, them, [...dice], [])
  let plays = [...done.values()]
  const [a, b] = dice
  if (longest === 1 && dice.length === 2 && a !== undefined && b !== undefined && a !== b) {
    const high = Math.max(a, b)
    if (plays.some((p) => p.moves[0]?.die === high)) plays = plays.filter((p) => p.moves[0]?.die === high)
  }
  return plays
}

/**
 * Where the checker on `from` can get to this turn, and how: one die, or
 * several dice by the same checker through open points. The fewest dice
 * win; then a path that hits nobody on the way; then the smaller dice (a
 * checker borne off with a 4 rather than a 6 when either may go).
 */
export function routesFrom(
  me0: Side,
  them0: Side,
  roll: readonly [number, number],
  made: readonly Move[],
  from: number,
): Map<number, Move[]> {
  const best = new Map<number, { steps: Move[]; loud: boolean; pips: number }>()
  const walk = (at: number, path: Move[], loud: boolean) => {
    const before = [...made, ...path]
    const base = applyMoves(me0, them0, before)
    for (const move of legalMoves(me0, them0, roll, before)) {
      if (move.from !== at) continue
      const steps = [...path, move]
      const pips = steps.reduce((n, m) => n + m.die, 0)
      const known = best.get(move.to)
      const better =
        !known ||
        steps.length < known.steps.length ||
        (steps.length === known.steps.length && (known.loud && !loud ? true : known.loud === loud && pips < known.pips))
      if (better) best.set(move.to, { steps, loud, pips })
      // Bearing off ends that checker's trip.
      if (move.to === OFF) continue
      walk(move.to, steps, loud || (base.them[across(move.to)] ?? 0) === 1)
    }
  }
  walk(from, [], false)
  return new Map([...best].map(([to, route]) => [to, route.steps]))
}
