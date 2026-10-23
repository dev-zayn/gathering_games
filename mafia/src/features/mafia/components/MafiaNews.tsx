import { ROLES } from '@shared/data/mafia-roles'
import type { MafiaView } from '@shared/protocol'
import { PixelSprite } from '@/components/PixelSprite'
import { GameScreen } from '@/components/game/GameScreen'
import { PixelTag } from '@/components/game/PixelTag'
import { Button } from '@/components/ui/button'

interface Props {
  view: MafiaView
  isHost: boolean
  onContinue: () => void
}

/** The announcements: who the night took (dawn), who the town sent out (verdict). */
export function MafiaNews({ view, isHost, onContinue }: Props) {
  const dawn = view.phase === 'dawn'
  return (
    <div className="flex flex-col gap-4">
      {dawn && view.dawn ? (
        <GameScreen tone={view.dawn.victim ? 'plasma' : 'neon'} className={view.dawn.victim ? 'animate-shake' : undefined}>
          <PixelTag className="text-coin">GOOD MORNING</PixelTag>
          <PixelSprite name="moon" className="size-14" />
          {view.dawn.victim ? (
            <>
              <p className="text-14 text-ink-soft">المافيا قتلت بالليل</p>
              <p className="animate-celebrate font-display text-40 font-extrabold text-plasma glow-text">{view.dawn.victim}</p>
            </>
          ) : (
            <p className="animate-celebrate font-display text-24 font-extrabold text-neon glow-text">
              {view.dawn.saved ? 'الطبيب أنقذ الضحية! محد مات 💉' : 'ليلة هادئة… محد مات'}
            </p>
          )}
        </GameScreen>
      ) : (
        view.verdict && (
          <GameScreen tone={view.verdict.role === 'mafia' ? 'neon' : 'plasma'}>
            <PixelTag className="text-coin">VERDICT</PixelTag>
            {view.verdict.name && view.verdict.role ? (
              <>
                <p className="font-display text-32 font-extrabold">{view.verdict.name}</p>
                <p className="text-14 text-ink-soft">طلع من اللعبة… وكان</p>
                <p className={`animate-pixel-pop font-display text-32 font-extrabold glow-text ${view.verdict.role === 'mafia' ? 'text-plasma' : 'text-neon'}`}>
                  {ROLES[view.verdict.role].name}
                </p>
              </>
            ) : (
              <p className="font-display text-24 font-extrabold">محد طلع اليوم</p>
            )}
            <p className="text-13 text-ink-faint">{view.verdict.tally.map((t) => `${t.name} ${String(t.votes)}`).join(' · ')}</p>
          </GameScreen>
        )
      )}
      {isHost ? (
        <Button size="xl" onClick={onContinue}>
          {dawn ? 'للتصويت ☀️' : 'الليل نزل 🌙'}
        </Button>
      ) : (
        <p className="text-center text-14 text-ink-faint">ننتظر صاحب الغرفة يكمّل…</p>
      )}
    </div>
  )
}
