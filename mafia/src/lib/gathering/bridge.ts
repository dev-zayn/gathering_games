// `window.gathering`: the جمعة app's bridge, injected into the game frame
// (gathering_app/docs/GAME_BRIDGE.md). Only the calls these games make are
// typed here. Every bridge call in the arcade goes through this file or
// lib/miniapp.ts.

import { devBridge } from './dev-bridge'

export interface Member {
  id: string
  nickname: string
  role: 'host' | 'player' | 'spectator'
  seat: number
  connected: boolean
}

export interface RoomInfo {
  id: string
  code: string
  status: 'lobby' | 'playing' | 'ended'
  round: number
  you: { role: Member['role']; seat: number }
  /** The tournament match this room plays; null (or absent, in an older app) otherwise. */
  tournament?: RoomMatch | null
}

/**
 * A match room's tournament, as `room.current().tournament` carries it: the
 * stage (knockout) or the rounds counted (league), and the tally — the two
 * sides' round wins, or the league's table best first, each line named.
 */
export interface RoomMatch {
  id: string
  name: string
  format: 'knockout' | 'league'
  match: string
  stage: number
  stages: number
  bestOf: number
  need: number
  rounds: number
  played: number
  tally: { player: string; nickname?: string; wins: number; points: number }[]
}

export interface Result {
  player: string
  score: number
  rank?: number
}

/** The `detail` of each `room.on` event the arcade listens to. */
export interface RoomEvents {
  message: { from: string; data: unknown; to?: string }
  members: Member[]
  host: { player: string; by: string | null }
  ended: { reason: string; round: number; results: Result[] }
  connection: { state: 'connecting' | 'open' | 'reconnecting' | 'closed' }
}

/** Who is playing: the app's signed-in player (never the phone number). */
export interface Player {
  id: string
  nickname: string
  handle?: string
}

export interface RoomApi {
  current: () => Promise<RoomInfo | null>
  /**
   * Outside a room only: a room for this game with this phone as host, or
   * into a friend's (no code: the app's Join sheet for this game). Either
   * way the room's lobby then takes this page's place. Rejects with a bare
   * code (`cancelled`, `in_another_room`, …).
   */
  create: (opts?: { visibility?: 'private' | 'friends' }) => Promise<{ id: string; code: string }>
  join: (opts?: { code?: string }) => Promise<{ id: string; code: string }>
  members: () => Promise<Member[]>
  send: (data: unknown, opts?: { to?: string }) => void
  end: (opts: { scores: Result[] }) => Promise<void>
  on: <E extends keyof RoomEvents>(event: E, fn: (detail: RoomEvents[E]) => void) => void
}

export interface TournamentApi {
  /** The match this page's room plays, or null. */
  current: () => Promise<RoomMatch | null>
  /** The tournament over the game. Rejects `not_in_tournament` outside a match room. */
  open: () => Promise<void>
  /**
   * Outside a room only: the app's own sheet to make a tournament of this
   * game, or to join one by its code. Once in, the tournament's page takes
   * this page's place. Rejects with a bare code (`cancelled`, `in_room`, …).
   */
  create: (opts?: { format?: 'knockout' | 'league' }) => Promise<{ id: string; code: string }>
  join: (opts?: { code?: string }) => Promise<{ id: string; code: string }>
}

export interface Gathering {
  room: RoomApi
  /** Absent in an app from before tournaments. */
  tournament?: TournamentApi
  player: { me: () => Promise<Player | null> }
  haptic: (type?: 'light' | 'medium' | 'heavy' | 'selection' | 'vibrate') => void
  hideSplash: () => void
  close: () => void
  openExternalUrl: (url: string) => Promise<boolean>
}

declare global {
  interface Window {
    gathering?: Gathering & { __installed?: boolean }
    GatheringBridge?: unknown
  }
}

let ready: Promise<Gathering | null> | null = null

/**
 * The bridge once the app has injected it, which is after our scripts begin
 * (GAME_BRIDGE.md "When window.gathering is there"). `null` in a plain
 * browser — unless the page was opened with `?dev`, where a stand-in plays
 * the room across this browser's tabs (dev-bridge.ts).
 */
export function bridge(): Promise<Gathering | null> {
  ready ??= new Promise((resolve) => {
    const installed = () => (window.gathering?.__installed ? window.gathering : null)
    if (installed()) {
      resolve(installed())
      return
    }
    if (!window.GatheringBridge) {
      resolve(new URLSearchParams(location.search).has('dev') ? devBridge() : null)
      return
    }
    let done = false
    const finish = () => {
      if (done) return
      done = true
      window.removeEventListener('gatheringready', finish)
      resolve(installed())
    }
    window.addEventListener('gatheringready', finish)
    // A slow load, not a broken app, gets ten seconds.
    window.setTimeout(finish, 10_000)
  })
  return ready
}

/** A bridge refusal's code: the app rejects with the bare code. */
export function codeOf(e: unknown): string {
  if (typeof e === 'string') return e
  if (e instanceof Error) return e.message
  if (typeof e === 'object' && e !== null && typeof (e as { code?: unknown }).code === 'string') {
    return (e as { code: string }).code
  }
  return String(e)
}

/** The bridge if it has arrived, for fire-and-forget calls. */
export const bridgeNow = (): Gathering | null => (window.gathering?.__installed ? window.gathering : null)
