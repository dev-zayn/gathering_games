import type { MafiaOptions } from '@shared/protocol'
import { StorageKeys } from '@/constants/storage'
import { createPersistedStore, usePersisted } from '@/lib/persisted-store'

// The host's role setup, kept on their phone: picked at the front door or in
// the room's setup, sent with «ابدأ».

const isMafiaOptions = (v: unknown): v is MafiaOptions =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as MafiaOptions).doctor === 'boolean' &&
  typeof (v as MafiaOptions).detective === 'boolean'

export const mafiaStore = createPersistedStore<MafiaOptions>(
  StorageKeys.mafiaRoles,
  { doctor: true, detective: true },
  isMafiaOptions,
)

export const useMafiaOptions = () => usePersisted(mafiaStore)
