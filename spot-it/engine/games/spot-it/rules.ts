import type { SpotMode } from '../../../shared/protocol'
import { shuffle } from '../../../shared/random'
import { CARDS, symbolsOf } from './deck'

// The five mini-games over one table. Every pile keeps its top card last.

/** How long the deal stays face down before the first race. */
export const COUNTDOWN_MS = 3000
/** The hot potato's pause between deals: who lost, then the next deal face down (4 · 3 · 2 · 1). */
export const NEXT_DEAL_MS = 4000
/** A card that lands face down turns up this long after: time for the catch to play and every phone to have it. */
export const REVEAL_MS = 700
/**
 * A first catch waits this long for others that were tapped earlier but
 * travelled further: the earliest tap wins, not the nearest phone.
 */
export const WINDOW_MS = 250
/** A wrong tap freezes the player: no point in tapping everything. */
export const FREEZE_MS = 2000
export const DEALS = 5

export interface Claim {
  by: string
  symbol: number
  target: string | null
  /** The cards the player was looking at: a claim on cards since changed is late, not wrong. */
  seen: number[]
  /** When it was tapped (host epoch ms), clamped to when its cards showed and when it arrived. */
  at: number
  /** Arrival order, to break a tie. */
  seq: number
}

export interface State {
  mode: SpotMode
  seed: number
  ids: string[]
  phase: 'countdown' | 'play' | 'over'
  until: number
  /** Face down, the next draw last. */
  deck: number[]
  center: number | null
  centerAt: number
  piles: Record<string, number[]>
  topAt: Record<string, number>
  grid: number[]
  gridAt: number[]
  /** The triplet's cards collected; the hot potato's cards lost. */
  score: Record<string, number>
  frozen: Record<string, number>
  queue: Claim[]
  closeAt: number | null
  seq: number
  last: { n: number; by: string; symbol: number; to: string | null } | null
  deal: number
  dealLoser: { id: string; cards: number } | null
}

export const ALL_CARDS: readonly number[] = CARDS.map((_, i) => i)

export const top = (s: State, id: string): number | null => s.piles[id]?.at(-1) ?? null

/** The next card off a deck the caller knows holds enough: 57 cards, eight players at most. */
function draw(deck: number[]): number {
  const card = deck.pop()
  if (card === undefined) throw new Error('draw() from an empty deck')
  return card
}

/** The pair modes match one symbol across two cards; the triplet across three of the grid. */
export const pairs = (mode: SpotMode) => mode !== 'triplet'

/** The mini-games where the fewest cards win. */
export const lowWins = (mode: SpotMode) => mode === 'well' || mode === 'potato' || mode === 'gift'

/** The two cards a claim matches across, with when each showed; null when the claim has none. */
export function involved(s: State, by: string, target: string | null): { cards: number[]; at: number } | null {
  const mine = top(s, by)
  const theirs = target !== null && target !== by && s.ids.includes(target) ? top(s, target) : null
  const pair = (a: number | null, aAt: number, b: number | null, bAt: number) =>
    a === null || b === null ? null : { cards: [a, b], at: Math.max(aAt, bAt) }
  switch (s.mode) {
    case 'tower':
    case 'well':
      return pair(s.center, s.centerAt, mine, s.topAt[by] ?? 0)
    case 'gift':
      return pair(s.center, s.centerAt, theirs, target ? (s.topAt[target] ?? 0) : 0)
    case 'potato':
      return pair(mine, s.topAt[by] ?? 0, theirs, target ? (s.topAt[target] ?? 0) : 0)
    case 'triplet':
      return { cards: [...s.grid], at: 0 }
  }
}

/** The face-up grid cards carrying `symbol`, in place order. */
export const carrying = (s: State, symbol: number): number[] =>
  s.grid.flatMap((card, i) => (symbolsOf(card).includes(symbol) ? [i] : []))

/** Whether `symbol` makes the catch on these cards. */
export function holds(s: State, cards: readonly number[], symbol: number): boolean {
  if (pairs(s.mode)) return cards.every((c) => symbolsOf(c).includes(symbol))
  return carrying(s, symbol).length >= 3
}

/** Some symbol shows on three of the grid's cards. */
export function hasSet(grid: readonly number[]): boolean {
  const seen = new Map<number, number>()
  for (const card of grid) {
    for (const sym of symbolsOf(card)) {
      const n = (seen.get(sym) ?? 0) + 1
      if (n >= 3) return true
      seen.set(sym, n)
    }
  }
  return false
}

/** The triplet's grid grows by three until a set shows; with none left to deal, the game is over. */
export function ensureSet(s: State, at: number): State {
  const grid = [...s.grid]
  const gridAt = [...s.gridAt]
  const deck = [...s.deck]
  while (!hasSet(grid) && deck.length > 0) {
    for (const card of deck.splice(-3, 3)) {
      grid.push(card)
      gridAt.push(at)
    }
  }
  return { ...s, grid, gridAt, deck, phase: hasSet(grid) ? s.phase : 'over' }
}

/** A fresh hot-potato deal: the whole deck shuffled, one card each, face down until `go`. */
export function newDeal(s: State, go: number): State {
  const deck = shuffle(ALL_CARDS)
  const piles: Record<string, number[]> = {}
  const topAt: Record<string, number> = {}
  for (const id of s.ids) {
    piles[id] = [draw(deck)]
    topAt[id] = go
  }
  return { ...s, deck: [], piles, topAt, phase: 'countdown', until: go, deal: s.deal + 1, frozen: {} }
}

