import { ArrowLeftRight } from 'lucide-react'
import { COLOR_NAMES } from '@shared/data/deck'
import type { UnoView } from '@shared/protocol'
import { PixelTag } from '@/components/game/PixelTag'
import { cn } from '@/lib/utils'
import { SUIT_BG, SUIT_TEXT } from '../lib/cards'
import { CardBack } from './CardBack'
import { UnoCardFace } from './UnoCardFace'

interface Props {
  view: UnoView
  /** The draw pile takes a tap: it is your move and you have not drawn yet. */
  canDraw: boolean
  onDraw: () => void
}

/**
 * The middle of the table on a CRT that glows in the colour to follow: the
 * draw pile, the top card, the colour called, which way play runs.
 */
export function TableCenter({ view, canDraw, onDraw }: Props) {
  return (
    <section
      aria-label="الطاولة"
      className={cn('relative flex flex-col items-center gap-3 overflow-hidden rounded-section bg-screen p-4 glow-box', SUIT_TEXT[view.color])}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 scanlines" />
      <div className="relative flex items-center justify-center gap-6">
        <button
          type="button"
          aria-label="اسحب ورقة"
          disabled={!canDraw}
          onClick={onDraw}
          className={cn(
            'flex flex-col items-center gap-1.5 rounded-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default',
            canDraw && 'animate-sprite-hop',
          )}
        >
          <CardBack />
          <PixelTag className={canDraw ? 'text-coin' : 'text-ink-faint'}>{canDraw ? 'DRAW' : `DECK ${String(view.pile)}`}</PixelTag>
        </button>
        <div className="flex flex-col items-center gap-1.5">
          {view.top && <UnoCardFace key={view.top.id} card={view.top} size="lg" className="animate-pixel-pop" />}
          <PixelTag className="text-ink-faint">{`HAND ${String(view.handNo)}`}</PixelTag>
        </div>
      </div>
      <div className="relative flex w-full items-center justify-between gap-3 text-ink">
        <span className="flex items-center gap-2 font-display text-14 font-bold">
          <span aria-hidden className={cn('size-3.5 rounded-control', SUIT_BG[view.color])} />
          {`اللون: ${COLOR_NAMES[view.color]}`}
        </span>
        <span className="flex items-center gap-1.5 text-13 font-semibold text-ink-soft">
          <ArrowLeftRight aria-hidden className="size-4" />
          {view.dir === 1 ? 'الدور بالترتيب' : 'الدور معكوس'}
        </span>
      </div>
    </section>
  )
}
