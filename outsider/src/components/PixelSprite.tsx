import { SPRITES, type SpriteName } from '@/data/sprites'
import { cn } from '@/lib/utils'

/** Palette key → fill token. Literal class names, so Tailwind sees them. */
const FILLS: Record<string, string> = {
  y: 'fill-coin',
  c: 'fill-neon',
  p: 'fill-plasma',
  w: 'fill-ink',
  k: 'fill-screen',
  g: 'fill-success',
  m: 'fill-rule',
}

interface Props {
  name: SpriteName
  className?: string
}

/**
 * An 8-bit sprite drawn as one `<rect>` per lit pixel, with crisp edges so it
 * scales to any size without blurring. Decorative: always `aria-hidden`.
 */
export function PixelSprite({ name, className }: Props) {
  const rows = SPRITES[name]
  const width = Math.max(...rows.map((r) => r.length))
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${String(width)} ${String(rows.length)}`}
      shapeRendering="crispEdges"
      className={cn('size-12', className)}
    >
      {rows.flatMap((row, y) =>
        Array.from({ length: row.length }, (_, x) => {
          const fill = FILLS[row.charAt(x)]
          return fill ? <rect key={`${String(x)}-${String(y)}`} x={x} y={y} width="1" height="1" className={fill} /> : null
        }),
      )}
    </svg>
  )
}
