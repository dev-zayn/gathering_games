import type { RoomView } from '@shared/protocol'
import { viewOf } from '@/features/room/hooks/use-room'
import { realtime } from '@/lib/realtime/connection'
import { MafiaNews } from './MafiaNews'
import { MafiaOver } from './MafiaOver'
import { MafiaPick } from './MafiaPick'
import { MafiaRole } from './MafiaRole'

interface Props {
  room: RoomView
  isHost: boolean
}

/** المافيا online — the phone is the narrator, one screen per phase. */
export function MafiaRoom({ room, isHost }: Props) {
  const view = viewOf(room, 'mafia')
  if (!view) return null
  const act = realtime.act
  switch (view.phase) {
    case 'reveal':
      return <MafiaRole view={view} onSeen={() => { act({ type: 'seen' }) }} />
    case 'night':
      return <MafiaPick key={`n${String(view.night)}`} view={view} onPick={(target) => { act({ type: 'night', target }) }} />
    case 'day':
      return <MafiaPick key={`d${String(view.night)}`} view={view} onPick={(target) => { act({ type: 'day', target }) }} />
    case 'dawn':
    case 'verdict':
      return <MafiaNews view={view} isHost={isHost} onContinue={() => { act({ type: 'continue' }) }} />
    case 'over':
      return <MafiaOver view={view} isHost={isHost} onFinish={() => { void realtime.finish() }} />
  }
}
