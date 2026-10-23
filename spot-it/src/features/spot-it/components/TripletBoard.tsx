import type { BoardProps } from '../lib/board'
import { isUp } from '../lib/board'
import { SpotDisc } from './SpotDisc'

/** The triplet: the face-up cards in place. A symbol on three of them is the catch; tap it on any. */
export function TripletBoard({ view, now, canTap, spot, shakeOf }: BoardProps) {
  const seen = view.grid.map((c) => c.id)
  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-13 text-ink-faint">لگط رمز موجود على ثلاث ورقات</p>
      <div className="grid grid-cols-3 gap-2.5">
        {view.grid.map((card, i) => (
          <SpotDisc
            key={`${String(i)}-${String(card.id)}`}
            card={card}
            seed={view.seed}
            faceUp={isUp(card, now)}
            tone="coin"
            shake={shakeOf(card.id)}
            label={`ورقة ${String(i + 1)}`}
            className="animate-pixel-pop"
            dense
            onSpot={
              canTap && isUp(card, now)
                ? (symbol) => {
                    const right = view.grid.filter((c) => isUp(c, now) && c.symbols.includes(symbol)).length >= 3
                    spot({ symbol, seen, card: card.id, right })
                  }
                : undefined
            }
          />
        ))}
      </div>
      <span className="text-center font-display text-13 font-bold text-neon">{`جمعت ${String(view.count)} ورقة`}</span>
    </div>
  )
}
