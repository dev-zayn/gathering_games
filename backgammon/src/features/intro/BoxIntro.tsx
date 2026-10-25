import { useState } from 'react'
import { BoxLid } from '@/components/art/BoxLid'
import { TeaGlass } from '@/components/art/TeaGlass'
import { haptic } from '@/lib/miniapp'
import { clack } from '@/lib/sound'
import { cn } from '@/lib/utils'
import { GAME } from '@/features/backgammon/data/game'

interface Props {
  onDone: () => void
}

/**
 * The game's loading screen: the closed box on a café table under the
 * lamp, a glass of tea beside it. A tap anywhere swings the lid open on
 * its hinge, and the table (already set up underneath) shows through.
 */
export function BoxIntro({ onDone }: Props) {
  const [opening, setOpening] = useState(false)

  const open = () => {
    if (opening) return
    haptic()
    clack()
    setOpening(true)
    window.setTimeout(onDone, 760)
  }

  return (
    <button
      type="button"
      aria-label={`افتح ${GAME.title}`}
      onClick={open}
      className={cn('fixed inset-0 z-70 flex flex-col items-center justify-center gap-8 cafe-ground px-10', opening && 'animate-fade-out')}
    >
      <div className="relative w-full max-w-60">
        <BoxLid className={cn('origin-top', opening && 'animate-lid-open')}>
          <p className="font-hand text-64 leading-none font-bold text-brass-lit">{GAME.title}</p>
          <p className="text-13 text-pearl/70">{GAME.subtitle}</p>
        </BoxLid>
        <TeaGlass className="absolute -end-10 -bottom-4 w-16" />
      </div>
      <p className={cn('text-14 text-ink-soft transition-opacity', opening ? 'opacity-0' : 'animate-lamp')}>دوس حتى تفتح الطاولي</p>
    </button>
  )
}
