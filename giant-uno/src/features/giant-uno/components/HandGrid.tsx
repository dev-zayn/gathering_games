import { cardName } from '@shared/data/deck'
import type { UnoCard, UnoView } from '@shared/protocol'
import { PixelTag } from '@/components/game/PixelTag'
import { cn } from '@/lib/utils'
import { sortHand } from '../lib/cards'
import { UnoCardFace } from './UnoCardFace'

interface Props {
  view: UnoView
  /** Your move: the cards that do not fit dim. */
  yours: boolean
  /** The wild waiting for its colour. */
  picked: number | null
  onPick: (card: UnoCard) => void
}

/** Your hand, sorted by colour: the cards that fit stand up and take a tap. */
export function HandGrid({ view, yours, picked, onPick }: Props) {
  const hand = sortHand(view.hand)
  return (
    <section aria-label="ورقك" className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-16 font-bold">ورقك</h2>
        <PixelTag className="text-neon">{`${String(hand.length)} CARDS`}</PixelTag>
      </div>
      <ul className={cn('grid gap-2 pt-2', hand.length > 15 ? 'grid-cols-6' : 'grid-cols-5')}>
        {hand.map((card) => {
          const fits = view.playable.includes(card.id)
          return (
            <li key={card.id}>
              <button
                type="button"
                aria-label={fits ? `العب ${cardName(card)}` : cardName(card)}
                disabled={!fits}
                onClick={() => {
                  onPick(card)
                }}
                className={cn(
                  'block w-full touch-manipulation rounded-card transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default',
                  fits && '-translate-y-2',
                  picked === card.id && '-translate-y-3.5',
                  yours && !fits && 'opacity-40',
                  card.id === view.drawn && 'animate-pixel-pop',
                )}
              >
                <UnoCardFace card={card} />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
