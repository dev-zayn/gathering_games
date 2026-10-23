import { useEffect } from 'react'
import { SYMBOLS } from '@shared/data/spot-symbols'
import type { SpotView } from '@shared/protocol'
import { haptic } from '@/lib/miniapp'
import { cn } from '@/lib/utils'

/** The latest catch, in a line over the board: who caught what, and who it landed on. */
export function CatchLine({ view }: { view: SpotView }) {
  const last = view.last
  const n = last?.n ?? 0
  const hitYou = !!last?.toYou

  useEffect(() => {
    // A buzz when it lands on you; your own catch already buzzed on the tap.
    if (n > 0 && hitYou) haptic('long')
  }, [n, hitYou])

  if (!last) {
    return <p className="min-h-10 text-center font-display text-15 font-bold text-ink-faint">لگط الرمز المشترك!</p>
  }
  const glyph = SYMBOLS[last.symbol]?.glyph ?? '؟'
  const text = last.you
    ? last.to
      ? `لگطتها ${glyph} وراحت لـ${last.to}`
      : `لگطتها! ${glyph}`
    : last.toYou
      ? `${last.by} لگط ${glyph} وانطاك الورق`
      : last.to
        ? `${last.by} لگط ${glyph} وانطاها لـ${last.to}`
        : `${last.by} لگط ${glyph}`

  return (
    <p
      key={n}
      role="status"
      aria-live="polite"
      className={cn(
        'flex min-h-10 animate-pixel-pop items-center justify-center text-center font-display text-17 font-extrabold',
        last.you ? 'text-success' : last.toYou ? 'text-plasma' : 'text-ink',
      )}
    >
      {text}
    </p>
  )
}
