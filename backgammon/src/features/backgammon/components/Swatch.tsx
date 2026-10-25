import type { Seat } from '@shared/backgammon/board'
import { cn } from '@/lib/utils'

/** A player's colour as a small checker: ivory or ebony. */
export function Swatch({ seat, className }: { seat: Seat; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-7 shrink-0 place-items-center rounded-full shadow-key',
        seat === 0 ? 'bg-ivory ring-1 ring-ivory-shade' : 'bg-ebony ring-1 ring-brass/60',
        className,
      )}
    >
      <span className={cn('size-3 rounded-full border', seat === 0 ? 'border-ivory-groove' : 'border-brass-deep')} />
    </span>
  )
}
