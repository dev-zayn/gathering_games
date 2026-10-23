import { TARGETS } from '@engine/games/reflex'
import type { ReflexOptions } from '@shared/protocol'
import { StorageKeys } from '@/constants/storage'
import { createPersistedStore, usePersisted } from '@/lib/persisted-store'

// The host's pick, kept on their phone and sent with «ابدأ».

const isReflexOptions = (v: unknown): v is ReflexOptions =>
  typeof v === 'object' && v !== null && (TARGETS as readonly unknown[]).includes((v as ReflexOptions).target)

export const reflexStore = createPersistedStore<ReflexOptions>(StorageKeys.reflexOptions, { target: 5 }, isReflexOptions)

export const useReflexOptions = () => usePersisted(reflexStore)
