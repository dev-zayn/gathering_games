import type { SpotCard, SpotMode, SpotOptions, SpotView } from '../../../shared/protocol'
import { shuffle } from '../../../shared/random'
import { actionOf, nameOf, refuse, type Ctx, type Engine } from '../../engine'
import { symbolsOf } from './deck'
import {
  ALL_CARDS,
  COUNTDOWN_MS,
  DEALS,
  FREEZE_MS,
  WINDOW_MS,
  apply,
  carrying,
  countOf,
  deal,
  heldBy,
  holds,
  involved,
  lowWins,
  pairs,
  top,
  type Claim,
  type State,
} from './rules'

// لگطها, run on the host's phone. A tap is a claim: a wrong one freezes the
// player at once; a right one waits a beat (WINDOW_MS) for any claim tapped
// earlier on a phone further away, then the earliest stands and the later
// ones on the same cards are late. Every card turns face up at a time of
// the host's clock, on every phone at once.

const MODES: readonly SpotMode[] = ['tower', 'well', 'potato', 'gift', 'triplet']

const sameCards = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((x, i) => x === b[i])

/** The claims that waited out their window, earliest tap first; each checked again, as the one before may have moved its cards. */
function resolve(s: State, now: number): State {
  const order = [...s.queue].sort((a, b) => a.at - b.at || a.seq - b.seq)
  let t: State = { ...s, queue: [], closeAt: null }
  for (const c of order) {
    if (t.phase !== 'play') break
    const cards = involved(t, c.by, c.target)
    if (!cards || (pairs(t.mode) && !sameCards(cards.cards, c.seen)) || !holds(t, cards.cards, c.symbol)) continue
    t = apply(t, c, now)
  }
  return t
}

/** The clock's part: the countdown's end, a window closing. */
function advance(s: State, now: number): State {
  let t = s
  if (t.phase === 'countdown' && now >= t.until) t = { ...t, phase: 'play' }
  if (t.closeAt !== null && now >= t.closeAt) t = resolve(t, now)
  return t
}

function claim(s: State, ctx: Ctx, me: string, raw: Record<string, unknown>): State | { error: string } {
  if (s.phase === 'countdown') return refuse('استنى العد…')
  if (s.phase === 'over') return refuse('خلصت اللعبة')
  if ((s.frozen[me] ?? 0) > ctx.now) return refuse('مجمّد ❄️ ثانية وترجع')
  // One claim a player a window: the first tap counts.
  if (s.queue.some((c) => c.by === me)) return s
  const symbol = raw.symbol
  const target = typeof raw.target === 'string' ? raw.target : null
  const seen = Array.isArray(raw.seen) ? raw.seen.filter((x): x is number => Number.isInteger(x)) : []
  if (typeof symbol !== 'number' || !Number.isInteger(symbol)) return refuse('حركة مو صحيحة')
  if (s.mode === 'potato' && top(s, me) === null) return refuse('ما عندك ورق هالجولة')
  const cards = involved(s, me, target)
  if (!cards) return refuse('سبقوك عليها')

  const right = holds(s, cards.cards, symbol)
  // A claim on cards that changed since the tap is late, not wrong.
  const fresh = sameCards(cards.cards, seen)
  if (!right) return fresh ? { ...s, frozen: { ...s.frozen, [me]: ctx.now + FREEZE_MS } } : refuse('سبقوك عليها')
  if (pairs(s.mode) && !fresh) return refuse('سبقوك عليها')

  // Tapped no earlier than its cards showed, no later than it arrived.
  const shown = pairs(s.mode) ? cards.at : Math.max(0, ...carrying(s, symbol).slice(0, 3).map((i) => s.gridAt[i] ?? 0))
  const tapped = typeof raw.at === 'number' && Number.isFinite(raw.at) ? raw.at : ctx.now
  const at = Math.min(Math.max(tapped, shown), ctx.now)
  const c: Claim = { by: me, symbol, target, seen, at, seq: s.seq + 1 }
  return { ...s, seq: c.seq, queue: [...s.queue, c], closeAt: s.closeAt ?? ctx.now + WINDOW_MS }
}

function standings(s: State, ctx: Ctx, me: string) {
  const sign = lowWins(s.mode) ? 1 : -1
  return s.ids
    .map((id) => ({ name: nameOf(ctx, id), count: countOf(s, id), you: id === me }))
    .sort((a, b) => sign * (a.count - b.count))
}

