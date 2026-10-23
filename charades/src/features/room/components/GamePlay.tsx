import type { RoomView } from '@shared/protocol'
import { CharadesRoom } from '@/features/charades/components/CharadesRoom'

interface Props {
  room: RoomView
  isHost: boolean
  clockOffset: number
}

/** The running game's screen. */
export function GamePlay({ room, isHost, clockOffset }: Props) {
  return <CharadesRoom room={room} isHost={isHost} clockOffset={clockOffset} />
}
