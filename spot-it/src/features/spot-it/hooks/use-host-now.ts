import { useEffect, useState } from 'react'

/**
 * The host's clock on this phone (`Date.now() + clockOffset`), read again at
 * each of `deadlines` as it passes: a card turning up, a freeze thawing. One
 * timer, to the next deadline only.
 */
export function useHostNow(clockOffset: number, deadlines: readonly number[]): number {
  const [now, setNow] = useState(() => Date.now() + clockOffset)
  const key = deadlines.join(',')

  useEffect(() => {
    const list = key ? key.split(',').map(Number) : []
    let timer = 0
    const tick = () => {
      const t = Date.now() + clockOffset
      setNow(t)
      const next = Math.min(...list.filter((d) => d > t))
      if (Number.isFinite(next)) timer = window.setTimeout(tick, next - t + 4)
    }
    timer = window.setTimeout(tick, 0)
    return () => {
      window.clearTimeout(timer)
    }
  }, [clockOffset, key])

  return now
}
