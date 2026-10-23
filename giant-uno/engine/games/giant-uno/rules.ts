import { ALL_CARDS, COLORS, cardOf, handPoints } from '../../../shared/data/deck'
import type { UnoCard, UnoColor, UnoOptions } from '../../../shared/protocol'
import { shuffle } from '../../../shared/random'

// The box's rules as plain data, run on the host's phone. A hand is dealt,
// played out and scored; with a target, the next one follows until a total
// reaches it. Every move clones the state and changes the clone.

export const HAND_SIZE = 7
/** A turn passes on its own after this long: the player draws one and keeps it. */
export const TURN_MS = 30_000
/** After drawing: play the card drawn or pass. */
export const DRAWN_MS = 12_000
export const COLOR_MS = 15_000
/** Facing a Wild Draw Four: draw four, or challenge. Silence draws. */
export const CHALLENGE_MS = 15_000
/** A player whose phone is gone gets this long, not the whole turn. */
export const AWAY_MS = 5_000
export const BETWEEN_MS = 15_000
const LOG_SIZE = 4

export type Phase = 'color' | 'play' | 'challenge' | 'between' | 'over'

export type Why = 'turn' | 'draw2' | 'wild4' | 'caught' | 'challenge' | 'hunt' | 'timeout'

/** What happened, kept as data and worded per phone (words.ts). */
export type Event = { n: number } & (
  | { k: 'deal'; dealer: string; hand: number }
  | { k: 'play'; by: string; card: number; color: UnoColor | null }
  | { k: 'color'; by: string; color: UnoColor }
  | { k: 'draw'; by: string; count: number; why: Why }
  | { k: 'skip'; who: string }
  | { k: 'reverse' }
  | { k: 'pass'; by: string }
  | { k: 'call'; by: string }
  | { k: 'caught'; by: string; who: string }
  | { k: 'challenge'; by: string; of: string; won: boolean }
  | { k: 'swap'; by: string; with: string }
  | { k: 'dump'; by: string; count: number; color: UnoColor }
  | { k: 'again'; by: string }
  | { k: 'timeout'; who: string }
  | { k: 'out'; by: string; points: number }
)

type Said = Event extends infer E ? (E extends { n: number } ? Omit<E, 'n'> : never) : never

export interface State {
  options: UnoOptions
  /** Seat order, fixed for the round; play runs down it when `dir` is 1. */
  ids: string[]
  hands: Record<string, number[]>
  /** Face down, the top is the last. */
  pile: number[]
  /** Face up, the top is the last. */
  discard: number[]
  color: UnoColor
  turn: number
  dir: 1 | -1
  phase: Phase
  until: number
  /** The card the player to move drew this turn: only it may be played. */
  drawn: number | null
  /** A Wild Draw Four waiting on its victim (the player to move): who played it, the colour it was played on, and whether they held none of it. */
  pending: { by: string; over: UnoColor; fair: boolean } | null
  /** Said «وحدة!» while down to two cards or one. A draw takes it back. */
  called: Record<string, boolean>
  /** Down to one card without the call: catchable until the next move. */
  exposed: string | null
  /** A challenger's look at the hand they challenged, until the next move. */
  shown: { to: string; of: string; cards: number[] } | null
  log: Event[]
  n: number
  dealer: number
  handNo: number
  /** Points so far, across hands. */
  totals: Record<string, number>
  /** The hand just played: who went out (null: the host ended it), what each held. */
  result: { winner: string; points: number; held: Record<string, number[]> } | null
}

export const current = (s: State): string => s.ids[s.turn] ?? ''

export const seatAfter = (s: State, from: number, steps = 1): number => {
  const n = s.ids.length
  return (((from + s.dir * steps) % n) + n) % n
}

export const topOf = (s: State): UnoCard | null => {
  const id = s.discard.at(-1)
  return id === undefined ? null : cardOf(id)
}

/** Whether a card may go down on the pile: the colour to follow, the same number, the same symbol, or any wild. */
export function fits(card: UnoCard, top: UnoCard | null, color: UnoColor): boolean {
  if (card.color === null || !top) return true
  if (card.color === color) return true
  // A wild on top is followed by its called colour only.
  if (top.color === null) return false
  if (card.kind === 'number') return top.kind === 'number' && top.value === card.value
  return card.kind === top.kind
}

export const holdsColor = (hand: readonly number[], color: UnoColor): boolean => hand.some((id) => cardOf(id).color === color)

export function say(s: State, e: Said): void {
  s.n += 1
  s.log = [{ ...e, n: s.n }, ...s.log].slice(0, LOG_SIZE)
}

/** Turns the discards under the top card into a fresh draw pile. */
function refill(s: State): void {
  const top = s.discard.at(-1)
  if (s.pile.length > 0 || top === undefined || s.discard.length < 2) return
  s.pile = shuffle(s.discard.slice(0, -1))
  s.discard = [top]
}

/** Draws up to `count` cards into a hand; fewer when none are left anywhere. */
export function drawInto(s: State, id: string, count: number): number[] {
  const got: number[] = []
  for (let i = 0; i < count; i++) {
    refill(s)
    const card = s.pile.pop()
    if (card === undefined) break
    got.push(card)
  }
  const hand = [...(s.hands[id] ?? []), ...got]
  s.hands[id] = hand
  // A bigger hand has to say it again on the way back down.
  if (hand.length > 1) s.called[id] = false
  if (s.exposed === id && hand.length > 1) s.exposed = null
  return got
}

