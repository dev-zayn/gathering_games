import { HOUSE_RULES } from '@shared/data/deck'
import { UNO_TARGETS, type UnoOptions } from '@shared/protocol'
import { StorageKeys } from '@/constants/storage'
import { createPersistedStore, usePersisted } from '@/lib/persisted-store'

// The host's setup, kept on their phone and sent with «ابدأ».

const isUnoOptions = (v: unknown): v is UnoOptions => {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return (
    UNO_TARGETS.some((t) => t === o.target) &&
    (o.scoring === 'winner' || o.scoring === 'low') &&
    typeof o.house === 'string' &&
    o.house in HOUSE_RULES
  )
}

export const unoStore = createPersistedStore<UnoOptions>(
  StorageKeys.unoOptions,
  { target: 0, scoring: 'winner', house: 'again' },
  isUnoOptions,
)

export const useUnoOptions = () => usePersisted(unoStore)
