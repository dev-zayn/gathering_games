import type { RoomView } from '@shared/protocol'
import { SpotRoom } from '@/features/spot-it/components/SpotRoom'

interface Props {
  room: RoomView
  isHost: boolean
  clockOffset: number
}

/** The running game's screen. */
export function GamePlay({ room, isHost, clockOffset }: Props) {
  return <SpotRoom room={room} isHost={isHost} clockOffset={clockOffset} />
}
