import { cn } from '@/lib/utils'
import type { BoardProps } from '../lib/board'
import { isUp, shared } from '../lib/board'
import { SeatCard } from './SeatCard'
import { SpotDisc } from './SpotDisc'

/**
 * The hot potato and the poisoned gift: your card (the potato) or the
 * middle card (the gift) over everyone else's. The catch is a symbol it
 * shares with another player's card: tap it on THEIR card, and the cards go
 * to them.
 */
export function FaceOffBoard({ view, now, canTap, spot, shakeOf }: BoardProps) {
  const potato = view.mode === 'potato'
  const main = potato ? view.mine : view.center
  const live = canTap && isUp(main, now)
  // One rival sits in the middle; up to four in pairs; more in threes.
  const cols = view.seats.length === 1 ? 'mx-auto max-w-44 grid-cols-1' : view.seats.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full max-w-56 flex-col items-center gap-1.5">
        <SpotDisc
          card={main}
          seed={view.seed}
          faceUp={isUp(main, now)}
          tone={potato ? 'neon' : 'coin'}
          shake={shakeOf(main?.id)}
          label={potato ? 'ورقتك' : 'ورقة النص'}
          empty={potato ? (view.dealt ? 'إنت سالم هالجولة، تفرّج' : 'تتفرج هالجولة') : 'خلص الكوم'}
        />
        <span className={cn('font-display text-13 font-bold', potato ? 'text-neon' : 'text-coin')}>
          {potato ? `بإيدك ${String(view.count)} ورقة` : `ورقة النص · مسموم عندك ${String(view.count)}`}
        </span>
      </div>
      <p className="text-center text-13 text-ink-faint">
        {potato ? 'لگط الرمز على ورقة غيرك وانطيه ورقك' : 'لگط الرمز على ورقة واحد، والهدية تروح له'}
      </p>
      <div className={cn('grid w-full gap-3', cols)}>
        {view.seats.map((seat) => (
          <SeatCard
            key={seat.id}
            seat={seat}
            view={view}
            now={now}
            shake={shakeOf(seat.top?.id)}
            onSpot={
              live && isUp(seat.top, now)
                ? (symbol) => {
                    const theirs = seat.top
                    if (!theirs) return
                    spot({ symbol, target: seat.id, seen: [main.id, theirs.id], card: theirs.id, right: shared(main, theirs, symbol) })
                  }
                : undefined
            }
          />
        ))}
      </div>
    </div>
  )
}
