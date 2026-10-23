import { Check, Play, SkipForward } from 'lucide-react'
import type { CharadesView } from '@shared/protocol'
import { PixelSprite } from '@/components/PixelSprite'
import { GameScreen } from '@/components/game/GameScreen'
import { PixelTag } from '@/components/game/PixelTag'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useTimeLeft } from '../hooks/use-time-left'

interface Props {
  view: CharadesView
  isHost: boolean
  clockOffset: number
  onBegin: () => void
  onMark: (got: boolean) => void
}

/**
 * The turn itself. The actor gets the word and the keys; their team gets
 * «احزروا!»; the other team gets the word too, to enjoy the struggle.
 */
export function CharadesStage({ view, isHost, clockOffset, onBegin, onMark }: Props) {
  const left = useTimeLeft(view.endsAt, clockOffset)
  const tone = view.team === 0 ? 'neon' : 'plasma'

  if (view.phase === 'ready') {
    return (
      <div className="flex flex-col gap-4">
        <GameScreen tone={tone}>
          <PixelTag className="text-coin">{`ROUND ${String(view.turn)} / ${String(view.turns)}`}</PixelTag>
          <PixelSprite name="clapper" className="size-16 animate-sprite-hop" />
          <p className="font-display text-28 font-extrabold glow-text">{view.isActor ? 'إنت الممثل!' : `الممثل: ${view.actor}`}</p>
          <p className="text-14 text-ink-soft">دور {view.teams[view.team]?.name}</p>
        </GameScreen>
        {(view.isActor || isHost) && (
          <Button size="xl" onClick={onBegin}>
            <Play />
            {view.isActor ? 'جاهز، ابدأ الوقت' : 'ابدأ بدل الممثل'}
          </Button>
        )}
      </div>
    )
  }

  const hurry = left <= 10
  const guessing = !view.isActor && view.yourTeam === view.team
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <PixelTag className={cn('text-16', hurry ? 'animate-blink text-plasma' : 'text-coin')}>
          {String(Math.ceil(left)).padStart(2, '0')}
        </PixelTag>
        <PixelTag className="text-success">{`SCORE ${String(view.got)}`}</PixelTag>
      </div>
      <Progress value={(left / view.seconds) * 100} className="h-3 rounded-control" />
      <GameScreen tone={hurry ? 'plasma' : 'coin'} className="min-h-72">
        {view.word ? (
          <>
            <PixelTag className="text-ink-faint">{view.isActor ? 'ACT IT OUT' : 'THEY ACT'}</PixelTag>
            <p key={view.word} className="animate-pixel-pop font-display text-40 leading-tight font-extrabold text-coin glow-text">
              {view.word}
            </p>
            {!view.isActor && <p className="text-14 text-ink-soft">{view.actor} يمثّل لفريقه — لا تساعدوهم 😄</p>}
          </>
        ) : (
          <>
            <PixelTag className="text-coin">GUESS!</PixelTag>
            <p className="font-display text-32 font-extrabold glow-text">{guessing ? 'احزروا!' : '…'}</p>
            <p className="text-14 text-ink-soft">{view.actor} يمثّل</p>
          </>
        )}
      </GameScreen>
      {view.isActor && (
        <div className="grid grid-cols-2 gap-3">
          <Button size="xl" variant="plasma" onClick={() => { onMark(false) }}>
            <SkipForward />
            تخطي
          </Button>
          <Button size="xl" variant="neon" onClick={() => { onMark(true) }}>
            <Check />
            صح
          </Button>
        </div>
      )}
    </div>
  )
}
