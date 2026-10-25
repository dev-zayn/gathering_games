import { BG_LENGTHS, type BgOptions } from '@shared/protocol'
import { StorageKeys } from '@/constants/storage'
import { createPersistedStore, usePersisted } from '@/lib/persisted-store'

// The last set-up picked, kept on this phone: sent with «ابدأ» by a host,
// and used for a game against الحجّي or two on one phone.

const isOptions = (v: unknown): v is BgOptions => {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return BG_LENGTHS.some((l) => l === o.length) && typeof o.cube === 'boolean'
}

export const optionsStore = createPersistedStore<BgOptions>(StorageKeys.options, { length: 3, cube: true }, isOptions)

export const useOptions = () => usePersisted(optionsStore)
