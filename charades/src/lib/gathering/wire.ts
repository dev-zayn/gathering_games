// What the pages of one round say to each other through `room.send`. The
// host's page runs the game (table.ts); everyone else's page sends it
// intents and draws the view it gets back. A view is sent to its own phone
// only (`send(…, { to })`), so a secret never reaches a phone it is not for.

import type { RoomView } from '@shared/protocol'

export type Wire =
  /** Host → room: my page is up; send me `sync` if you have no view yet. */
  | { k: 'hello' }
  /** Phone → host: my page is up, send me my view. */
  | { k: 'sync' }
  /** Phone → host: the host's start (options) or a move. */
  | { k: 'start'; options: unknown }
  | { k: 'act'; action: unknown }
  /** Host → one phone: your view of the room. */
  | { k: 'view'; room: RoomView }
  /** Host → one phone: your last move was refused, in Arabic. */
  | { k: 'error'; message: string }
  /** Host → room: a line for everyone («بدت اللعبة»). */
  | { k: 'notice'; text: string }

const KINDS = new Set(['hello', 'sync', 'start', 'act', 'view', 'error', 'notice'])

/** Messages arrive as untrusted JSON from any member of the room. */
export function readWire(raw: unknown): Wire | null {
  if (typeof raw !== 'object' || raw === null) return null
  const k = (raw as { k?: unknown }).k
  return typeof k === 'string' && KINDS.has(k) ? (raw as Wire) : null
}
