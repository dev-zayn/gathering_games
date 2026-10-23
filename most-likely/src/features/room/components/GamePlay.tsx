import type { RoomView } from '@shared/protocol'
import { MostLikelyRoom } from '@/features/most-likely/components/MostLikelyRoom'

interface Props {
  room: RoomView
  isHost: boolean
  clockOffset: number
}

/** The running game's screen. */
export function GamePlay({ room, isHost }: Props) {
  return <MostLikelyRoom room={room} isHost={isHost} />
}
