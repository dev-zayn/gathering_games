import { Dices } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Cube } from './Cube'
import { Die } from './Die'

interface Props {
  canDouble: boolean
  cube: number
  /** The throw is on its way to the host's phone: the dice shake in the hand. */
  throwing: boolean
  onRoll: () => void
  onDouble: () => void
}

/** The start of a turn: throw the dice, or first turn the cube. */
export function RollKeys({ canDouble, cube, throwing, onRoll, onDouble }: Props) {
  return (
    <div className="flex items-center gap-2.5">
      {canDouble && (
        <Button variant="outline" size="lg" className="gap-2 px-3" disabled={throwing} onClick={onDouble}>
          <Cube value={cube * 2} className="size-7 text-12" />
          ضاعف
        </Button>
      )}
      <Button size="lg" className="flex-1" disabled={throwing} onClick={onRoll}>
        {throwing ? (
          <span className="flex animate-shake gap-1.5" aria-label="الزار ينذب">
            <Die value={3} size="sm" />
            <Die value={5} size="sm" />
          </span>
        ) : (
          <>
            <Dices className="size-5.5" />
            ذبّ الزار
          </>
        )}
      </Button>
    </div>
  )
}
