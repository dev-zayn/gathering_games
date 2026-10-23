import { useEffect, useState } from 'react'

/**
 * Seconds left until `endsAt` — the SERVER's epoch deadline — ticking at 10Hz.
 * `clockOffset` (server − client) lines every phone up on the same second; the
 * server alone decides when the turn really ends.
 */
export function useTimeLeft(endsAt: number | null, clockOffset: number): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (endsAt === null) return
    const id = window.setInterval(() => {
      setNow(Date.now())
    }, 100)
    return () => {
      window.clearInterval(id)
    }
  }, [endsAt])

  return endsAt === null ? 0 : Math.max(0, (endsAt - (now + clockOffset)) / 1000)
}
