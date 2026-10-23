import { useSyncExternalStore } from 'react'

// A tiny `useSyncExternalStore` store mirrored to localStorage — the roster, the
// outsider scores, the high scores. Storage can be missing or throw (private
// mode, a webview with site data blocked): then the store simply lives for the
// session, in memory, and the games still play.

export interface PersistedStore<T> {
  get: () => T
  set: (next: T | ((prev: T) => T)) => void
  subscribe: (listener: () => void) => () => void
}

export function createPersistedStore<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): PersistedStore<T> {
  const listeners = new Set<() => void>()
  let value = read()

  function read(): T {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return fallback
      const parsed: unknown = JSON.parse(raw)
      return isValid(parsed) ? parsed : fallback
    } catch {
      return fallback
    }
  }

  return {
    get: () => value,
    set(next) {
      value = typeof next === 'function' ? (next as (prev: T) => T)(value) : next
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch {
        // No storage — keep it in memory for this session.
      }
      listeners.forEach((listener) => {
        listener()
      })
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

/** Read a persisted store and re-render when it changes. */
export function usePersisted<T>(store: PersistedStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get)
}

/** Guards for the shapes the stores hold. */
export const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string')

export const isNumberRecord = (v: unknown): v is Record<string, number> =>
  typeof v === 'object' && v !== null && !Array.isArray(v) && Object.values(v).every((x) => typeof x === 'number')

export const isStringListRecord = (v: unknown): v is Record<string, string[]> =>
  typeof v === 'object' && v !== null && !Array.isArray(v) && Object.values(v).every(isStringArray)
