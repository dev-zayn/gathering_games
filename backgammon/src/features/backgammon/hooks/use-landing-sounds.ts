import { useEffect } from 'react'
import { BAR } from '@shared/backgammon/board'
import { clack, thud } from '@/lib/sound'
import type { CheckerStacks } from './use-checker-stacks'

/** Each checker that moved is heard as it lands: a clack on the board, a thud on the bar. */
export function useLandingSounds({ stacks, moved, beat }: CheckerStacks): void {
  useEffect(() => {
    if (beat === 0 || moved.length === 0) return
    // A board reset (a new game) moves everything: one clack, not thirty.
    const heard = moved.length > 4 ? moved.slice(0, 1) : moved
    heard.forEach((id, i) => {
      const onBar = stacks.some((side) => side[BAR]?.includes(id))
      ;(onBar ? thud : clack)(0.32 + i * 0.08)
    })
  }, [beat, moved, stacks])
}
