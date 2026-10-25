import { OFF, other, startBoard, winKind, type Board, type Seat } from '@shared/backgammon/board'
import { applyMoves, movesThisTurn, type Move } from '@shared/backgammon/moves'
import type { BgOptions, BgResult, BgTurn } from '@shared/protocol'
import { rollDie } from '@shared/random'

/** How long each decision may take before it plays itself (the bot's choice). */
export const ROLL_MS = 60_000
export const MOVE_MS = 120_000
export const ANSWER_MS = 60_000
/** A player whose phone has dropped out gets this long, then the turn plays itself. */
export const AWAY_MS = 25_000
/** The pause between two games of a match. */
export const BETWEEN_MS = 8_000
/** The cube's top face. */
export const CUBE_MAX = 64

export interface State {
  /** Seat 0 (ivory) and seat 1 (ebony). */
  ids: [string, string]
  options: BgOptions
  board: Board
  phase: 'roll' | 'double' | 'move' | 'between' | 'over'
  turn: Seat
  dice: [number, number] | null
  /** The player to move's moves so far, before they are done. */
  staged: Move[]
  cube: { value: number; owner: Seat | null }
  score: [number, number]
  /** This game (or, between games, the next one) is the Crawford game. */
  crawford: boolean
  /** The Crawford game has been dealt: it never comes twice. */
  crawfordDone: boolean
  gameNo: number
  until: number
  opening: { dice: [number, number]; ties: number }
  last: BgTurn | null
  result: BgResult | null
  winner: Seat | null
  /** Turns played in the match, for `BgTurn.n`. */
  turns: number
}

/** The opening roll: one die each, thrown again while they tie. The higher die moves first, with both numbers. */
export function openingRoll(): { dice: [number, number]; ties: number } {
  let ties = 0
  for (;;) {
    const dice: [number, number] = [rollDie(), rollDie()]
    if (dice[0] !== dice[1]) return { dice, ties }
    ties++
  }
}

/** A fresh game in the match: the checkers set up, the cube in the middle, the opening roll played as the first turn. */
export function newGame(s: State, now: number): State {
  const opening = openingRoll()
  const first: Seat = opening.dice[0] > opening.dice[1] ? 0 : 1
  return {
    ...s,
    board: startBoard(),
    phase: 'move',
    turn: first,
    dice: [opening.dice[first], opening.dice[other(first)]],
    staged: [],
    cube: { value: 1, owner: null },
    gameNo: s.gameNo + 1,
    until: now + MOVE_MS,
    opening,
    result: null,
  }
}

export function startState(ids: [string, string], options: BgOptions, now: number): State {
  const blank: State = {
    ids,
    options,
    board: startBoard(),
    phase: 'move',
    turn: 0,
    dice: null,
    staged: [],
    cube: { value: 1, owner: null },
    score: [0, 0],
    crawford: false,
    crawfordDone: false,
    gameNo: 0,
    until: now,
    opening: { dice: [1, 2], ties: 0 },
    last: null,
    result: null,
    winner: null,
    turns: 0,
  }
  return newGame(blank, now)
}

/** The player to roll may turn the cube: it is in play, not the Crawford game, theirs or in the middle, below 64. */
export function mayDouble(s: State, seat: Seat): boolean {
  return (
    s.options.cube &&
    s.phase === 'roll' &&
    s.turn === seat &&
    !s.crawford &&
    s.cube.value < CUBE_MAX &&
    (s.cube.owner === null || s.cube.owner === seat)
  )
}

/** The turn goes across the board. */
export function passTurn(s: State, now: number): State {
  return { ...s, turn: other(s.turn), phase: 'roll', dice: null, staged: [], until: now + ROLL_MS }
}

/** The dice are thrown: the moves begin, or a roll with no legal move passes the turn at once. */
export function roll(s: State, now: number): State {
  const dice: [number, number] = [rollDie(), rollDie()]
  const me = s.board[s.turn]
  const them = s.board[other(s.turn)]
  if (movesThisTurn(me, them, dice) > 0) return { ...s, phase: 'move', dice, staged: [], until: now + MOVE_MS }
  const turns = s.turns + 1
  const last: BgTurn = { seat: s.turn, dice, moves: [], hits: 0, blocked: true, n: turns }
  return passTurn({ ...s, last, turns }, now)
}

/** A whole turn, already checked: the board moves on, and the game ends if the mover is all off. */
export function play(s: State, moves: Move[], now: number): State {
  const seat = s.turn
  const dice = s.dice ?? [0, 0]
  const after = applyMoves(s.board[seat], s.board[other(seat)], moves)
  const board: Board = seat === 0 ? [after.me, after.them] : [after.them, after.me]
  const turns = s.turns + 1
  const last: BgTurn = { seat, dice, moves, hits: after.hits, blocked: false, n: turns }
  const next: State = { ...s, board, last, turns, staged: [] }
  if ((board[seat][OFF] ?? 0) === 15) return endGame(next, seat, winKind(board[other(seat)]), false, now)
  return passTurn(next, now)
}

/**
 * A game is won: the points are the kind times the cube. The match ends
 * at its length (a single game ends it at once); otherwise the next game
 * comes after a pause, and it is the Crawford game when the winner has
 * just reached one point short for the first time.
 */
export function endGame(s: State, winner: Seat, kind: 1 | 2 | 3, passed: boolean, now: number): State {
  const points = kind * s.cube.value
  const score: [number, number] = [...s.score]
  score[winner] += points
  const result: BgResult = { winner, kind, cube: s.cube.value, points, passed }
  const base: State = { ...s, score, result, dice: null, staged: [] }
  const length = s.options.length
  if (length === 1 || score[winner] >= length) return { ...base, phase: 'over', winner, until: now }
  const crawford = s.options.cube && !s.crawfordDone && score[winner] === length - 1
  return { ...base, phase: 'between', crawford, crawfordDone: s.crawfordDone || crawford, until: now + BETWEEN_MS }
}

/** Who the game is waiting on: the player to move, or the one answering a double. */
export function waitingOn(s: State): Seat | null {
  if (s.phase === 'double') return other(s.turn)
  if (s.phase === 'roll' || s.phase === 'move') return s.turn
  return null
}
