import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  /** Neon tube around the screen — the game's own colour. */
  tone?: 'coin' | 'neon' | 'plasma'
  className?: string
}

const TONES = {
  coin: 'text-coin',
  neon: 'text-neon',
  plasma: 'text-plasma',
} as const

/**
 * The CRT every game plays on: the tube's black behind scanlines, framed by a
 * glowing tube in the game's colour. Content is centred; type inside should set
 * its own colour (the frame's `currentColor` is the tube).
 */
export function GameScreen({ children, tone = 'neon', className }: Props) {
  return (
    <section
      className={cn(
        'relative flex min-h-72 flex-col items-center justify-center gap-3 overflow-hidden rounded-section bg-screen p-6 text-center glow-box',
        TONES[tone],
        className,
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 scanlines" />
      <div className="relative flex w-full flex-col items-center gap-3 text-ink">{children}</div>
    </section>
  )
}
