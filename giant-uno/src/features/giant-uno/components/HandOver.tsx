import { Shuffle, Trophy } from 'lucide-react'
import { signed } from '@shared/data/deck'
import type { UnoView } from '@shared/protocol'
import { GameScreen } from '@/components/game/GameScreen'
import { PixelTag } from '@/components/game/PixelTag'
import { PixelSprite } from '@/components/PixelSprite'
import { Button } from '@/components/ui/button'
import { realtime } from '@/lib/realtime/connection'
import { ResultRows } from './ResultRows'

interface Props {
  view: UnoView
  isHost: boolean
  secs: number
}

/** A hand is over: who went out and for how much; then the next hand comes, or the round is decided. */
export function HandOver({ view, isHost, secs }: Props) {
  const over = view.phase === 'over'
  const result = view.result
  const you = view.seats.find((s) => s.you)
  const won = over && !!you && view.winners.includes(you.name)
  const target = view.options.target
  return (
    <div className="flex flex-col gap-3">
      <GameScreen tone="coin" className="min-h-56">
        <PixelTag className="animate-blink text-coin">{over ? (won ? 'YOU WIN!' : 'GAME OVER') : `HAND ${String(view.handNo)} OVER`}</PixelTag>
        <PixelSprite name={over ? 'crown' : 'cards'} className="size-14 animate-sprite-hop" />
        {result && (
          <p className="font-display text-20 font-extrabold text-ink">
            {result.you ? `خلّصت ورقك! ${signed(result.points)}` : `${result.winner} خلّص ورقه! ${signed(result.points)}`}
          </p>
        )}
        {over && view.winners.length > 0 && (
          <p className="animate-celebrate font-display text-24 font-extrabold text-coin glow-text">{`👑 ${view.winners.join(' و ')}`}</p>
        )}
        {target > 0 && <p className="text-14 text-ink-soft">{`نلعب لين ${String(target)} نقطة`}</p>}
      </GameScreen>

      <ResultRows view={view} />

      {over ? (
        isHost ? (
          <Button size="xl" onClick={() => void realtime.finish()}>
            <Trophy />
            النتائج
          </Button>
        ) : (
          <p className="text-center text-14 text-ink-faint">ننتظر صاحب الغرفة يعرض النتائج…</p>
        )
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-center font-display text-15 font-bold text-ink-soft">{`اليد الجاية تتوزّع بعد ${String(secs)} ثانية`}</p>
          {isHost && (
            <Button
              size="lg"
              onClick={() => {
                realtime.act({ type: 'next' })
              }}
            >
              <Shuffle />
              وزّع هسه
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
