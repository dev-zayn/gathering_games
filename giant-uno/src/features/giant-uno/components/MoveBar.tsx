import { Layers, Megaphone, SkipForward } from 'lucide-react'
import { signed } from '@shared/data/deck'
import type { UnoView } from '@shared/protocol'
import { Button } from '@/components/ui/button'

interface Props {
  view: UnoView
  /** It is your move. */
  yours: boolean
  secs: number
  act: (action: Record<string, unknown>) => void
}

/** Under the table: what you can do now (draw, pass, «وحدة!»), or whose move it is. */
export function MoveBar({ view, yours, secs, act }: Props) {
  const mover = view.seats.find((s) => s.id === view.turn)
  const hint = yours
    ? view.drawn !== null
      ? 'سحبت ورقة تركب: العبها لو عدّي'
      : view.playable.length > 0
        ? 'العب ورقة تركب، لو اسحب'
        : 'ما عندك شي يركب: اسحب ورقة'
    : view.phase === 'color'
      ? `${mover?.name ?? '؟'} يختار اللون…`
      : view.phase === 'challenge'
        ? `${mover?.name ?? '؟'} يقرّر على الـ${signed(4)}…`
        : `دور ${mover?.name ?? '؟'}…`

  return (
    <section className="flex flex-col gap-2">
      <p className="text-center font-display text-14 font-bold text-ink-soft">
        {hint}
        {yours && <span dir="ltr" className="ms-2 font-pixel text-10 text-coin">{`${String(secs)}s`}</span>}
      </p>
      {(view.canCall || yours) && (
        <div className="flex gap-2">
          {view.canCall && (
            <Button
              variant="plasma"
              size="lg"
              className="flex-1"
              onClick={() => {
                act({ type: 'call' })
              }}
            >
              <Megaphone />
              وحدة!
            </Button>
          )}
          {yours && view.drawn === null && (
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => {
                act({ type: 'draw' })
              }}
            >
              <Layers />
              اسحب ورقة
            </Button>
          )}
          {yours && view.drawn !== null && (
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => {
                act({ type: 'pass' })
              }}
            >
              <SkipForward />
              عدّي
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
