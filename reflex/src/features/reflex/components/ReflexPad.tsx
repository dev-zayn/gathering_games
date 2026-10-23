import { PixelTag } from '@/components/game/PixelTag'
import { cn } from '@/lib/utils'
import type { ReflexPhase, Side } from '../hooks/use-reflex'

interface Props {
  side: Side
  name: string
  score: number
  phase: ReflexPhase
  onTap: (side: Side) => void
}

/** What a pad says, and how it's lit, for each moment of the duel. */
function look(side: Side, phase: ReflexPhase): { line: string; tag: string; lit: string } {
  switch (phase.kind) {
    case 'lobby':
      return { line: 'حط إصبعك جاهز', tag: 'READY?', lit: '' }
    case 'armed':
      return { line: 'استنى…', tag: 'WAIT', lit: '' }
    case 'go':
      return { line: 'دوس!', tag: 'NOW!', lit: 'bg-coin text-screen' }
    case 'point':
      if (phase.winner === side) {
        return phase.foul
          ? { line: 'الثاني استعجل', tag: '+1', lit: 'bg-success-soft' }
          : { line: `${String(phase.ms)}ms`, tag: phase.record ? 'NEW RECORD +1' : '+1', lit: 'bg-success-soft' }
      }
      return phase.foul
        ? { line: 'استعجلت!', tag: 'FOUL', lit: 'bg-plasma-soft animate-shake' }
        : { line: 'أبطأ', tag: 'MISS', lit: '' }
    case 'match':
      return phase.winner === side
        ? { line: 'فزت!', tag: 'WINNER', lit: 'bg-success-soft' }
        : { line: 'خسرت', tag: 'GAME OVER', lit: 'bg-plasma-soft' }
  }
}

/**
 * One duellist's half of the screen — the whole half is the key. Player two's
 * pad is turned 180° so each reads it from their own end of the phone. Fires on
 * pointer-DOWN: waiting for the click's release would add ~100ms of lag.
 */
export function ReflexPad({ side, name, score, phase, onTap }: Props) {
  const { line, tag, lit } = look(side, phase)
  const tube = side === 'p1' ? 'text-neon' : 'text-plasma'

  return (
    <button
      type="button"
      aria-label={`${name}: ${line}`}
      onPointerDown={(e) => {
        e.preventDefault()
        onTap(side)
      }}
      className={cn(
        'relative flex flex-1 touch-none flex-col items-center justify-center gap-3 overflow-hidden rounded-section bg-screen glow-box select-none',
        tube,
        side === 'p2' && 'rotate-180',
        lit,
      )}
    >
      <span aria-hidden className="pointer-events-none absolute inset-0 scanlines" />
      <span className={cn('relative flex items-center gap-3', phase.kind === 'go' && 'text-screen')}>
        <PixelTag className="text-12">{side === 'p1' ? '1UP' : '2UP'}</PixelTag>
        <span className={cn('font-display text-18 font-bold', phase.kind !== 'go' && 'text-ink')}>{name}</span>
        <PixelTag className={cn('text-12', phase.kind !== 'go' && 'text-coin')}>{String(score)}</PixelTag>
      </span>
      <span
        key={`${phase.kind}-${line}`}
        className={cn(
          'relative animate-pixel-pop font-display text-40 font-extrabold',
          phase.kind === 'go' ? 'text-screen' : 'text-ink glow-text',
        )}
      >
        {line}
      </span>
      <PixelTag className={cn('relative', phase.kind === 'go' ? 'text-screen' : tube)}>{tag}</PixelTag>
    </button>
  )
}
