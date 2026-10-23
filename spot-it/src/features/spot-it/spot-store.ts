import type { SpotOptions } from '@shared/protocol'
import { StorageKeys } from '@/constants/storage'
import { createPersistedStore, usePersisted } from '@/lib/persisted-store'
import { MODES } from './data/modes'

// The host's pick, kept on their phone and sent with «ابدأ».

const isSpotOptions = (v: unknown): v is SpotOptions =>
  typeof v === 'object' && v !== null && MODES.some((m) => m.id === (v as SpotOptions).mode)

export const spotStore = createPersistedStore<SpotOptions>(StorageKeys.spotOptions, { mode: 'tower' }, isSpotOptions)

export const useSpotOptions = () => usePersisted(spotStore)
