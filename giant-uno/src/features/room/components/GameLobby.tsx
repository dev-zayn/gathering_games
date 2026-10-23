import type { RoomView } from '@shared/protocol'
import { UnoLobby } from '@/features/giant-uno/components/UnoLobby'

interface Props {
  room: RoomView
  isHost: boolean
}

/** The game's own lobby options and the start key. */
export function GameLobby({ room, isHost }: Props) {
  const present = room.players.filter((p) => p.connected).length
  return <UnoLobby isHost={isHost} present={present} />
}
