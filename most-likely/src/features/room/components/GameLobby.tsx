import type { RoomView } from '@shared/protocol'
import { MostLikelyLobby } from '@/features/most-likely/components/MostLikelyLobby'

interface Props {
  room: RoomView
  isHost: boolean
}

/** The game's own lobby options and the start key. */
export function GameLobby({ room, isHost }: Props) {
  const present = room.players.filter((p) => p.connected).length
  return <MostLikelyLobby isHost={isHost} present={present} />
}
