import { cn } from '@/lib/utils'
import { diceCall } from '../lib/words'
import { Die } from './Die'

/** The dice of a throw keep their places: first, second (and a double's third and fourth). */
const PLACES = ['first', 'second', 'third', 'fourth'] as const

interface Props {
  dice: readonly [number, number]
  /** The dice still to play; the rest show as used. */
  left?: readonly number[]
  size?: 'sm' | 'md'
  /** Changes with every throw: the dice tumble in and the big rolls are called out. */
  throwKey?: string
  className?: string
}

/** A throw on the table: two dice, or four of a double, the played ones sunk; «شيش بيش!» stamped over the big ones. */
export function DiceTray({ dice, left, size = 'md', throwKey, className }: Props) {
  const [a, b] = dice
  const faces = a === b ? [a, a, a, a] : [a, b]
  const remaining = [...(left ?? faces)]
  const used = faces.map((v) => {
    const i = remaining.indexOf(v)
    if (i < 0) return true
    remaining.splice(i, 1)
    return false
  })
  // A double's four dice sit smaller.
  const dieSize = a === b && size === 'md' ? 'sm' : size
  const call = diceCall(a, b)
  return (
    <div className={cn('relative flex items-center gap-1.5', className)}>
      {faces.map((v, i) => (
        <Die key={PLACES[i]} value={v} used={used[i]} size={dieSize} throwKey={throwKey} order={i} />
      ))}
      {call && throwKey !== undefined && (
        <span
          key={throwKey}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-7 animate-stamp text-center font-hand text-22 font-bold whitespace-nowrap text-brass-lit"
        >
          {call}
        </span>
      )}
    </div>
  )
}
