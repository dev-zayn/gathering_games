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

export type GameView = UnoView

// ── بقت وحدة! ──────────────────────────────────────────────────────────────

export type UnoColor = 'red' | 'yellow' | 'green' | 'blue'

export type UnoKind = 'number' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4' | 'custom'

/** What the two blank Wild Customizable cards do: the house rule agreed before the deal. */
export type UnoHouseRule = 'again' | 'swap' | 'hunt' | 'dump' | 'wild'

/** `winner`: who goes out scores what everyone else holds. `low`: everyone counts their own hand, the fewest win. */
export type UnoScoring = 'winner' | 'low'

export const UNO_TARGETS = [0, 200, 500] as const

export interface UnoOptions {
  /** 0: one hand. Else hands are dealt until a total reaches it (the box plays to 500). */
  target: (typeof UNO_TARGETS)[number]
  scoring: UnoScoring
  house: UnoHouseRule
}

export interface UnoCard {
  /** 0–107, the same card on every phone (shared/data/deck.ts). */
  id: number
  /** Null on the wild cards: the colour is the player's to call. */
  color: UnoColor | null
  kind: UnoKind
  /** The number cards' 0–9. */
  value: number | null
}

/** A player at the table, in seat order. */
export interface UnoSeat {
  id: string
  name: string
  /** Cards in hand: everyone sees how many, nobody else sees which. */
  count: number
  connected: boolean
  you: boolean
  /** Down to one card, and said «وحدة!» in time. */
  called: boolean
  /** Down to one card without saying it: anyone else may catch them until the next move. */
  exposed: boolean
  /** Points so far, when hands are dealt to a target. */
  total: number
}

/** One line of what just happened, worded for this phone («لعبت» or «علي لعب»). */
export interface UnoLine {
  /** Bumps on every event: a phone plays each one once. */
  n: number
  text: string
  /** `you`: your move; `hit`: it lands on you (you draw, you're skipped); `plain`: the rest. */
  tone: 'you' | 'hit' | 'plain'
}

export interface UnoHandRow {
  id: string
  name: string
  you: boolean
  /** What they still held when the hand ended. */
  cards: UnoCard[]
  points: number
  total: number
}

export interface UnoView {
  game: 'giant-uno'
  options: UnoOptions
  /** `color`: the first player calls a wild that opened the pile. `challenge`: a Wild Draw Four waits on its victim. `between`: the next hand is coming. */
  phase: 'color' | 'play' | 'challenge' | 'between' | 'over'
  /** You were dealt in (false for a phone that joined the room after the deal). */
  dealt: boolean
  hand: UnoCard[]
  /** Your cards that may go down now; empty when it is not your move. */
  playable: number[]
  /** The card you drew this turn: only it may be played, or you pass. */
  drawn: number | null
  top: UnoCard | null
  /** The colour to follow: the top card's, or the one called on a wild. */
  color: UnoColor
  /** Cards face down in the draw pile. */
  pile: number
  seats: UnoSeat[]
  /** Whose move it is: the player to play, the one calling a colour, the one facing a Draw Four. */
  turn: string
  /** 1: clockwise (down the seats), −1 after a reverse. */
  dir: 1 | -1
  /** The move's deadline (host epoch ms): the turn passes on its own then. */
  until: number
  /** You face a Wild Draw Four from this player, played on `over`: draw four, or challenge that they held none of it. */
  challenge: { by: string; over: UnoColor } | null
  /** You challenged: the hand you were shown. */
  shown: { name: string; cards: UnoCard[] } | null
  /** You hold two cards or one and have not said «وحدة!» yet. */
  canCall: boolean
  /** Newest first, a few lines. */
  log: UnoLine[]
  /** 1 for the first hand. */
  handNo: number
  /** The hand just played, between hands and at the end. */
  result: { winner: string; you: boolean; points: number; rows: UnoHandRow[] } | null
  /** Once it is over: whoever came first (a tie crowns them all). */
  winners: string[]
}
