import type { SpotCard } from '@shared/protocol'

// Where a card's eight symbols sit: one in the middle, seven round it, each
// its own size and turn, as on the printed cards: sizes differ, so the eye
// cannot just match outlines. Seeded by the round and the card, so a card
// looks the same on every phone and every redraw, and a new round deals
// new-looking cards.

export interface Placed {
  symbol: number
  /** The centre, in % of the card from its start and top edges. */
  x: number
  y: number
  /** The glyph's size, in % of the card's width. */
  size: number
  /** The hit area's side, in % of the card's width. */
  hit: number
  turn: number
}

/** mulberry32: a small, good-enough seeded generator. */
function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const RING = 7
const RING_RADIUS = 31

export function layoutOf(card: SpotCard, seed: number): Placed[] {
  const next = rng(seed ^ Math.imul(card.id + 1, 0x9e3779b1))
  const between = (lo: number, hi: number) => lo + next() * (hi - lo)
  // Which symbol takes the middle, and the ring's order.
  const order = card.symbols
    .map((symbol) => ({ symbol, key: next() }))
    .sort((a, b) => a.key - b.key)
    .map((o) => o.symbol)
  const spin = next() * 360
  return order.map((symbol, i) => {
    if (i === 0) {
      return { symbol, x: 50 + between(-3, 3), y: 50 + between(-3, 3), size: between(17, 25), hit: 28, turn: between(-70, 70) }
    }
    const angle = ((spin + ((i - 1) * 360) / RING + between(-8, 8)) * Math.PI) / 180
    const r = RING_RADIUS + between(-2, 2)
    return {
      symbol,
      x: 50 + r * Math.cos(angle),
      y: 50 + r * Math.sin(angle),
      size: between(12, 21),
      hit: 24,
      turn: between(-80, 80),
    }
  })
}
