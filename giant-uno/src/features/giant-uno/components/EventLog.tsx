import { useEffect } from 'react'
import type { UnoLine, UnoView } from '@shared/protocol'
import { haptic } from '@/lib/miniapp'
import { cn } from '@/lib/utils'

const TONES: Record<UnoLine['tone'], string> = {
  you: 'text-success',
  hit: 'text-plasma',
  plain: 'text-ink',
}

/** What just happened, the newest line big and the two before it small. */
export function EventLog({ view }: { view: UnoView }) {
  const [latest, ...older] = view.log
  const n = latest?.n ?? 0
  const hit = latest?.tone === 'hit'

  useEffect(() => {
    // A buzz when it lands on you: drawn, skipped, caught.
    if (n > 0 && hit) haptic('long')
  }, [n, hit])

  return (
    <div role="status" aria-live="polite" className="flex min-h-16 flex-col items-center justify-center gap-0.5 text-center">
      {latest && (
        <p key={latest.n} className={cn('animate-pixel-pop font-display text-17 font-extrabold', TONES[latest.tone])}>
          {latest.text}
        </p>
      )}
      {older.slice(0, 2).map((line) => (
        <p key={line.n} className="text-12 text-ink-faint">
          {line.text}
        </p>
      ))}
    </div>
  )
}
