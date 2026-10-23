import { Layers, Swords } from 'lucide-react'
import { COLOR_NAMES, signed } from '@shared/data/deck'
import type { UnoColor } from '@shared/protocol'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SUIT_TEXT } from '../lib/cards'

interface Props {
  by: string
  /** The colour the Draw Four was played on: fair only if they held none of it. */
  over: UnoColor
  secs: number
  act: (action: Record<string, unknown>) => void
}

/** A Wild Draw Four on you: take the four, or bet they held the colour. */
export function ChallengePanel({ by, over, secs, act }: Props) {
  const color = COLOR_NAMES[over]
  return (
    <section className="flex animate-rise-in flex-col gap-3 rounded-card border-2 border-plasma bg-card p-4 shadow-pixel">
      <h2 className="font-display text-18 font-extrabold text-plasma">{`${by} لعب عليك جوكر ${signed(4)}`}</h2>
      <p className="text-14 leading-relaxed text-ink-soft">
        {`الـ${signed(4)}`} ينلعب بس إذا ما عنده <span className={cn('font-bold', SUIT_TEXT[over])}>{color}</span>. تتحدّاه؟ إذا طلع عنده{' '}
        {color} هو يسحب 4 وإنت تلعب. وإذا ما عنده، تسحب 6 ويروح دورك.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            act({ type: 'accept' })
          }}
        >
          <Layers />
          اسحب 4
        </Button>
        <Button
          variant="plasma"
          size="lg"
          onClick={() => {
            act({ type: 'challenge' })
          }}
        >
          <Swords />
          اتحدّاه
        </Button>
      </div>
      <p className="text-center text-12 text-ink-faint">{`إذا ما قرّرت خلال ${String(secs)} ثانية تسحب 4`}</p>
    </section>
  )
}
