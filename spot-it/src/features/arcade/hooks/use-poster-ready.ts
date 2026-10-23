import { useEffect, useState } from 'react'

/**
 * True once the poster has decoded AND the loading bar has had `minMs` to fill
 * — so a cached poster still gets its moment, and a slow one never shows half
 * painted. A poster that fails to load counts as ready: the intro is garnish,
 * never a gate on the game.
 */
export function usePosterReady(src: string | undefined, minMs: number): boolean {
  const [loaded, setLoaded] = useState(!src)
  const [waited, setWaited] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => {
      setWaited(true)
    }, minMs)
    return () => {
      window.clearTimeout(t)
    }
  }, [minMs])

  useEffect(() => {
    if (!src) return
    let live = true
    const img = new Image()
    img.src = src
    const done = () => {
      if (live) setLoaded(true)
    }
    img.decode().then(done, done)
    return () => {
      live = false
    }
  }, [src])

  return loaded && waited
}
