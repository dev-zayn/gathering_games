import { StorageKeys } from '@/constants/storage'
import { CATEGORIES, DEFAULT_CUSTOM } from '@shared/data/outsider-categories'
import { createPersistedStore, isStringArray, isStringListRecord, usePersisted } from '@/lib/persisted-store'

// The host's category setup, kept on their phone and sent with «ابدأ».

/** The group's own categories: name → lines («كلمة» or «كلمة = معنى»). */
export const customStore = createPersistedStore<Record<string, string[]>>(
  StorageKeys.outsiderCustom,
  DEFAULT_CUSTOM,
  isStringListRecord,
)

/** Which categories rounds are drawn from. Everything's on until switched off. */
export const enabledStore = createPersistedStore<string[]>(
  StorageKeys.outsiderCats,
  [...Object.keys(CATEGORIES), ...Object.keys(DEFAULT_CUSTOM)],
  isStringArray,
)

export const useCustom = () => usePersisted(customStore)
export const useEnabled = () => usePersisted(enabledStore)

export function toggleCategory(name: string): void {
  enabledStore.set((prev) => (prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]))
}

/** Saves a custom category, renaming it if `previous` names another. */
export function saveCustom(name: string, lines: string[], previous?: string): void {
  customStore.set((prev) => ({
    ...Object.fromEntries(Object.entries(prev).filter(([key]) => key !== previous)),
    [name]: lines,
  }))
  enabledStore.set((prev) => [...prev.filter((c) => c !== previous), name].filter((c, i, a) => a.indexOf(c) === i))
}

export function deleteCustom(name: string): void {
  customStore.set((prev) => Object.fromEntries(Object.entries(prev).filter(([key]) => key !== name)))
  enabledStore.set((prev) => prev.filter((c) => c !== name))
}
