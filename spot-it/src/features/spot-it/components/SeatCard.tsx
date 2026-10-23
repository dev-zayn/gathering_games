import { Snowflake, WifiOff } from 'lucide-react'
import type { SpotSeat, SpotView } from '@shared/protocol'
import { cn } from '@/lib/utils'
import { isUp } from '../lib/board'
import { SpotDisc } from './SpotDisc'

interface Props {
  seat: SpotSeat
  view: SpotView
  now: number
  onSpot?: (symbol: number) => void
  shake: number
}

/** Another player's place at the table: their card to match against, their count, frozen or gone. */
export function SeatCard({ seat, view, now, onSpot, shake }: Props) {
  const frozen = seat.frozenUntil > now
  return (
    <div className="flex min-w-0 flex-col items-center gap-1">
      <SpotDisc
        card={seat.top}
        seed={view.seed}
        faceUp={isUp(seat.top, now)}
        tone="plasma"
        shake={shake}
        onSpot={onSpot}
        dense
        label={`ورقة ${seat.name}`}
        empty={view.mode === 'potato' ? 'سالم' : undefined}
        className={cn(frozen && 'opacity-60')}
      />
      <span className="flex max-w-full items-center gap-1 font-display text-12 font-bold text-ink-soft">
        {!seat.connected && <WifiOff aria-label="طالع" className="size-3.5 shrink-0 text-ink-faint" />}
        {frozen && <Snowflake aria-label="مجمّد" className="size-3.5 shrink-0 text-neon" />}
        <span className="truncate">{seat.name}</span>
        <span dir="ltr" className="shrink-0 font-pixel text-9 text-plasma">
          {String(seat.count)}
        </span>
      </span>
    </div>
  )
}
