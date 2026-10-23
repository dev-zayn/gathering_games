import { CATEGORIES } from '../../shared/data/outsider-categories'
import { CUSTOM_LIMITS, MIN_WORDS, allCategories, secretsOf, type Secret } from '../../shared/outsider-words'
import type { OutsiderOptions, OutsiderView } from '../../shared/protocol'
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
  type Result,
} from '../engine'

interface State {
  options: OutsiderOptions
  /** Seated at the start — later arrivals can't play a round they didn't get a card for. */
  ids: string[]
  scores: Record<string, number>
  round: number
  phase: OutsiderView['phase']
  category: string
  secret: Secret
  outsider: string
  choices: string[]
  seen: string[]
  pairs: [string, string][]
  q: number
  votes: Record<string, string>
  verdict: { counts: [string, number][]; caught: boolean } | null
  guessed: boolean | null
  gains: Record<string, number>
}

function parseOptions(raw: unknown): Result<OutsiderOptions> {
  const o = (typeof raw === 'object' && raw !== null ? raw : {}) as Partial<Record<keyof OutsiderOptions, unknown>>
  const custom: Record<string, string[]> = {}
  if (typeof o.custom === 'object' && o.custom !== null) {
    for (const [name, lines] of Object.entries(o.custom).slice(0, CUSTOM_LIMITS.categories)) {
      if (!Array.isArray(lines) || name in CATEGORIES) continue
      const clean = lines
        .filter((l): l is string => typeof l === 'string')
        .map((l) => l.trim().slice(0, CUSTOM_LIMITS.chars))
        .filter(Boolean)
        .slice(0, CUSTOM_LIMITS.lines)
      const title = name.trim().slice(0, 30)
      if (title) custom[title] = clean
    }
  }
  const all = allCategories(custom)
  const enabled = (Array.isArray(o.enabled) ? o.enabled : Object.keys(all)).filter(
    (c): c is string => typeof c === 'string' && secretsOf(all[c]).length >= MIN_WORDS,
  )
  if (enabled.length === 0) return refuse('فعّلوا سالفة وحدة على الأقل')
  return { enabled, custom }
}

/** One question each: a shuffled ring, so nobody asks themselves and everybody gets asked. */
function ring(ids: readonly string[]): [string, string][] {
  const r = shuffle(ids)
  return r.map((p, i) => [p, r[(i + 1) % r.length] ?? p])
}

function newRound(prev: Pick<State, 'options' | 'ids' | 'scores' | 'round'>): State {
  const all = allCategories(prev.options.custom)
  const category = pick(prev.options.enabled)
  const secrets = secretsOf(all[category])
  const secret = pick(secrets)
  const decoys = shuffle(secrets.map((s) => s.word).filter((w) => w !== secret.word)).slice(0, 7)
  return {
    ...prev,
    round: prev.round + 1,
    phase: 'reveal',
    category,
    secret,
    outsider: pick(prev.ids),
    choices: shuffle([secret.word, ...decoys]),
    seen: [],
    pairs: [],
    q: 0,
    votes: {},
    verdict: null,
    guessed: null,
    gains: {},
  }
}

function score(state: State, guessed: boolean): State {
  const gains: Record<string, number> = Object.fromEntries(state.ids.map((id) => [id, 0]))
  for (const [voter, accused] of Object.entries(state.votes)) {
    if (accused === state.outsider) gains[voter] = (gains[voter] ?? 0) + 1
  }
  gains[state.outsider] = (gains[state.outsider] ?? 0) + (state.verdict?.caught ? 0 : 1) + (guessed ? 1 : 0)
  const scores = { ...state.scores }
  for (const [id, g] of Object.entries(gains)) scores[id] = (scores[id] ?? 0) + g
  return { ...state, phase: 'result', guessed, gains, scores }
}

