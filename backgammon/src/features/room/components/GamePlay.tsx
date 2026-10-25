import type { RoomView } from '@shared/protocol'
import { BackgammonRoom } from '@/features/backgammon/components/BackgammonRoom'

interface Props {
  room: RoomView
  isHost: boolean
  clockOffset: number
}

/** The running game's screen. */
export function GamePlay({ room, isHost, clockOffset }: Props) {
  return <BackgammonRoom room={room} isHost={isHost} clockOffset={clockOffset} />
}
