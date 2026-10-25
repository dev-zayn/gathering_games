import { m } from 'framer-motion'
import { cn } from '@/lib/utils'

/** Where the pips sit on the 3 × 3 grid of a face. */
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

const SIZES = {
  sm: { face: 'size-8 rounded-md p-1', pip: 'size-1.5' },
  md: { face: 'size-11 rounded-control p-1.5', pip: 'size-2' },
  lg: { face: 'size-14 rounded-button p-2', pip: 'size-2.5' },
} as const

interface Props {
  value: number
  /** Played already this turn: it sinks and dims. */
  used?: boolean
  size?: keyof typeof SIZES
  /** Bone with walnut pips, or ebony with pearl ones (the opening die of the dark side). */
  tone?: 'ivory' | 'ebony'
  /** Changes with every throw: the die tumbles in. */
  throwKey?: string | number
  /** Which die of the throw it is: each tumbles its own way. */
  order?: number
}

/** One die: real pips on a bone face, thrown in with a tumble. */
export function Die({ value, used = false, size = 'md', tone = 'ivory', throwKey, order = 0 }: Props) {
  const s = SIZES[size]
  const pips = new Set(PIPS[value] ?? [])
  const spin = order % 2 === 0 ? -1 : 1
  return (
    <m.div
      key={throwKey}
      role="img"
      aria-label={`زار ${String(value)}${used ? '، انلعب' : ''}`}
      dir="ltr"
      initial={throwKey === undefined ? false : { rotate: spin * (240 + order * 50), y: -28, scale: 0.55, opacity: 0 }}
      animate={{ rotate: 0, y: 0, scale: used ? 0.84 : 1, opacity: used ? 0.36 : 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 15, delay: order * 0.06 }}
      className={cn(
        'grid shrink-0 grid-cols-3 grid-rows-3 shadow-key',
        tone === 'ivory' ? 'bg-ivory' : 'bg-ebony ring-1 ring-brass/50',
        s.face,
      )}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className="grid place-items-center">
          {pips.has(i) && <span className={cn('rounded-full', tone === 'ivory' ? 'bg-walnut-deep' : 'bg-pearl', s.pip)} />}
        </span>
      ))}
    </m.div>
  )
}