export const outsider: Engine<State, OutsiderOptions> = {
  id: 'outsider',
  options: parseOptions,

  scores: (s) => s.ids.map((id) => ({ player: id, score: s.scores[id] ?? 0 })),

  start: (ctx, options) => newRound({ options, ids: [...ctx.ids], scores: {}, round: 0 }),

  act(state, ctx, me, raw) {
    const a = actionOf(raw)
    const isHost = me === ctx.hostId
    if (!state.ids.includes(me)) return refuse('إنت مو بهاي الجولة')
    switch (a.type) {
      case 'seen':
        return state.phase === 'reveal' && !state.seen.includes(me) ? { ...state, seen: [...state.seen, me] } : state
      case 'asked': {
        const pair = state.pairs[state.q]
        if (state.phase !== 'questions' || !pair || (pair[0] !== me && !isHost)) return refuse('مو دورك')
        return state.q < state.pairs.length - 1 ? { ...state, q: state.q + 1 } : { ...state, pairs: ring(state.ids), q: 0 }
      }
      case 'toVote':
        if (state.phase !== 'questions') return state
        if (!isHost) return refuse('بس صاحب الغرفة يبدأ التصويت')
        return { ...state, phase: 'vote' }
      case 'vote': {
        const target = a.target
        if (state.phase !== 'vote' || typeof target !== 'string' || target === me || !state.ids.includes(target)) {
          return refuse('تصويت مو صحيح')
        }
        return { ...state, votes: { ...state.votes, [me]: target } }
      }
      case 'guess':
        if (state.phase !== 'guess' || me !== state.outsider) return refuse('مو دورك')
        if (typeof a.word !== 'string' || !state.choices.includes(a.word)) return refuse('اختيار مو صحيح')
        return score(state, a.word === state.secret.word)
      case 'skipGuess':
        // The outsider's phone died on the last screen — the host can close the round.
        return state.phase === 'guess' && isHost ? score(state, false) : state
      case 'next':
        if (state.phase !== 'result' || !isHost) return refuse('بس صاحب الغرفة يبدأ جولة جديدة')
        return newRound(state)
      default:
        return refuse('حركة مو معروفة')
    }
  },

  settle(state, ctx) {
    if (state.phase === 'reveal' && pending(state.ids, (id) => state.seen.includes(id), ctx).length === 0) {
      return { ...state, phase: 'questions', pairs: ring(state.ids), q: 0 }
    }
    if (state.phase === 'vote') {
      const voted = Object.keys(state.votes).length
      if (voted > 0 && pending(state.ids, (id) => id in state.votes, ctx).length === 0) {
        const counts = count(state.votes)
        return { ...state, phase: 'guess', verdict: { counts, caught: plurality(counts) === state.outsider } }
      }
    }
    return state
  },

  view(state, ctx, me) {
    const isOutsider = me === state.outsider
    const pair = state.pairs[state.q]
    const waiting =
      state.phase === 'reveal'
        ? pending(state.ids, (id) => state.seen.includes(id), ctx)
        : state.phase === 'vote'
          ? pending(state.ids, (id) => id in state.votes, ctx)
          : state.phase === 'guess'
            ? [state.outsider]
            : []
    const view: OutsiderView = {
      game: 'outsider',
      phase: state.phase,
      round: state.round,
      category: state.category,
      secret: isOutsider && state.phase !== 'result' ? null : { word: state.secret.word, meaning: state.secret.meaning },
      isOutsider,
      seen: state.seen.includes(me),
      waitingOn: waiting.map((id) => nameOf(ctx, id)),
      ask:
        state.phase === 'questions' && pair
          ? {
              asker: nameOf(ctx, pair[0]),
              target: nameOf(ctx, pair[1]),
              index: state.q + 1,
              total: state.pairs.length,
              mine: pair[0] === me,
            }
          : null,
      voted: me in state.votes,
      candidates: named(
        ctx,
        state.ids.filter((id) => id !== me),
      ),
      verdict: state.verdict
        ? {
            counts: state.verdict.counts.map(([id, votes]) => ({ name: nameOf(ctx, id), votes })),
            outsider: nameOf(ctx, state.outsider),
            caught: state.verdict.caught,
          }
        : null,
      options: state.phase === 'guess' ? state.choices : [],
      result:
        state.phase === 'result'
          ? {
              word: state.secret.word,
              meaning: state.secret.meaning,
              guessed: state.guessed ?? false,
              gains: Object.fromEntries(Object.entries(state.gains).map(([id, g]) => [nameOf(ctx, id), g])),
            }
          : null,
      scores: state.ids
        .map((id) => ({ name: nameOf(ctx, id), score: state.scores[id] ?? 0 }))
        .sort((a, b) => b.score - a.score),
    }
    const yourTurn =
      state.phase === 'reveal' && !view.seen
        ? 'شوف كرتك بالسر'
        : state.phase === 'questions' && pair?.[0] === me
          ? `دورك تسأل ${nameOf(ctx, pair[1])}`
          : state.phase === 'vote' && !view.voted
            ? 'صوّت: منو برا السالفة؟'
            : state.phase === 'guess' && isOutsider
              ? 'انكشفت اللعبة… احزر السالفة!'
              : null
    return { view, yourTurn }
  },
}
