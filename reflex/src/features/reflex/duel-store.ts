import { useSyncExternalStore } from 'react'

// The one-phone duel, opened from the front door: two thumbs, one screen,
// no room. Not kept: a reload comes back to the front door.

let open = false
const listeners = new Set<() => void>()

export const duel = {
  set(next: boolean) {
    open = next
    listeners.forEach((l) => {
      l()
    })
  },
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export const useDuelOpen = () => useSyncExternalStore(subscribe, () => open)
