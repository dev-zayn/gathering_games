import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  className?: string
}

/** A screen's primary action, pinned to the bottom edge where a thumb rests —
 *  «أضف إلى السلة», «متابعة للدفع», «تأكيد الطلب». */
export function ActionBar({ children, className }: Props) {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-30 flex shrink-0 items-center gap-3 border-t border-hairline bg-card px-4 pt-3 pb-safe-4.5',
        className,
      )}
    >
      {children}
    </div>
  )
}
