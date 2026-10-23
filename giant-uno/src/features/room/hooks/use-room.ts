import type { GameView, RoomView } from '@shared/protocol'
import { realtime, useRealtime } from '@/lib/realtime/connection'

/** The room you're in, with the bits every game screen needs. */
export function useRoom() {
  const snap = useRealtime()
  const room = snap.room
  return {
    ...snap,
    room,
    isHost: !!room && room.hostId === room.you,
    act: realtime.act,
  }
}

/** Narrows a room's game view to one game's shape. */
export function viewOf<G extends GameView['game']>(room: RoomView | null, game: G): Extract<GameView, { game: G }> | null {
  const v = room?.view
  return v?.game === game ? (v as Extract<GameView, { game: G }>) : null
}
