import type { ReflexView } from '@shared/protocol'
import { PixelTag } from '@/components/game/PixelTag'
import { cn } from '@/lib/utils'

/** The draw just played, fastest first: every time, every false start, every miss. */
export function DrawTable({ view }: { view: ReflexView }) {
  return (
    <section className="flex animate-rise-in flex-col gap-2 rounded-card border-2 border-hairline bg-card p-3 shadow-pixel">
      <PixelTag className="text-coin">{`DRAW ${String(view.draw)}`}</PixelTag>
      <ol className="flex flex-col">
        {view.rows.map((row, i) => (
          <li key={`${String(i)}-${row.name}`} className="flex min-h-9 items-center gap-3 border-b border-divider last:border-b-0">
            <span className={cn('flex-1 truncate font-display text-14 font-bold', row.you && 'text-neon')}>{row.name}</span>
            {row.won && <PixelTag className="animate-badge-pop text-success">+1</PixelTag>}
            <PixelTag className={cn('w-20 text-end', row.tap.kind === 'time' ? 'text-ink' : row.tap.kind === 'foul' ? 'text-plasma' : 'text-ink-faint')}>
              {row.tap.kind === 'time' ? `${String(row.tap.ms)}ms` : row.tap.kind === 'foul' ? 'FOUL' : '---'}
            </PixelTag>
          </li>
        ))}
      </ol>
      {!view.rows.some((r) => r.won) && <p className="text-center text-13 text-ink-faint">محد أخذ النقطة هالمرة</p>}
    </section>
  )
}
