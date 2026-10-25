import { useEffect, useState } from 'react'

/** True for `ms` after `key` changes (and from the start when `fromStart`): a banner's moment. */
export function useFresh(key: string, ms: number, fromStart: boolean): boolean {
  const [shown, setShown] = useState(fromStart ? key : '')
  const [seen, setSeen] = useState(key)
  if (seen !== key) {
    setSeen(key)
    setShown(key)
  }
  useEffect(() => {
    if (!shown) return
    const t = window.setTimeout(() => {
      setShown('')
    }, ms)
    return () => {
      window.clearTimeout(t)
    }
  }, [shown, ms])
  return shown !== '' && shown === key
}
