import { m } from 'framer-motion'
import type { Board, Seat } from '@shared/backgammon/board'
import { useCheckerStacks } from '../hooks/use-checker-stacks'
import { useLandingSounds } from '../hooks/use-landing-sounds'
import { checkerAt, spotOf, type Spot } from '../lib/geometry'
import { Checker } from './Checker'

interface Props {
  board: Board
  perspective: Seat
}

const GLIDE = { type: 'spring', stiffness: 210, damping: 26, mass: 1 } as const

interface Placed {
  id: string
  seat: Seat
  spot: Spot
  k: number
  n: number
}

/** A tall stack shows its count on the top checker. */
const countOf = (c: Placed): number | null =>
  c.k === c.n - 1 && ((c.spot.kind === 'point' && c.n > 5) || (c.spot.kind === 'bar' && c.n > 2)) ? c.n : null

/**
 * All thirty checkers, each one itself from board to board: the ones that
 * moved glide to their new place over the others and are heard landing.
 */
export function CheckerLayer({ board, perspective }: Props) {
  const stacks = useCheckerStacks(board)
  useLandingSounds(stacks)
  const moved = new Set(stacks.moved)
  const placed: Placed[] = []
  for (const seat of [0, 1] as const) {
    stacks.stacks[seat].forEach((ids, index) => {
      const spot = spotOf(seat, index, perspective)
      ids.forEach((id, k) => placed.push({ id, seat, spot, k, n: ids.length }))
    })
  }
  // Paint order: up each stack, and whatever is on the move above it all.
  placed.sort((a, b) => Number(moved.has(a.id)) - Number(moved.has(b.id)) || a.k - b.k)

  return (
    <g>
      {placed.map((c) => {
        const at = checkerAt(c.spot, c.k, c.n)
        return (
          <m.g key={c.id} initial={false} animate={{ x: at.x, y: at.y }} transition={GLIDE}>
            <Checker seat={c.seat} edge={c.spot.kind === 'off'} count={countOf(c)} />
          </m.g>
        )
      })}
    </g>
  )
}
