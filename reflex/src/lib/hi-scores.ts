import { StorageKeys } from '@/constants/storage'
import { createPersistedStore, isNumberRecord, usePersisted } from '@/lib/persisted-store'

/** Best score per game id on this phone — the cabinet's «HI» readout. */
export const hiScoresStore = createPersistedStore<Record<string, number>>(StorageKeys.hiScores, {}, isNumberRecord)

export const useHiScores = () => usePersisted(hiScoresStore)

/**
 * Records `value` for `game` if it beats the stored best. `lower` for times
 * (a faster reaction is better). Returns true on a new record.
 */
export function submitHiScore(game: string, value: number, better: 'higher' | 'lower' = 'higher'): boolean {
  const best = hiScoresStore.get()[game]
  const beats = best === undefined || (better === 'higher' ? value > best : value < best)
  if (beats) hiScoresStore.set((prev) => ({ ...prev, [game]: value }))
  return beats
}
