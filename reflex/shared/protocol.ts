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

export type GameView = ReflexView

// ── أسرع إصبع ──────────────────────────────────────────────────────────────

export interface ReflexOptions {
  /** First to this many points takes the match. */
  target: number
}

/** One player's go at a draw. */
export type ReflexTap =
  /** Tapped after the signal, `ms` measured on their own phone from the signal showing. */
  | { kind: 'time'; ms: number }
  /** Tapped before the signal, or impossibly soon after it. */
  | { kind: 'foul' }
  /** No tap before the draw closed. */
  | { kind: 'miss' }

export interface ReflexRow {
  name: string
  you: boolean
  tap: ReflexTap
  /** Took the draw's point. */
  won: boolean
}

export interface ReflexStanding {
  name: string
  you: boolean
  points: number
  /** Their fastest reaction this match, if any. */
  best: number | null
  connected: boolean
}

export interface ReflexView {
  game: 'reflex'
  /** `draw`: everyone's finger ready, the signal at `goAt`; `result`: the draw's table until `until`. */
  phase: 'draw' | 'result' | 'over'
  draw: number
  target: number
  /** The signal, on the host's clock: every phone lights at once. */
  goAt: number
  /** `draw`: when it closes for whoever has not tapped; `result`: when the next draw arms. */
  until: number
  /** Dealt in (false for a phone that joined after the start). */
  dealt: boolean
  /** Your go at this draw, once the host has it. */
  yours: ReflexTap | null
  /** How many have gone, of how many. */
  done: number
  of: number
  /** The draw just played, fastest first (`result` and `over`). */
  rows: ReflexRow[]
  /** Best first. */
  standings: ReflexStanding[]
  /** Once it is over: whoever reached the target (a tie crowns them all). */
  winners: string[]
}
