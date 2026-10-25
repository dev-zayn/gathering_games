import { Check, Undo2 } from 'lucide-react'
import { diceLeft } from '@shared/backgammon/moves'
import { Button } from '@/components/ui/button'
import type { TurnPlay } from '../hooks/use-turn-play'
import { DiceTray } from './DiceTray'

interface Props {
  dice: [number, number]
  play: Extract<TurnPlay, { active: true }>
  throwKey: string
}

/** The dice in hand while the checkers move: what is left to play, «رجّع» and «تمّ». */
export function MoveKeys({ dice, play, throwKey }: Props) {
  const hint = play.complete
    ? play.staged.length === 0
      ? 'ما عندك لعب بهالزار'
      : 'خلصت حركاتك: دوس «تمّ»'
    : play.selected !== null
      ? 'اختار وين تنزّلها'
      : 'دوس على حجرة حتى تحرّكها'
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2.5">
        <DiceTray dice={dice} left={diceLeft(dice, play.staged)} throwKey={throwKey} />
        <span className="flex-1" />
        <Button variant="outline" size="icon-lg" aria-label="رجّع آخر حركة" disabled={!play.canUndo} onClick={play.undo}>
          <Undo2 />
        </Button>
        <Button size="lg" className="min-w-24" disabled={!play.complete || play.sent} onClick={play.submit}>
          <Check className="size-5" />
          تمّ
        </Button>
      </div>
      <p role="status" aria-live="polite" className="text-12 text-ink-soft">
        {hint}
      </p>
    </div>
  )
}
