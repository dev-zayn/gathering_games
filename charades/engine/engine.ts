import type { OnlineGameId } from '../shared/games'
import type { GameView } from '../shared/protocol'

/** What an engine knows about the room around it. */
export interface Ctx {
  /** Everyone seated, in join order. */
  ids: readonly string[]
  names: Readonly<Record<string, string>>
  connected: ReadonlySet<string>
  hostId: string
  now: number
}

/** An engine's answer to a move: the next state, or an Arabic reason it's refused. */
export type Result<S> = S | { error: string }

export const refuse = (error: string): { error: string } => ({ error })

export const isRefusal = <S>(r: Result<S>): r is { error: string } =>
  typeof r === 'object' && r !== null && 'error' in r && typeof (r as { error: unknown }).error === 'string'

/**
 * One game's rules, run by the host's phone (lib/gathering/table.ts). Pure functions over a plain-data state:
 * the room owns the state, the clock and the sockets.
 */
export interface Engine<S, O> {
  id: OnlineGameId
  /** Validates the host's start options. */
  options: (raw: unknown) => Result<O>
  start: (ctx: Ctx, options: O) => S
  act: (state: S, ctx: Ctx, playerId: string, action: unknown) => Result<S>
  /**
   * Moves the game on once a phase has everything it waits for. Called after
   * every move, every (dis)connection and every timer — so a phone dropping
   * out never stalls a vote the rest have finished.
   */
  settle: (state: S, ctx: Ctx) => S
  /** When the game's clock next needs the server (epoch ms), if at all. */
  wakeAt?: (state: S) => number | null
  wake?: (state: S, ctx: Ctx) => S
  view: (state: S, ctx: Ctx, playerId: string) => { view: GameView; yourTurn: string | null }
  /**
   * The round's results for گعدة, when the host ends it: one score per
   * player who was dealt in, highest best. The platform ranks them.
   */
  scores: (state: S) => Score[]
}

export interface Score {
  player: string
  score: number
}

// ── Small shared helpers ────────────────────────────────────────────────────

/** Action objects arrive as untrusted JSON. */
export function actionOf(raw: unknown): { type: string } & Record<string, unknown> {
  if (typeof raw !== 'object' || raw === null || typeof (raw as { type?: unknown }).type !== 'string') {
    return { type: '' }
  }
  return raw as { type: string } & Record<string, unknown>
}

/** Those in `ids` who still owe a move and are here to make it. */
export function pending(ids: readonly string[], done: (id: string) => boolean, ctx: Ctx): string[] {
  return ids.filter((id) => ctx.connected.has(id) && !done(id))
}

/** Votes → [target, count] most first. */
export function count(votes: Readonly<Record<string, string>>): [string, number][] {
  const map = new Map<string, number>()
  for (const target of Object.values(votes)) map.set(target, (map.get(target) ?? 0) + 1)
  return [...map.entries()].sort((a, b) => b[1] - a[1])
}

/** The outright winner of a count, or null on a tie / no votes. */
export function plurality(counts: readonly [string, number][]): string | null {
  const [first, second] = counts
  if (!first) return null
  if (second?.[1] === first[1]) return null
  return first[0]
}

export const nameOf = (ctx: Ctx, id: string): string => ctx.names[id] ?? '؟'
export const named = (ctx: Ctx, ids: readonly string[]) => ids.map((id) => ({ id, name: nameOf(ctx, id) }))
