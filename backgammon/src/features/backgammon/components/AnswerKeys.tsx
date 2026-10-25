import { Flag, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { pointsWords } from '../lib/words'
import { Cube } from './Cube'

interface Props {
  by: string
  cube: number
  onTake: () => void
  onPass: () => void
}

/** A double offered to this side: take it at twice the stake, or give the game up at the stake as it is. */
export function AnswerKeys({ by, cube, onTake, onPass }: Props) {
  return (
    <div className="flex animate-rise-in flex-col gap-3">
      <div className="flex items-center gap-3">
        <Cube value={cube * 2} />
        <p className="flex-1 text-14 leading-relaxed text-ink">
          <span className="font-semibold">{`${by} ضاعف.`}</span>
          {` إذا قبلت، اللعبة تصير تسوى ${pointsWords(cube * 2)} والمكعب بيدك. إذا سلّمت تخسر ${pointsWords(cube)}.`}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <Button variant="teal" size="lg" onClick={onTake}>
          <ShieldCheck />
          أقبل
        </Button>
        <Button variant="brick" size="lg" onClick={onPass}>
          <Flag />
          أسلّم
        </Button>
      </div>
    </div>
  )
}
