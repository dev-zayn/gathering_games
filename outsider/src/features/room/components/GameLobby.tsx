import type { RoomView } from '@shared/protocol'
import { OutsiderLobby } from '@/features/outsider/components/OutsiderLobby'

interface Props {
  room: RoomView
  isHost: boolean
}

/** The game's own lobby options and the start key. */
export function GameLobby({ room, isHost }: Props) {
  const present = room.players.filter((p) => p.connected).length
  return <OutsiderLobby isHost={isHost} present={present} />
}
