import { useId } from 'react'
import { cn } from '@/lib/utils'

const STEAM = [
  'M23 14c-3-4 3-6 0-10',
  'M30 15c-3-5 3-7 0-12',
  'M37 14c-3-4 3-6 0-10',
]

/** An istikan of tea on its saucer, steam rising: the café's own mark. */
export function TeaGlass({ className }: { className?: string }) {
  const id = useId()
  return (
    <svg viewBox="0 0 60 84" aria-hidden className={cn('overflow-visible', className)}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="stop-tea" />
          <stop offset="1" className="stop-tea-deep" />
        </linearGradient>
      </defs>
      {STEAM.map((d, i) => (
        <path
          key={d}
          d={d}
          fill="none"
          className="animate-steam stroke-pearl"
          strokeWidth="1.6"
          strokeLinecap="round"
          style={{ animationDelay: `${String(i * 900)}ms` }}
        />
      ))}
      {/* The saucer, with its turquoise band. */}
      <ellipse cx="30" cy="76" rx="28" ry="6" className="fill-pearl" />
      <ellipse cx="30" cy="75" rx="21" ry="3.6" fill="none" className="stroke-turquoise" strokeWidth="1.6" />
      {/* The glass: a tulip, wide at the lip, pinched at the waist. */}
      <path d="M15 20h30c0 9-6 15-6 24s5 13 5 21c0 5-4 8-14 8s-14-3-14-8c0-8 5-12 5-21s-6-15-6-24Z" className="fill-pearl" opacity="0.22" />
      <path d="M17.5 27h25c-1 6-5.5 10.5-5.5 17s4.5 12 4.5 20c0 4-3 6.5-11.5 6.5S18.5 68 18.5 64c0-8 4.5-13.5 4.5-20s-4.5-11-5.5-17Z" fill={`url(#${id})`} />
      <path d="M15 20h30c0 9-6 15-6 24s5 13 5 21c0 5-4 8-14 8s-14-3-14-8c0-8 5-12 5-21s-6-15-6-24Z" fill="none" className="stroke-pearl" strokeOpacity="0.7" strokeWidth="1.2" />
      <path d="M19 23c0.5 6 4 9 4 15" fill="none" className="stroke-pearl" strokeOpacity="0.6" strokeWidth="1.4" strokeLinecap="round" />
      {/* The spoon, leaning on the lip. */}
      <path d="M41 6 35 34" className="stroke-brass" strokeWidth="1.8" strokeLinecap="round" />
      <ellipse cx="41.6" cy="5" rx="2.2" ry="3.2" transform="rotate(12 41.6 5)" className="fill-brass" />
    </svg>
  )
}
