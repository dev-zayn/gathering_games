import { useId } from 'react'
import { cn } from '@/lib/utils'

/** The inlay's 8-pointed star (two squares, one turned), in mother-of-pearl. */
export function InlayStar({ className }: { className?: string }) {
  const id = useId()
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={cn('shrink-0', className)}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className="stop-pearl" />
          <stop offset="0.4" className="stop-pearl-rose" />
          <stop offset="0.7" className="stop-pearl-mint" />
          <stop offset="1" className="stop-pearl" />
        </linearGradient>
      </defs>
      <rect x="9" y="9" width="22" height="22" fill={`url(#${id})`} />
      <rect x="9" y="9" width="22" height="22" transform="rotate(45 20 20)" fill={`url(#${id})`} />
      <circle cx="20" cy="20" r="5.5" className="fill-walnut-deep" />
      <circle cx="20" cy="20" r="2.2" className="fill-brass" />
    </svg>
  )
}
