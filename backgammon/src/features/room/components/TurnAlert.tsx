import { useEffect } from 'react'
import { TeaGlass } from '@/components/art/TeaGlass'
import { realtime, useRealtime } from '@/lib/realtime/connection'

/**
 * «دورك»: a small note dropped at the top of the screen when the board
 * starts waiting on this phone, gone after a moment or a tap. Two players
 * turn by turn would tire of anything bigger.
 */
export function TurnAlert() {
  const { turn } = useRealtime()

  useEffect(() => {
    if (!turn) return
    const t = window.setTimeout(() => {
      realtime.dismissTurn()
    }, 1600)
    return () => {
      window.clearTimeout(t)
    }
  }, [turn])

  if (!turn) return null
  return (
    <button
      key={turn.id}
      type="button"
      onClick={() => {
        realtime.dismissTurn()
      }}
      aria-live="assertive"
      className="fixed inset-x-0 top-0 z-80 flex justify-center px-3 pt-safe-3"
    >
      <span className="flex animate-lay-down items-center gap-2.5 rounded-full border border-brass/60 bg-slab-raised py-1.5 ps-2 pe-5 shadow-slab">
        <TeaGlass className="h-8 w-6" />
        <span className="font-hand text-22 leading-none font-bold text-brass-lit">{turn.text}</span>
      </span>
    </button>
  )
}