/** The deal set out for a mini-game, face down until `go`. */
export function deal(s: State, go: number): State {
  const deck = [...s.deck]
  const piles: Record<string, number[]> = {}
  const topAt: Record<string, number> = {}
  switch (s.mode) {
    case 'tower':
    case 'gift':
      for (const id of s.ids) {
        piles[id] = [draw(deck)]
        topAt[id] = go
      }
      return { ...s, deck, piles, topAt, center: draw(deck), centerAt: go }
    case 'well': {
      const center = deck.pop() ?? null
      s.ids.forEach((id) => {
        piles[id] = []
        topAt[id] = go
      })
      deck.forEach((card, i) => {
        const id = s.ids[i % s.ids.length]
        if (id !== undefined) piles[id]?.push(card)
      })
      return { ...s, deck: [], piles, topAt, center, centerAt: go }
    }
    case 'potato':
      return newDeal(s, go)
    case 'triplet': {
      const grid = deck.splice(-9, 9)
      return ensureSet({ ...s, deck, grid, gridAt: grid.map(() => go) }, go)
    }
  }
}

/** A catch that stood: the cards move. */
export function apply(s: State, c: Claim, now: number): State {
  const show = now + REVEAL_MS
  const { center } = s
  // `involved` vouched for these: a pair mode's catch has its middle card, a hand-over its target.
  const to = c.target ?? c.by
  const last = { n: (s.last?.n ?? 0) + 1, by: c.by, symbol: c.symbol, to: s.mode === 'gift' || s.mode === 'potato' ? c.target : null }
  const piles = { ...s.piles }
  const t: State = { ...s, piles, last }
  switch (s.mode) {
    case 'tower': {
      // The middle card onto your tower, and the next one drawn.
      if (center === null) return s
      piles[c.by] = [...(piles[c.by] ?? []), center]
      const next = s.deck.at(-1) ?? null
      return { ...t, deck: s.deck.slice(0, -1), center: next, centerAt: show, topAt: { ...s.topAt, [c.by]: s.centerAt }, phase: next === null ? 'over' : s.phase }
    }
    case 'well': {
      // Your card into the well; your next one turns up.
      const pile = piles[c.by] ?? []
      piles[c.by] = pile.slice(0, -1)
      return { ...t, center: pile.at(-1) ?? null, centerAt: show, topAt: { ...s.topAt, [c.by]: show }, phase: pile.length <= 1 ? 'over' : s.phase }
    }
    case 'gift': {
      // The middle card onto their pile, and the next one drawn.
      if (center === null) return s
      piles[to] = [...(piles[to] ?? []), center]
      const next = s.deck.at(-1) ?? null
      return { ...t, deck: s.deck.slice(0, -1), center: next, centerAt: show, topAt: { ...s.topAt, [to]: s.centerAt }, phase: next === null ? 'over' : s.phase }
    }
    case 'potato': {
      // Everything you hold onto theirs: your top card is now theirs.
      piles[to] = [...(piles[to] ?? []), ...(piles[c.by] ?? [])]
      piles[c.by] = []
      const next = { ...t, topAt: { ...s.topAt, [to]: s.topAt[c.by] ?? now } }
      const holders = s.ids.filter((id) => (piles[id]?.length ?? 0) > 0)
      const [loser] = holders
      if (holders.length !== 1 || loser === undefined) return next
      // One player holds the lot: they lose the deal and keep its cards.
      const cards = piles[loser]?.length ?? 0
      const lost = { ...next, score: { ...s.score, [loser]: (s.score[loser] ?? 0) + cards }, dealLoser: { id: loser, cards } }
      return s.deal >= DEALS ? { ...lost, phase: 'over' } : newDeal(lost, now + NEXT_DEAL_MS)
    }
    case 'triplet': {
      // Three cards with the symbol to you; the gaps refilled from the deck.
      const taken = new Set(carrying(s, c.symbol).slice(0, 3))
      const deck = [...s.deck]
      const grid: number[] = []
      const gridAt: number[] = []
      s.grid.forEach((card, i) => {
        if (!taken.has(i)) {
          grid.push(card)
          gridAt.push(s.gridAt[i] ?? 0)
          return
        }
        const next = deck.pop()
        if (next === undefined) return
        grid.push(next)
        gridAt.push(show)
      })
      const score = { ...s.score, [c.by]: (s.score[c.by] ?? 0) + taken.size }
      return ensureSet({ ...t, deck, grid, gridAt, score }, show)
    }
  }
}

/** The mini-game's own count for a player: tower height, cards left, cards lost, gifts held, sets' cards. */
export function countOf(s: State, id: string): number {
  switch (s.mode) {
    case 'tower':
    case 'well':
    case 'gift':
      return s.piles[id]?.length ?? 0
    case 'potato':
    case 'triplet':
      return s.score[id] ?? 0
  }
}

/** The cards a player holds right now. */
export function heldBy(s: State, id: string): number {
  return s.mode === 'triplet' ? (s.score[id] ?? 0) : (s.piles[id]?.length ?? 0)
}
