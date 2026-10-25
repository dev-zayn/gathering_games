import { actionOf, refuse, type Ctx, type Engine, type Result } from '../../engine'
import type { Seat } from '@shared/backgammon/board'
import { BG_LENGTHS, type BgOptions, type BgView } from '@shared/protocol'
import { doubleMove, nextMove, passMove, playMove, rollMove, stageMove, takeMove, timedOut } from './moves'
import { AWAY_MS, mayDouble, startState, waitingOn, type State } from './rules'

const TURN_WORDS = 'دورك'
const ANSWER_WORDS = 'صاحبك ضاعف: تقبل لو تسلّم؟'

function options(raw: unknown): Result<BgOptions> {
  if (typeof raw !== 'object' || raw === null) return refuse('اختار طول المباراة')
  const { length, cube } = raw as Record<string, unknown>
  const len = BG_LENGTHS.find((l) => l === length)
  if (len === undefined) return refuse('اختار طول المباراة')
  if (typeof cube !== 'boolean') return refuse('اختار المكعب لو بلاه')
  return { length: len, cube }
}

function seatOf(s: State, playerId: string): Seat | null {
  const i = s.ids.indexOf(playerId)
  return i === 0 || i === 1 ? i : null
}

function act(s: State, ctx: Ctx, playerId: string, raw: unknown): Result<State> {
  const seat = seatOf(s, playerId)
  if (seat === null) return refuse('إنت تتفرّج على هاللعبة')
  const action = actionOf(raw)
  switch (action.type) {
    case 'roll':
      return rollMove(s, seat, ctx.now)
    case 'double':
      return doubleMove(s, seat, ctx.now)
    case 'take':
      return takeMove(s, seat, ctx.now)
    case 'pass':
      return passMove(s, seat, ctx.now)
    case 'stage':
      return stageMove(s, seat, action.moves)
    case 'play':
      return playMove(s, seat, action.moves, ctx.now)
    case 'next':
      return nextMove(s, ctx.now)
    default:
      return refuse('ما فهمنا هالحركة')
  }
}

/** A phone that has dropped out does not hold the board up: its decision gets `AWAY_MS`. */
function settle(s: State, ctx: Ctx): State {
  const seat = waitingOn(s)
  if (seat === null || ctx.connected.has(s.ids[seat])) return s
  const cut = ctx.now + AWAY_MS
  return s.until > cut ? { ...s, until: cut } : s
}

function view(s: State, ctx: Ctx, playerId: string): { view: BgView; yourTurn: string | null } {
  const seat = seatOf(s, playerId)
  const side = (i: Seat) => ({
    id: s.ids[i],
    name: ctx.names[s.ids[i]] ?? '؟',
    connected: ctx.connected.has(s.ids[i]),
    you: s.ids[i] === playerId,
    score: s.score[i],
  })
  const waiting = waitingOn(s)
  const yourTurn =
    seat === null || waiting !== seat ? null : s.phase === 'double' ? ANSWER_WORDS : TURN_WORDS
  return {
    view: {
      game: 'backgammon',
      options: s.options,
      phase: s.phase,
      seat,
      sides: [side(0), side(1)],
      board: [s.board[0].slice(), s.board[1].slice()],
      turn: s.turn,
      dice: s.dice,
      staged: s.staged,
      cube: s.cube,
      canDouble: seat !== null && mayDouble(s, seat),
      crawford: s.crawford,
      gameNo: s.gameNo,
      until: s.until,
      opening: s.opening,
      last: s.last,
      result: s.result,
      winner: s.winner,
    },
    yourTurn,
  }
}

/** طاولي, run by the host's phone: two seats, a match of games, the cube between them. */
export const backgammon: Engine<State, BgOptions> = {
  id: 'backgammon',
  options,
  start: (ctx, opts) => {
    const [a = '', b = ''] = ctx.ids
    return startState([a, b], opts, ctx.now)
  },
  act: (s, ctx, playerId, action) => act(structuredClone(s), ctx, playerId, action),
  settle,
  wakeAt: (s) => (s.phase === 'over' ? null : s.until),
  wake: (s, ctx) => (ctx.now < s.until ? s : timedOut(structuredClone(s), ctx.now)),
  view,
  scores: (s) => [
    { player: s.ids[0], score: s.score[0] },
    { player: s.ids[1], score: s.score[1] },
  ],
}

