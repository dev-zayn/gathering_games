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

export type GameView = BgView

// ── طاولي ───────────────────────────────────────────────────────────────────

/** 1: one game, its worth is the score. 3/5/7: a match to that many points. */
export const BG_LENGTHS = [1, 3, 5, 7] as const
export type BgLength = (typeof BG_LENGTHS)[number]

export interface BgOptions {
  length: BgLength
  /** The doubling cube is in play (with the Crawford rule in a match). */
  cube: boolean
}

/** One die's move of one checker, in the mover's own numbering: 25 the bar, 0 borne off. */
export interface BgMove {
  from: number
  to: number
  die: number
}

/** 0 plays the ivory checkers and sits first; 1 the ebony. */
export type BgSeat = 0 | 1

export interface BgSide {
  id: string
  name: string
  connected: boolean
  you: boolean
  /** Match points so far. */
  score: number
}

/** A turn played out, for the phones to replay: the roll and its moves, or no move at all. */
export interface BgTurn {
  seat: BgSeat
  dice: [number, number]
  moves: BgMove[]
  /** Checkers it sent to the bar. */
  hits: number
  /** The roll had no legal move. */
  blocked: boolean
  /** Bumps on every turn: a phone plays each one once. */
  n: number
}

/** How a game ended: who took it, and for how much. */
export interface BgResult {
  winner: BgSeat
  /** 1 a single game, 2 a gammon (مارس), 3 a backgammon (مارس كبير). */
  kind: 1 | 2 | 3
  cube: number
  points: number
  /** The loser passed a double. */
  passed: boolean
}

export interface BgView {
  game: 'backgammon'
  options: BgOptions
  /**
   * `roll`: the player to move doubles or rolls. `double`: the other one
   * takes or passes. `move`: the dice are out. `between`: the next game is
   * coming. `over`: the match is decided.
   */
  phase: 'roll' | 'double' | 'move' | 'between' | 'over'
  /** Your seat; null for a phone that is not one of the two. */
  seat: BgSeat | null
  sides: [BgSide, BgSide]
  /** Both sides' checkers, each in its own numbering (shared/backgammon/board.ts). */
  board: [number[], number[]]
  /** Whose turn it is; a double waits on the other seat. */
  turn: BgSeat
  /** The roll being played (`move`); null before it is thrown. */
  dice: [number, number] | null
  /** The moves the player to move has made so far, before saying they are done: the other phone watches them. */
  staged: BgMove[]
  /** The cube's value, and who holds it (null: in the middle, either may double). */
  cube: { value: number; owner: BgSeat | null }
  /** You may turn the cube now. */
  canDouble: boolean
  /** This game is the match's Crawford game: no doubling in it. */
  crawford: boolean
  /** 1 for the first game. */
  gameNo: number
  /** The decision's deadline (host epoch ms): the turn plays itself then. */
  until: number
  /** This game's opening roll: one die each by seat, and how many ties came before it. */
  opening: { dice: [number, number]; ties: number }
  /** The turn just played. */
  last: BgTurn | null
  /** The game just finished, between games and at the end. */
  result: BgResult | null
  /** Once the match is decided. */
  winner: BgSeat | null
}
