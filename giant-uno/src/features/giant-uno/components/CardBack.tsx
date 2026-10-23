import { PixelSprite } from '@/components/PixelSprite'
import { cn } from '@/lib/utils'

/** A card face down: the draw pile. */
export function CardBack({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('flex aspect-2/3 w-28 shrink-0 rounded-card border-2 border-screen bg-plasma p-2 shadow-pixel', className)}>
      <div className="flex size-full items-center justify-center rounded-control bg-screen pixel-grid grid-cell-2">
        <PixelSprite name="cards" className="size-1/2" />
      </div>
    </div>
  )
}
