import type { Seat } from '@shared/backgammon/board'
import type { BgView } from '@shared/protocol'
import { Die } from './Die'

interface Props {
  view: BgView
  names: [string, string]
  /** «You», when there is one on this phone. */
  you: Seat | null
}

/** A game's first moment, laid across the hinge: one die each, and who starts with both. */
export function OpeningRoll({ view, names, you }: Props) {
  const { dice, ties } = view.opening
  const first: Seat = dice[0] > dice[1] ? 0 : 1
  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/2 flex justify-center">
      <div className="-mt-9 flex animate-lay-down items-center gap-3 rounded-full border border-brass/50 bg-slab-raised py-2 ps-2 pe-4 shadow-slab">
        <Die value={dice[0]} size="sm" throwKey={`open-${String(view.gameNo)}`} />
        <Die value={dice[1]} size="sm" tone="ebony" throwKey={`open-${String(view.gameNo)}`} order={1} />
        <p className="flex flex-col text-13 leading-tight">
          <span className="font-semibold text-ink">{first === you ? 'إنت تبدأ' : `${names[first]} يبدأ`}</span>
          <span className="text-11 text-ink-faint">{ties > 0 ? `بعد ${String(ties)} تعادل · بالزارين` : 'بالزارين'}</span>
        </p>
      </div>
    </div>
  )
}
