import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { InlayStar } from './InlayStar'

interface Props {
  children?: ReactNode
  className?: string
}

/**
 * The closed box: walnut, a double band of mother-of-pearl round the edge,
 * the star in the middle and whatever is written under it, as the lid of a
 * real طاولي box is inlaid.
 */
export function BoxLid({ children, className }: Props) {
  return (
    <div className={cn('relative aspect-360/552 overflow-hidden rounded-sheet walnut-face shadow-slab', className)}>
      <div aria-hidden className="absolute inset-2 rounded-card border-2 border-pearl/55" />
      <div aria-hidden className="absolute inset-4 rounded-control border border-pearl/30" />
      {/* The hinge seen from outside: two brass straps across the lid's middle edge. */}
      <span aria-hidden className="absolute start-0 top-1/2 h-3 w-5 -translate-y-1/2 rounded-e-md brass-face" />
      <span aria-hidden className="absolute end-0 top-1/2 h-3 w-5 -translate-y-1/2 rounded-s-md brass-face" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
        <InlayStar className="size-20 drop-shadow-lg" />
        {children}
      </div>
    </div>
  )
}
