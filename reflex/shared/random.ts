/** One element at random. Callers guarantee a non-empty list. */
export function pick<T>(list: readonly T[]): T {
  const item = list[Math.floor(Math.random() * list.length)]
  if (item === undefined) throw new Error('pick() on an empty list')
  return item
}

/** A shuffled copy (Fisher–Yates) — the input is left alone. */
export function shuffle<T>(list: readonly T[]): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const a = out[i] as T
    out[i] = out[j] as T
    out[j] = a
  }
  return out
}

/** A whole number of milliseconds in [min, max). */
export function between(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min))
}
