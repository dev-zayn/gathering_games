import { useRef, useState } from 'react'
import { realtime } from '@/lib/realtime/connection'
import { haptic } from '@/lib/miniapp'

export interface SpotTap {
  symbol: number
  /** The player handed the cards (the hot potato, the poisoned gift). */
  target?: string
  /** The cards matched across, in the engine's order (`involved`): a claim on cards since changed is late. */
  seen: number[]
  /** The card tapped, to shake on a miss. */
  card: number
  /** This phone's own read of the tap, for feedback before the host's answer. */
  right: boolean
}

/** A tap breathes this long before the next counts: the host takes one claim a player a beat. */
const RIGHT_GAP_MS = 450
const WRONG_GAP_MS = 250

/**
 * Taps as claims to the host, stamped with the host's clock (the earliest
 * tap wins, not the nearest phone). A miss shakes its card at once; the
 * freeze it earns comes back in the view.
 */
export function useSpot(clockOffset: number) {
  const [shake, setShake] = useState<{ card: number; n: number }>({ card: -1, n: 0 })
  const quietUntil = useRef(0)

  const spot = (tap: SpotTap) => {
    const now = Date.now()
    if (now < quietUntil.current) return
    quietUntil.current = now + (tap.right ? RIGHT_GAP_MS : WRONG_GAP_MS)
    haptic(tap.right ? 'short' : 'long')
    if (!tap.right) setShake((s) => ({ card: tap.card, n: s.n + 1 }))
    realtime.act({ type: 'spot', symbol: tap.symbol, target: tap.target, seen: tap.seen, at: now + clockOffset })
  }

  /** The shake count for one card: bumps only for misses on it. */
  const shakeOf = (card: number | undefined) => (card !== undefined && shake.card === card ? shake.n : 0)

  return { spot, shakeOf }
}
