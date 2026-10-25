import { ChevronsLeft, Trophy } from 'lucide-react'
import type { RoomView } from '@shared/protocol'
import { Button } from '@/components/ui/button'
import { viewOf } from '@/features/room/hooks/use-room'
import { realtime } from '@/lib/realtime/connection'
import { useHostNow } from '../hooks/use-host-now'
import { BackgammonTable } from './BackgammonTable'
import { TurnNote } from './TurnNote'

interface Props {
  room: RoomView
  isHost: boolean
  clockOffset: number
}

const act = (action: Record<string, unknown>) => {
  realtime.act(action)
}

/** طاولي in a گعدة room: this phone's side at the bottom, its moves sent to the host's phone as they are made. */
export function BackgammonRoom({ room, isHost, clockOffset }: Props) {
  const view = viewOf(room, 'backgammon')
  const now = useHostNow(clockOffset)
  if (!view) return null
  const names: [string, string] = [view.sides[0].name, view.sides[1].name]
  const after =
    view.phase === 'over' ? (
      isHost ? (
        <Button size="xl" onClick={() => void realtime.finish()}>
          <Trophy />
          النتائج
        </Button>
      ) : (
        <TurnNote waiting>ننتظر صاحب الغرفة يعرض النتائج…</TurnNote>
      )
    ) : (
      <Button
        size="lg"
        onClick={() => {
          act({ type: 'next' })
        }}
      >
        <ChevronsLeft />
        يلا الجاية
      </Button>
    )
  return (
    <BackgammonTable
      view={view}
      perspective={view.seat ?? 0}
      controller={view.seat}
      you={view.seat}
      names={names}
      act={act}
      now={now}
      timed
      waiting={`دور ${names[view.turn]}…`}
      after={after}
    />
  )
}
