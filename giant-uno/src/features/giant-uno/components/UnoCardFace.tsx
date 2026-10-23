import { Ban, PencilLine, Repeat2 } from 'lucide-react'
import { COLORS, cardName } from '@shared/data/deck'
import type { UnoCard } from '@shared/protocol'
import { cn } from '@/lib/utils'
import { SUIT_BG, SUIT_TEXT } from '../lib/cards'

const SIZES = {
  /** The pile's top card. */
  lg: { box: 'w-28 p-2', glyph: 'text-56', icon: 'size-14', over: 'text-28' },
  /** A card in your hand. */
  md: { box: 'w-full p-1', glyph: 'text-28', icon: 'size-7', over: 'text-16' },
  /** A hand shown after a challenge, or left at the end. */
  sm: { box: 'w-8 p-0.5', glyph: 'text-14', icon: 'size-3.5', over: 'text-10' },
} as const

export type CardSize = keyof typeof SIZES

interface Props {
  card: UnoCard
  size?: CardSize
  className?: string
}

/**
 * One card's face: its colour round a CRT-black panel with the number or
 * the symbol glowing in the middle. A wild's panel holds the four colours,
 * with «+4» or the house rule's pencil on top.
 */
export function UnoCardFace({ card, size = 'md', className }: Props) {
  const s = SIZES[size]
  return (
    <div
      role="img"
      aria-label={cardName(card)}
      className={cn(
        'flex aspect-2/3 shrink-0 rounded-card border-2 border-screen shadow-pixel',
        card.color ? SUIT_BG[card.color] : 'bg-ink',
        s.box,
        className,
      )}
    >
      <div
        className={cn(
          'relative flex size-full items-center justify-center overflow-hidden rounded-control bg-screen',
          card.color && SUIT_TEXT[card.color],
        )}
      >
        {card.color ? (
          card.kind === 'skip' ? (
            <Ban aria-hidden strokeWidth={3} className={s.icon} />
          ) : card.kind === 'reverse' ? (
            <Repeat2 aria-hidden strokeWidth={3} className={s.icon} />
          ) : (
            <span dir="ltr" className={cn('font-display leading-none font-extrabold glow-text', s.glyph)}>
              {card.kind === 'draw2' ? '+2' : String(card.value)}
            </span>
          )
        ) : (
          <>
            <span aria-hidden className="grid aspect-square w-2/3 rotate-45 grid-cols-2 gap-0.5">
              {COLORS.map((c) => (
                <span key={c} className={cn('rounded-control', SUIT_BG[c])} />
              ))}
            </span>
            {card.kind === 'wild4' && (
              <span dir="ltr" className={cn('absolute rounded-control bg-screen px-1 font-display leading-none font-extrabold text-ink', s.over)}>
                +4
              </span>
            )}
            {card.kind === 'custom' && (
              <span className="absolute rounded-control bg-screen p-0.5 text-ink">
                <PencilLine aria-hidden strokeWidth={3} className={s.icon} />
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