function winners(s: State, ctx: Ctx): string[] {
  if (s.phase !== 'over') return []
  const counts = s.ids.map((id) => countOf(s, id))
  const best = lowWins(s.mode) ? Math.min(...counts) : Math.max(...counts)
  return s.ids.filter((id) => countOf(s, id) === best).map((id) => nameOf(ctx, id))
}

const face = (card: number | null, at: number): SpotCard | null => (card === null ? null : { id: card, symbols: [...symbolsOf(card)], at })

export const spotIt: Engine<State, SpotOptions> = {
  id: 'spot-it',

  // Highest best for گعدة: where the fewest cards win, a score is the count below zero.
  scores: (s) => s.ids.map((id) => ({ player: id, score: lowWins(s.mode) ? -countOf(s, id) : countOf(s, id) })),

  options(raw) {
    const mode = typeof raw === 'object' && raw !== null ? (raw as { mode?: unknown }).mode : undefined
    return MODES.includes(mode as SpotMode) ? { mode: mode as SpotMode } : refuse('اختار لعبة من الخمسة')
  },

  start(ctx, { mode }) {
    const go = ctx.now + COUNTDOWN_MS
    const blank: State = {
      mode,
      seed: Math.floor(Math.random() * 2 ** 31),
      ids: [...ctx.ids],
      phase: 'countdown',
      until: go,
      deck: shuffle(ALL_CARDS),
      center: null,
      centerAt: go,
      piles: {},
      topAt: {},
      grid: [],
      gridAt: [],
      score: {},
      frozen: {},
      queue: [],
      closeAt: null,
      seq: 0,
      last: null,
      deal: 0,
      dealLoser: null,
    }
    const dealt = deal(blank, go)
    // A triplet with no set in the whole deck is over before it begins; it shows the deal anyway.
    return { ...dealt, phase: dealt.phase === 'over' ? 'over' : 'countdown' }
  },

  act(s, ctx, me, raw) {
    const a = actionOf(raw)
    if (!s.ids.includes(me)) return refuse('إنت تتفرج هالجولة')
    if (a.type !== 'spot') return refuse('حركة مو معروفة')
    return claim(s, ctx, me, a)
  },

  settle: (s, ctx) => advance(s, ctx.now),

  wakeAt(s) {
    if (s.phase === 'over') return null
    const times = [s.phase === 'countdown' ? s.until : null, s.closeAt].filter((t): t is number => t !== null)
    return times.length > 0 ? Math.min(...times) : null
  },

  wake: (s, ctx) => advance(s, ctx.now),

  view(s, ctx, me) {
    const others = s.ids.filter((id) => id !== me)
    const facing = s.mode === 'potato' || s.mode === 'gift'
    const last = s.last
    const view: SpotView = {
      game: 'spot-it',
      mode: s.mode,
      phase: s.phase,
      until: s.until,
      seed: s.seed,
      dealt: s.ids.includes(me),
      center: s.mode === 'potato' || s.mode === 'triplet' ? null : face(s.center, s.centerAt),
      mine: s.mode === 'gift' || s.mode === 'triplet' ? null : face(top(s, me), s.topAt[me] ?? 0),
      count: heldBy(s, me),
      seats: others.map((id) => ({
        id,
        name: nameOf(ctx, id),
        count: heldBy(s, id),
        top: facing ? face(top(s, id), s.topAt[id] ?? 0) : null,
        frozenUntil: s.frozen[id] ?? 0,
        connected: ctx.connected.has(id),
      })),
      grid: s.grid.map((card, i) => ({ id: card, symbols: [...symbolsOf(card)], at: s.gridAt[i] ?? 0 })),
      deck: s.deck.length,
      frozenUntil: s.frozen[me] ?? 0,
      last: last && {
        n: last.n,
        by: nameOf(ctx, last.by),
        you: last.by === me,
        symbol: last.symbol,
        to: last.to === null ? null : nameOf(ctx, last.to),
        toYou: last.to === me,
      },
      deal: s.deal,
      deals: s.mode === 'potato' ? DEALS : 0,
      dealLoser: s.dealLoser && { name: nameOf(ctx, s.dealLoser.id), you: s.dealLoser.id === me, cards: s.dealLoser.cards },
      standings: standings(s, ctx, me),
      lowWins: lowWins(s.mode),
      winners: winners(s, ctx),
    }
    return { view, yourTurn: null }
  },
}
