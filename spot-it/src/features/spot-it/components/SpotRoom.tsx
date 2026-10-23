import type { RoomView } from '@shared/protocol'
import { PixelTag } from '@/components/game/PixelTag'
import { viewOf } from '@/features/room/hooks/use-room'
import { modeOf } from '../data/modes'
import { useHostNow } from '../hooks/use-host-now'
import { useSpot } from '../hooks/use-spot'
import type { BoardProps } from '../lib/board'
import { CatchLine } from './CatchLine'
import { CountdownCover } from './CountdownCover'
import { FaceOffBoard } from './FaceOffBoard'
import { FreezeCover } from './FreezeCover'
import { PairBoard } from './PairBoard'
import { SpotOver } from './SpotOver'
import { SpotStandings } from './SpotStandings'
import { TripletBoard } from './TripletBoard'

interface Props {
  room: RoomView
  isHost: boolean
  clockOffset: number
}

/** لگطها on the table: the mini-game's head, the latest catch, the board, who leads. */
export function SpotRoom({ room, isHost, clockOffset }: Props) {
  const view = viewOf(room, 'spot-it')
  const { spot, shakeOf } = useSpot(clockOffset)
  // Wake for every card that turns up, and for a freeze thawing.
  const deadlines = view
    ? [view.center?.at, view.mine?.at, ...view.seats.map((s) => s.top?.at), ...view.seats.map((s) => s.frozenUntil), ...view.grid.map((c) => c.at), view.frozenUntil].filter(
        (t): t is number => t !== undefined,
      )
    : []
  const now = useHostNow(clockOffset, deadlines)
  if (!view) return null

  const mode = modeOf(view.mode)
  const frozen = view.frozenUntil > now
  const board: BoardProps = { view, now, canTap: view.dealt && view.phase === 'play' && !frozen, spot, shakeOf }
  const counter = view.deals > 0 ? `DEAL ${String(view.deal)}/${String(view.deals)}` : view.mode === 'well' ? null : `DECK ${String(view.deck)}`

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <PixelTag className="text-coin">{mode.code}</PixelTag>
          <span className="truncate font-display text-17 font-extrabold">{mode.title}</span>
        </div>
        {counter && <PixelTag className="shrink-0 text-neon">{counter}</PixelTag>}
      </div>

      {view.phase === 'over' ? (
        <SpotOver view={view} isHost={isHost} />
      ) : (
        <>
          <CatchLine view={view} />
          <div className="relative">
            {view.mode === 'tower' || view.mode === 'well' ? (
              <PairBoard {...board} />
            ) : view.mode === 'triplet' ? (
              <TripletBoard {...board} />
            ) : (
              <FaceOffBoard {...board} />
            )}
            {view.phase === 'countdown' && <CountdownCover view={view} clockOffset={clockOffset} />}
            {view.phase === 'play' && frozen && <FreezeCover until={view.frozenUntil} clockOffset={clockOffset} />}
          </div>
          {!view.dealt && <p className="text-center text-13 text-ink-faint">دخلت بعد التوزيع: تفرّج هالجولة، وبالجاية تلعب.</p>}
        </>
      )}

      <SpotStandings view={view} />
    </div>
  )
}
