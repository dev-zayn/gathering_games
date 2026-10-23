import type { OutsiderView } from '@shared/protocol'
import { PixelSprite } from '@/components/PixelSprite'
import { GameScreen } from '@/components/game/GameScreen'
import { PixelTag } from '@/components/game/PixelTag'
import { Button } from '@/components/ui/button'
import { WaitingFor } from '@/features/room/components/WaitingFor'

interface Props {
  view: OutsiderView
  isHost: boolean
  onGuess: (word: string) => void
  onSkip: () => void
}

/** The unmasking, then the outsider's last chance — on their phone; everyone else watches. */
export function OutsiderGuess({ view, isHost, onGuess, onSkip }: Props) {
  const v = view.verdict
  return (
    <div className="flex flex-col gap-4">
      {v && (
        <GameScreen tone={v.caught ? 'neon' : 'plasma'} className={v.caught ? 'animate-shake' : undefined}>
          <PixelSprite name="spy" className="size-14" />
          <p className="text-14 text-ink-soft">اللي برا السالفة هو</p>
          <p className="animate-celebrate font-display text-40 font-extrabold text-plasma glow-text">
            {view.isOutsider ? 'إنت!' : v.outsider}
          </p>
          <PixelTag className={v.caught ? 'text-12 text-success' : 'text-12 text-coin'}>{v.caught ? 'BUSTED!' : 'ESCAPED!'}</PixelTag>
          <p className="text-13 text-ink-faint">{v.counts.map((c) => `${c.name} ${String(c.votes)}`).join(' · ')}</p>
        </GameScreen>
      )}
      {view.isOutsider ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-center font-display text-22 font-extrabold">شنو كانت السالفة؟</h2>
          <div className="grid grid-cols-2 gap-3">
            {view.options.map((w) => (
              <Button key={w} size="xl" variant="outline" className="text-16 whitespace-normal" onClick={() => { onGuess(w) }}>
                {w}
              </Button>
            ))}
          </div>
        </section>
      ) : (
        <>
          <WaitingFor names={view.waitingOn} label="يحزر هسه" />
          {isHost && (
            <Button variant="ghost" size="sm" onClick={onSkip}>
              تخطّي التخمين
            </Button>
          )}
        </>
      )}
    </div>
  )
}
