// The game, run on the host's phone. This is the old game server's room
// (rooms, seats, the clock, a view per phone) cut down to one round of one
// room: جمعة owns the room itself — who is in it, the code, the start, the
// results — and its relay carries the messages (wire.ts). The engines in
// engine/games are the server's, unchanged: pure functions over plain data.
//
// Secrets stay secret because every phone is sent its own view and nothing
// else. The host's phone holds the whole state, as the server did.

import { ENGINES } from '@engine/games'
import { isRefusal, type Ctx } from '@engine/engine'
import type { OnlineGameId } from '@shared/games'
import type { RoomView } from '@shared/protocol'
import type { Member, Result } from './bridge'
import { Mailer, type Post } from './mailer'
import type { Wire } from './wire'

/** What a host's page keeps across a reload of itself. */
export interface TableSnapshot {
  stage: RoomView['stage']
  state: unknown
  names: Record<string, string>
}

export interface TableOptions {
  game: OnlineGameId
  code: string
  hostId: string
  members: Member[]
  /** Posts a wire message through the relay (`to` null: the whole room). */
  deliver: (post: Post) => void
  /** The host's own view, drawn on this phone. */
  local: (view: RoomView) => void
  /** The host's own move was refused, in Arabic. */
  refused: (message: string) => void
  save?: (snapshot: TableSnapshot) => void
  restore?: TableSnapshot | null
  now?: () => number
}

export class Table {
  private readonly engine
  private stage: RoomView['stage'] = 'lobby'
  private state: unknown = null
  private members: Member[]
  /** Every name the round has seen: a player who left still has one on the scoreboard. */
  private names: Record<string, string> = {}
  /** Phones whose page has asked for its view: a member whose frame is not open cannot play. */
  private readonly ready = new Set<string>()
  /** What each phone was last sent, to send nothing when nothing changed. */
  private readonly sent = new Map<string, string>()
  private readonly mailer: Mailer
  private timer: ReturnType<typeof setTimeout> | null = null
  private readonly now: () => number
  private readonly o: TableOptions

  constructor(o: TableOptions) {
    this.o = o
    this.engine = ENGINES[o.game]
    this.now = o.now ?? Date.now
    this.members = o.members
    this.mailer = new Mailer(o.deliver, this.now)
    this.ready.add(o.hostId)
    if (o.restore) {
      this.stage = o.restore.stage
      this.state = o.restore.state
      this.names = { ...o.restore.names }
    }
    this.learnNames()
  }

  get playing(): boolean {
    return this.stage === 'playing'
  }

  /** Says the host's page is up, then draws everyone's view. */
  open(): void {
    this.mailer.post('hello', null, { k: 'hello' } satisfies Wire)
    this.update()
  }

  dispose(): void {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
    this.mailer.dispose()
  }

  setMembers(members: Member[]): void {
    this.members = members
    this.learnNames()
    this.update()
  }

  /** A message from a phone (the host's own moves come through here too). */
  receive(from: string, wire: Wire): void {
    switch (wire.k) {
      case 'sync':
        this.ready.add(from)
        this.sent.delete(from)
        this.update()
        return
      case 'start':
        this.start(from, wire.options)
        return
      case 'act':
        this.ready.add(from)
        this.act(from, wire.action)
        return
      default:
        return
    }
  }

  /** The round's results, for `room.end`. Null before the game has begun. */
  scores(): Result[] | null {
    if (this.stage !== 'playing') return null
    return this.engine.scores(this.state)
  }

  private start(from: string, options: unknown): void {
    if (from !== this.o.hostId) {
      this.refuse(from, 'بس صاحب الغرفة يبدأ')
      return
    }
    if (this.stage !== 'lobby') return
    const ctx = this.ctx()
    const parsed = this.engine.options(options)
    if (isRefusal(parsed)) {
      this.refuse(from, parsed.error)
      return
    }
    this.state = this.engine.start(ctx, parsed)
    this.stage = 'playing'
    this.mailer.post('notice', null, { k: 'notice', text: 'بدت اللعبة! 🎮' } satisfies Wire)
    this.update()
  }

