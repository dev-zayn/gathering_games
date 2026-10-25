// A stand-in for گعدة's room in a plain browser, for working on the games
// without phones: open the page with `?dev` (and `&name=…`) in several tabs
// of one browser and each tab is a player at one table, the first one the
// host. The tabs talk over a BroadcastChannel with the relay's rules: a
// message to the room comes back to its sender, one with `to` reaches that
// tab alone. Never used inside the app (bridge.ts asks for it only when the
// app's channel is missing).

import type { Gathering, Member, Result, RoomEvents } from './bridge'

interface Presence {
  id: string
  name: string
  joinedAt: number
  at: number
}

type Packet =
  | { t: 'presence'; p: Presence }
  | { t: 'msg'; from: string; data: unknown; to?: string }
  | { t: 'ended'; results: Result[] }

const STALE_MS = 3000

function sessionValue(key: string, make: () => string): string {
  try {
    const v = sessionStorage.getItem(key)
    if (v) return v
    const made = make()
    sessionStorage.setItem(key, made)
    return made
  } catch {
    return make()
  }
}

export function devBridge(): Gathering {
  const channel = new BroadcastChannel(`arcade-dev:${location.pathname}`)
  const id = sessionValue('arcade.dev.id', () => `dev_${Math.random().toString(36).slice(2, 8)}`)
  const joinedAt = Number(sessionValue('arcade.dev.joined', () => String(Date.now())))
  const name = new URLSearchParams(location.search).get('name') || `لاعب ${id.slice(-3)}`
  const peers = new Map<string, Presence>()
  const handlers = new Map<string, Set<(detail: never) => void>>()
  let lastMembers = ''
  let lastHost = ''

  const emit = <E extends keyof RoomEvents>(event: E, detail: RoomEvents[E]) => {
    handlers.get(event)?.forEach((fn) => {
      ;(fn as (d: RoomEvents[E]) => void)(detail)
    })
  }

  const me = (): Presence => ({ id, name, joinedAt, at: Date.now() })

  function members(): Member[] {
    const now = Date.now()
    const all = [me(), ...peers.values()].sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id))
    const live = all.filter((p) => p.id === id || now - p.at < STALE_MS)
    const host = live[0]?.id
    return live.map((p, seat) => ({
      id: p.id,
      nickname: p.name,
      role: p.id === host ? 'host' : 'player',
      seat,
      connected: true,
    }))
  }

  function refresh() {
    const list = members()
    const key = JSON.stringify(list)
    if (key !== lastMembers) {
      lastMembers = key
      emit('members', list)
    }
    const host = list.find((m) => m.role === 'host')?.id ?? ''
    if (lastHost && host !== lastHost) emit('host', { player: host, by: null })
    lastHost = host
  }

  channel.onmessage = (e: MessageEvent<Packet>) => {
    const p = e.data
    if (p.t === 'presence') {
      const known = peers.has(p.p.id)
      peers.set(p.p.id, p.p)
      if (!known) channel.postMessage({ t: 'presence', p: me() } satisfies Packet)
      refresh()
    } else if (p.t === 'msg') {
      if (!p.to || p.to === id) emit('message', { from: p.from, data: p.data, to: p.to })
    } else {
      emit('ended', { reason: 'host', round: 1, results: p.results })
    }
  }
  channel.postMessage({ t: 'presence', p: me() } satisfies Packet)
  window.setInterval(() => {
    channel.postMessage({ t: 'presence', p: me() } satisfies Packet)
    refresh()
  }, 1000)

  return {
    room: {
      // A beat for the other tabs to answer the first presence.
      current: () =>
        new Promise((resolve) => {
          window.setTimeout(() => {
            const seat = members().findIndex((m) => m.id === id)
            resolve({
              id: 'room_dev',
              code: 'DEV123',
              status: 'playing',
              round: 1,
              you: { role: seat === 0 ? 'host' : 'player', seat },
            })
          }, 400)
        }),
      members: () => Promise.resolve(members()),
      // The tabs are always at one table: there is no other room to make or join.
      create: () => Promise.reject(new Error('in_room')),
      join: () => Promise.reject(new Error('in_room')),
      send(data, opts) {
        const packet: Packet = { t: 'msg', from: id, data, to: opts?.to }
        channel.postMessage(packet)
        if (!opts?.to) emit('message', { from: id, data })
      },
      end({ scores }) {
        const results = scores.map((s) => ({ ...s, rank: 1 + scores.filter((o) => o.score > s.score).length }))
        channel.postMessage({ t: 'ended', results } satisfies Packet)
        emit('ended', { reason: 'host', round: 1, results })
        return Promise.resolve()
      },
      on(event, fn) {
        const set = handlers.get(event) ?? new Set()
        set.add(fn)
        handlers.set(event, set)
      },
    },
    player: { me: () => Promise.resolve({ id, nickname: name }) },
    haptic: () => undefined,
    hideSplash: () => undefined,
    close: () => {
      location.reload()
    },
    openExternalUrl: (url) => Promise.resolve(window.open(url, '_blank', 'noopener') !== null),
  }
}
