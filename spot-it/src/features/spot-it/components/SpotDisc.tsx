import { SYMBOLS } from '@shared/data/spot-symbols'
import type { SpotCard } from '@shared/protocol'
import { PixelSprite } from '@/components/PixelSprite'
import { cn } from '@/lib/utils'
import { layoutOf } from '../lib/layout'

const TONES = {
  coin: 'border-coin',
  neon: 'border-neon',
  plasma: 'border-plasma',
  rule: 'border-rule',
} as const

interface Props {
  card: SpotCard | null
  seed: number
  /** False until the host's clock reaches the card's `at`: every phone turns it up at once. */
  faceUp: boolean
  tone?: keyof typeof TONES
  /** A tap on one of its symbols. Absent: the card is only looked at. */
  onSpot?: (symbol: number) => void
  /** Bumps on a wrong tap on this card: it shakes once. */
  shake?: number
  /** Shown in the ring when there is no card. */
  empty?: string
  /** A small card (the triplet's grid, another player's): bigger symbols in the same places. */
  dense?: boolean
  label: string
  className?: string
}

/**
 * One round card: eight symbols, one in the middle and seven round it, each
 * its own size and turn. Symbols are keys that fire on touch-down, not on
 * release: a race is won in the first few milliseconds.
 */
export function SpotDisc({ card, seed, faceUp, tone = 'rule', onSpot, shake = 0, empty, dense = false, label, className }: Props) {
  return (
    <div
      key={shake}
      role="group"
      aria-label={label}
      className={cn(
        '@container relative aspect-square w-full rounded-full border-4 bg-card shadow-pixel',
        TONES[tone],
        shake > 0 && 'animate-shake',
        !card && 'border-dashed border-dash bg-transparent shadow-none',
        className,
      )}
    >
      {!card ? (
        empty && (
          <span className="absolute inset-0 flex items-center justify-center p-4 text-center font-display text-13 font-bold text-ink-faint">
            {empty}
          </span>
        )
      ) : !faceUp ? (
        <span aria-hidden className="absolute inset-2 flex items-center justify-center rounded-full bg-screen pixel-grid">
          <PixelSprite name="eye" className="size-1/3 animate-blink" />
        </span>
      ) : (
        layoutOf(card, seed).map((p) => {
          const symbol = SYMBOLS[p.symbol]
          return (
            <button
              key={p.symbol}
              type="button"
              aria-label={symbol?.name ?? '؟'}
              disabled={!onSpot}
              onPointerDown={(e) => {
                if (e.button !== 0) return
                e.preventDefault()
                onSpot?.(p.symbol)
              }}
              onClick={(e) => {
                // Keyboards press without a pointer: `detail` 0.
                if (e.detail === 0) onSpot?.(p.symbol)
              }}
              className="absolute flex touch-manipulation items-center justify-center rounded-full select-none outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-ghost disabled:cursor-default"
              style={{
                insetInlineStart: `${String(p.x - p.hit / 2)}%`,
                top: `${String(p.y - p.hit / 2)}%`,
                width: `${String(p.hit)}%`,
                height: `${String(p.hit)}%`,
              }}
            >
              <span aria-hidden className="leading-none" style={{ fontSize: `${String(p.size * (dense ? 1.2 : 1))}cqw`, transform: `rotate(${String(p.turn)}deg)` }}>
                {symbol?.glyph}
              </span>
            </button>
          )
        })
      )}
    </div>
  )
}
