import { useEffect } from 'react'
import { BellRing } from 'lucide-react'
import { PixelTag } from '@/components/game/PixelTag'
import { realtime, useRealtime } from '@/lib/realtime/connection'

/**
 * The «YOUR TURN» takeover — shown when a turn notification lands on your
 * player channel. A tap, 2 s or the move made clears it (turns come round
 * fast, and it covers the seats); the buzz and chime already fired in
 * `alertTurn`.
 */
export function TurnAlert() {
  const { turn } = useRealtime()

  useEffect(() => {
    if (!turn) return
    const t = window.setTimeout(() => {
      realtime.dismissTurn()
    }, 2000)
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
      <span className="flex w-full max-w-md animate-count-slam items-center gap-3 rounded-card border-2 border-screen bg-coin px-4 py-3.5 text-screen shadow-pixel-lg">
        <BellRing aria-hidden className="size-7 shrink-0 animate-shake" />
        <span className="flex flex-1 flex-col items-start gap-1 text-start">
          <PixelTag className="text-12">YOUR TURN!</PixelTag>
          <span className="font-display text-17 font-extrabold">{turn.text}</span>
        </span>
      </span>
    </button>
  )
}
