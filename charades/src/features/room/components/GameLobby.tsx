import type { RoomView } from '@shared/protocol'
import { CharadesLobby } from '@/features/charades/components/CharadesLobby'

interface Props {
  room: RoomView
  isHost: boolean
}

/** The game's own lobby options and the start key. */
export function GameLobby({ room, isHost }: Props) {
  const present = room.players.filter((p) => p.connected).length
  return <CharadesLobby isHost={isHost} present={present} />
}
