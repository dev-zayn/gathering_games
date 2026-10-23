import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  className?: string
}

/**
 * A line of 8-bit Latin — «PLAYER 1», «ROUND 2/5», «GAME OVER». Latin only: the
 * pixel face has no Arabic glyphs. Always `dir="ltr"` so digits and words keep
 * their order inside the RTL page.
 */
export function PixelTag({ children, className }: Props) {
  return (
    <span dir="ltr" className={cn('font-pixel text-10 leading-relaxed tracking-wider uppercase', className)}>
      {children}
    </span>
  )
}
