import { useSyncExternalStore } from 'react'
import type { OnlineGameId } from '@shared/games'
import type { RoomView } from '@shared/protocol'
import { bridge, codeOf, type Gathering, type Member, type Player, type Result, type RoomMatch } from '@/lib/gathering/bridge'
import { Table, type TableSnapshot } from '@/lib/gathering/table'
import { readWire, type Wire } from '@/lib/gathering/wire'
import { toast } from '@/lib/toast-store'
import { alertTurn } from '@/lib/turn-alert'

// This phone's place in the round, over گعدة's room (lib/gathering). The
// host's phone runs the game (`Table`); every other phone asks it for its
// view and sends it moves. The screens read one snapshot either way, the
// same `RoomView` the old game server sent.

export type Status = 'idle' | 'connecting' | 'open' | 'reconnecting'

export type Phase =
  /** Reading the room. */
  | 'booting'
  /** Opened outside a room, or once its round was over. */
  | 'no-room'
  /** In the round, waiting for the host's page to answer. */
  | 'waiting'
  | 'live'
  /** The round is over: گعدة shows its results in the room's lobby. */
  | 'ended'

export interface Snapshot {
  phase: Phase
  status: Status
  room: RoomView | null
  /** Unused since the room is گعدة's; kept for the screens that read it. */
  fatal: string | null
  /** hostNow − clientNow, so countdowns agree across phones. */
  clockOffset: number
  /** The latest turn prompt; `id` bumps per prompt. */
  turn: { text: string; id: number } | null
  results: Result[] | null
  /** The app's signed-in player; null in a plain browser. */
  me: Player | null
  /** Inside گعدة (rooms can be made and joined from here), not a plain browser. */
  inApp: boolean
  /** The app has tournaments: they can be made and joined from the front door. */
  tournaments: boolean
  /** The tournament match this room plays, its tally as the app last counted it. */
  match: RoomMatch | null
}

let snapshot: Snapshot = {
  phase: 'booting',
  status: 'connecting',
  room: null,
  fatal: null,
  clockOffset: 0,
  turn: null,
  results: null,
  me: null,
  inApp: false,
  tournaments: false,
  match: null,
}
const listeners = new Set<() => void>()

let g: Gathering | null = null
let me = ''
let hostId = ''
let roomKey = ''
let table: Table | null = null
let syncTimer = 0

function set(patch: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...patch }
  listeners.forEach((l) => {
    l()
  })
}

/** A view arrived (from the host's page, or this page's own table). */
function show(room: RoomView, clockOffset: number) {
  window.clearInterval(syncTimer)
  const turn = room.yourTurn
  if (turn && turn !== snapshot.room?.yourTurn) {
    alertTurn(turn)
    set({ turn: { text: turn, id: (snapshot.turn?.id ?? 0) + 1 } })
  }
  // The move is made: the takeover goes with it (it covers the seats, and a catch).
  if (!turn && snapshot.turn) set({ turn: null })
  set({ room, clockOffset, phase: snapshot.phase === 'ended' ? 'ended' : 'live' })
}

function post(data: Wire, to?: string) {
  g?.room.send(data, to ? { to } : undefined)
}

/** Guests ask the host for their view until it comes: the host's page may open after theirs. */
function askForView() {
  window.clearInterval(syncTimer)
  post({ k: 'sync' }, hostId)
  syncTimer = window.setInterval(() => {
    post({ k: 'sync' }, hostId)
  }, 2000)
}

function loadSnapshot(): TableSnapshot | null {
  try {
    const raw = localStorage.getItem(roomKey)
    return raw ? (JSON.parse(raw) as TableSnapshot) : null
  } catch {
    return null
  }
}

function saveSnapshot(s: TableSnapshot | null) {
  try {
    if (s) localStorage.setItem(roomKey, JSON.stringify(s))
    else localStorage.removeItem(roomKey)
  } catch {
    // No storage: a reload of the host's page loses the round.
  }
}

function hostTable(game: OnlineGameId, code: string, members: Member[], restore: TableSnapshot | null) {
  table?.dispose()
  table = new Table({
    game,
    code,
    hostId: me,
    members,
    deliver: (p) => {
      g?.room.send(p.data, p.to ? { to: p.to } : undefined)
      // The room hears the host's notices; the host would only hear its own echo.
      const wire = readWire(p.data)
      if (wire?.k === 'notice') toast.info(wire.text)
    },
    local: (view) => {
      show(view, 0)
    },
    refused: (message) => {
      toast.error(message)
    },
    save: saveSnapshot,
    restore,
  })
  table.open()
}

function onMessage(from: string, data: unknown, to: string | undefined) {
  const wire = readWire(data)
  // A phone hears its own messages to the room: skip them.
  if (!wire || (from === me && !to)) return
  if (table) {
    table.receive(from, wire)
    return
  }
  if (from !== hostId) return
  switch (wire.k) {
    case 'hello':
      if (!snapshot.room) askForView()
      else post({ k: 'sync' }, hostId)
      return
    case 'view':
      show(wire.room, wire.room.now - Date.now())
      return
    case 'error':
      toast.error(wire.message)
      return
    case 'notice':
      toast.info(wire.text)
      return
    default:
      return
  }
}

