import { signed } from '@shared/data/deck'
import type { UnoView } from '@shared/protocol'
import { PixelTag } from '@/components/game/PixelTag'
import { cn } from '@/lib/utils'
import { sortHand } from '../lib/cards'
import { UnoCardFace } from './UnoCardFace'

const SHOWN = 8

/** The hand's count: what each player was left holding, its points, and the totals when playing to a target. */
export function ResultRows({ view }: { view: UnoView }) {
  const result = view.result
  if (!result) return null
  const totals = view.options.target > 0
  const rows = [...result.rows].sort((a, b) => (totals ? (view.options.scoring === 'low' ? a.total - b.total : b.total - a.total) : a.points - b.points))
  return (
    <section className="flex flex-col gap-2 rounded-card border-2 border-hairline bg-card p-3 shadow-pixel">
      <div className="flex items-center justify-between">
        <PixelTag className="text-coin">{`HAND ${String(view.handNo)}`}</PixelTag>
        <span className="text-12 text-ink-faint">
          {view.options.scoring === 'low' ? 'نقاط الورق اللي بإيدك · الأقل يفوز' : 'اللي يخلّص ياخذ نقاط ورق الباقين'}
        </span>
      </div>
      <ol className="flex flex-col">
        {rows.map((row) => (
          <li key={row.id} className="flex min-h-12 items-center gap-2 border-b border-divider py-1.5 last:border-b-0">
            <span className={cn('w-20 shrink-0 truncate font-display text-14 font-bold', row.you && 'text-neon')}>
              {row.you ? 'إنت' : row.name}
            </span>
            <span className="flex min-w-0 flex-1 flex-wrap gap-1">
              {row.cards.length === 0 ? (
                <span className="font-display text-13 font-bold text-success">خلّص ورقه</span>
              ) : (
                <>
                  {sortHand(row.cards)
                    .slice(0, SHOWN)
                    .map((card) => (
                      <UnoCardFace key={card.id} card={card} size="sm" className="w-6 shadow-none" />
                    ))}
                  {row.cards.length > SHOWN && <span className="self-center text-12 text-ink-faint">{signed(row.cards.length - SHOWN)}</span>}
                </>
              )}
            </span>
            <span className="flex shrink-0 flex-col items-end">
              <PixelTag className="text-ink">{String(row.points)}</PixelTag>
              {totals && <span className="text-11 text-ink-faint">{`المجموع ${String(row.total)}`}</span>}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
