import type { RoomView } from '@shared/protocol'
import { UnoRoom } from '@/features/giant-uno/components/UnoRoom'

interface Props {
  room: RoomView
  isHost: boolean
  clockOffset: number
}

/** The running game's screen. */
export function GamePlay({ room, isHost, clockOffset }: Props) {
  return <UnoRoom room={room} isHost={isHost} clockOffset={clockOffset} />
}
