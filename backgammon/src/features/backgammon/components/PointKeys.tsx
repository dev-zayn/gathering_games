import { BAR, OFF, across, type Board, type Seat } from '@shared/backgammon/board'
import type { Move } from '@shared/backgammon/moves'
import { barBox, percentBox, pointBox, trayBox, type Box } from '../lib/geometry'

interface Props {
  board: Board
  perspective: Seat
  mover: Seat
  sources: Set<number>
  selected: number | null
  targets: Map<number, Move[]>
  onPick: (from: number) => void
  onDrop: (to: number) => void
}

interface Key {
  index: number
  box: Box
  label: string
}

/**
 * The board's keys: one real button over each point's band, the mover's
 * bar and the mover's tray, laid over the drawing. A tap on a landing
 * moves there; a tap on a checker that can move picks it (or lets it go).
 */
export function PointKeys({ board, perspective, mover, sources, selected, targets, onPick, onDrop }: Props) {
  const moverSees = mover === perspective
  const mine = board[mover]
  const theirs = board[mover === 0 ? 1 : 0]
  const keys: Key[] = []
  for (let p = 1; p <= 24; p++) {
    const index = moverSees ? p : across(p)
    const own = mine[index] ?? 0
    const foe = theirs[across(index)] ?? 0
    const held = own > 0 ? `${String(own)} من حجارك` : foe > 0 ? `${String(foe)} من حجار صاحبك` : 'فاضية'
    keys.push({ index, box: pointBox(p), label: `الخانة ${String(index)}، ${held}` })
  }
  keys.push({ index: BAR, box: barBox(moverSees), label: `الوسط، ${String(mine[BAR] ?? 0)} من حجارك` })
  keys.push({ index: OFF, box: trayBox(moverSees), label: `الحجار اللي شلتها، ${String(mine[OFF] ?? 0)}` })

  return (
    <div className="absolute inset-0">
      {keys.map((k) => {
        const route = targets.get(k.index)
        const canPick = sources.has(k.index)
        if (!route && !canPick && k.index === OFF) return null
        return (
          <button
            key={k.index}
            type="button"
            aria-label={
              route
                ? `${k.label}: انقل هنا بـ ${route.map((m) => String(m.die)).join(' و ')}`
                : canPick
                  ? `${k.label}: ${selected === k.index ? 'تراجع عن اختيارها' : 'اختار حجرة'}`
                  : k.label
            }
            aria-pressed={canPick ? selected === k.index : undefined}
            onClick={() => {
              if (route) onDrop(k.index)
              else onPick(k.index)
            }}
            className="absolute rounded-control outline-none focus-visible:ring-2 focus-visible:ring-brass-lit"
            style={percentBox(k.box)}
          />
        )
      })}
    </div>
  )
}
