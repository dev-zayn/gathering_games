import { Check, Trophy, X } from 'lucide-react'
import type { RoomView } from '@shared/protocol'
import { GameScreen } from '@/components/game/GameScreen'
import { PixelTag } from '@/components/game/PixelTag'
import { PixelSprite } from '@/components/PixelSprite'
import { Button } from '@/components/ui/button'
import { viewOf } from '@/features/room/hooks/use-room'
import { realtime } from '@/lib/realtime/connection'
import { CharadesStage } from './CharadesStage'
import { CharadesTeams } from './CharadesTeams'

interface Props {
  room: RoomView
  isHost: boolean
  clockOffset: number
}

/** مثّلها online — teams, the stage, the turn's words, the winners. */
export function CharadesRoom({ room, isHost, clockOffset }: Props) {
  const view = viewOf(room, 'charades')
  if (!view) return null
  const act = realtime.act
  const [a, b] = view.teams
  const winner = !a || !b || a.score === b.score ? null : a.score > b.score ? a : b

  return (
    <div className="flex flex-col gap-4">
      {view.phase !== 'playing' && <CharadesTeams view={view} />}
      {(view.phase === 'ready' || view.phase === 'playing') && (
        <CharadesStage
          view={view}
          isHost={isHost}
          clockOffset={clockOffset}
          onBegin={() => { act({ type: 'begin' }) }}
          onMark={(got) => { act({ type: 'mark', got }) }}
        />
      )}
      {view.phase === 'summary' && (
        <section className="flex animate-rise-in flex-col gap-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <PixelTag className="text-plasma">TIME UP!</PixelTag>
            <p className="animate-celebrate font-pixel text-32 text-success glow-text" dir="ltr">+{view.got}</p>
          </div>
          {view.plays.length > 0 && (
            <ul className="flex flex-col rounded-card border-2 border-hairline bg-card px-4 py-1 shadow-pixel">
              {view.plays.map((p, i) => (
                <li key={`${p.word}-${String(i)}`} className="flex items-center gap-3 border-b border-divider py-2.5 last:border-b-0">
                  {p.got ? <Check aria-label="صح" className="size-5 text-success" /> : <X aria-label="تخطي" className="size-5 text-plasma" />}
                  <span className="font-display text-15 font-semibold">{p.word}</span>
                </li>
              ))}
            </ul>
          )}
          {(view.isActor || isHost) && (
            <Button size="xl" onClick={() => { act({ type: 'next' }) }}>
              الدور الجاي
            </Button>
          )}
        </section>
      )}
      {view.phase === 'final' && (
        <>
          <GameScreen tone="coin">
            <PixelTag className="animate-blink text-coin">GAME OVER</PixelTag>
            <PixelSprite name="crown" className="size-16 animate-sprite-hop" />
            <p className="animate-celebrate font-display text-32 font-extrabold text-coin glow-text">
              {winner ? `فاز ${winner.name}!` : 'تعادل!'}
            </p>
          </GameScreen>
          {isHost && (
            <Button size="xl" onClick={() => { void realtime.finish() }}>
              <Trophy />
              النتائج
            </Button>
          )}
        </>
      )}
    </div>
  )
}
