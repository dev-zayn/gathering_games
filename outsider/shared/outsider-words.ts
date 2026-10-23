import { CATEGORIES } from './data/outsider-categories'

export interface Secret {
  word: string
  /** Who or what the word stands for — insiders only. Empty when none. */
  meaning: string
}

/** «اريل = قاسم» → { word: 'اريل', meaning: 'قاسم' }. */
export function parseLine(line: string): Secret {
  const [word = '', ...rest] = line.split('=')
  return { word: word.trim(), meaning: rest.join('=').trim() }
}

/** Splits the custom-category textarea: one per line, or comma-separated. */
export function splitLines(text: string): string[] {
  return text
    .split(/\n|،|,/)
    .map((l) => l.trim())
    .filter((l) => parseLine(l).word)
}

/** Every category — built-ins, then the group's own (which win on a clash). */
export function allCategories(custom: Record<string, string[]>): Record<string, readonly string[]> {
  return { ...CATEGORIES, ...custom }
}

export function secretsOf(lines: readonly string[] | undefined): Secret[] {
  return (lines ?? []).map(parseLine).filter((s) => s.word)
}

/** A category needs two secrets at least — one to hide, one to guess against. */
export const MIN_WORDS = 2

/** Bounds on a group's own categories — they travel to the server on start. */
export const CUSTOM_LIMITS = { categories: 12, lines: 80, chars: 40 } as const
