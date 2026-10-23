import type { UnoCard, UnoColor, UnoKind } from '@shared/protocol'

// The four colours as token classes (literal, so Tailwind sees them), and a
// hand sorted the way a player holds it.

export const SUIT_BG: Record<UnoColor, string> = {
  red: 'bg-suit-red',
  yellow: 'bg-suit-yellow',
  green: 'bg-suit-green',
  blue: 'bg-suit-blue',
}

export const SUIT_TEXT: Record<UnoColor, string> = {
  red: 'text-suit-red',
  yellow: 'text-suit-yellow',
  green: 'text-suit-green',
  blue: 'text-suit-blue',
}

const COLOR_ORDER: Record<UnoColor, number> = { red: 0, yellow: 1, green: 2, blue: 3 }
const KIND_ORDER: Record<UnoKind, number> = { number: 0, skip: 1, reverse: 2, draw2: 3, wild: 4, custom: 5, wild4: 6 }

/** By colour, then numbers before symbols; the wilds at the end. */
export function sortHand(cards: readonly UnoCard[]): UnoCard[] {
  const colorOf = (c: UnoCard) => (c.color ? COLOR_ORDER[c.color] : 4)
  return [...cards].sort(
    (a, b) => colorOf(a) - colorOf(b) || KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || (a.value ?? 0) - (b.value ?? 0) || a.id - b.id,
  )
}
