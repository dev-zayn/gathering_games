import { Crown } from 'lucide-react'
import { PixelTag } from './PixelTag'
import { cn } from '@/lib/utils'

interface Props {
  /** Name → total. */
  scores: Record<string, number>
  /** Name → points just earned this round, shown as a popping «+1». */
  gains?: Record<string, number>
  /** Names in roster order — players with no score yet still get a row at 0. */
  players: readonly string[]
  title?: string
}

/** The high-score table: ranked, the leader crowned, fresh points popping in. */
export function Scoreboard({ scores, gains, players, title = 'HI-SCORE' }: Props) {
  const rows = players.map((p) => ({ name: p, score: scores[p] ?? 0 })).sort((a, b) => b.score - a.score)
  const top = rows[0]?.score ?? 0

  return (
    <section className="flex flex-col gap-3 rounded-card border-2 border-hairline bg-card p-4 shadow-pixel">
      <PixelTag className="text-center text-coin">{title}</PixelTag>
      <ol className="flex flex-col">
        {rows.map((row, i) => {
          const gain = gains?.[row.name] ?? 0
          const leads = top > 0 && row.score === top
          return (
            <li
              key={row.name}
              className="flex items-center gap-3 border-b border-divider py-2.5 last:border-b-0"
            >
              <PixelTag className={cn('w-6 text-ink-faint', leads && 'text-coin')}>{String(i + 1)}</PixelTag>
              <span className="flex flex-1 items-center gap-1.5 truncate font-display text-16 font-bold">
                {row.name}
                {leads && <Crown aria-label="المتصدّر" className="size-4 text-coin" />}
              </span>
              {gain > 0 && (
                <PixelTag className="animate-badge-pop text-success">+{String(gain)}</PixelTag>
              )}
              <PixelTag className="w-10 text-end text-12 text-ink">{String(row.score)}</PixelTag>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
