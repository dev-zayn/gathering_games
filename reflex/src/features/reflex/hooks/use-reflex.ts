import { useEffect, useRef, useState } from 'react'
import { submitHiScore } from '@/lib/hi-scores'
import { haptic } from '@/lib/miniapp'
import { between } from '@shared/random'

export type Side = 'p1' | 'p2'

/** First to this many points takes the match. */
export const TARGET = 5

export type ReflexPhase =
  | { kind: 'lobby' }
  /** Waiting for the signal — a tap now is a foul. */
  | { kind: 'armed' }
  | { kind: 'go'; at: number }
  | { kind: 'point'; winner: Side; foul: boolean; ms?: number; record: boolean }
  | { kind: 'match'; winner: Side }

const other = (s: Side): Side => (s === 'p1' ? 'p2' : 'p1')

/**
 * The quick-draw duel. The signal lands after a random 1.5–4.5s, so nobody can
 * count it in; a tap before it hands the point to the other side.
 */
export function useReflex() {
  const [phase, setPhase] = useState<ReflexPhase>({ kind: 'lobby' })
  const [score, setScore] = useState<Record<Side, number>>({ p1: 0, p2: 0 })
  const timer = useRef(0)

  useEffect(
    () => () => {
      window.clearTimeout(timer.current)
    },
    [],
  )

  const arm = () => {
    window.clearTimeout(timer.current)
    setPhase({ kind: 'armed' })
    timer.current = window.setTimeout(() => {
      haptic('long')
      setPhase({ kind: 'go', at: performance.now() })
    }, between(1500, 4500))
  }

  const award = (winner: Side, point: Omit<Extract<ReflexPhase, { kind: 'point' }>, 'kind' | 'winner'>) => {
    const next = { ...score, [winner]: score[winner] + 1 }
    setScore(next)
    if (next[winner] >= TARGET) {
      setPhase({ kind: 'match', winner })
      return
    }
    setPhase({ kind: 'point', winner, ...point })
    timer.current = window.setTimeout(arm, 1800)
  }

  const tap = (side: Side) => {
    if (phase.kind === 'armed') {
      window.clearTimeout(timer.current)
      haptic('long')
      award(other(side), { foul: true, record: false })
    } else if (phase.kind === 'go') {
      const ms = Math.round(performance.now() - phase.at)
      haptic()
      award(side, { foul: false, ms, record: submitHiScore('reflex', ms, 'lower') })
    }
  }

  const rematch = () => {
    setScore({ p1: 0, p2: 0 })
    arm()
  }

  return { phase, score, tap, start: arm, rematch }
}
