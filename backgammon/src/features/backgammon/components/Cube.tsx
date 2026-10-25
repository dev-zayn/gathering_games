import { m } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Props {
  value: number
  className?: string
}

/**
 * The doubling cube: a pearl face in a brass edge, what the game is worth
 * («×2»). One cube on the screen at a time (`layoutId`), so it slides to
 * whoever holds it.
 */
export function Cube({ value, className }: Props) {
  return (
    <m.div
      layoutId="doubling-cube"
      role="img"
      aria-label={`مكعب المضاعفة: اللعبة تسوى ${String(value)}`}
      transition={{ type: 'spring', stiffness: 220, damping: 24 }}
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-lg border-2 border-brass pearl-sheen font-sans text-15 font-bold text-walnut-deep shadow-key',
        className,
      )}
    >
      <span dir="ltr">{`×${String(value)}`}</span>
    </m.div>
  )
}
