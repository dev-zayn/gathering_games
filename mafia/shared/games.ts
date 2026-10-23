// The game: its id and how many may play. Keep in step with the engine in
// engine/games/ and the cabinet in src/features/arcade/data/games.ts.

export type OnlineGameId = 'mafia'

export const ONLINE_GAMES: readonly OnlineGameId[] = ['mafia']

export const PLAYER_LIMITS: Record<OnlineGameId, { min: number; max: number }> = {
  mafia: { min: 5, max: 16 },
}

export const isOnlineGame = (v: unknown): v is OnlineGameId =>
  typeof v === 'string' && (ONLINE_GAMES as readonly string[]).includes(v)

/** Longest player name — it has to fit on a phone across the table. */
export const MAX_NAME = 16

/** Room codes: 4 characters with the look-alikes (0/O, 1/I/L) left out. */
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const CODE_LENGTH = 4

export function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH)
}

/** A clean display name, or null when there's nothing usable left. */
export function cleanName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  // Strip control characters and collapse whitespace — names are shown raw.
  // eslint-disable-next-line no-control-regex
  const name = raw.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME)
  return name || null
}
