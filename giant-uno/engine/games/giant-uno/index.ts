import { HOUSE_RULES, cardOf, handPoints, signed } from '../../../shared/data/deck'
import { UNO_TARGETS, type UnoOptions, type UnoView } from '../../../shared/protocol'
import { actionOf, nameOf, refuse, type Ctx, type Engine, type Score } from '../../engine'
import { answer, callColor, catchOut, draw, pass, play, sayOne, timeOut } from './moves'
import { AWAY_MS, current, deal, firstDealer, fits, nextHand, topOf, type State } from './rules'
import { lineFor } from './words'

// بقت وحدة!, run on the host's phone: the box's rules (rules.ts, moves.ts),
// each phone sent its own hand and nobody else's. With a target, hand after
// hand is dealt in the one round until a total reaches it.

const clone = (s: State): State => structuredClone(s)

const live = (s: State) => s.phase === 'play' || s.phase === 'color' || s.phase === 'challenge'

function scores(s: State): Score[] {
  const { target, scoring } = s.options
  if (target > 0) return s.ids.map((id) => ({ player: id, score: scoring === 'low' ? -(s.totals[id] ?? 0) : (s.totals[id] ?? 0) }))
  // One hand: whoever went out scores what the others hold; the others rank by what they were left with.
  return s.ids.map((id) => {
    if (scoring === 'winner' && s.result?.winner === id) return { player: id, score: s.result.points }
    return { player: id, score: -handPoints((s.result ? s.result.held[id] : s.hands[id]) ?? []) }
  })
}

function winners(s: State, ctx: Ctx): string[] {
  if (s.phase !== 'over') return []
  const rows = scores(s)
  const best = Math.max(...rows.map((r) => r.score))
  return rows.filter((r) => r.score === best).map((r) => nameOf(ctx, r.player))
}

/** The turn alert's words: the same for a whole turn, so drawing a card does not ring it again. */
function prompt(s: State, me: string): string | null {
  if (current(s) !== me) return null
  switch (s.phase) {
    case 'play':
      return 'دورك! العب ورقة لو اسحب'
    case 'color':
      return 'اختار لون الورقة الأولى'
    case 'challenge':
      return `${signed(4)} عليك! تسحب لو تتحدّى؟`
    default:
      return null
  }
}

export const giantUno: Engine<State, UnoOptions> = {
  id: 'giant-uno',

  scores,

  options(raw) {
    const o = (typeof raw === 'object' && raw !== null ? raw : {}) as Partial<Record<keyof UnoOptions, unknown>>
    const target = UNO_TARGETS.find((t) => t === o.target)
    const scoring = o.scoring === 'winner' || o.scoring === 'low' ? o.scoring : null
    const house = typeof o.house === 'string' && o.house in HOUSE_RULES ? (o.house as UnoOptions['house']) : null
    if (target === undefined || !scoring || !house) return refuse('إعدادات اللعبة مو صحيحة')
    return { target, scoring, house }
  },

  start(ctx, options) {
    const s: State = {
      options,
      ids: [...ctx.ids],
      hands: {},
      pile: [],
      discard: [],
      color: 'red',
      turn: 0,
      dir: 1,
      phase: 'play',
      until: 0,
      drawn: null,
      pending: null,
      called: {},
      exposed: null,
      shown: null,
      log: [],
      n: 0,
      dealer: firstDealer(ctx.ids.length),
      handNo: 0,
      totals: Object.fromEntries(ctx.ids.map((id) => [id, 0])),
      result: null,
    }
    deal(s, ctx.now)
    return s
  },

  act(s, ctx, me, raw) {
    if (!s.ids.includes(me)) return refuse('دخلت بعد التوزيع: تفرّج هاليد')
    const a = actionOf(raw)
    const t = clone(s)
    switch (a.type) {
      case 'play':
        return play(t, me, a, ctx.now)
      case 'draw':
        return draw(t, me, ctx.now)
      case 'pass':
        return pass(t, me, ctx.now)
      case 'color':
        return callColor(t, me, a.color, ctx.now)
      case 'call':
        return sayOne(t, me)
      case 'catch':
        return catchOut(t, me, a.who)
      case 'accept':
        return answer(t, me, false, ctx.now)
      case 'challenge':
        return answer(t, me, true, ctx.now)
      case 'next':
        // The host deals the next hand before its countdown runs out.
        if (me !== ctx.hostId) return refuse('بس صاحب الغرفة يوزّع')
        if (t.phase !== 'between') return s
        nextHand(t, ctx.now)
        return t
      default:
        return refuse('حركة مو معروفة')
    }
  },

  settle(s, ctx) {
    // A player whose phone is gone gets a few seconds, not the whole turn.
    if (live(s) && !ctx.connected.has(current(s)) && s.until > ctx.now + AWAY_MS) return { ...s, until: ctx.now + AWAY_MS }
    return s
  },

  wakeAt: (s) => (s.phase === 'over' ? null : s.until),

  wake(s, ctx) {
    if (s.phase === 'over' || ctx.now < s.until) return s
    const t = clone(s)
    if (t.phase === 'between') nextHand(t, ctx.now)
    else timeOut(t, ctx.now)
    return t
  },

  view(s, ctx, me) {
    const name = (id: string) => nameOf(ctx, id)
    const who = current(s)
    const hand = s.hands[me] ?? []
    const top = topOf(s)
    const yours = s.phase === 'play' && who === me
    const drawn = yours ? s.drawn : null
    const playable = !yours ? [] : drawn !== null ? [drawn] : hand.filter((id) => fits(cardOf(id), top, s.color))
    const dealt = s.ids.includes(me)
    const result = s.result
    const view: UnoView = {
      game: 'giant-uno',
      options: s.options,
      phase: s.phase,
      dealt,
      hand: hand.map(cardOf),
      playable,
      drawn,
      top,
      color: s.color,
      pile: s.pile.length,
      seats: s.ids.map((id) => {
        const count = (s.hands[id] ?? []).length
        return {
          id,
          name: name(id),
          count,
          connected: ctx.connected.has(id),
          you: id === me,
          called: !!s.called[id] && count === 1,
          exposed: s.exposed === id,
          total: s.totals[id] ?? 0,
        }
      }),
      turn: who,
      dir: s.dir,
      until: s.until,
      challenge: s.phase === 'challenge' && who === me && s.pending ? { by: name(s.pending.by), over: s.pending.over } : null,
      shown: s.shown?.to === me ? { name: name(s.shown.of), cards: s.shown.cards.map(cardOf) } : null,
      canCall: dealt && live(s) && hand.length > 0 && hand.length <= 2 && !s.called[me],
      log: s.log.map((e) => lineFor(e, me, name)),
      handNo: s.handNo,
      result: result && {
        winner: name(result.winner),
        you: result.winner === me,
        points: result.points,
        rows: s.ids.map((id) => {
          const held = result.held[id] ?? []
          return { id, name: name(id), you: id === me, cards: held.map(cardOf), points: handPoints(held), total: s.totals[id] ?? 0 }
        }),
      },
      winners: winners(s, ctx),
    }
    return { view, yourTurn: prompt(s, me) }
  },
}
