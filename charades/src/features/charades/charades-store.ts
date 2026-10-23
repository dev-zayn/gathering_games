import { DECK_NAMES, SECONDS_CHOICES, TURN_CHOICES } from '@shared/data/charades-words'
import type { CharadesOptions } from '@shared/protocol'
import { StorageKeys } from '@/constants/storage'
import { createPersistedStore, isStringArray, usePersisted } from '@/lib/persisted-store'

// The host's setup, kept on their phone: picked at the front door or in the
// room's setup, sent with «ابدأ».

const isCharadesOptions = (v: unknown): v is CharadesOptions => {
  if (typeof v !== 'object' || v === null) return false
  const o = v as CharadesOptions
  return (
    (SECONDS_CHOICES as readonly number[]).includes(o.seconds) &&
    (TURN_CHOICES as readonly number[]).includes(o.turns) &&
    isStringArray(o.decks)
  )
}

export const charadesStore = createPersistedStore<CharadesOptions>(
  StorageKeys.charadesOptions,
  { seconds: 60, turns: 3, decks: [...DECK_NAMES] },
  isCharadesOptions,
)

export const useCharadesOptions = () => usePersisted(charadesStore)
