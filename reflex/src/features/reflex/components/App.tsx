import { RoomScreen } from '@/features/room/components/RoomScreen'
import { useDuelOpen } from '../duel-store'
import { Reflex } from './Reflex'

/** The room's game, or the one-phone duel when the front door opened it. */
export function App() {
  return useDuelOpen() ? <Reflex /> : <RoomScreen game="reflex" />
}
