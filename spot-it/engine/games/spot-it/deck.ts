// The deck: the lines of the projective plane of order 7. A plane of prime
// order n has n² + n + 1 points and as many lines, n + 1 points on every
// line, and any two lines meet in exactly one point. Points are symbols and
// lines are cards, so 57 cards of 8 symbols where any two cards share
// exactly one symbol — the box's 55 and the two it leaves out.
//
// Points: (x, y) for x, y in 0..6 is x·7 + y (0–48); the slope m's point at
// infinity is 49 + m (49–55); the vertical's is 56.

const N = 7

function plane(): number[][] {
  const cards: number[][] = []
  // y = m·x + b, and the point at infinity of its slope m.
  for (let m = 0; m < N; m++) {
    for (let b = 0; b < N; b++) {
      const card: number[] = []
      for (let x = 0; x < N; x++) card.push(x * N + ((m * x + b) % N))
      card.push(N * N + m)
      cards.push(card)
    }
  }
  // x = c, and the verticals' point at infinity.
  for (let c = 0; c < N; c++) {
    const card: number[] = []
    for (let y = 0; y < N; y++) card.push(c * N + y)
    card.push(N * N + N)
    cards.push(card)
  }
  // The line at infinity.
  cards.push(Array.from({ length: N + 1 }, (_, i) => N * N + i))
  return cards
}

/** Card id → its 8 symbols (indices into shared/data/spot-symbols.ts). */
export const CARDS: readonly (readonly number[])[] = plane()

export const SYMBOLS_PER_CARD = N + 1

export const symbolsOf = (card: number): readonly number[] => CARDS[card] ?? []

/** The one symbol two different cards share. */
export function common(a: number, b: number): number | null {
  const other = symbolsOf(b)
  return symbolsOf(a).find((s) => other.includes(s)) ?? null
}
