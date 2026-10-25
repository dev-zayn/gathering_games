import { useId } from 'react'

/** A strip of pearl diamonds set in walnut, as on the box's rim; it stretches to fill its row. */
export function InlayStrip() {
  const id = useId()
  return (
    <svg aria-hidden className="h-2 min-w-0 flex-1">
      <defs>
        <pattern id={id} width="10" height="8" patternUnits="userSpaceOnUse">
          <path d="M5 1 8.5 4 5 7 1.5 4Z" className="fill-pearl" opacity="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="8" fill={`url(#${id})`} />
    </svg>
  )
}
