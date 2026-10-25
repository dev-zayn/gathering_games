import { useEffect, useState, type ReactNode } from 'react'
import { OFF, other, pips, startSide, type Board as BoardCounts, type Seat } from '@shared/backgammon/board'
import { applyMoves, diceLeft, type Move } from '@shared/backgammon/moves'
import type { BgView } from '@shared/protocol'
import { rattle } from '@/lib/sound'
import { useFresh } from '../hooks/use-fresh'
import { useTurnPlay } from '../hooks/use-turn-play'
import { movesText, rollText } from '../lib/words'
import { Board } from './Board'
import { Cube } from './Cube'
import { DiceTray } from './DiceTray'
import { GameOver } from './GameOver'
import { OpeningRoll } from './OpeningRoll'
import { SidePlate } from './SidePlate'
import { TurnControls } from './TurnControls'

interface Props {
  view: BgView
  /** The side drawn at the bottom of the board. */
  perspective: Seat
  /** The seat this screen decides for now; null when it only watches. */
  controller: Seat | null
  /** «You» on this phone, if anyone (null for two on one phone). */
  you: Seat | null
  names: [string, string]
  act: (action: Record<string, unknown>) => void
  /** The host's clock, now. */
  now: number
  /** The clock is real (a room); a game on one phone has none. */
  timed: boolean
  /** What the other side is up to while this screen waits. */
  waiting: string
  /** Under the board once a game is over: the next game, the match's end. */
  after: ReactNode
}

const isStart = (board: BoardCounts) => board.every((side) => side.join() === startSide().join())

/**
 * The table: the far side's plate, the board, and this side's plate with
 * the keys of the turn under the thumb. Online and on one phone alike —
 * the screen around it says who decides and how the moves travel.
 */
export function BackgammonTable({ view, perspective, controller, you, names, act, now, timed, waiting, after }: Props) {
  const far = other(perspective)
  const throwKey = `${String(view.gameNo)}:${String(view.last?.n ?? 0)}:${String(view.turn)}:${view.dice?.join('') ?? ''}`
  const mine = controller !== null && view.turn === controller && view.phase === 'move' && view.dice !== null
  const play = useTurnPlay(
    mine && view.dice ? { board: view.board, mover: controller, dice: view.dice, key: throwKey, staged: view.staged } : null,
    (moves: Move[]) => {
      act({ type: 'stage', moves })
    },
    (moves: Move[]) => {
      act({ type: 'play', moves })
    },
  )
  // The throw is in the air from the tap until the dice come back.
  const [throwing, setThrowing] = useState('')
  // Every throw is heard: this phone's on the tap, the other side's (and the opening's) as it lands.
  const thrown = view.dice !== null && throwing !== throwKey
  useEffect(() => {
    if (thrown) rattle()
  }, [throwKey, thrown])
  const opening = useFresh(`game-${String(view.gameNo)}`, 2600, isStart(view.board) && view.phase === 'move')

  // What the board shows: the turn in hand here, or the other side's moves as they make them.
  let board = view.board
  if (play.active) board = play.board
  else if (view.phase === 'move' && view.staged.length > 0) {
    const s = view.turn
    const pos = applyMoves(board[s], board[other(s)], view.staged)
    board = s === 0 ? [pos.me, pos.them] : [pos.them, pos.me]
  }

  const waitingOn = view.phase === 'double' ? other(view.turn) : view.phase === 'roll' || view.phase === 'move' ? view.turn : null
  const secsLeft = Math.max(0, Math.ceil((view.until - now) / 1000))
  const clock = (seat: Seat) => (timed && waitingOn === seat && secsLeft <= 20 ? secsLeft : null)
  const score = (seat: Seat) => (view.options.length > 1 ? { mine: view.sides[seat].score, length: view.options.length } : null)
  const cubeAt = (seat: Seat | null) =>
    view.options.cube && view.cube.owner === seat && !view.crawford ? <Cube value={view.cube.value} /> : null

  /** The far side's dice while it plays, or the roll it could not use. */
  const farDice = (() => {
    if (view.phase === 'move' && view.turn === far && view.dice) {
      return <DiceTray dice={view.dice} left={diceLeft(view.dice, view.staged)} size="sm" throwKey={throwKey} />
    }
    return null
  })()
  const note = (seat: Seat): string | null => {
    const last = view.last
    if (last?.seat !== seat || view.turn === seat || view.phase === 'between' || view.phase === 'over') return null
    if (last.blocked) return `${rollText(last.dice)} · ما عنده لعب`
    return `${rollText(last.dice)} · ${movesText(last.moves, seat !== perspective)}${last.hits > 0 ? ' · أكل' : ''}`
  }
  const plate = (seat: Seat) => ({
    seat,
    name: names[seat],
    lamp: waitingOn === seat,
    connected: view.sides[seat].connected,
    pips: pips(board[seat]),
    off: board[seat][OFF] ?? 0,
    score: score(seat),
    secs: clock(seat),
    note: note(seat),
  })

  return (
    <div className="flex flex-col gap-2.5">
      <SidePlate {...plate(far)} end={farDice ?? cubeAt(far)} />
      <Board board={board} perspective={perspective} play={play} mover={mine ? controller : null} cube={cubeAt(null)}>
        {opening && <OpeningRoll view={view} names={names} you={you} />}
        {(view.phase === 'between' || view.phase === 'over') && (
          <GameOver view={view} names={names} you={you} secs={timed && view.phase === 'between' ? secsLeft : null} />
        )}
      </Board>
      <SidePlate {...plate(perspective)} end={cubeAt(perspective)}>
        <TurnControls
          view={view}
          controller={controller}
          play={play}
          names={names}
          sayWho={you === null}
          waiting={waiting}
          throwKey={throwKey}
          throwing={throwing === throwKey}
          onRoll={() => {
            rattle()
            setThrowing(throwKey)
            act({ type: 'roll' })
            // A throw lost on the way gives the key back.
            window.setTimeout(() => {
              setThrowing('')
            }, 4000)
          }}
          act={act}
          after={after}
        />
      </SidePlate>
    </div>
  )
}
