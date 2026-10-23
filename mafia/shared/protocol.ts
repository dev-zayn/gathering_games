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
import type { Role } from './data/mafia-roles'

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

export type GameView = MafiaView

export interface Named {
  id: string
  name: string
}

export interface Tally {
  name: string
  votes: number
}

// ── المافيا ─────────────────────────────────────────────────────────────────

export interface MafiaView {
  game: 'mafia'
  phase: 'reveal' | 'night' | 'dawn' | 'day' | 'verdict' | 'over'
  night: number
  role: Role
  alive: boolean
  /** Fellow mafiosi — on a mafia phone only. */
  partners: string[]
  seen: boolean
  living: Named[]
  /** Whom you may pick right now (night move or day vote). */
  targets: Named[]
  acted: boolean
  /** How many living players the phase still waits on — a count, never names, so the night gives nothing away. */
  waiting: number
  /** The detective's answer for tonight — detective phone only. */
  check: { name: string; isMafia: boolean } | null
  dawn: { victim: string | null; saved: boolean } | null
  verdict: { name: string | null; role: Role | null; tally: Tally[] } | null
  over: { winner: 'town' | 'mafia'; seats: { name: string; role: Role; alive: boolean }[] } | null
}

// ── Start options ─────────────────────────────────────────────────

export interface MafiaOptions {
  doctor: boolean
  detective: boolean
}
