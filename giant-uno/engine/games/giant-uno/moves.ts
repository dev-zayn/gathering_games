import { COLORS, cardOf, isCard, signed } from '../../../shared/data/deck'
import type { UnoColor } from '../../../shared/protocol'
import { refuse } from '../../engine'
import {
  CHALLENGE_MS,
  DRAWN_MS,
  current,
  drawInto,
  drawUntil,
  endHand,
  fits,
  holdsColor,
  likelyColor,
  say,
  seatAfter,
  topOf,
  turnTo,
  type State,
} from './rules'

// One function a move. Each takes a clone of the state, checks the move is
// the player's to make, and changes the clone; a refusal is in Arabic.

type Move = State | { error: string }

const isColor = (v: unknown): v is UnoColor => typeof v === 'string' && (COLORS as readonly string[]).includes(v)

/** A move closes the window to catch a player who did not say «وحدة!»; the challenger's own next move ends their look. */
function moving(s: State, me: string): void {
  s.exposed = null
  if (s.shown?.to === me) s.shown = null
}

function yourMove(s: State, me: string, phase: State['phase']): string | null {
  if (s.phase === 'between' || s.phase === 'over') return 'خلصت اليد'
  if (current(s) !== me) return 'مو دورك'
  if (s.phase !== phase) return s.phase === 'color' ? 'اختار اللون أول' : s.phase === 'challenge' ? `قرّر على الـ${signed(4)} أول` : 'مو هسه'
  return null
}

export function play(s: State, me: string, raw: Record<string, unknown>, now: number): Move {
  const wrong = yourMove(s, me, 'play')
  if (wrong) return refuse(wrong)
  const id = raw.card
  const hand = s.hands[me] ?? []
  if (!isCard(id) || !hand.includes(id)) return refuse('هالورقة مو عندك')
  if (s.drawn !== null && id !== s.drawn) return refuse('تگدر تلعب بس الورقة اللي سحبتها')
  const card = cardOf(id)
  if (!fits(card, topOf(s), s.color)) return refuse('ما تركب: طابق اللون أو الرقم أو الرمز')
  const chosen = raw.color
  if (card.color === null && !isColor(chosen)) return refuse('اختار لون')
  const swapWith = typeof raw.target === 'string' ? raw.target : null
  const swapping = card.kind === 'custom' && s.options.house === 'swap'
  if (swapping && (!swapWith || swapWith === me || !s.ids.includes(swapWith))) return refuse('اختار وياه تبدّل')

  moving(s, me)
  const over = s.color
  const rest = hand.filter((c) => c !== id)
  // Legal only holding none of the colour to follow; played anyway, it can be challenged.
  const fair = card.kind === 'wild4' ? !holdsColor(rest, over) : true
  s.hands[me] = rest
  s.discard.push(id)
  s.drawn = null
  s.color = card.color ?? (chosen as UnoColor)
  say(s, { k: 'play', by: me, card: id, color: card.color === null ? s.color : null })

  if (card.kind === 'custom' && s.options.house === 'dump' && rest.length > 0) {
    const dumped = rest.filter((c) => cardOf(c).color === s.color)
    s.hands[me] = rest.filter((c) => cardOf(c).color !== s.color)
    // Under the card that dumped them: it stays on top, its colour called.
    s.discard.splice(s.discard.length - 1, 0, ...dumped)
    if (dumped.length > 0) say(s, { k: 'dump', by: me, count: dumped.length, color: s.color })
  }

  const left = s.hands[me] ?? []
  if (left.length === 1 && !s.called[me]) s.exposed = me
  const next = seatAfter(s, s.turn)
  const victim = s.ids[next] ?? ''

  if (left.length === 0) {
    // Out. A last draw card still lands on the next player, and counts.
    if (card.kind === 'draw2' || card.kind === 'wild4') {
      const count = card.kind === 'draw2' ? 2 : 4
      drawInto(s, victim, count)
      say(s, { k: 'draw', by: victim, count, why: card.kind })
    }
    if (card.kind === 'custom' && s.options.house === 'hunt') {
      say(s, { k: 'draw', by: victim, count: drawUntil(s, victim, s.color), why: 'hunt' })
    }
    endHand(s, me, now)
    return s
  }

  switch (card.kind) {
    case 'skip':
      say(s, { k: 'skip', who: victim })
      turnTo(s, seatAfter(s, s.turn, 2), now)
      return s
    case 'reverse':
      s.dir = s.dir === 1 ? -1 : 1
      say(s, { k: 'reverse' })
      // Two at the table: a reverse is a skip, and the player goes again.
      turnTo(s, s.ids.length === 2 ? s.turn : seatAfter(s, s.turn), now)
      return s
    case 'draw2':
      drawInto(s, victim, 2)
      say(s, { k: 'draw', by: victim, count: 2, why: 'draw2' })
      turnTo(s, seatAfter(s, s.turn, 2), now)
      return s
    case 'wild4':
      s.turn = next
      s.phase = 'challenge'
      s.pending = { by: me, over, fair }
      s.until = now + CHALLENGE_MS
      return s
    case 'custom':
      return house(s, me, victim, swapWith, now)
    default:
      turnTo(s, next, now)
      return s
  }
}

