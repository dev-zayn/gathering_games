import type { RoomView } from '@shared/protocol'
import { ReflexRoom } from '@/features/reflex/components/ReflexRoom'
import { viewOf } from '../hooks/use-room'

interface Props {
  room: RoomView
  isHost: boolean
  clockOffset: number
}

/** The running game's screen. */
export function GamePlay({ room, isHost, clockOffset }: Props) {
  const view = viewOf(room, 'reflex')
  return view ? <ReflexRoom view={view} isHost={isHost} clockOffset={clockOffset} /> : null
}
