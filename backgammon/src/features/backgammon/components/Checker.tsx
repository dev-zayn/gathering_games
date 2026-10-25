import type { Seat } from '@shared/backgammon/board'
import { CHECKER, SLAB_W, TRAY_H } from '../lib/geometry'

interface Props {
  seat: Seat
  /** Borne off: seen edge-on, standing in the tray. */
  edge?: boolean
  /** The count on the top checker of a tall stack. */
  count?: number | null
}

/**
 * One checker, centred on (0, 0): ivory with a brick heart for seat 0,
 * ebony with a brass rim and a pearl heart for seat 1, each with the
 * turned groove of a real piece and its shadow on the board.
 */
export function Checker({ seat, edge = false, count = null }: Props) {
  const ivory = seat === 0
  if (edge) {
    const h = TRAY_H - 8
    return (
      <rect
        x={-SLAB_W / 2}
        y={-h / 2}
        width={SLAB_W}
        height={h}
        rx="2"
        fill={`url(#${ivory ? 'ck-ivory-edge' : 'ck-ebony-edge'})`}
        className={ivory ? 'stroke-ivory-groove' : 'stroke-brass-deep'}
        strokeWidth="0.6"
      />
    )
  }
  const r = CHECKER / 2
  return (
    <>
      <circle cx="0.8" cy="1.8" r={r} className="fill-black" opacity="0.4" />
      <circle r={r} fill={`url(#${ivory ? 'ck-ivory' : 'ck-ebony'})`} />
      <circle
        r={r - 0.8}
        fill="none"
        className={ivory ? 'stroke-ivory-shade' : 'stroke-brass'}
        strokeOpacity={ivory ? 0.9 : 0.6}
        strokeWidth="1.2"
      />
      <circle
        r={r * 0.62}
        fill="none"
        className={ivory ? 'stroke-ivory-groove' : 'stroke-brass-deep'}
        strokeOpacity="0.7"
        strokeWidth="1"
      />
      {count === null ? (
        <circle r={r * 0.16} className={ivory ? 'fill-brick' : 'fill-pearl'} opacity="0.85" />
      ) : (
        <text
          y="0.5"
          className={`font-sans ${ivory ? 'fill-walnut-deep' : 'fill-pearl'}`}
          fontSize="13"
          fontWeight="700"
          textAnchor="middle"
          dominantBaseline="central"
        >
          {count}
        </text>
      )}
    </>
  )
}
