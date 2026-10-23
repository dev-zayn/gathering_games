import { useState } from 'react'
import { MIN_MS } from '@engine/games/reflex'
import type { ReflexTap, ReflexView } from '@shared/protocol'
import { submitHiScore } from '@/lib/hi-scores'
import { haptic } from '@/lib/miniapp'
import { realtime } from '@/lib/realtime/connection'
import { useSignal } from './use-signal'

/**
 * This phone's go at the draw: the signal, the tap timed here (never over
 * the network), sent to the host, and shown at once, before its answer.
 */
export function useDrawTap(view: ReflexView, clockOffset: number) {
  const armed = view.phase === 'draw' && view.dealt
  const { lit, since } = useSignal(view.goAt, clockOffset, armed)
  const [local, setLocal] = useState<{ draw: number; tap: ReflexTap; record: boolean } | null>(null)
  const mine = local?.draw === view.draw ? local : null

  /** A finger down, at `t` (the event's `timeStamp`). */
  const tap = (t: number) => {
    if (!armed || mine || view.yours) return
    const ms = since(t)
    const foul = ms === null || ms < MIN_MS
    haptic(foul ? 'long' : 'short')
    const record = !foul && submitHiScore('reflex', ms, 'lower')
    setLocal({ draw: view.draw, tap: foul ? { kind: 'foul' } : { kind: 'time', ms }, record })
    realtime.act(ms === null ? { type: 'tap', early: true } : { type: 'tap', ms })
  }

  return { lit, tap, yours: view.yours ?? mine?.tap ?? null, record: mine?.record ?? false }
}
