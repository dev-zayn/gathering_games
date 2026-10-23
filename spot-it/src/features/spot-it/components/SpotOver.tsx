import { Trophy } from 'lucide-react'
import type { SpotView } from '@shared/protocol'
import { GameScreen } from '@/components/game/GameScreen'
import { PixelTag } from '@/components/game/PixelTag'
import { PixelSprite } from '@/components/PixelSprite'
import { Button } from '@/components/ui/button'
import { realtime } from '@/lib/realtime/connection'
import { modeOf } from '../data/modes'

interface Props {
  view: SpotView
  isHost: boolean
}

/** The mini-game is decided: the winner, and the host's key to گعدة's results. */
export function SpotOver({ view, isHost }: Props) {
  const you = view.standings.find((s) => s.you)
  const won = !!you && view.winners.includes(you.name)
  return (
    <div className="flex flex-col gap-3">
      <GameScreen tone="coin" className="min-h-56">
        <PixelTag className="animate-blink text-coin">{won ? 'YOU WIN!' : 'GAME OVER'}</PixelTag>
        <PixelSprite name="crown" className="size-14 animate-sprite-hop" />
        <p className="animate-celebrate font-display text-24 font-extrabold text-coin glow-text">
          {view.winners.length > 0 ? `👑 ${view.winners.join(' و ')}` : 'خلصت'}
        </p>
        <p className="text-14 text-ink-soft">{modeOf(view.mode).title}</p>
      </GameScreen>
      {isHost ? (
        <Button size="xl" onClick={() => void realtime.finish()}>
          <Trophy />
          النتائج
        </Button>
      ) : (
        <p className="text-center text-14 text-ink-faint">ننتظر صاحب الغرفة يعرض النتائج…</p>
      )}
    </div>
  )
}
