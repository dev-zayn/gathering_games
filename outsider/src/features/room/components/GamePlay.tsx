import type { RoomView } from '@shared/protocol'
import { OutsiderRoom } from '@/features/outsider/components/OutsiderRoom'

interface Props {
  room: RoomView
  isHost: boolean
  clockOffset: number
}

/** The running game's screen. */
export function GamePlay({ room, isHost }: Props) {
  return <OutsiderRoom room={room} isHost={isHost} />
}
