import type { RoomView } from '@shared/protocol'
import { MafiaLobby } from '@/features/mafia/components/MafiaLobby'

interface Props {
  room: RoomView
  isHost: boolean
}

/** The game's own lobby options and the start key. */
export function GameLobby({ room, isHost }: Props) {
  const present = room.players.filter((p) => p.connected).length
  return <MafiaLobby isHost={isHost} present={present} />
}
