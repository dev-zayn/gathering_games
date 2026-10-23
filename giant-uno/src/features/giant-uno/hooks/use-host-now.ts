import { useEffect, useState } from 'react'

/** The host's clock, read on this phone four times a second: for the move's countdown. */
export function useHostNow(clockOffset: number): number {
  const [now, setNow] = useState(() => Date.now() + clockOffset)
  useEffect(() => {
    const tick = window.setInterval(() => {
      setNow(Date.now() + clockOffset)
    }, 250)
    return () => {
      window.clearInterval(tick)
    }
  }, [clockOffset])
  return now
}
