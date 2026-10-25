import { refuse, type Result } from '../../engine'
import { BAR, OFF, other, type Seat } from '@shared/backgammon/board'
import { bestPlay, takes } from '@shared/backgammon/bot'
import { applyMoves, diceLeft, diceOf, isLegalPlay, isLegalStart, type Move } from '@shared/backgammon/moves'
import { ANSWER_MS, endGame, mayDouble, newGame, play, roll, type State } from './rules'

// Each move a player can make, checked against the phase and the seat. A
// refusal is an Arabic line for that phone alone.

export function rollMove(s: State, seat: Seat, now: number): Result<State> {
  if (s.phase !== 'roll' || s.turn !== seat) return refuse('مو دورك تذبّ الزار')
  return roll(s, now)
}

export function doubleMove(s: State, seat: Seat, now: number): Result<State> {
  if (!s.options.cube) return refuse('هاللعبة بلا مضاعفة')
  if (s.phase !== 'roll' || s.turn !== seat) return refuse('تضاعف بس بدورك، قبل لا تذبّ')
  if (s.crawford) return refuse('هاي لعبة كروفورد: ماكو مضاعفة بيها')
  if (!mayDouble(s, seat)) return refuse('المكعب مو بيدك هسه')
  return { ...s, phase: 'double', until: now + ANSWER_MS }
}

/** The other side takes: the cube doubles and goes to them; the doubler rolls. */
export function takeMove(s: State, seat: Seat, now: number): Result<State> {
  if (s.phase !== 'double' || seat !== other(s.turn)) return refuse('ماكو مضاعفة تنتظرك')
  return { ...s, phase: 'roll', cube: { value: s.cube.value * 2, owner: seat }, until: now + ANSWER_MS }
}

/** The other side passes: the doubler wins the game at the cube's value before the double. */
export function passMove(s: State, seat: Seat, now: number): Result<State> {
  if (s.phase !== 'double' || seat !== other(s.turn)) return refuse('ماكو مضاعفة تنتظرك')
  return endGame(s, s.turn, 1, true, now)
}

/** Moves as they arrive from a phone: untrusted JSON, at most four. */
export function movesOf(raw: unknown): Move[] | null {
  if (!Array.isArray(raw) || raw.length > 4) return null
  const out: Move[] = []
  for (const m of raw as unknown[]) {
    if (typeof m !== 'object' || m === null) return null
    const { from, to, die } = m as Record<string, unknown>
    const whole = (v: unknown, lo: number, hi: number): v is number =>
      typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi
    if (!whole(from, 1, BAR) || !whole(to, OFF, 24) || !whole(die, 1, 6)) return null
    out.push({ from, to, die })
  }
  return out
}

/** The mover's moves so far, for the other phone to watch: a legal start of the turn, or nothing. */
export function stageMove(s: State, seat: Seat, raw: unknown): Result<State> {
  if (s.phase !== 'move' || s.turn !== seat || !s.dice) return refuse('مو دورك')
  const moves = movesOf(raw)
  if (!moves || !isLegalStart(s.board[seat], s.board[other(seat)], s.dice, moves)) return refuse('هاي الحركة ما تصير')
  return { ...s, staged: moves }
}

/** The whole turn: every die the rules say must be used, and nothing else. */
export function playMove(s: State, seat: Seat, raw: unknown, now: number): Result<State> {
  if (s.phase !== 'move' || s.turn !== seat || !s.dice) return refuse('مو دورك')
  const moves = movesOf(raw)
  if (!moves) return refuse('هاي الحركة ما تصير')
  if (!isLegalPlay(s.board[seat], s.board[other(seat)], s.dice, moves)) {
    return isLegalStart(s.board[seat], s.board[other(seat)], s.dice, moves)
      ? refuse('بعدك ما خلّصت: لازم تلعب كل زار يمشي')
      : refuse('هاي الحركة ما تصير')
  }
  return play(s, moves, now)
}

/** Between games, either player may deal the next one at once. */
export function nextMove(s: State, now: number): Result<State> {
  if (s.phase !== 'between') return s
  return newGame(s, now)
}

/**
 * The clock ran out on a decision: the turn plays itself the way الحجّي
 * would. A roll is thrown, a double taken or passed as he would, and a
 * turn finished from whatever the player had already moved.
 */
export function timedOut(s: State, now: number): State {
  switch (s.phase) {
    case 'roll':
      return roll(s, now)
    case 'double': {
      const taker = other(s.turn)
      const sense = {
        value: s.cube.value,
        length: s.options.length,
        mine: s.score[taker],
        theirs: s.score[s.turn],
      }
      const yes = takes(s.board[taker], s.board[s.turn], sense)
      const next = yes ? takeMove(s, taker, now) : passMove(s, taker, now)
      return 'error' in next ? s : next
    }
    case 'move': {
      if (!s.dice) return s
      const seat = s.turn
      const staged = applyMoves(s.board[seat], s.board[other(seat)], s.staged)
      // The rest of the roll, from where the player left it.
      const moves = [...s.staged, ...bestPlay(staged.me, staged.them, diceLeft(s.dice, s.staged))]
      if (!isLegalPlay(s.board[seat], s.board[other(seat)], s.dice, moves)) {
        return play(s, bestPlay(s.board[seat], s.board[other(seat)], diceOf(s.dice)), now)
      }
      return play(s, moves, now)
    }
    case 'between':
      return newGame(s, now)
    case 'over':
      return s
  }
}