/** The Wild Customizable, by the rule agreed in the lobby. */
function house(s: State, me: string, victim: string, swapWith: string | null, now: number): State {
  switch (s.options.house) {
    case 'again':
      say(s, { k: 'again', by: me })
      turnTo(s, s.turn, now)
      return s
    case 'swap': {
      const other = swapWith ?? victim
      const mine = s.hands[me] ?? []
      s.hands[me] = s.hands[other] ?? []
      s.hands[other] = mine
      // Down to one by a swap is not by playing: nobody owes the call.
      s.exposed = null
      s.called[me] = s.hands[me].length === 1
      s.called[other] = mine.length === 1
      say(s, { k: 'swap', by: me, with: other })
      turnTo(s, seatAfter(s, s.turn), now)
      return s
    }
    case 'hunt':
      say(s, { k: 'draw', by: victim, count: drawUntil(s, victim, s.color), why: 'hunt' })
      turnTo(s, seatAfter(s, s.turn, 2), now)
      return s
    default:
      turnTo(s, seatAfter(s, s.turn), now)
      return s
  }
}

export function draw(s: State, me: string, now: number): Move {
  const wrong = yourMove(s, me, 'play')
  if (wrong) return refuse(wrong)
  if (s.drawn !== null) return refuse('سحبت، العبها لو عدّي')
  moving(s, me)
  const [card] = drawInto(s, me, 1)
  if (card === undefined) {
    // Nothing left to draw anywhere: the turn passes.
    say(s, { k: 'pass', by: me })
    turnTo(s, seatAfter(s, s.turn), now)
    return s
  }
  say(s, { k: 'draw', by: me, count: 1, why: 'turn' })
  if (!fits(cardOf(card), topOf(s), s.color)) {
    turnTo(s, seatAfter(s, s.turn), now)
    return s
  }
  s.drawn = card
  s.until = now + DRAWN_MS
  return s
}

export function pass(s: State, me: string, now: number): Move {
  const wrong = yourMove(s, me, 'play')
  if (wrong) return refuse(wrong)
  if (s.drawn === null) return refuse('اسحب ورقة أول')
  moving(s, me)
  say(s, { k: 'pass', by: me })
  turnTo(s, seatAfter(s, s.turn), now)
  return s
}

/** The first player's call on a wild that opened the pile. */
export function callColor(s: State, me: string, color: unknown, now: number): Move {
  const wrong = yourMove(s, me, 'color')
  if (wrong) return refuse(wrong)
  if (!isColor(color)) return refuse('اختار لون')
  s.color = color
  say(s, { k: 'color', by: me, color })
  turnTo(s, s.turn, now)
  return s
}

/** «وحدة!»: down to two cards it holds for the next play; down to one it saves you, if nobody caught you first. */
export function sayOne(s: State, me: string): Move {
  if (s.phase === 'between' || s.phase === 'over') return refuse('خلصت اليد')
  const count = (s.hands[me] ?? []).length
  if (count === 0 || count > 2) return refuse('تصيح «وحدة!» لمن تبقى عندك ورقتين أو وحدة')
  if (s.called[me]) return s
  s.called[me] = true
  if (s.exposed === me) s.exposed = null
  say(s, { k: 'call', by: me })
  return s
}

/** Caught on one card without the call: two cards, before the next move. */
export function catchOut(s: State, me: string, who: unknown): Move {
  if (s.phase === 'between' || s.phase === 'over') return refuse('خلصت اليد')
  if (typeof who !== 'string' || who === me) return refuse('حركة مو صحيحة')
  if (s.exposed !== who) return refuse('فاتت، أو صاح بوقتها')
  s.exposed = null
  drawInto(s, who, 2)
  s.called[who] = false
  say(s, { k: 'caught', by: me, who })
  return s
}

/** Facing a Wild Draw Four: draw the four and lose the turn, or challenge it. */
export function answer(s: State, me: string, challenge: boolean, now: number): Move {
  const wrong = yourMove(s, me, 'challenge')
  if (wrong) return refuse(wrong)
  const pending = s.pending
  if (!pending) return refuse('مو هسه')
  moving(s, me)
  s.pending = null
  if (!challenge) {
    drawInto(s, me, 4)
    say(s, { k: 'draw', by: me, count: 4, why: 'wild4' })
    turnTo(s, seatAfter(s, s.turn), now)
    return s
  }
  s.shown = { to: me, of: pending.by, cards: [...(s.hands[pending.by] ?? [])] }
  if (!pending.fair) {
    // They held the colour: they draw the four, and you play on.
    drawInto(s, pending.by, 4)
    say(s, { k: 'challenge', by: me, of: pending.by, won: true })
    turnTo(s, s.turn, now)
    return s
  }
  drawInto(s, me, 6)
  say(s, { k: 'challenge', by: me, of: pending.by, won: false })
  turnTo(s, seatAfter(s, s.turn), now)
  return s
}

/** The move's time ran out: a colour is called for them, a Draw Four drawn, or one card drawn and kept. */
export function timeOut(s: State, now: number): State {
  const who = current(s)
  if (s.phase === 'color') return callColor(s, who, likelyColor(s.hands[who] ?? []), now) as State
  say(s, { k: 'timeout', who })
  if (s.phase === 'challenge') return answer(s, who, false, now) as State
  moving(s, who)
  if (s.drawn === null) {
    const got = drawInto(s, who, 1)
    if (got.length > 0) say(s, { k: 'draw', by: who, count: 1, why: 'timeout' })
  }
  turnTo(s, seatAfter(s, s.turn), now)
  return s
}
