import type { ReactNode } from 'react'
import { Hourglass } from 'lucide-react'

/** A line in the keys' place while this phone waits, or only watches. */
export function TurnNote({ children, waiting = false }: { children: ReactNode; waiting?: boolean }) {
  return (
    <p role="status" aria-live="polite" className="flex min-h-13 items-center gap-2 text-14 text-ink-soft">
      {waiting && <Hourglass aria-hidden className="size-4 shrink-0 animate-lamp text-brass" />}
      {children}
    </p>
  )
}
