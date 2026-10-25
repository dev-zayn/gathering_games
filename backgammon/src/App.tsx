import { LocalTable } from '@/features/backgammon/components/LocalTable'
import { useLocalOpen } from '@/features/backgammon/local-store'
import { RoomScreen } from '@/features/room/components/RoomScreen'

/** The room's screens, or a match on this phone alone once one is opened from the front door. */
export function App() {
  const local = useLocalOpen()
  return local ? <LocalTable /> : <RoomScreen game="backgammon" />
}
