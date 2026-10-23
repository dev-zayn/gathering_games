// The few app-level calls the games make outside the room, through جمعة's
// bridge (lib/gathering/bridge.ts). In a plain browser they fall back to the
// web's own APIs.

import { bridgeNow } from '@/lib/gathering/bridge'

/**
 * A buzz under the thumb — a reveal, a round won, a foul. `short` for taps,
 * `long` for moments. Never throws: haptics are garnish.
 */
export function haptic(kind: 'short' | 'long' = 'short'): void {
  try {
    const g = bridgeNow()
    if (g) {
      g.haptic(kind === 'short' ? 'light' : 'heavy')
      return
    }
    if (typeof navigator.vibrate === 'function') navigator.vibrate(kind === 'short' ? 15 : 220)
  } catch {
    // No haptics on this device.
  }
}
