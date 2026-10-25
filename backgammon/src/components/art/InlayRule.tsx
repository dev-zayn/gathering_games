import { cn } from '@/lib/utils'
import { InlayStar } from './InlayStar'
import { InlayStrip } from './InlayStrip'

/** A band of inlay across the page: pearl diamonds either side of the star. */
export function InlayRule({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('flex items-center gap-2', className)}>
      <InlayStrip />
      <InlayStar className="size-5" />
      <InlayStrip />
    </div>
  )
}
