// الحجّي: the café regular who plays when there is no one else, and the
// hand that plays a turn whose player has gone quiet. Not a neural net: a
// position is weighed in pips — the race, the points made (the home board,
// the bar point, anchors in the other home), primes, the other side's
// checkers on the bar — less what the blots may cost, counted over the 36
// rolls the other side can throw. The cube follows the race rule of
// thumb: double at 8% ahead, pass at 12% behind.

import { BAR, OFF, across, inContact, pips, type Side } from './board'
import { allPlays, type Move } from './moves'

/** The 21 different rolls and how many of the 36 throws give each. */
const ROLLS: readonly { a: number; b: number; w: number }[] = (() => {
  const out: { a: number; b: number; w: number }[] = []
  for (let a = 1; a <= 6; a++) for (let b = a; b <= 6; b++) out.push({ a, b, w: a === b ? 1 : 2 })
  return out
})()

/** A made point's worth, by where it is (index = this side's point). */
const POINT_WORTH = [0, 2, 4, 6, 8, 10, 8, 8, 5, 3, 2, 2, 2, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 4, 7, 6, 3, 2, 1]

/** Can the other side's checker on its point `q` land on its point `t` with this roll? */
function reaches(me: Side, them: Side, q: number, t: number, a: number, b: number): boolean {
  const dist = q - t
  if (dist <= 0) return false
  // A landing (in the other side's numbering) is open unless this side holds two there.
  const open = (x: number) => x >= 1 && (me[across(x)] ?? 0) < 2
  const onBar = them[BAR] ?? 0
  if (onBar > 0 && q !== BAR) {
    // A checker waits on the bar: it takes a die to enter before anyone else moves.
    if (onBar >= 2 && a !== b) return false
    if (a !== b) return (a === dist && open(25 - b)) || (b === dist && open(25 - a))
    if (!open(25 - a)) return false
    for (let k = 1; k <= 4 - onBar; k++) if (k * a === dist) return stepsOpen(q, a, k, open)
    return false
  }
  if (a === b) {
    for (let k = 1; k <= 4; k++) if (k * a === dist) return stepsOpen(q, a, k, open)
    return false
  }
  if (a === dist || b === dist) return true
  if (a + b === dist) return open(q - a) || open(q - b)
  return false
}

/** The landings before the last of k equal steps are all open. */
function stepsOpen(q: number, die: number, k: number, open: (x: number) => boolean): boolean {
  for (let j = 1; j < k; j++) if (!open(q - j * die)) return false
  return true
}

/** What this side's blots may cost on the other side's next roll, in pips (25 − p lost, and a tempo). */
export function blotRisk(me: Side, them: Side): number {
  const blots: number[] = []
  for (let p = 1; p <= 24; p++) if ((me[p] ?? 0) === 1) blots.push(p)
  if (blots.length === 0) return 0
  const hitters: number[] = []
  for (let q = 1; q <= BAR; q++) if ((them[q] ?? 0) > 0) hitters.push(q)
  let total = 0
  for (const { a, b, w } of ROLLS) {
    let worst = 0
    for (const p of blots) {
      const t = across(p)
      if (hitters.some((q) => reaches(me, them, q, t, a, b))) worst = Math.max(worst, 25 - p + 6)
    }
    total += w * worst
  }
  return total / 36
}

/** The longest run of points this side holds in a row, from its 2-point up to its 18. */
function primeLength(me: Side): number {
  let best = 0
  let run = 0
  for (let p = 2; p <= 18; p++) {
    run = (me[p] ?? 0) >= 2 ? run + 1 : 0
    best = Math.max(best, run)
  }
  return best
}

/** How good this board is for the side that has just moved (the other side rolls next), in pips. */
export function evaluate(me: Side, them: Side): number {
  if ((me[OFF] ?? 0) === 15) return 10_000
  const lead = pips(them) - pips(me)
  if (!inContact(me, them)) {
    // The race: pips and checkers off, and no tall stacks wasting rolls.
    let stacks = 0
    for (let p = 1; p <= 6; p++) stacks += Math.max(0, (me[p] ?? 0) - 3)
    return lead + 4 * (me[OFF] ?? 0) - stacks
  }
  let score = lead * 0.6
  let homeMade = 0
  for (let p = 1; p <= 24; p++) {
    const n = me[p] ?? 0
    if (n >= 2) {
      score += POINT_WORTH[p] ?? 0
      if (p <= 6) homeMade++
    }
    if (n > 3) score -= 1.5 * (n - 3)
  }
  const prime = primeLength(me)
  if (prime >= 3) score += 4 * (prime - 2) ** 2
  // Their checkers on the bar, worth more the more of the home board is shut.
  score += (them[BAR] ?? 0) * (3 + 2 * homeMade)
  score -= blotRisk(me, them)
  score += 2 * (me[OFF] ?? 0)
  return score
}

/** الحجّي's play for these dice (`diceOf(roll)`, or what a turn has left): the board he likes best of all the legal ones. */
export function bestPlay(me: Side, them: Side, dice: readonly number[]): Move[] {
  let best: Move[] = []
  let bestScore = -Infinity
  for (const play of allPlays(me, them, dice)) {
    const score = evaluate(play.me, play.them)
    if (score > bestScore) {
      bestScore = score
      best = play.moves
    }
  }
  return best
}

/** Where the match stands for one side: the cube, and the scores when it is a match. */
export interface CubeSense {
  value: number
  /** Points to win; 1 for a single game (no match to protect). */
  length: number
  mine: number
  theirs: number
}

/** The side to roll is ahead in the race by this share of its own count. */
function raceLead(me: Side, them: Side): number {
  const mine = pips(me)
  return mine === 0 ? 1 : (pips(them) - mine) / mine
}

/** Should the side about to roll turn the cube? (The engine has already checked that it may.) */
export function wantsToDouble(me: Side, them: Side, sense: CubeSense): boolean {
  if (sense.length > 1) {
    // Already enough to win the match at this value: doubling only gives the other side a chance.
    if (sense.mine + sense.value >= sense.length) return false
    // Post-Crawford, the trailer doubles at once: the leader loses nothing by passing… or must take.
    if (sense.theirs === sense.length - 1) return true
  }
  if (!inContact(me, them)) return raceLead(me, them) >= 0.08
  // In contact only a crushing blitz: them on the bar against a mostly closed board, and far ahead.
  let homeMade = 0
  for (let p = 1; p <= 6; p++) if ((me[p] ?? 0) >= 2) homeMade++
  return (them[BAR] ?? 0) >= 1 && homeMade >= 5 && pips(them) - pips(me) >= 30
}

/** Should the side offered the cube take it? `doubler` is the side that turned it, about to roll. */
export function takes(me: Side, doubler: Side, sense: CubeSense): boolean {
  if (sense.length > 1 && sense.theirs + sense.value >= sense.length) return true
  if (!inContact(me, doubler)) return raceLead(doubler, me) <= 0.12
  // Shut out on the bar against a closed board, and far behind: let it go.
  let homeMade = 0
  for (let p = 1; p <= 6; p++) if ((doubler[p] ?? 0) >= 2) homeMade++
  return !((me[BAR] ?? 0) >= 1 && homeMade >= 5 && pips(me) - pips(doubler) >= 40)
}
