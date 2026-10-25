// طاولي's board, as both sides and the engine see it. Each side is counted
// in its own numbering, the way a player calls the points: 1–6 is that
// side's home board, 24 the farthest point from it, 25 the bar and 0 the
// checkers already borne off. The other side's point p is this side's
// point 25 − p (`across`), so the two arrays together are the whole board.

export type Seat = 0 | 1

/** One side's 15 checkers by place: index 0 borne off, 1–24 the points, 25 the bar. */
export type Side = number[]

/** Both sides, by seat: seat 0 plays the ivory checkers, seat 1 the ebony. */
export type Board = [Side, Side]

export const CHECKERS = 15
export const BAR = 25
export const OFF = 0
/** The highest point of a side's home board. */
export const HOME = 6

/** The opening set-up, the same for each side in its own numbering: 2 on the 24, 5 on the 13, 3 on the 8, 5 on the 6. */
export function startSide(): Side {
  const side = Array.from({ length: 26 }, () => 0)
  side[24] = 2
  side[13] = 5
  side[8] = 3
  side[6] = 5
  return side
}

export const startBoard = (): Board => [startSide(), startSide()]

export const other = (seat: Seat): Seat => (seat === 0 ? 1 : 0)

/** The point of this side that the other side calls `p`. */
export const across = (p: number): number => 25 - p

/** How many pips this side still has to travel: the bar counts 25. */
export function pips(side: Side): number {
  let total = 0
  for (let p = 1; p <= BAR; p++) total += p * (side[p] ?? 0)
  return total
}

/** Every checker on this side's home board or already off: bearing off may begin. */
export function allHome(side: Side): boolean {
  for (let p = HOME + 1; p <= BAR; p++) if ((side[p] ?? 0) > 0) return false
  return true
}

/** The farthest checker from home (25 for the bar), 0 once everything is off. */
export function backmost(side: Side): number {
  for (let p = BAR; p >= 1; p--) if ((side[p] ?? 0) > 0) return p
  return 0
}

/** Some checker of one side still has to pass one of the other's: hitting can still happen. */
export function inContact(me: Side, them: Side): boolean {
  const mine = backmost(me)
  const theirs = backmost(them)
  return mine > 0 && theirs > 0 && mine + theirs > 25
}

/**
 * What the game is worth to the winner before the cube: 1, a gammon (مارس,
 * 2) when the loser has borne nothing off, a backgammon (مارس كبير, 3)
 * when the loser also still has a checker on the bar or in the winner's
 * home board (the loser's points 19–24).
 */
export function winKind(loser: Side): 1 | 2 | 3 {
  if ((loser[OFF] ?? 0) > 0) return 1
  for (let p = 19; p <= BAR; p++) if ((loser[p] ?? 0) > 0) return 3
  return 2
}

/** A board's counts are sound: 15 checkers a side, none negative, never both sides on one point. */
export function isSound(board: Board): boolean {
  const [a, b] = board
  if (a.length !== 26 || b.length !== 26) return false
  const total = (s: Side) => s.reduce((n, c) => n + c, 0)
  if (total(a) !== CHECKERS || total(b) !== CHECKERS) return false
  if (a.some((c) => c < 0 || !Number.isInteger(c)) || b.some((c) => c < 0 || !Number.isInteger(c))) return false
  for (let p = 1; p <= 24; p++) if ((a[p] ?? 0) > 0 && (b[across(p)] ?? 0) > 0) return false
  return true
}

export const cloneBoard = (board: Board): Board => [board[0].slice(), board[1].slice()]
