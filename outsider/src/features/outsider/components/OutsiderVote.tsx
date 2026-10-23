import type { OutsiderView } from '@shared/protocol'
import { PixelTag } from '@/components/game/PixelTag'
import { Button } from '@/components/ui/button'
import { WaitingFor } from '@/features/room/components/WaitingFor'

interface Props {
  view: OutsiderView
  onVote: (target: string) => void
}

/** The secret ballot, on your own phone. */
export function OutsiderVote({ view, onVote }: Props) {
  if (view.voted) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <PixelTag className="text-success">VOTE CAST</PixelTag>
        <p className="font-display text-22 font-extrabold">صوّتت ✓</p>
        <WaitingFor names={view.waitingOn} />
      </div>
    )
  }
  return (
    <section className="flex animate-rise-in flex-col gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <PixelTag className="text-plasma">SECRET VOTE</PixelTag>
        <h2 className="font-display text-24 font-extrabold">منو برا السالفة؟</h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {view.candidates.map((p) => (
          <Button key={p.id} size="xl" variant="outline" className="text-16" onClick={() => { onVote(p.id) }}>
            {p.name}
          </Button>
        ))}
      </div>
    </section>
  )
}