  private act(from: string, action: unknown): void {
    if (this.stage !== 'playing') return
    const next = this.engine.act(this.state, this.ctx(), from, action)
    if (isRefusal(next)) {
      this.refuse(from, next.error)
      return
    }
    this.state = next
    this.update()
  }

  private refuse(to: string, message: string): void {
    if (to === this.o.hostId) {
      this.o.refused(message)
      return
    }
    this.mailer.post(`error:${to}`, to, { k: 'error', message } satisfies Wire)
  }

  /** In the round: everyone in the room whose page is open and who is online. */
  private ctx(): Ctx {
    const here = this.members.filter((m) => m.connected || m.id === this.o.hostId)
    return {
      ids: here.filter((m) => this.ready.has(m.id)).map((m) => m.id),
      names: this.names,
      connected: new Set(here.filter((m) => this.ready.has(m.id)).map((m) => m.id)),
      hostId: this.o.hostId,
      now: this.now(),
    }
  }

  /** After any change: let the game move on if it can, re-arm its clock, tell everyone. */
  private update(): void {
    if (this.stage === 'playing') {
      this.state = this.engine.settle(this.state, this.ctx())
      this.schedule()
    }
    this.o.save?.({ stage: this.stage, state: this.state, names: this.names })
    this.broadcast()
  }

  private schedule(): void {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
    const at = this.stage === 'playing' ? this.engine.wakeAt?.(this.state) : null
    if (at == null) return
    this.timer = setTimeout(
      () => {
        this.timer = null
        if (this.stage !== 'playing' || !this.engine.wake) return
        this.state = this.engine.wake(this.state, this.ctx())
        this.update()
      },
      Math.max(0, at - this.now()),
    )
  }

  private broadcast(): void {
    const ctx = this.ctx()
    for (const id of ctx.connected) {
      const view = this.viewFor(id, ctx)
      if (id === this.o.hostId) {
        this.o.local(view)
        continue
      }
      // `now` moves on every call; whether anything else did decides the send.
      const key = JSON.stringify({ ...view, now: 0 })
      if (this.sent.get(id) === key) continue
      this.sent.set(id, key)
      this.mailer.post(`view:${id}`, id, { k: 'view', room: view } satisfies Wire)
    }
  }

  private viewFor(id: string, ctx: Ctx): RoomView {
    const game = this.stage === 'playing' ? this.engine.view(this.state, ctx, id) : null
    const seated = new Set(this.members.map((m) => m.id))
    const players = [
      ...[...this.members]
        .sort((a, b) => a.seat - b.seat)
        .map((m) => ({ id: m.id, name: this.names[m.id] ?? m.nickname, connected: ctx.connected.has(m.id) })),
      // A player dealt in who has left the room since keeps their place on the board.
      ...Object.keys(this.names)
        .filter((pid) => !seated.has(pid) && this.dealt(pid))
        .map((pid) => ({ id: pid, name: this.names[pid] ?? '؟', connected: false })),
    ]
    return {
      code: this.o.code,
      game: this.o.game,
      you: id,
      hostId: this.o.hostId,
      players,
      stage: this.stage,
      view: game?.view ?? null,
      yourTurn: game?.yourTurn ?? null,
      now: ctx.now,
    }
  }

  private dealt(id: string): boolean {
    return this.stage === 'playing' && this.engine.scores(this.state).some((s) => s.player === id)
  }

  private learnNames(): void {
    for (const m of this.members) this.names[m.id] = cleanNickname(m.nickname)
  }
}

/** Nicknames are shown raw, on a phone across the table: control characters out, cut to fit. */
function cleanNickname(raw: string): string {
  // eslint-disable-next-line no-control-regex
  const name = raw.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim()
  const letters = Array.from(new Intl.Segmenter('ar', { granularity: 'grapheme' }).segment(name), (s) => s.segment)
  return letters.slice(0, 16).join('') || '؟'
}
