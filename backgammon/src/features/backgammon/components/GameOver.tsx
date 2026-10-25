import type { Seat } from '@shared/backgammon/board'
import type { BgView } from '@shared/protocol'
import { cn } from '@/lib/utils'
import { pointsWords, resultWords } from '../lib/words'
import { Swatch } from './Swatch'

interface Props {
  view: BgView
  names: [string, string]
  /** «You», when there is one on this phone (null for two on one phone). */
  you: Seat | null
  /** Seconds to the next game, when it deals itself. */
  secs: number | null
}

/** A game won, laid over the board: who, how (a gammon, a pass), for how much, and the match so far. */
export function GameOver({ view, names, you, secs }: Props) {
  const r = view.result
  if (!r) return null
  const over = view.phase === 'over'
  const yours = you === r.winner
  const title = yours ? (over ? 'ربحت المباراة!' : 'ربحت هاللعبة!') : `${names[r.winner]} ربح ${over ? 'المباراة' : 'هاللعبة'}`
  const loser: Seat = r.winner === 0 ? 1 : 0
  const how = r.passed ? (loser === you ? 'سلّمت المضاعفة' : `${names[loser]} سلّم المضاعفة`) : resultWords(r)
  const match = view.options.length > 1
  return (
    <div className="absolute inset-0 grid place-items-center bg-cafe/55 p-5">
      <div className="flex w-full max-w-72 animate-lay-down flex-col items-center gap-3 rounded-sheet border border-brass/40 bg-slab-raised px-5 py-5 text-center shadow-slab">
        <Swatch seat={r.winner} className="size-10" />
        <p className={cn('font-hand text-32 leading-tight font-bold', yours || you === null ? 'text-brass-lit' : 'text-ink')}>
          <span className="inline-block animate-celebrate">{title}</span>
        </p>
        <p className="text-14 text-ink-soft">
          {`${how} · ${pointsWords(r.points)}`}
        </p>
        {match && (
          <div dir="rtl" className="flex w-full items-center justify-between gap-2 border-t border-hairline pt-3">
            {([0, 1] as const).map((seat) => (
              <span key={seat} className="flex min-w-0 items-center gap-1.5">
                <Swatch seat={seat} className="size-5" />
                <span className="truncate text-13 text-ink-soft">{names[seat]}</span>
                <span className="text-20 leading-none font-bold text-brass-lit tabular-nums">{view.sides[seat].score}</span>
              </span>
            ))}
          </div>
        )}
        {!over && view.crawford && <p className="text-12 text-ink-faint">الجاية لعبة «كروفورد»: بلا مضاعفة.</p>}
        {!over && secs !== null && <p className="text-12 text-ink-faint">{`اللعبة الجاية بعد ${String(secs)} ثانية`}</p>}
      </div>
    </div>
  )
}
