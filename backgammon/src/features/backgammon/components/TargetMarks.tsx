import { BAR, OFF, type Board, type Seat } from '@shared/backgammon/board'
import type { Move } from '@shared/backgammon/moves'
import { CHECKER, MID, SLAB_W, TRAY_H, checkerAt, spikePath, spotOf, trayBox, type Spot } from '../lib/geometry'

interface Props {
  board: Board
  perspective: Seat
  mover: Seat
  sources: Set<number>
  selected: number | null
  targets: Map<number, Move[]>
}

/** How many checkers stand on a spot of the board as drawn. */
function countAt(board: Board, perspective: Seat, spot: Spot): { mine: number; theirs: number } {
  const other: Seat = perspective === 0 ? 1 : 0
  if (spot.kind === 'point') return { mine: board[perspective][spot.p] ?? 0, theirs: board[other][25 - spot.p] ?? 0 }
  const seat = spot.mine ? perspective : other
  const n = board[seat][spot.kind === 'bar' ? BAR : OFF] ?? 0
  return { mine: spot.mine ? n : 0, theirs: spot.mine ? 0 : n }
}

/** The dice a route uses, as said on its landing: «5», «6+5». */
const diceWords = (route: Move[]) => route.map((m) => String(m.die)).join('+')

/**
 * What the hand may do, drawn over the checkers: a faint brass ring on each
 * checker that can move, a bright one on the picked checker, and on every
 * landing the picked checker can reach a breathing spike and a ghost of the
 * checker with the dice it takes.
 */
export function TargetMarks({ board, perspective, mover, sources, selected, targets }: Props) {
  const moverCount = (spot: Spot) => {
    const c = countAt(board, perspective, spot)
    return mover === perspective ? c.mine : c.theirs
  }
  const top = (index: number) => {
    const spot = spotOf(mover, index, perspective)
    const n = moverCount(spot)
    return checkerAt(spot, Math.max(0, n - 1), Math.max(1, n))
  }
  const r = CHECKER / 2 + 1.6

  return (
    <g pointerEvents="none">
      {selected === null &&
        [...sources].map((from) => {
          const at = top(from)
          return <circle key={from} cx={at.x} cy={at.y} r={r} fill="none" className="stroke-brass animate-breathe" strokeWidth="1.6" />
        })}
      {selected !== null && (
        <g transform={`translate(${String(top(selected).x)} ${String(top(selected).y)})`}>
          <circle r={r + 2.5} className="fill-brass" opacity="0.18" />
          <circle r={r} fill="none" className="stroke-brass-lit" strokeWidth="2.4" />
        </g>
      )}
      {[...targets].map(([to, route]) => {
        const spot = spotOf(mover, to, perspective)
        if (spot.kind === 'off') {
          const tray = trayBox(spot.mine)
          const n = moverCount(spot)
          const at = checkerAt(spot, n, n + 1)
          // The label sits at the tray's inner end, on a pill of its own over whatever is borne off.
          const lx = spot.mine ? MID + 30 : MID - 30
          return (
            <g key="off">
              <g className="animate-breathe">
                <rect x={tray.x + 1} y={tray.y + 1} width={tray.w - 2} height={tray.h - 2} rx="6" className="fill-brass" opacity="0.16" />
                <rect x={at.x - SLAB_W / 2 - 1} y={at.y - (TRAY_H - 8) / 2} width={SLAB_W + 2} height={TRAY_H - 8} rx="2.5" fill="none" className="stroke-pearl" strokeDasharray="2 2" />
              </g>
              <rect x={lx - 25} y={tray.y + tray.h / 2 - 9} width="50" height="18" rx="9" className="fill-walnut-deep stroke-brass" strokeWidth="0.8" />
              <text x={lx} y={tray.y + tray.h / 2 + 0.5} className="fill-brass-lit font-sans" fontSize="10.5" fontWeight="700" textAnchor="middle" dominantBaseline="central">
                {`شيل · ${diceWords(route)}`}
              </text>
            </g>
          )
        }
        const c = countAt(board, perspective, spot)
        const blot = (mover === perspective ? c.theirs : c.mine) === 1
        const n = blot ? 0 : moverCount(spot)
        const at = checkerAt(spot, n, n + 1)
        const p = spot.kind === 'point' ? spot.p : 0
        return (
          <g key={to}>
            {p > 0 && (
              <g className="animate-breathe">
                <path d={spikePath(p)} className="fill-pearl" opacity="0.24" />
              </g>
            )}
            <circle cx={at.x} cy={at.y} r={CHECKER / 2 - 1} className={blot ? 'fill-brick' : 'fill-pearl'} opacity="0.2" />
            <circle cx={at.x} cy={at.y} r={CHECKER / 2 - 1} fill="none" className={blot ? 'stroke-brick-lit' : 'stroke-pearl'} strokeWidth="1.4" strokeDasharray="3 2.4" />
            <text x={at.x} y={at.y + 0.5} className="fill-pearl font-sans" fontSize="11" fontWeight="700" textAnchor="middle" dominantBaseline="central">
              {diceWords(route)}
            </text>
          </g>
        )
      })}
    </g>
  )
}
