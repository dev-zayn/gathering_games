import { ArrowRight, Play, RotateCcw, Zap } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PixelTag } from '@/components/game/PixelTag'
import { Button } from '@/components/ui/button'
import { useHiScores } from '@/lib/hi-scores'
import { duel } from '../duel-store'
import { TARGET, useReflex } from '../hooks/use-reflex'
import { ReflexPad } from './ReflexPad'

/**
 * The duel on one phone, from the front door: two pads facing each other
 * across the screen, a strip of rules between. No room, no network.
 */
export function Reflex() {
  const hi = useHiScores().reflex
  const { phase, score, tap, start, rematch } = useReflex()
  const names = { p1: 'لاعب ١', p2: 'لاعب ٢' }

  return (
    <AppShell>
      <div className="flex flex-1 flex-col gap-2 p-2 pt-safe-2 pb-safe-2">
        <ReflexPad side="p2" name={names.p2} score={score.p2} phase={phase} onTap={tap} />
        <div className="flex shrink-0 items-center justify-between gap-2 rounded-card border-2 border-hairline bg-card px-3 py-2">
          <div className="flex flex-col">
            <PixelTag className="text-9 text-ink-faint">{`FIRST TO ${String(TARGET)}`}</PixelTag>
            <PixelTag className="text-9 text-coin">{hi === undefined ? 'HI ---' : `HI ${String(hi)}ms`}</PixelTag>
          </div>
          {phase.kind === 'lobby' && (
            <Button size="sm" onClick={start}>
              <Play />
              ابدأ
            </Button>
          )}
          {phase.kind === 'match' && (
            <Button size="sm" variant="plasma" onClick={rematch}>
              <RotateCcw />
              مباراة ثانية
            </Button>
          )}
          {phase.kind !== 'armed' && phase.kind !== 'go' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                duel.set(false)
              }}
            >
              <ArrowRight />
              رجوع
            </Button>
          )}
          {(phase.kind === 'armed' || phase.kind === 'go' || phase.kind === 'point') && (
            <Zap aria-hidden className="size-6 animate-sprite-hop text-coin" />
          )}
        </div>
        <ReflexPad side="p1" name={names.p1} score={score.p1} phase={phase} onTap={tap} />
      </div>
    </AppShell>
  )
}
