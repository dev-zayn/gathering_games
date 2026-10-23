import { DECKS, SECONDS_CHOICES, TURN_CHOICES } from '../../shared/data/charades-words'
import type { CharadesOptions, CharadesView } from '../../shared/protocol'
import { shuffle } from '../../shared/random'
import { actionOf, nameOf, refuse, type Engine } from '../engine'

type Team = 0 | 1

interface State {
  options: CharadesOptions
  teams: [string[], string[]]
  /** Next actor per team, as an index into its members. */
  next: [number, number]
  scores: [number, number]
  turn: number
  team: Team
  actor: string
  phase: CharadesView['phase']
  pile: string[]
  word: string
  plays: { word: string; got: boolean }[]
  endsAt: number | null
}

const TEAM_NAMES = ['فريق النيون', 'فريق البلازما'] as const

function draw(s: State): Pick<State, 'word' | 'pile'> {
  const pile = s.pile.length > 0 ? s.pile : shuffle(s.options.decks.flatMap((d) => DECKS[d] ?? []))
  const [word = '', ...rest] = pile
  return { word, pile: rest }
}

/** The team `team`'s next actor steps up. */
function ready(s: State, team: Team, turn: number): State {
  const members = s.teams[team]
  const actor = members[s.next[team] % members.length] ?? members[0] ?? ''
  const next: [number, number] = [...s.next]
  next[team] += 1
  return { ...s, team, turn, actor, next, phase: 'ready', plays: [], endsAt: null }
}

const teamOf = (s: State, id: string): Team => (s.teams[1].includes(id) ? 1 : 0)

export const charades: Engine<State, CharadesOptions> = {
  id: 'charades',

  // Everyone on a team takes the team's score.
  scores: (s) => s.teams.flatMap((members, i) => members.map((id) => ({ player: id, score: s.scores[i] ?? 0 }))),

  options(raw) {
    const o = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>
    const seconds = (SECONDS_CHOICES as readonly unknown[]).includes(o.seconds) ? (o.seconds as number) : 60
    const turns = (TURN_CHOICES as readonly unknown[]).includes(o.turns) ? (o.turns as number) : 3
    const decks = (Array.isArray(o.decks) ? o.decks : Object.keys(DECKS)).filter(
      (d): d is string => typeof d === 'string' && d in DECKS,
    )
    if (decks.length === 0) return refuse('اختاروا مجموعة كلمات وحدة على الأقل')
    return { seconds, turns, decks }
  },

  start(ctx, options) {
    const order = shuffle(ctx.ids)
    const teams: [string[], string[]] = [order.filter((_, i) => i % 2 === 0), order.filter((_, i) => i % 2 === 1)]
    const base: State = {
      options,
      teams,
      next: [0, 0],
      scores: [0, 0],
      turn: 1,
      team: 0,
      actor: '',
      phase: 'ready',
      pile: [],
      word: '',
      plays: [],
      endsAt: null,
    }
    return ready(base, 0, 1)
  },

  act(s, ctx, me, raw) {
    const a = actionOf(raw)
    const isHost = me === ctx.hostId
    const lead = me === s.actor || isHost
    switch (a.type) {
      case 'begin':
        if (s.phase !== 'ready' || !lead) return refuse('الممثل يبدأ الدور')
        return { ...s, ...draw(s), phase: 'playing', plays: [], endsAt: ctx.now + s.options.seconds * 1000 }
      case 'mark': {
        if (s.phase !== 'playing' || me !== s.actor) return refuse('بس الممثل يحسب')
        const got = a.got === true
        const scores: [number, number] = [...s.scores]
        if (got) scores[s.team] += 1
        return { ...s, ...draw(s), scores, plays: [...s.plays, { word: s.word, got }] }
      }
      case 'next':
        if (s.phase !== 'summary' || !lead) return refuse('انتظروا الممثل')
        if (s.team === 0) return ready(s, 1, s.turn)
        if (s.turn < s.options.turns) return ready(s, 0, s.turn + 1)
        return { ...s, phase: 'final' }
      case 'restart':
        if (s.phase !== 'final' || !isHost) return refuse('بس صاحب الغرفة يبدأ من جديد')
        return charades.start(ctx, s.options)
      default:
        return refuse('حركة مو معروفة')
    }
  },

  // Nothing waits on a crowd here: the actor drives, the clock ends the turn.
  settle: (s) => s,

  wakeAt: (s) => (s.phase === 'playing' ? s.endsAt : null),
  wake: (s, ctx) => (s.phase === 'playing' && s.endsAt !== null && ctx.now >= s.endsAt ? { ...s, phase: 'summary', endsAt: null } : s),

  view(s, ctx, me) {
    const yourTeam = teamOf(s, me)
    const isActor = me === s.actor
    // The actor needs the word; the other team watches it squirm. The guessers never get it.
    const seesWord = s.phase === 'playing' && (isActor || yourTeam !== s.team)
    const view: CharadesView = {
      game: 'charades',
      phase: s.phase,
      turn: s.turn,
      turns: s.options.turns,
      seconds: s.options.seconds,
      team: s.team,
      yourTeam,
      teams: s.teams.map((ids, i) => ({
        name: TEAM_NAMES[i] ?? '',
        members: ids.map((id) => nameOf(ctx, id)),
        score: s.scores[i] ?? 0,
      })),
      actor: nameOf(ctx, s.actor),
      isActor,
      word: seesWord ? s.word : null,
      endsAt: s.endsAt,
      got: s.plays.filter((p) => p.got).length,
      plays: s.phase === 'summary' || isActor ? s.plays : [],
    }
    const yourTurn = s.phase === 'ready' && isActor ? 'دورك تمثّل! خذ الموبايل وقوم' : null
    return { view, yourTurn }
  },
}
