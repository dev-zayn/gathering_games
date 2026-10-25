// The dice. Every throw in طاولي comes from here, so a test can load them.

/** A fair die from the platform's crypto source (a byte under 252 is an even six ways). */
function cryptoDie(): number {
  const byte = new Uint8Array(1)
  for (;;) {
    crypto.getRandomValues(byte)
    const b = byte[0] ?? 255
    if (b < 252) return (b % 6) + 1
  }
}

let die: () => number = cryptoDie

/** One die, 1–6. */
export const rollDie = (): number => die()

/** Tests load the dice: the source until the next call (null puts the fair one back). */
export function setDieSource(source: (() => number) | null): void {
  die = source ?? cryptoDie
}
