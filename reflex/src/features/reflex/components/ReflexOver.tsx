import { Trophy } from 'lucide-react'
import type { ReflexView } from '@shared/protocol'
import { GameScreen } from '@/components/game/GameScreen'
import { PixelTag } from '@/components/game/PixelTag'
import { PixelSprite } from '@/components/PixelSprite'
import { Button } from '@/components/ui/button'
import { realtime } from '@/lib/realtime/connection'

interface Props {
  view: ReflexView
  isHost: boolean
}

/** Someone reached the target: the fastest finger, and the host's key to گعدة's results. */
export function ReflexOver({ view, isHost }: Props) {
  const you = view.standings.find((s) => s.you)
  const won = !!you && view.winners.includes(you.name)
  return (
    <div className="flex flex-col gap-3">
      <GameScreen tone="coin" className="min-h-56">
        <PixelTag className="animate-blink text-coin">{won ? 'YOU WIN!' : 'GAME OVER'}</PixelTag>
        <PixelSprite name="bolt" className="size-14 animate-sprite-hop" />
        <p className="animate-celebrate font-display text-24 font-extrabold text-coin glow-text">{`⚡ ${view.winners.join(' و ')}`}</p>
        <p className="text-14 text-ink-soft">أسرع إصبع بالشلة</p>
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
