import type { RoomView } from '@shared/protocol'
import { MafiaRoom } from '@/features/mafia/components/MafiaRoom'

interface Props {
  room: RoomView
  isHost: boolean
  clockOffset: number
}

/** The running game's screen. */
export function GamePlay({ room, isHost }: Props) {
  return <MafiaRoom room={room} isHost={isHost} />
}
