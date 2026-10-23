import { mafiaCount, type Role } from '../../shared/data/mafia-roles'
import type { MafiaOptions, MafiaView } from '../../shared/protocol'
import { pick, shuffle } from '../../shared/random'
import {
  actionOf,
  count,
  nameOf,
  named,
  pending,
  plurality,
  refuse,
  type Engine,
} from '../engine'

interface Seat {
  role: Role
  alive: boolean
}

interface State {
  options: MafiaOptions
  ids: string[]
  seats: Record<string, Seat>
  phase: MafiaView['phase']
  night: number
  seen: string[]
  /** Everyone living acts at night — townsfolk pick a decoy — so the night gives no role away. */
  acted: string[]
  kills: Record<string, string>
  save: string | null
  check: { target: string; isMafia: boolean } | null
  /** Voter → target, or '' for «محد». */
  votes: Record<string, string>
  dawn: { victim: string | null; saved: boolean } | null
  verdict: { victim: string | null; tally: [string, number][] } | null
  winner: 'town' | 'mafia' | null
}

const SKIP = ''

const living = (s: State) => s.ids.filter((id) => s.seats[id]?.alive)
const roleOf = (s: State, id: string): Role => s.seats[id]?.role ?? 'citizen'

function winnerOf(s: State): 'town' | 'mafia' | null {
  const alive = living(s)
  const mafia = alive.filter((id) => roleOf(s, id) === 'mafia').length
  if (mafia === 0) return 'town'
  if (mafia >= alive.length - mafia) return 'mafia'
  return null
}

function deal(ids: readonly string[], options: MafiaOptions): Record<string, Seat> {
  const roles: Role[] = Array.from({ length: mafiaCount(ids.length) }, () => 'mafia' as const)
  if (options.doctor) roles.push('doctor')
  if (options.detective) roles.push('detective')
  while (roles.length < ids.length) roles.push('citizen')
  const dealt = shuffle(roles)
  return Object.fromEntries(ids.map((id, i) => [id, { role: dealt[i] ?? 'citizen', alive: true }]))
}

const nightStart = (s: State): State => ({
  ...s,
  phase: 'night',
  acted: [],
  kills: {},
  save: null,
  check: null,
  votes: {},
})

const kill = (s: State, id: string | null): State =>
  id ? { ...s, seats: { ...s.seats, [id]: { ...(s.seats[id] ?? { role: 'citizen' }), alive: false } } } : s

/** Whom `me` may pick tonight / today. */
function targetsFor(s: State, me: string): string[] {
  const alive = living(s)
  if (s.phase === 'night') {
    const role = roleOf(s, me)
    if (role === 'mafia') return alive.filter((id) => roleOf(s, id) !== 'mafia')
    if (role === 'doctor') return alive
    return alive.filter((id) => id !== me)
  }
  return alive.filter((id) => id !== me)
}

function endNight(s: State): State {
  const target = plurality(count(s.kills)) ?? (Object.keys(s.kills).length ? pick(Object.values(s.kills)) : null)
  const saved = target !== null && target === s.save
  const victim = saved ? null : target
  const next = kill(s, victim)
  const winner = winnerOf(next)
  return { ...next, phase: winner ? 'over' : 'dawn', dawn: { victim, saved }, winner }
}

function endDay(s: State): State {
  const tally = count(s.votes)
  const top = plurality(tally)
  const victim = top && top !== SKIP ? top : null
  const next = kill(s, victim)
  const winner = winnerOf(next)
  return { ...next, phase: winner ? 'over' : 'verdict', verdict: { victim, tally }, winner }
}

