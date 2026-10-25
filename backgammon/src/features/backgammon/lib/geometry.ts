// The board as this phone draws it, in the drawing's own units (360 × 552).
// Held upright: the bar runs across the middle like the box's hinge, the two
// outer boards above it, the two home boards below. Seen from this phone's
// side, its points 1–12 run down the right (12 at the top, 7 just over the
// bar, 6 just under it, 1 at the bottom) and 13–24 down the left (13 at the
// top, 24 at the bottom), so its checkers travel up the left, across the
// top and down the right into its home, and come off into the tray under
// it. The other side's point p is drawn where this side's 25 − p is.

import { BAR, OFF, across, type Seat } from '@shared/backgammon/board'

export const W = 360
export const H = 552
/** The frame around the field. */
export const FRAME = 12
/** One point's band, across the board. */
export const ROW = 37
export const MID = W / 2
export const COLUMN = MID - FRAME
/** A point's length, from the frame towards the middle. */
export const SPIKE = 150
export const BAR_TOP = FRAME + 6 * ROW
export const BAR_H = 44
export const LOWER_TOP = BAR_TOP + BAR_H
export const TRAY_TOP = LOWER_TOP + 6 * ROW + 6
export const TRAY_H = 34
export const CHECKER = 33
/** A borne-off checker, seen edge-on in the tray. */
export const SLAB_W = 7
export const SLAB_GAP = 10.4

/** Somewhere a checker can be, as this phone draws it. */
export type Spot = { kind: 'point'; p: number } | { kind: 'bar'; mine: boolean } | { kind: 'off'; mine: boolean }

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** The band of this phone's point p (1–24): its row and its half of the board. */
export function pointBox(p: number): Box & { right: boolean } {
  const right = p <= 12
  let top: number
  if (p <= 6) top = LOWER_TOP + (6 - p) * ROW
  else if (p <= 12) top = FRAME + (12 - p) * ROW
  else if (p <= 18) top = FRAME + (p - 13) * ROW
  else top = LOWER_TOP + (p - 19) * ROW
  return { x: right ? MID : FRAME, y: top, w: COLUMN, h: ROW, right }
}

/** Where the checkers waiting on the bar sit: this phone's on the left, by the home board they enter. */
export const barBox = (mine: boolean): Box => ({ x: mine ? FRAME : MID, y: BAR_TOP, w: COLUMN, h: BAR_H })

/** The tray under each home board: this phone's on the right. */
export const trayBox = (mine: boolean): Box => ({ x: mine ? MID : FRAME, y: TRAY_TOP, w: COLUMN, h: TRAY_H })

/** Where one side's checker at its own index (0 off, 1–24, 25 bar) is drawn from `perspective`'s side. */
export function spotOf(seat: Seat, index: number, perspective: Seat): Spot {
  const mine = seat === perspective
  if (index === BAR) return { kind: 'bar', mine }
  if (index === OFF) return { kind: 'off', mine }
  return { kind: 'point', p: mine ? index : across(index) }
}

/** The centre of the k-th checker (0 at the frame) of n on a spot; long stacks close up to fit. */
export function checkerAt(spot: Spot, k: number, n: number): { x: number; y: number } {
  const room = (span: number) => (n <= 1 ? CHECKER : Math.min(CHECKER, (span - CHECKER) / (n - 1)))
  if (spot.kind === 'point') {
    const box = pointBox(spot.p)
    const step = room(COLUMN - 4)
    const from = CHECKER / 2 + 2 + k * step
    return { x: box.right ? W - FRAME - from : FRAME + from, y: box.y + ROW / 2 }
  }
  if (spot.kind === 'bar') {
    // From near the middle (where the cube sits, 26 clear of it) outwards.
    const step = room(COLUMN - 34)
    const from = 26 + CHECKER / 2 + k * step
    return { x: spot.mine ? MID - from : MID + from, y: BAR_TOP + BAR_H / 2 }
  }
  const from = 8 + k * SLAB_GAP
  return { x: spot.mine ? W - FRAME - from : FRAME + from, y: TRAY_TOP + TRAY_H / 2 }
}

/** A point's spike, base on the frame, tip towards the middle. */
export function spikePath(p: number): string {
  const { y, right } = pointBox(p)
  const base = right ? W - FRAME : FRAME
  const tip = right ? W - FRAME - SPIKE : FRAME + SPIKE
  const f = (v: number) => v.toFixed(1)
  return `M${f(base)} ${f(y + 1.5)}L${f(tip)} ${f(y + ROW / 2)}L${f(base)} ${f(y + ROW - 1.5)}Z`
}

/** A box as percentages of the board, for the HTML laid over the drawing. */
export const percentBox = (b: Box) => ({
  insetInlineStart: `${String((b.x / W) * 100)}%`,
  top: `${String((b.y / H) * 100)}%`,
  width: `${String((b.w / W) * 100)}%`,
  height: `${String((b.h / H) * 100)}%`,
})
