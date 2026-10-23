import { RotateCcw } from 'lucide-react'
import type { OutsiderView } from '@shared/protocol'
import { GameScreen } from '@/components/game/GameScreen'
import { PixelTag } from '@/components/game/PixelTag'
import { Scoreboard } from '@/components/game/Scoreboard'
import { Button } from '@/components/ui/button'

interface Props {
  view: OutsiderView
  isHost: boolean
  onNext: () => void
}

/** The secret, whether the outsider got it, and the table with this round's points. */
export function OutsiderResult({ view, isHost, onNext }: Props) {
  const r = view.result
  if (!r) return null
  const scores = Object.fromEntries(view.scores.map((s) => [s.name, s.score]))
  return (
    <div className="flex flex-col gap-4">
      <GameScreen tone={r.guessed ? 'plasma' : 'neon'}>
        <PixelTag className="text-coin">ROUND OVER</PixelTag>
        <p className="text-14 text-ink-soft">السالفة كانت</p>
        <p className="animate-celebrate font-display text-40 font-extrabold text-neon glow-text">{r.word}</p>
        {r.meaning && <p className="font-display text-20 font-bold text-coin">= {r.meaning}</p>}
        <p className="font-display text-16 font-bold">
          {view.verdict?.outsider} {r.guessed ? 'حزرها صح ✅' : 'ما عرفها ❌'}
        </p>
      </GameScreen>
      <Scoreboard scores={scores} gains={r.gains} players={view.scores.map((s) => s.name)} />
      {isHost ? (
        <Button size="xl" onClick={onNext}>
          <RotateCcw />
          جولة جديدة
        </Button>
      ) : (
        <p className="text-center text-14 text-ink-faint">ننتظر صاحب الغرفة يبدأ جولة جديدة…</p>
      )}
    </div>
  )
}
