import { Crown, WifiOff } from 'lucide-react'
import type { ReflexView } from '@shared/protocol'
import { PixelTag } from '@/components/game/PixelTag'
import { cn } from '@/lib/utils'

/** The match so far, best first: points, then each player's fastest reaction. */
export function ReflexStandings({ view }: { view: ReflexView }) {
  const top = view.standings[0]?.points ?? 0
  return (
    <section className="flex flex-col gap-2 rounded-card border-2 border-hairline bg-card p-3 shadow-pixel">
      <div className="flex items-center justify-between">
        <PixelTag className="text-coin">SCORE</PixelTag>
        <PixelTag className="text-ink-faint">{`FIRST TO ${String(view.target)}`}</PixelTag>
      </div>
      <ol className="flex flex-col">
        {view.standings.map((row, i) => (
          <li key={`${String(i)}-${row.name}`} className="flex min-h-9 items-center gap-3 border-b border-divider last:border-b-0">
            <PixelTag className={cn('w-6', i === 0 && top > 0 ? 'text-coin' : 'text-ink-faint')}>{String(i + 1)}</PixelTag>
            <span className={cn('flex min-w-0 flex-1 items-center gap-1.5 font-display text-14 font-bold', row.you && 'text-neon')}>
              <span className="truncate">{row.name}</span>
              {top > 0 && row.points === top && <Crown aria-label="المتصدّر" className="size-4 shrink-0 text-coin" />}
              {!row.connected && <WifiOff aria-label="طالع" className="size-3.5 shrink-0 text-ink-faint" />}
            </span>
            <PixelTag className="text-ink-faint">{row.best === null ? '' : `${String(row.best)}ms`}</PixelTag>
            <PixelTag className="w-6 text-end text-ink">{String(row.points)}</PixelTag>
          </li>
        ))}
      </ol>
    </section>
  )
}
