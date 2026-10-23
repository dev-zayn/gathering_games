import type { SpotCard, SpotView } from '@shared/protocol'
import type { SpotTap } from '../hooks/use-spot'

/** What every board is handed by the room. */
export interface BoardProps {
  view: SpotView
  /** The host's clock on this phone. */
  now: number
  /** Dealt in, the race on, not frozen. */
  canTap: boolean
  spot: (tap: SpotTap) => void
  shakeOf: (card: number | undefined) => number
}

/** Turned up on this phone yet. */
export const isUp = (card: SpotCard | null | undefined, now: number): card is SpotCard => !!card && now >= card.at

/** The symbol two cards share, when both are there. */
export const shared = (a: SpotCard | null, b: SpotCard | null, symbol: number) =>
  !!a && !!b && a.symbols.includes(symbol) && b.symbols.includes(symbol)

