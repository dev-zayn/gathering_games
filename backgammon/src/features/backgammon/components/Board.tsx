import type { ReactNode } from 'react'
import type { Board as BoardCounts, Seat } from '@shared/backgammon/board'
import type { TurnPlay } from '../hooks/use-turn-play'
import { BAR_H, BAR_TOP, H, MID, W, percentBox } from '../lib/geometry'
import { BoardArt } from './BoardArt'
import { CheckerDefs } from './CheckerDefs'
import { CheckerLayer } from './CheckerLayer'
import { PointKeys } from './PointKeys'
import { TargetMarks } from './TargetMarks'

interface Props {
  board: BoardCounts
  perspective: Seat
  /** The turn in hand on this screen, and whose checkers it moves. */
  play: TurnPlay
  mover: Seat | null
  /** The cube, when it waits in the middle of the hinge. */
  cube?: ReactNode
  /** Laid over the board: a banner, a game's end. */
  children?: ReactNode
}

const CUBE_BOX = { x: MID - 18, y: BAR_TOP + BAR_H / 2 - 18, w: 36, h: 36 }

/** The board on the table: the box's drawing, the checkers on it, what the hand may do, and its keys. */
export function Board({ board, perspective, play, mover, cube, children }: Props) {
  const live = play.active && mover !== null
  return (
    <div dir="ltr" className="relative mx-auto board-fit rounded-card shadow-slab">
      <svg viewBox={`0 0 ${String(W)} ${String(H)}`} className="absolute inset-0 size-full" role="img" aria-label="لوحة الطاولي">
        <BoardArt />
        <CheckerDefs />
        <CheckerLayer board={board} perspective={perspective} />
        {live && (
          <TargetMarks
            board={board}
            perspective={perspective}
            mover={mover}
            sources={play.sources}
            selected={play.selected}
            targets={play.targets}
          />
        )}
      </svg>
      {cube && (
        <div className="absolute grid place-items-center" style={percentBox(CUBE_BOX)}>
          {cube}
        </div>
      )}
      {live && (
        <PointKeys
          board={board}
          perspective={perspective}
          mover={mover}
          sources={play.sources}
          selected={play.selected}
          targets={play.targets}
          onPick={play.pick}
          onDrop={play.drop}
        />
      )}
      <div dir="rtl">{children}</div>
    </div>
  )
}
