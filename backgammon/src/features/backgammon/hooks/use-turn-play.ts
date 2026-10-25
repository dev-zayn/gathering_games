import { useState } from 'react'
import { BAR, other, type Board, type Seat } from '@shared/backgammon/board'
import { applyMoves, legalMoves, routesFrom, type Move } from '@shared/backgammon/moves'
import { haptic } from '@/lib/miniapp'

/** A turn this screen plays: the board it started from, whose it is, the roll. */
export interface TurnInput {
  board: Board
  mover: Seat
  dice: [number, number]
  /** Changes with every new turn: the moves made so far start again from `staged`. */
  key: string
  /** Moves already made (and sent) this turn, to pick up after a reload. */
  staged: Move[]
}

interface Local {
  key: string
  staged: Move[]
  /** How many moves each tap added (a route of two dice is one tap), for «رجّع». */
  taps: number[]
  selected: number | null
  /** «تمّ» was pressed: the turn is on its way, the hand lets go. */
  sent: boolean
}

/**
 * The moves of the turn in hand, before «تمّ»: which checkers may move
 * now, where the picked one can go (one die or several through open
 * points), the board as it stands, and the taps to move, take a move
 * back and finish. Every change is sent on (`onStage`) so the other side
 * watches it happen.
 */
export function useTurnPlay(turn: TurnInput | null, onStage: (moves: Move[]) => void, onPlay: (moves: Move[]) => void) {
  const key = turn?.key ?? ''
  const [local, setLocal] = useState<Local>(() => ({ key, staged: turn?.staged ?? [], taps: [], selected: null, sent: false }))
  let current = local
  if (local.key !== key) {
    current = { key, staged: turn?.staged ?? [], taps: turn?.staged.map(() => 1) ?? [], selected: null, sent: false }
    setLocal(current)
  }

  if (!turn) {
    return { active: false as const, board: null, staged: [] as Move[], sources: new Set<number>(), targets: new Map<number, Move[]>() }
  }

  const me0 = turn.board[turn.mover]
  const them0 = turn.board[other(turn.mover)]
  const { staged } = current
  const pos = applyMoves(me0, them0, staged)
  const board: Board = turn.mover === 0 ? [pos.me, pos.them] : [pos.them, pos.me]
  const legal = legalMoves(me0, them0, turn.dice, staged)
  const sources = new Set(current.sent ? [] : legal.map((m) => m.from))
  // A checker on the bar is the only one that may move: it is picked for you.
  const selected = (pos.me[BAR] ?? 0) > 0 && sources.has(BAR) ? BAR : current.selected
  const targets = selected !== null && sources.has(selected) ? routesFrom(me0, them0, turn.dice, staged, selected) : new Map<number, Move[]>()

  const update = (next: Omit<Local, 'key'>) => {
    setLocal({ ...next, key })
  }

  return {
    active: true as const,
    board,
    staged,
    sources,
    targets,
    selected,
    /** Nothing more can be played: «تمّ» sends the turn. */
    complete: legal.length === 0,
    canUndo: staged.length > 0 && !current.sent,
    sent: current.sent,
    pick: (from: number) => {
      if (!sources.has(from)) {
        update({ ...current, selected: null })
        return
      }
      haptic()
      update({ ...current, selected: from === selected ? null : from })
    },
    drop: (to: number) => {
      const route = targets.get(to)
      if (!route) return
      haptic()
      const moves = [...staged, ...route]
      update({ staged: moves, taps: [...current.taps, route.length], selected: null, sent: false })
      onStage(moves)
    },
    clear: () => {
      update({ ...current, selected: null })
    },
    undo: () => {
      const last = current.taps.at(-1)
      if (last === undefined) return
      const moves = staged.slice(0, staged.length - last)
      update({ staged: moves, taps: current.taps.slice(0, -1), selected: null, sent: false })
      onStage(moves)
    },
    submit: () => {
      if (legal.length > 0 || current.sent) return
      update({ ...current, selected: null, sent: true })
      onPlay(staged)
    },
  }
}

export type TurnPlay = ReturnType<typeof useTurnPlay>
