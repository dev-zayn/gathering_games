import type { ReflexOptions, ReflexRow, ReflexTap, ReflexView } from '../../shared/protocol'
import { between } from '../../shared/random'
import { actionOf, nameOf, refuse, type Ctx, type Engine } from '../engine'

// أسرع إصبع for a room: every phone is a pad, the host's clock fires one
// signal on all of them at once, and each phone times its own player from
// the moment its pad lit to the moment the finger landed. The time is taken
// on the phone, so the network never picks the winner: the host only
// collects the times and gives the point to the fastest.

export const TARGETS = [3, 5, 7] as const
/** After the start, a beat for every page to have the first draw before it can fire. */
export const START_LEAD_MS = 1200
/** The signal lands at a random moment in this span, so nobody can count it in. */
export const WAIT_MIN_MS = 1500
export const WAIT_MAX_MS = 4500
/** A draw closes this long after the signal for whoever has not tapped. */
export const TAP_WINDOW_MS = 3000
/** The draw's table stays up this long, then the next draw arms. */
export const RESULT_MS = 3000
/** Quicker than any human: a finger already on its way, a false start. */
export const MIN_MS = 100
/** A time that reaches the host this long before the signal cannot have seen it. */
const EARLY_SLACK_MS = 50

interface State {
  ids: string[]
  target: number
  phase: ReflexView['phase']
  draw: number
  goAt: number
  until: number
  taps: Record<string, ReflexTap>
  points: Record<string, number>
  best: Record<string, number>
  /** The draw just closed, as its table shows it. */
  last: { id: string; tap: ReflexTap; won: boolean }[]
}

function arm(s: State, now: number, lead = 0): State {
  const goAt = now + lead + between(WAIT_MIN_MS, WAIT_MAX_MS)
  return { ...s, phase: 'draw', draw: s.draw + 1, goAt, until: goAt + TAP_WINDOW_MS, taps: {} }
}

const ORDER: Record<ReflexTap['kind'], number> = { time: 0, foul: 1, miss: 2 }

/** The draw closes: the fastest time takes the point (a dead heat gives it to each). */
function close(s: State, now: number): State {
  const taps = Object.fromEntries(s.ids.map((id): [string, ReflexTap] => [id, s.taps[id] ?? { kind: 'miss' }]))
  const times = s.ids.flatMap((id) => {
    const t = taps[id]
    return t?.kind === 'time' ? [t.ms] : []
  })
  const fastest = times.length > 0 ? Math.min(...times) : null
  const won = (id: string) => {
    const t = taps[id]
    return t?.kind === 'time' && t.ms === fastest
  }
  const points = { ...s.points }
  const best = { ...s.best }
  for (const id of s.ids) {
    const t = taps[id]
    if (t?.kind === 'time') best[id] = Math.min(best[id] ?? Infinity, t.ms)
    if (won(id)) points[id] = (points[id] ?? 0) + 1
  }
  const last = s.ids
    .map((id) => ({ id, tap: taps[id] ?? ({ kind: 'miss' } as const), won: won(id) }))
    .sort((a, b) => ORDER[a.tap.kind] - ORDER[b.tap.kind] || (a.tap.kind === 'time' && b.tap.kind === 'time' ? a.tap.ms - b.tap.ms : 0))
  const done = s.ids.some((id) => (points[id] ?? 0) >= s.target)
  return { ...s, taps, points, best, last, phase: done ? 'over' : 'result', until: done ? now : now + RESULT_MS }
}

/** The clock's part: a draw closing for the slow, the next one arming. */
function advance(s: State, ctx: Ctx): State {
  if (s.phase === 'draw') {
    // Everyone here has gone (even all on false starts), or the draw ran out.
    const waiting = s.ids.filter((id) => ctx.connected.has(id) && !(id in s.taps))
    if (waiting.length === 0 || ctx.now >= s.until) return close(s, ctx.now)
  }
  if (s.phase === 'result' && ctx.now >= s.until) return arm(s, ctx.now)
  return s
}

function standings(s: State, ctx: Ctx, me: string) {
  return s.ids
    .map((id) => ({ name: nameOf(ctx, id), you: id === me, points: s.points[id] ?? 0, best: s.best[id] ?? null, connected: ctx.connected.has(id) }))
    .sort((a, b) => b.points - a.points || (a.best ?? Infinity) - (b.best ?? Infinity))
}

export const reflex: Engine<State, ReflexOptions> = {
  id: 'reflex',

  scores: (s) => s.ids.map((id) => ({ player: id, score: s.points[id] ?? 0 })),

  options(raw) {
    const target = typeof raw === 'object' && raw !== null ? (raw as { target?: unknown }).target : undefined
    return (TARGETS as readonly unknown[]).includes(target) ? { target: target as number } : refuse('اختار كم نقطة للفوز')
  },

  start: (ctx, { target }) =>
    arm(
      { ids: [...ctx.ids], target, phase: 'draw', draw: 0, goAt: 0, until: 0, taps: {}, points: {}, best: {}, last: [] },
      ctx.now,
      START_LEAD_MS,
    ),

  act(s, ctx, me, raw) {
    const a = actionOf(raw)
    if (!s.ids.includes(me)) return refuse('إنت تتفرج هالجولة')
    if (a.type !== 'tap') return refuse('حركة مو معروفة')
    // Late for this draw, or a second tap: the first go counts.
    if (s.phase !== 'draw' || me in s.taps) return s
    const ms = typeof a.ms === 'number' && Number.isFinite(a.ms) ? Math.round(a.ms) : null
    const early = a.early === true || ms === null || ms < MIN_MS || ctx.now < s.goAt - EARLY_SLACK_MS
    const tap: ReflexTap = early ? { kind: 'foul' } : { kind: 'time', ms: Math.min(ms, 9999) }
    return { ...s, taps: { ...s.taps, [me]: tap } }
  },

  settle: advance,

  wakeAt: (s) => (s.phase === 'over' ? null : s.until),

  wake: advance,

  view(s, ctx, me) {
    const rows: ReflexRow[] = s.last.map((r) => ({ name: nameOf(ctx, r.id), you: r.id === me, tap: r.tap, won: r.won }))
    const table = standings(s, ctx, me)
    const view: ReflexView = {
      game: 'reflex',
      phase: s.phase,
      draw: s.draw,
      target: s.target,
      goAt: s.goAt,
      until: s.until,
      dealt: s.ids.includes(me),
      yours: s.phase === 'draw' ? (s.taps[me] ?? null) : null,
      done: Object.keys(s.taps).length,
      of: s.ids.filter((id) => ctx.connected.has(id)).length,
      rows: s.phase === 'draw' ? [] : rows,
      standings: table,
      winners: s.phase === 'over' ? table.filter((t) => t.points >= s.target).map((t) => t.name) : [],
    }
    return { view, yourTurn: null }
  },
}
