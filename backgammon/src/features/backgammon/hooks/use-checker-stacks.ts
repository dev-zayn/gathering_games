import { useState } from 'react'
import type { Board } from '@shared/backgammon/board'
import { restack, stacksOf, type Stacks } from '../lib/stacks'

export interface CheckerStacks {
  stacks: Stacks
  /** The checkers the last change moved: drawn on top, heard landing. */
  moved: string[]
  /** Bumps on every change of the board. */
  beat: number
}

/** Each checker's place, carried from board to board so the one that moved is the one that glides. */
export function useCheckerStacks(board: Board): CheckerStacks {
  const key = `${board[0].join()}|${board[1].join()}`
  const [memo, setMemo] = useState(() => ({ key, stacks: stacksOf(board), moved: [] as string[], beat: 0 }))
  if (memo.key === key) return memo
  // A new board: worked out while rendering (React's "state from props"), kept for the next one.
  const next = restack(memo.stacks, board)
  const updated = { key, stacks: next.stacks, moved: next.moved, beat: memo.beat + 1 }
  setMemo(updated)
  return updated
}