export const mafia: Engine<State, MafiaOptions> = {
  // The winning side scores 1, the rest 0; a game ended before either side
  // won scores nobody.
  scores: (s) =>
    s.ids.map((id) => ({
      player: id,
      score: s.winner !== null && (roleOf(s, id) === 'mafia') === (s.winner === 'mafia') ? 1 : 0,
    })),

  id: 'mafia',

  options(raw) {
    const o = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>
    return { doctor: o.doctor !== false, detective: o.detective !== false }
  },

  start: (ctx, options) => ({
    options,
    ids: [...ctx.ids],
    seats: deal(ctx.ids, options),
    phase: 'reveal',
    night: 1,
    seen: [],
    acted: [],
    kills: {},
    save: null,
    check: null,
    votes: {},
    dawn: null,
    verdict: null,
    winner: null,
  }),

  act(s, ctx, me, raw) {
    const a = actionOf(raw)
    const isHost = me === ctx.hostId
    if (!s.ids.includes(me)) return refuse('إنت مو بهاي اللعبة')
    const alive = s.seats[me]?.alive ?? false
    switch (a.type) {
      case 'seen':
        return s.phase === 'reveal' && !s.seen.includes(me) ? { ...s, seen: [...s.seen, me] } : s
      case 'night': {
        if (s.phase !== 'night' || !alive || s.acted.includes(me)) return refuse('مو دورك')
        const target = a.target
        if (typeof target !== 'string' || !targetsFor(s, me).includes(target)) return refuse('اختيار مو صحيح')
        const role = roleOf(s, me)
        return {
          ...s,
          acted: [...s.acted, me],
          kills: role === 'mafia' ? { ...s.kills, [me]: target } : s.kills,
          save: role === 'doctor' ? target : s.save,
          check: role === 'detective' ? { target, isMafia: roleOf(s, target) === 'mafia' } : s.check,
        }
      }
      case 'day': {
        if (s.phase !== 'day' || !alive || me in s.votes) return refuse('مو دورك')
        const target = a.target === null ? SKIP : a.target
        if (typeof target !== 'string' || (target !== SKIP && !targetsFor(s, me).includes(target))) {
          return refuse('تصويت مو صحيح')
        }
        return { ...s, votes: { ...s.votes, [me]: target } }
      }
      case 'continue':
        if (!isHost) return refuse('بس صاحب الغرفة يكمّل')
        if (s.phase === 'dawn') return { ...s, phase: 'day', votes: {} }
        if (s.phase === 'verdict') return nightStart({ ...s, night: s.night + 1 })
        return s
      case 'restart':
        if (s.phase !== 'over' || !isHost) return refuse('بس صاحب الغرفة يبدأ من جديد')
        return mafia.start({ ...ctx, ids: s.ids }, s.options)
      default:
        return refuse('حركة مو معروفة')
    }
  },

  settle(s, ctx) {
    if (s.phase === 'reveal' && pending(s.ids, (id) => s.seen.includes(id), ctx).length === 0) return nightStart(s)
    if (s.phase === 'night' && pending(living(s), (id) => s.acted.includes(id), ctx).length === 0) return endNight(s)
    if (s.phase === 'day' && Object.keys(s.votes).length > 0 && pending(living(s), (id) => id in s.votes, ctx).length === 0) {
      return endDay(s)
    }
    return s
  },

  view(s, ctx, me) {
    const role = roleOf(s, me)
    const alive = s.seats[me]?.alive ?? false
    const acted = s.phase === 'night' ? s.acted.includes(me) : s.phase === 'day' ? me in s.votes : false
    const waiting =
      s.phase === 'reveal'
        ? pending(s.ids, (id) => s.seen.includes(id), ctx).length
        : s.phase === 'night'
          ? pending(living(s), (id) => s.acted.includes(id), ctx).length
          : s.phase === 'day'
            ? pending(living(s), (id) => id in s.votes, ctx).length
            : 0
    const view: MafiaView = {
      game: 'mafia',
      phase: s.phase,
      night: s.night,
      role,
      alive,
      partners:
        role === 'mafia' ? s.ids.filter((id) => id !== me && roleOf(s, id) === 'mafia').map((id) => nameOf(ctx, id)) : [],
      seen: s.seen.includes(me),
      living: named(ctx, living(s)),
      targets: alive && (s.phase === 'night' || s.phase === 'day') ? named(ctx, targetsFor(s, me)) : [],
      acted,
      waiting,
      check:
        role === 'detective' && s.phase === 'night' && s.check
          ? { name: nameOf(ctx, s.check.target), isMafia: s.check.isMafia }
          : null,
      dawn: s.dawn && s.phase !== 'reveal' ? { victim: s.dawn.victim ? nameOf(ctx, s.dawn.victim) : null, saved: s.dawn.saved } : null,
      verdict: s.verdict
        ? {
            name: s.verdict.victim ? nameOf(ctx, s.verdict.victim) : null,
            role: s.verdict.victim ? roleOf(s, s.verdict.victim) : null,
            tally: s.verdict.tally.map(([id, votes]) => ({ name: id === SKIP ? 'محد' : nameOf(ctx, id), votes })),
          }
        : null,
      over:
        s.phase === 'over' && s.winner
          ? {
              winner: s.winner,
              seats: s.ids.map((id) => ({ name: nameOf(ctx, id), role: roleOf(s, id), alive: s.seats[id]?.alive ?? false })),
            }
          : null,
    }
    const yourTurn =
      s.phase === 'reveal' && !view.seen
        ? 'شوف دورك بالسر'
        : s.phase === 'night' && alive && !acted
          ? 'الليل نزل… دورك تختار'
          : s.phase === 'day' && alive && !acted
            ? 'صوّت: منو يطلع اليوم؟'
            : null
    return { view, yourTurn }
  },
}
