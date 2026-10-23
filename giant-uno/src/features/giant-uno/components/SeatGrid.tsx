import { Hand, Layers, WifiOff } from 'lucide-react'
import type { UnoView } from '@shared/protocol'
import { PixelTag } from '@/components/game/PixelTag'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  view: UnoView
  /** Seconds left on the move. */
  secs: number
  onCatch: (who: string) => void
}

/**
 * Everyone at the table in seat order: how many cards each holds, whose
 * move it is (and how long it has left), who said «وحدة!», and a key to
 * catch whoever is down to one without saying it.
 */
export function SeatGrid({ view, secs, onCatch }: Props) {
  const totals = view.options.target > 0
  return (
    <ul aria-label="اللاعبين" className="grid grid-cols-3 gap-2">
      {view.seats.map((seat) => {
        const moving = seat.id === view.turn && view.phase !== 'between' && view.phase !== 'over'
        return (
          <li
            key={seat.id}
            aria-current={moving ? 'true' : undefined}
            className={cn(
              'flex min-w-0 flex-col gap-1 rounded-card border-2 bg-card p-2 shadow-pixel',
              moving ? 'border-neon text-neon glow-box' : 'border-hairline',
            )}
          >
            <span className="flex min-w-0 items-center gap-1 font-display text-13 font-bold text-ink">
              {!seat.connected && <WifiOff aria-label="طالع" className="size-3.5 shrink-0 text-ink-faint" />}
              <span className={cn('truncate', seat.you && 'text-neon')}>{seat.you ? 'إنت' : seat.name}</span>
            </span>
            <span className="flex items-center gap-1.5 text-ink-soft">
              <Layers aria-label="ورق" className="size-3.5 shrink-0" />
              <PixelTag className="text-ink">{String(seat.count)}</PixelTag>
              {seat.called && <span className="font-display text-11 font-extrabold text-coin">وحدة!</span>}
              {moving && <PixelTag className="ms-auto text-neon">{`${String(secs)}s`}</PixelTag>}
            </span>
            {totals && <span className="text-11 text-ink-faint">{`${String(seat.total)} نقطة`}</span>}
            {seat.exposed && !seat.you && view.dealt && (
              <Button
                variant="plasma"
                size="sm"
                className="h-9 px-2"
                onClick={() => {
                  onCatch(seat.id)
                }}
              >
                <Hand />
                مسكته!
              </Button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