let joining: Promise<void> | null = null

/** Reads the room this page was opened into and takes its place in the round, once per page. */
export function joinRound(game: OnlineGameId): Promise<void> {
  joining ??= join(game)
  return joining
}

async function join(game: OnlineGameId): Promise<void> {
  g = await bridge()
  const info = await g?.room.current().catch(() => null)
  if (!g || info?.status !== 'playing') {
    // Opened on its own: the front door, with the way into a room.
    const self = await g?.player.me().catch(() => null)
    set({ phase: 'no-room', status: 'idle', me: self ?? null, inApp: !!g, tournaments: !!g?.tournament })
    g?.hideSplash()
    return
  }
  const members = await g.room.members()
  const self = await g.player.me().catch(() => null)
  me = self?.id ?? members.find((m) => m.seat === info.you.seat)?.id ?? ''
  hostId = members.find((m) => m.role === 'host')?.id ?? ''
  roomKey = `arcade.table.${info.id}.${String(info.round)}`
  set({ phase: 'waiting', status: 'open', match: info.tournament ?? null })
  g.hideSplash()

  g.room.on('message', (d) => {
    onMessage(d.from, d.data, d.to)
  })
  g.room.on('members', (list) => {
    table?.setMembers(list)
  })
  g.room.on('host', (d) => {
    hostId = d.player
    if (d.player !== me || table) return
    // The host left with the game on their phone. A game not begun moves to
    // this phone; one under way cannot, so the round ends here.
    if (snapshot.room?.stage === 'playing') {
      toast.info('صاحب الغرفة طلع، وانتهت الجولة')
      void g?.room.end({ scores: [] }).catch(() => undefined)
      return
    }
    void g?.room.members().then((list) => {
      hostTable(game, info.code, list, null)
    })
  })
  g.room.on('ended', (d) => {
    window.clearInterval(syncTimer)
    table?.dispose()
    table = null
    saveSnapshot(null)
    set({ phase: 'ended', results: d.results, turn: null })
    // The app counts a match room's round as it closes: its tally a moment later.
    if (snapshot.match) window.setTimeout(readMatch, 1500)
  })
  g.room.on('connection', (d) => {
    const status: Status = d.state === 'open' ? 'open' : d.state === 'closed' ? 'idle' : 'reconnecting'
    set({ status })
    // Back on the relay: whatever the host sent meanwhile may be gone.
    if (d.state === 'open' && !table && snapshot.phase !== 'ended') post({ k: 'sync' }, hostId)
  })

  if (hostId === me) hostTable(game, info.code, members, loadSnapshot())
  else askForView()
}

/** The match as the app now has it. */
function readMatch() {
  void g?.room.current().then(
    (info) => {
      if (info?.tournament) set({ match: info.tournament })
    },
    () => undefined,
  )
}

export const realtime = {
  /** The host's start, with the game's options. */
  start: (options: unknown) => {
    table?.receive(me, { k: 'start', options })
  },
  act: (action: unknown) => {
    if (table) table.receive(me, { k: 'act', action })
    else post({ k: 'act', action }, hostId)
  },
  /** The host ends the round: گعدة ranks the scores and shows them in the room. */
  async finish(): Promise<void> {
    if (!g || !table) return
    try {
      await g.room.end({ scores: table.scores() ?? [] })
    } catch {
      toast.error('ما گدرنا ننهي الجولة، جرّب مرة ثانية')
    }
  },
  /**
   * Into a room from the front door: `create` makes one with this phone as
   * host, `join` opens the app's Join sheet for this game. The app then puts
   * the room's lobby in this page's place. Resolves the room's code, or
   * rejects with the bridge's bare code (`cancelled`, `in_another_room`…).
   */
  async enter(kind: 'create' | 'join', visibility: 'private' | 'friends' = 'private'): Promise<string> {
    if (!g) throw new Error('not_supported')
    g.haptic('light')
    try {
      const room = kind === 'create' ? await g.room.create({ visibility }) : await g.room.join()
      return room.code
    } catch (e) {
      throw new Error(codeOf(e), { cause: e })
    }
  },
  /**
   * Into a tournament from the front door: `create` opens the app's sheet
   * to make one of this game (a knockout or a league: it seats two, so the
   * sheet asks), `join` its sheet for a tournament's code. The tournament's
   * page then takes this page's place. Resolves its code, or rejects with
   * the bridge's bare code.
   */
  async enterTournament(kind: 'create' | 'join'): Promise<string> {
    const t = g?.tournament
    if (!t) throw new Error('not_supported')
    g?.haptic('light')
    try {
      const made = kind === 'create' ? await t.create() : await t.join()
      return made.code
    } catch (e) {
      throw new Error(codeOf(e), { cause: e })
    }
  },
  /** The tournament over the game, from a match room. */
  openTournament() {
    g?.haptic('light')
    void g?.tournament?.open().catch(() => undefined)
  },
  dismissTurn() {
    set({ turn: null })
  },
  /** Back to گعدة: the frame closes, the room stays. */
  close() {
    g?.close()
  },
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export function useRealtime(): Snapshot {
  return useSyncExternalStore(subscribe, () => snapshot)
}
