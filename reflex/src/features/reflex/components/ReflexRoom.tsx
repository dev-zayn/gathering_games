import type { ReflexView } from '@shared/protocol'
import { useDrawTap } from '../hooks/use-draw-tap'
import { DrawPad } from './DrawPad'
import { DrawTable } from './DrawTable'
import { ReflexOver } from './ReflexOver'
import { ReflexStandings } from './ReflexStandings'

interface Props {
  view: ReflexView
  isHost: boolean
  clockOffset: number
}

/** أسرع إصبع in a room: this phone's pad, the draw's table, the match so far. */
export function ReflexRoom({ view, isHost, clockOffset }: Props) {
  const { lit, tap, yours, record } = useDrawTap(view, clockOffset)
  return (
    <div className="flex flex-1 flex-col gap-3">
      {view.phase === 'over' ? (
        <ReflexOver view={view} isHost={isHost} />
      ) : (
        <>
          <DrawPad view={view} lit={lit} yours={yours} record={record} onTap={tap} />
          {view.phase === 'result' && <DrawTable view={view} />}
        </>
      )}
      <ReflexStandings view={view} />
    </div>
  )
}
