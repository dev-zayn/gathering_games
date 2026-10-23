import type { UnoCard, UnoColor, UnoHouseRule, UnoKind } from '../protocol'

// The box's 108 cards, numbered once so every phone means the same card by
// the same id: per colour one 0, two of each 1–9, two each of skip, reverse
// and draw two (25 × 4 = 100), then 2 wilds, 4 wild draw fours and the 2
// blank wild customizables. Never reorder: an id is a card on the wire.

export const COLORS: readonly UnoColor[] = ['red', 'yellow', 'green', 'blue']

export const COLOR_NAMES: Record<UnoColor, string> = {
  red: 'أحمر',
  yellow: 'أصفر',
  green: 'أخضر',
  blue: 'أزرق',
}

function build(): UnoCard[] {
  const out: UnoCard[] = []
  const add = (color: UnoColor | null, kind: UnoKind, value: number | null = null) => {
    out.push({ id: out.length, color, kind, value })
  }
  for (const color of COLORS) {
    add(color, 'number', 0)
    for (let v = 1; v <= 9; v++) {
      add(color, 'number', v)
      add(color, 'number', v)
    }
    for (const kind of ['skip', 'reverse', 'draw2'] as const) {
      add(color, kind)
      add(color, kind)
    }
  }
  for (let i = 0; i < 2; i++) add(null, 'wild')
  for (let i = 0; i < 4; i++) add(null, 'wild4')
  for (let i = 0; i < 2; i++) add(null, 'custom')
  return out
}

export const DECK: readonly UnoCard[] = build()

export const ALL_CARDS: readonly number[] = DECK.map((c) => c.id)

export function cardOf(id: number): UnoCard {
  const card = DECK[id]
  if (!card) throw new Error(`no card ${String(id)}`)
  return card
}

export const isCard = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < DECK.length

/** What a card left in a hand is worth at the end of a hand. */
export function pointsOf(card: UnoCard): number {
  switch (card.kind) {
    case 'number':
      return card.value ?? 0
    case 'skip':
    case 'reverse':
    case 'draw2':
      return 20
    case 'custom':
      return 40
    case 'wild':
    case 'wild4':
      return 50
  }
}

export const handPoints = (ids: readonly number[]): number => ids.reduce((sum, id) => sum + pointsOf(cardOf(id)), 0)

/**
 * A signed number inside Arabic text, isolated left to right: «+2» alone
 * in a right-to-left line otherwise shows as «2+» (the sign is neutral and
 * takes the line's direction).
 */
export const signed = (n: number): string => `\u2066+${String(n)}\u2069`

const KIND_NAMES: Record<Exclude<UnoKind, 'number'>, string> = {
  skip: 'تخطّي',
  reverse: 'عكس',
  draw2: signed(2),
  wild: 'جوكر',
  wild4: `جوكر ${signed(4)}`,
  custom: 'جوكر القاعدة',
}

/** «أحمر 7», «تخطّي أزرق», «جوكر +4». */
export function cardName(card: UnoCard): string {
  if (card.kind === 'number') return `${card.color ? COLOR_NAMES[card.color] : ''} ${String(card.value)}`
  const kind = KIND_NAMES[card.kind]
  return card.color ? `${kind} ${COLOR_NAMES[card.color]}` : kind
}

/** The house rules the host can write on the two blank cards. */
export const HOUSE_RULES: Record<UnoHouseRule, { title: string; how: string }> = {
  again: { title: 'دور ثاني', how: 'اللي يلعبها يختار اللون ويلعب مرة ثانية.' },
  swap: { title: 'بدّل الورق', how: 'اللي يلعبها يختار اللون ويبدّل ورقه كله ويا لاعب يختاره.' },
  hunt: { title: 'دوّر على اللون', how: 'اللي يلعبها يختار لون، واللي بعده يسحب لين يطلعله هاللون ويروح دوره.' },
  dump: { title: 'ذب اللون', how: 'اللي يلعبها يختار لون ويذب كل ورقه من هاللون وياها.' },
  wild: { title: 'جوكر عادي', how: 'مثل الجوكر: يختار اللون وبس.' },
}
