import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  className?: string
}

/** A screen's main key, pinned to the bottom edge where a thumb rests. */
export function ActionBar({ children, className }: Props) {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-30 -mx-4 mt-auto flex shrink-0 items-center gap-3 border-t border-hairline bg-slab/95 px-4 pt-3 pb-safe-4 backdrop-blur-sm',
        className,
      )}
    >
      {children}
    </div>
  )
}
