import {
  BAR_H,
  BAR_TOP,
  FRAME,
  H,
  LOWER_TOP,
  MID,
  ROW,
  TRAY_H,
  TRAY_TOP,
  W,
  pointBox,
  spikePath,
} from '../lib/geometry'

const POINTS = Array.from({ length: 24 }, (_, i) => i + 1)
const HINGE_Y = BAR_TOP + BAR_H / 2

/** The 8-pointed star of the inlay. */
function star(cx: number, cy: number, r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI / 8) * i - Math.PI / 2
    const rr = i % 2 === 0 ? r : r * 0.62
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(' ')
}

/** A two-stop gradient along a point, lit at its base on the frame. */
function Spike({ id, lit, deep, leftward }: { id: string; lit: string; deep: string; leftward: boolean }) {
  return (
    <linearGradient id={id} x1={leftward ? 1 : 0} y1="0" x2={leftward ? 0 : 1} y2="0">
      <stop offset="0" className={lit} />
      <stop offset="1" className={deep} />
    </linearGradient>
  )
}

/**
 * The box, opened flat: a walnut frame banded with mother-of-pearl, the
 * field, 24 points in turquoise and brick (this phone's even points are
 * turquoise), the hinge across the middle with its brass pins and the
 * inlaid star the cube rests on, the tray under the home boards, and each
 * point's number in a cartouche on the frame. Drawn once; nothing here moves.
 */
export function BoardArt() {
  return (
    <>
      <defs>
        <linearGradient id="bg-walnut" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className="stop-walnut-lit" />
          <stop offset="0.5" className="stop-walnut" />
          <stop offset="1" className="stop-walnut-deep" />
        </linearGradient>
        <radialGradient id="bg-field" cx="0.5" cy="0.5" r="0.75">
          <stop offset="0" className="stop-field-lit" />
          <stop offset="1" className="stop-field-deep" />
        </radialGradient>
        <Spike id="bg-teal" lit="stop-turquoise-lit" deep="stop-turquoise-deep" leftward />
        <Spike id="bg-teal-l" lit="stop-turquoise-lit" deep="stop-turquoise-deep" leftward={false} />
        <Spike id="bg-brick" lit="stop-brick-lit" deep="stop-brick-deep" leftward />
        <Spike id="bg-brick-l" lit="stop-brick-lit" deep="stop-brick-deep" leftward={false} />
        <linearGradient id="bg-pearl" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className="stop-pearl" />
          <stop offset="0.35" className="stop-pearl-rose" />
          <stop offset="0.65" className="stop-pearl-mint" />
          <stop offset="1" className="stop-pearl" />
        </linearGradient>
        <linearGradient id="bg-brass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="stop-brass-lit" />
          <stop offset="0.5" className="stop-brass" />
          <stop offset="1" className="stop-brass-deep" />
        </linearGradient>
        <pattern id="bg-inlay" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" className="fill-walnut-deep" />
          <path d="M4 0.6 7.4 4 4 7.4 0.6 4Z" fill="url(#bg-pearl)" opacity="0.85" />
        </pattern>
      </defs>

      {/* The frame, and the pearl band set into it. */}
      <rect width={W} height={H} rx="16" fill="url(#bg-walnut)" />
      <rect x="1" y="1" width={W - 2} height={H - 2} rx="15" fill="none" className="stroke-pearl" strokeOpacity="0.12" />
      <path
        fillRule="evenodd"
        fill="url(#bg-inlay)"
        d={`M4 4h${String(W - 8)}v${String(H - 8)}h${String(-(W - 8))}Z M8 8v${String(H - 16)}h${String(W - 16)}v${String(-(H - 16))}Z`}
      />

      {/* The field, upper and lower halves. */}
      <rect x={FRAME} y={FRAME} width={W - 2 * FRAME} height={6 * ROW} rx="4" fill="url(#bg-field)" />
      <rect x={FRAME} y={LOWER_TOP} width={W - 2 * FRAME} height={6 * ROW} rx="4" fill="url(#bg-field)" />

      {POINTS.map((p) => {
        const right = pointBox(p).right
        const tone = p % 2 === 0 ? 'bg-teal' : 'bg-brick'
        return (
          <path
            key={p}
            d={spikePath(p)}
            fill={`url(#${tone}${right ? '' : '-l'})`}
            className="stroke-pearl"
            strokeOpacity="0.28"
            strokeWidth="0.7"
          />
        )
      })}

      {/* The hinge: walnut across the board, brass pins, the star in the middle. */}
      <rect x="0" y={BAR_TOP} width={W} height={BAR_H} fill="url(#bg-walnut)" />
      <rect x="0" y={BAR_TOP} width={W} height="1" className="fill-black" opacity="0.45" />
      <rect x="0" y={BAR_TOP + BAR_H - 1} width={W} height="1" className="fill-black" opacity="0.45" />
      <rect x="0" y={HINGE_Y - 0.5} width={W} height="1" className="fill-black" opacity="0.3" />
      {[FRAME + 2, W - FRAME - 30].map((x) => (
        <g key={x}>
          <rect x={x} y={HINGE_Y - 5} width="28" height="10" rx="3" fill="url(#bg-brass)" />
          <circle cx={x + 7} cy={HINGE_Y} r="1.6" className="fill-brass-deep" />
          <circle cx={x + 21} cy={HINGE_Y} r="1.6" className="fill-brass-deep" />
        </g>
      ))}
      <circle cx={MID} cy={HINGE_Y} r="19" className="fill-walnut-deep" stroke="url(#bg-brass)" strokeWidth="1.2" />
      <polygon points={star(MID, HINGE_Y, 15)} fill="url(#bg-pearl)" opacity="0.9" />
      <polygon points={star(MID, HINGE_Y, 7)} className="fill-walnut-deep" opacity="0.85" />

      {/* The tray: sunk into the frame under the home boards, one half each. */}
      <rect x={FRAME} y={TRAY_TOP} width={W - 2 * FRAME} height={TRAY_H} rx="6" className="fill-field-deep" />
      <rect x={FRAME} y={TRAY_TOP} width={W - 2 * FRAME} height="3" rx="1.5" className="fill-black" opacity="0.5" />
      <rect x={MID - 0.75} y={TRAY_TOP + 4} width="1.5" height={TRAY_H - 8} fill="url(#bg-brass)" opacity="0.6" />

      {/* Point numbers in their cartouches on the frame, this phone's own count. */}
      {POINTS.map((p) => {
        const box = pointBox(p)
        const x = box.right ? W - FRAME / 2 : FRAME / 2
        const y = box.y + ROW / 2
        return (
          <g key={p}>
            <rect x={x - 5} y={y - 5.5} width="10" height="11" rx="2.5" className="fill-walnut-deep" />
            <text
              x={x}
              y={y + 0.3}
              className="fill-pearl-dim font-sans"
              fontSize="6.5"
              fontWeight="600"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {p}
            </text>
          </g>
        )
      })}
    </>
  )
}
