import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * The draw's signal on this phone: lit at `goAt` on the host's clock (so
 * every phone in the room lights together), and the frame it was painted
 * in, to time the tap from. Times are `performance.now()`'s, the clock of
 * an event's `timeStamp`.
 */
export function useSignal(goAt: number, clockOffset: number, armed: boolean) {
  const [litFor, setLitFor] = useState<number | null>(null)
  const shown = useRef<{ goAt: number; at: number } | null>(null)
  const lit = armed && litFor === goAt

  useEffect(() => {
    if (!armed) return
    const timer = window.setTimeout(
      () => {
        shown.current = { goAt, at: performance.now() }
        setLitFor(goAt)
      },
      Math.max(0, goAt - (Date.now() + clockOffset)),
    )
    return () => {
      window.clearTimeout(timer)
    }
  }, [goAt, clockOffset, armed])

  useLayoutEffect(() => {
    if (!lit) return
    // The frame that paints the lit pad is the moment the player could see it.
    const raf = requestAnimationFrame((t) => {
      shown.current = { goAt, at: t }
    })
    return () => {
      cancelAnimationFrame(raf)
    }
  }, [lit, goAt])

  /** Milliseconds from the pad lighting to `t`, or null when it has not lit. */
  const since = (t: number): number | null => {
    const s = shown.current
    return lit && s?.goAt === goAt ? Math.max(0, Math.round(t - s.at)) : null
  }

  return { lit, since }
}
