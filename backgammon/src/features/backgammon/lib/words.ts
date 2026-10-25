import { BAR, OFF, across } from '@shared/backgammon/board'
import type { Move } from '@shared/backgammon/moves'
import type { BgResult } from '@shared/protocol'

/** Left to right inside an Arabic line, so «24→18» never reads backwards. */
export const ltr = (s: string): string => `⁦${s}⁩`

/** A roll as the café says it: the big ones have names. */
export function diceCall(a: number, b: number): string | null {
  const hi = Math.max(a, b)
  const lo = Math.min(a, b)
  if (hi === 6 && lo === 5) return 'شيش بيش!'
  if (hi === 6 && lo === 6) return 'دو شيش!'
  return null
}

/** A roll written down: «6-5». */
export const rollText = (dice: readonly [number, number]): string => ltr(`${String(dice[0])}-${String(dice[1])}`)

/** One move written down in the reader's numbers: «13→8», «نزّل 20», «شيل 4». */
function moveText(m: Move, at: (p: number) => number): string {
  if (m.from === BAR) return `نزّل ${String(at(m.to))}`
  if (m.to === OFF) return `شيل ${String(at(m.from))}`
  return ltr(`${String(at(m.from))}→${String(at(m.to))}`)
}

/**
 * A turn's moves, one checker's run joined up (24→13 rather than 24→18،
 * 18→13). `theirs`: the other side's turn, written in this phone's
 * numbers, the ones on its frame (their 24→21 is this side's 1→4).
 */
export function movesText(moves: readonly Move[], theirs = false): string {
  const runs: Move[] = []
  for (const m of moves) {
    const prev = runs.at(-1)
    if (prev?.to === m.from && prev.to !== OFF && m.from !== BAR) runs[runs.length - 1] = { from: prev.from, to: m.to, die: prev.die + m.die }
    else runs.push({ ...m })
  }
  const at = (p: number) => (theirs ? across(p) : p)
  return runs.map((m) => moveText(m, at)).join('، ')
}

/** How a game played to the end was won, in words (a passed double is worded by whoever shows it). */
export function resultWords(r: BgResult): string {
  if (r.kind === 3) return 'مارس كبير! ×3'
  if (r.kind === 2) return 'مارس! ×2'
  return 'لعبة عادية'
}

/** «نقطة»، «نقطتين»، «3 نقاط». */
export function pointsWords(n: number): string {
  if (n === 1) return 'نقطة'
  if (n === 2) return 'نقطتين'
  return n <= 10 ? `${String(n)} نقاط` : `${String(n)} نقطة`
}
