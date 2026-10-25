import type { ReactNode } from 'react'
import { WifiOff } from 'lucide-react'
import type { Seat } from '@shared/backgammon/board'
import { cn } from '@/lib/utils'
import { Swatch } from './Swatch'

interface Props {
  seat: Seat
  name: string
  /** The board waits on this side: its lamp is lit. */
  lamp: boolean
  connected: boolean
  pips: number
  off: number
  /** Match points, and the match's length; null for a single game. */
  score: { mine: number; length: number } | null
  /** The decision's last seconds, once they are few. */
  secs: number | null
  /** A line under the name: what this side just did, or is doing. */
  note?: string | null
  /** At the end of the row: this side's dice, or the cube it holds. */
  end?: ReactNode
  /** Under the row: the keys of the turn. */
  children?: ReactNode
  className?: string
}

/**
 * One side of the table: the colour, the name, how far it still has to go
 * («باقي 142») and what it has borne off, the match score, a lamp while the
 * board waits on it, and the clock's last seconds.
 */
export function SidePlate({ seat, name, lamp, connected, pips, off, score, secs, note, end, children, className }: Props) {
  return (
    <section
      aria-label={name}
      className={cn(
        'relative flex flex-col gap-2 rounded-card border bg-slab px-3 py-2 shadow-slab transition-colors',
        lamp ? 'border-brass/45' : 'border-hairline',
        className,
      )}
    >
      {lamp && (
        <span aria-hidden className="pointer-events-none absolute inset-x-6 -top-px h-0.5 animate-lamp rounded-full bg-brass-lit" />
      )}
      <div className="flex min-h-10 items-center gap-2.5">
        <Swatch seat={seat} />
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="flex items-center gap-1.5 truncate text-15 font-semibold text-ink">
            <span className="truncate">{name}</span>
            {!connected && <WifiOff aria-label="مو متصل" className="size-3.5 shrink-0 text-brick-lit" />}
          </p>
          <p className="truncate text-12 text-ink-faint">
            {note ?? (
              <>
                {`باقي ${String(pips)}`}
                {off > 0 && ` · شال ${String(off)}`}
              </>
            )}
          </p>
        </div>
        {secs !== null && (
          <span role="timer" className="shrink-0 rounded-full bg-brick-soft px-2 py-0.5 text-12 font-semibold text-brick-lit tabular-nums">
            {`${String(secs)} ث`}
          </span>
        )}
        {score && (
          <span className="flex shrink-0 items-baseline gap-0.5 text-ink" aria-label={`${String(score.mine)} من ${String(score.length)}`}>
            <span className="text-22 leading-none font-bold text-brass-lit tabular-nums">{score.mine}</span>
            <span className="text-11 text-ink-faint">{`/${String(score.length)}`}</span>
          </span>
        )}
        {end}
      </div>
      {children}
    </section>
  )
}
