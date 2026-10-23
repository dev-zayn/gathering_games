// The wire protocol between the phones and the game server — one WebSocket
// per phone at `/ws`, JSON text frames. The server is authoritative: phones
// send intents, the server answers with a personalised `RoomView` (never
// anybody else's secrets) after every change.
//
// Channels (Bun's native WebSocket pub/sub): every socket in a room is
// subscribed to `room:<code>` (room-wide notifications) and to its own
// `player:<id>` (turn notifications). Game state is never published — each
// phone's view is different, so it's sent socket by socket.

import type { OnlineGameId } from './games'

// ── Client → server ─────────────────────────────────────────────────────────

export type ClientMessage =
  | { t: 'create'; game: OnlineGameId; name: string }
  | { t: 'join'; code: string; name: string }
  /** Reclaim a seat after a dropped connection or a reload. */
  | { t: 'rejoin'; code: string; playerId: string; secret: string }
  /** Host only, lobby only. `options` is validated by the game's engine. */
  | { t: 'start'; options: unknown }
  /** A move in the running game — validated by the game's engine. */
  | { t: 'act'; action: unknown }
  /** Host only: back to the lobby, ending the game in progress. */
  | { t: 'lobby' }
  /** Host only, lobby only. */
  | { t: 'kick'; playerId: string }
  | { t: 'leave' }
  | { t: 'ping' }

// ── Server → client ─────────────────────────────────────────────────────────

export type ServerMessage =
  /** Your seat: keep it to `rejoin` with. */
  | { t: 'session'; code: string; playerId: string; secret: string }
  | { t: 'room'; room: RoomView }
  /** Arabic, customer-facing. `fatal` means the seat is gone (bad code, kicked). */
  | { t: 'error'; message: string; fatal?: boolean }
  /**
   * A realtime notification, published on a channel: `turn` on your private
   * `player:<id>` channel the moment the game starts waiting on you; `room` on
   * the `room:<code>` channel for everyone (joins, leaves, the game starting).
   */
  | { t: 'notify'; kind: 'turn' | 'room'; text: string }
  | { t: 'pong' }

export interface PlayerSummary {
  id: string
  name: string
  connected: boolean
}

export interface RoomView {
  code: string
  game: OnlineGameId
  /** Your player id. */
  you: string
  hostId: string
  players: PlayerSummary[]
  stage: 'lobby' | 'playing'
  view: GameView | null
  /** Set while the game is waiting on YOU — what to do, in Arabic. Drives the turn alert. */
  yourTurn: string | null
  /** Server clock (epoch ms) when this view was sent — for timers across phones. */
  now: number
}

export type GameView = SpotView

// ── لگطها ──────────────────────────────────────────────────────────────────

/** The box's five mini-games. */
export type SpotMode = 'tower' | 'well' | 'potato' | 'gift' | 'triplet'

export interface SpotOptions {
  mode: SpotMode
}

/** A card face up on the table. */
export interface SpotCard {
  id: number
  /** Its 8 symbols, indices into shared/data/spot-symbols.ts. */
  symbols: number[]
  /** When it turns face up (host epoch ms): every phone shows it at once, so lag picks no winner. */
  at: number
}

/** Another player at the table. */
export interface SpotSeat {
  id: string
  name: string
  /** The cards they hold (a tower, a pile, the potato, the gifts). */
  count: number
  /** Their face-up card, when the mini-game matches against it (the hot potato, the poisoned gift). */
  top: SpotCard | null
  /** Frozen for a wrong tap until then (host epoch ms). */
  frozenUntil: number
  connected: boolean
}

/** The latest catch, for the line under the board. */
export interface SpotCatch {
  /** Bumps on every catch: a phone plays each one once. */
  n: number
  by: string
  you: boolean
  symbol: number
  /** Who was handed the cards, when someone was (the hot potato, the poisoned gift). */
  to: string | null
  toYou: boolean
}

export interface SpotStanding {
  name: string
  /** The mini-game's own count: tower height, cards left, cards lost, gifts, sets' cards. */
  count: number
  you: boolean
}

export interface SpotView {
  game: 'spot-it'
  mode: SpotMode
  /** `countdown`: the cards are dealt face down until `until`. */
  phase: 'countdown' | 'play' | 'over'
  until: number
  /** Lays the symbols out on the cards, the same on every phone. */
  seed: number
  /** You were dealt in (false for a phone that joined the room after the deal). */
  dealt: boolean
  /** The middle card: the tower's draw, the well, the poisoned gift. */
  center: SpotCard | null
  /** Your face-up card: the tower's top, your pile's top, the potato. */
  mine: SpotCard | null
  /** The cards you hold. */
  count: number
  /** Everyone else dealt in, in seat order. */
  seats: SpotSeat[]
  /** The triplet's face-up cards, in place. */
  grid: SpotCard[]
  /** Cards still face down in the draw pile. */
  deck: number
  frozenUntil: number
  last: SpotCatch | null
  /** The hot potato's deals, and who lost the one before. */
  deal: number
  deals: number
  dealLoser: { name: string; you: boolean; cards: number } | null
  /** Best first; `lowWins` when the fewest cards win. */
  standings: SpotStanding[]
  lowWins: boolean
  /** Once it is over: whoever came first (a tie crowns them all). */
  winners: string[]
}
