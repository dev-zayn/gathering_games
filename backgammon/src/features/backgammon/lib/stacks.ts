// Every checker keeps its own identity between two boards, so the one that
// moved is the one that glides: the board only says how many sit where, so
// the checkers that left a place are paired with the places that gained
// one, farthest first on both sides (a turn's checkers run from high
// points to low, the bar counting highest and off lowest; a hit runs from
// a point to the bar).

import type { Board, Seat } from '@shared/backgammon/board'

/** By seat, by index (0 off, 1–24, 25 bar): the checkers there, bottom to top. */
export type Stacks = [string[][], string[][]]

export function stacksOf(board: Board): Stacks {
  const one = (seat: Seat) => {
    let n = 0
    return board[seat].map((count) => Array.from({ length: count }, () => `${String(seat)}-${String(n++)}`))
  }
  return [one(0), one(1)]
}

/** The stacks for a new board, the checkers that moved named. */
export function restack(prev: Stacks, board: Board): { stacks: Stacks; moved: string[] } {
  const moved: string[] = []
  const side = (seat: Seat): string[][] => {
    const next = prev[seat].map((s) => s.slice())
    const counts = board[seat]
    const left: { id: string; from: number }[] = []
    next.forEach((stack, i) => {
      while (stack.length > (counts[i] ?? 0)) {
        const id = stack.pop()
        if (id) left.push({ id, from: i })
      }
    })
    const gained: number[] = []
    counts.forEach((count, i) => {
      for (let k = next[i]?.length ?? 0; k < count; k++) gained.push(i)
    })
    left.sort((a, b) => b.from - a.from)
    gained.sort((a, b) => b - a)
    gained.forEach((i, j) => {
      const checker = left[j]
      if (!checker) return
      next[i]?.push(checker.id)
      moved.push(checker.id)
    })
    return next
  }
  return { stacks: [side(0), side(1)], moved }
}
