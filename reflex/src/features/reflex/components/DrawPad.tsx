import type { ReflexTap, ReflexView } from '@shared/protocol'
import { PixelTag } from '@/components/game/PixelTag'
import { cn } from '@/lib/utils'

interface Props {
  view: ReflexView
  lit: boolean
  /** This phone's go, as the host has it (or as it was just sent). */
  yours: ReflexTap | null
  record: boolean
  onTap: (timeStamp: number) => void
}

/** What the pad says, and how it is lit, at each moment of a draw. */
function look(view: ReflexView, lit: boolean, yours: ReflexTap | null, record: boolean) {
  if (!view.dealt) return { line: 'تتفرج هالجولة', tag: 'WATCH', sub: 'بالجولة الجاية تلعب', lit: '' }
  if (view.phase === 'result') {
    const row = view.rows.find((r) => r.you)
    const tap = row?.tap ?? { kind: 'miss' }
    if (row?.won && tap.kind === 'time') return { line: `${String(tap.ms)}ms`, tag: '+1', sub: 'إنت الأسرع!', lit: 'bg-success-soft' }
    if (tap.kind === 'time') return { line: `${String(tap.ms)}ms`, tag: 'MISS', sub: 'أبطأ بشوية', lit: '' }
    if (tap.kind === 'foul') return { line: 'استعجلت!', tag: 'FOUL', sub: 'دست قبل الإشارة', lit: 'bg-plasma-soft' }
    return { line: 'ما دست', tag: 'TOO SLOW', sub: 'الإشارة راحت عليك', lit: '' }
  }
  if (yours?.kind === 'time') {
    return { line: `${String(yours.ms)}ms`, tag: record ? 'NEW RECORD' : 'NICE', sub: `ننتظر الباقين ${String(view.done)}/${String(view.of)}`, lit: '' }
  }
  if (yours?.kind === 'foul') return { line: 'استعجلت!', tag: 'FOUL', sub: 'طلعت من هالجولة', lit: 'bg-plasma-soft animate-shake' }
  if (lit) return { line: 'دوس!', tag: 'NOW!', sub: '', lit: 'bg-coin text-screen' }
  return { line: 'استنى…', tag: 'WAIT', sub: 'لا تدوس قبل ما يضوي', lit: '' }
}

/**
 * This phone's pad: the whole of it is the key. It fires on pointer-DOWN
 * and hands over the event's own timestamp: waiting for the release, or for
 * the handler, would add lag that is not the player's.
 */
export function DrawPad({ view, lit, yours, record, onTap }: Props) {
  const l = look(view, lit, yours, record)
  const go = l.lit.includes('bg-coin')
  return (
    <button
      type="button"
      aria-label={`${l.line} ${l.sub}`}
      disabled={!view.dealt}
      onPointerDown={(e) => {
        e.preventDefault()
        onTap(e.timeStamp)
      }}
      className={cn(
        'relative flex min-h-80 flex-1 touch-none flex-col items-center justify-center gap-3 overflow-hidden rounded-section bg-screen text-neon glow-box select-none disabled:cursor-default',
        l.lit,
      )}
    >
      <span aria-hidden className="pointer-events-none absolute inset-0 scanlines" />
      <PixelTag className={cn('relative', go ? 'text-screen' : 'text-coin')}>{`DRAW ${String(view.draw)}`}</PixelTag>
      <span
        key={`${String(view.draw)}-${l.line}`}
        // The signal shows at once: a pop-in would hold it back from the eye.
        className={cn('relative font-display text-56 font-extrabold', go ? 'text-screen' : 'animate-pixel-pop text-ink glow-text')}
      >
        {l.line}
      </span>
      <PixelTag className={cn('relative text-12', go ? 'text-screen' : 'text-neon')}>{l.tag}</PixelTag>
      {l.sub && <span className="relative font-display text-15 font-bold text-ink-soft">{l.sub}</span>}
    </button>
  )
}