/** Draws until a card of the colour turns up (the house rule «دوّر على اللون»). */
export function drawUntil(s: State, id: string, color: UnoColor): number {
  let count = 0
  for (;;) {
    const [card] = drawInto(s, id, 1)
    if (card === undefined) return count
    count += 1
    if (cardOf(card).color === color) return count
  }
}

/** The move passes to `seat`, a fresh turn. */
export function turnTo(s: State, seat: number, now: number): void {
  s.turn = seat
  s.phase = 'play'
  s.drawn = null
  s.until = now + TURN_MS
}

/** The colour most of a hand is in: a timed-out or absent player's call. */
export function likelyColor(hand: readonly number[]): UnoColor {
  const counts = COLORS.map((c) => hand.filter((id) => cardOf(id).color === c).length)
  const best = Math.max(...counts)
  return COLORS[counts.indexOf(best)] ?? 'red'
}

/** Deals a hand: the whole deck shuffled, seven each, one card turned up and acted on. */
export function deal(s: State, now: number): void {
  s.handNo += 1
  s.pile = shuffle(ALL_CARDS)
  s.discard = []
  s.hands = Object.fromEntries(s.ids.map((id) => [id, [] as number[]]))
  s.called = {}
  s.exposed = null
  s.shown = null
  s.pending = null
  s.drawn = null
  s.result = null
  s.dir = 1
  for (let i = 0; i < HAND_SIZE; i++) {
    for (let k = 1; k <= s.ids.length; k++) {
      const id = s.ids[seatAfter(s, s.dealer, k)] ?? ''
      const card = s.pile.pop()
      if (card !== undefined) s.hands[id]?.push(card)
    }
  }
  say(s, { k: 'deal', dealer: s.ids[s.dealer] ?? '', hand: s.handNo })

  // A Wild Draw Four never opens the pile: back in the deck, and turn up another.
  let first = s.pile.pop()
  while (first !== undefined && cardOf(first).kind === 'wild4') {
    // Never back on top: splice puts it before a card already there.
    s.pile.splice(Math.floor(Math.random() * s.pile.length), 0, first)
    first = s.pile.pop()
  }
  // Ten hands of seven leave 38 cards: there is always one to turn up.
  if (first === undefined) throw new Error('nothing left to turn up')
  s.discard = [first]
  const card = cardOf(first)
  const left = seatAfter(s, s.dealer)
  s.color = card.color ?? 'red'
  switch (card.kind) {
    case 'number':
      turnTo(s, left, now)
      return
    case 'skip':
      say(s, { k: 'skip', who: s.ids[left] ?? '' })
      turnTo(s, seatAfter(s, left), now)
      return
    case 'reverse':
      // The dealer goes first, and play runs the other way.
      s.dir = -1
      say(s, { k: 'reverse' })
      turnTo(s, s.dealer, now)
      return
    case 'draw2':
      drawInto(s, s.ids[left] ?? '', 2)
      say(s, { k: 'draw', by: s.ids[left] ?? '', count: 2, why: 'draw2' })
      turnTo(s, seatAfter(s, left), now)
      return
    default:
      // A wild: the player to the dealer's left calls the colour, then plays.
      s.turn = left
      s.phase = 'color'
      s.drawn = null
      s.until = now + COLOR_MS
  }
}

/** Someone went out: the hand is scored, and the round is over or the next hand waits. */
export function endHand(s: State, winner: string | null, now: number): void {
  const held = Object.fromEntries(s.ids.map((id) => [id, [...(s.hands[id] ?? [])]]))
  const points = s.ids.filter((id) => id !== winner).reduce((sum, id) => sum + handPoints(held[id] ?? []), 0)
  const { target, scoring } = s.options
  if (scoring === 'winner') {
    if (winner) s.totals[winner] = (s.totals[winner] ?? 0) + points
  } else {
    for (const id of s.ids) s.totals[id] = (s.totals[id] ?? 0) + handPoints(held[id] ?? [])
  }
  if (winner) say(s, { k: 'out', by: winner, points })
  s.result = winner ? { winner, points, held } : null
  s.exposed = null
  s.pending = null
  s.drawn = null
  const reached = target > 0 && s.ids.some((id) => (s.totals[id] ?? 0) >= target)
  if (target === 0 || reached || !winner) {
    s.phase = 'over'
    s.until = 0
    return
  }
  s.phase = 'between'
  s.until = now + BETWEEN_MS
}

/** The next hand: the deal moves one seat on. */
export function nextHand(s: State, now: number): void {
  s.dir = 1
  s.dealer = seatAfter(s, s.dealer)
  deal(s, now)
}

/** The first dealer: everyone turns up a card, the highest number deals (a symbol counts 0, the first seat wins a tie). */
export function firstDealer(count: number): number {
  const cards = shuffle(ALL_CARDS).slice(0, count).map((id) => cardOf(id).value ?? 0)
  return cards.indexOf(Math.max(...cards))
}
