import type { BoardProps } from '../lib/board'
import { isUp, shared } from '../lib/board'
import { SpotDisc } from './SpotDisc'

/**
 * The tower and the well: the middle card over yours. The one symbol they
 * share is the catch; tap it on either card.
 */
export function PairBoard({ view, now, canTap, spot, shakeOf }: BoardProps) {
  const { center, mine } = view
  const live = canTap && isUp(center, now) && isUp(mine, now)
  const tap = (card: number) => (symbol: number) => {
    if (!center || !mine) return
    spot({ symbol, seen: [center.id, mine.id], card, right: shared(center, mine, symbol) })
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full max-w-64 flex-col items-center gap-1.5">
        <span className="font-display text-13 font-bold text-coin">
          {view.mode === 'well' ? 'البير' : 'ورقة النص'}
        </span>
        <SpotDisc
          card={center}
          seed={view.seed}
          faceUp={isUp(center, now)}
          tone="coin"
          shake={shakeOf(center?.id)}
          onSpot={live ? tap(center.id) : undefined}
          label="ورقة النص"
          empty="خلص الكوم"
        />
      </div>
      <div className="flex w-full max-w-64 flex-col items-center gap-1.5">
        <SpotDisc
          card={mine}
          seed={view.seed}
          faceUp={isUp(mine, now)}
          tone="neon"
          shake={shakeOf(mine?.id)}
          onSpot={live ? tap(mine.id) : undefined}
          label="ورقتك"
          empty={view.dealt ? 'خلص ورقك!' : 'تتفرج هالجولة'}
        />
        <span className="font-display text-13 font-bold text-neon">
          {view.mode === 'well' ? `ورقتك · باقي ${String(view.count)}` : `برجك · ${String(view.count)} ورقة`}
        </span>
      </div>
    </div>
  )
}
