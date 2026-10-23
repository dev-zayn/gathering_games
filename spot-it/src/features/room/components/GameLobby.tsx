import type { RoomView } from '@shared/protocol'
import { SpotLobby } from '@/features/spot-it/components/SpotLobby'

interface Props {
  room: RoomView
  isHost: boolean
}

/** The game's own lobby options and the start key. */
export function GameLobby({ room, isHost }: Props) {
  const present = room.players.filter((p) => p.connected).length
  return <SpotLobby isHost={isHost} present={present} />
}
