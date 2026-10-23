import { useEffect, useState } from 'react'

/** Whole seconds left until `until` on the host's clock, ticking while there are any. */
export function useCountdown(until: number, clockOffset: number): number {
  const left = () => Math.max(0, Math.ceil((until - (Date.now() + clockOffset)) / 1000))
  const [secs, setSecs] = useState(left)

  useEffect(() => {
    const read = () => Math.max(0, Math.ceil((until - (Date.now() + clockOffset)) / 1000))
    const timer = window.setInterval(() => {
      setSecs(read())
    }, 100)
    return () => {
      window.clearInterval(timer)
    }
  }, [until, clockOffset])

  return secs
}
