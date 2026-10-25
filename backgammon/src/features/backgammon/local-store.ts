import { useSyncExternalStore } from 'react'
import type { Ctx } from '@engine/engine'
import { backgammon } from '@engine/games/backgammon'
import type { State } from '@engine/games/backgammon/rules'
import type { BgOptions } from '@shared/protocol'
import { StorageKeys } from '@/constants/storage'
import { createPersistedStore } from '@/lib/persisted-store'

/** A match on this phone alone: against الحجّي, or two people passing it across. */
export interface LocalMatch {
  mode: 'bot' | 'pair'
  names: [string, string]
  state: State
}

const isLocalMatch = (v: unknown): v is LocalMatch => {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  const state = o.state as Record<string, unknown> | null
  return (
    (o.mode === 'bot' || o.mode === 'pair') &&
    Array.isArray(o.names) &&
    typeof state === 'object' &&
    state !== null &&
    Array.isArray(state.ids) &&
    Array.isArray(state.board) &&
    typeof state.phase === 'string'
  )
}

/** The match, kept to carry on after the frame closes. */
export const localStore = createPersistedStore<LocalMatch | null>(StorageKeys.local, null, isLocalMatch)

// Whether the one-phone table is on screen: this page's only, never stored.
let open = false
const listeners = new Set<() => void>()

export const localTable = {
  open() {
    open = true
    listeners.forEach((l) => {
      l()
    })
  },
  close() {
    open = false
    listeners.forEach((l) => {
      l()
    })
  },
}

export function useLocalOpen(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => {
        listeners.delete(l)
      }
    },
    () => open,
  )
}

/** A fresh match on this phone, with the set-up picked, and its table on screen. */
export function startLocal(mode: LocalMatch['mode'], options: BgOptions, myName: string | null): void {
  const ids: [string, string] = mode === 'bot' ? ['me', 'haji'] : ['ivory', 'ebony']
  const names: [string, string] = mode === 'bot' ? [myName ?? 'إنت', 'الحجّي'] : ['الأبيض', 'الأسود']
  const ctx: Ctx = { ids, names: { [ids[0]]: names[0], [ids[1]]: names[1] }, connected: new Set(ids), hostId: ids[0], now: Date.now() }
  localStore.set({ mode, names, state: backgammon.start(ctx, options) })
  localTable.open()
}

/** The same two, the same set-up, a new match. */
export function rematch(match: LocalMatch): void {
  startLocal(match.mode, match.state.options, match.mode === 'bot' ? match.names[0] : null)
}

