import type { SpotView } from '@shared/protocol'
import { PixelTag } from '@/components/game/PixelTag'
import { cn } from '@/lib/utils'
import { COUNT_WORDS } from '../data/modes'

/** Who leads, best first: the most cards, or the fewest where the fewest win. */
export function SpotStandings({ view }: { view: SpotView }) {
  return (
    <section className="flex flex-col gap-2 rounded-card border-2 border-hairline bg-card p-3 shadow-pixel">
      <div className="flex items-center justify-between">
        <PixelTag className="text-coin">STANDINGS</PixelTag>
        <span className="text-12 text-ink-faint">{`${COUNT_WORDS[view.mode]}${view.lowWins ? ' · الأقل يفوز' : ''}`}</span>
      </div>
      <ol className="flex flex-col">
        {view.standings.map((row, i) => (
          <li key={`${String(i)}-${row.name}`} className="flex min-h-9 items-center gap-3 border-b border-divider last:border-b-0">
            <PixelTag className={cn('w-6', i === 0 ? 'text-coin' : 'text-ink-faint')}>{String(i + 1)}</PixelTag>
            <span className={cn('flex-1 truncate font-display text-14 font-bold', row.you && 'text-neon')}>{row.name}</span>
            <PixelTag className="text-ink">{String(row.count)}</PixelTag>
          </li>
        ))}
      </ol>
    </section>
  )
}
