import { describe, expect, test } from 'bun:test'
import { isRefusal, type Ctx } from '@engine/engine'
import { MIN_MS, RESULT_MS, START_LEAD_MS, TAP_WINDOW_MS, WAIT_MAX_MS, reflex } from '@engine/games/reflex'
import type { ReflexView } from '@shared/protocol'

// أسرع إصبع's rules on a clock of the test's own: the engine is pure, so a
// whole match plays in a loop, every tap arriving where the test says.

function tableAt(players: number, target = 3) {
  const ids = Array.from({ length: players }, (_, i) => `ply_${String(i)}`)
  const connected = new Set(ids)
  let now = 1_000_000
  const ctx = (): Ctx => ({
    ids,
    names: Object.fromEntries(ids.map((id, i) => [id, `P${String(i)}`])),
    connected,
    hostId: 'ply_0',
    now,
  })
  const options = reflex.options({ target })
  if (isRefusal(options)) throw new Error(options.error)
  let s = reflex.start(ctx(), options)
  const view = (id: string): ReflexView => reflex.view(s, ctx(), id).view
  return {
    ids,
    connected,
    get s() {
      return s
    },
    view,
    /** The clock moves on, and the host's timers with it. */
    to(at: number) {
      now = at
      s = reflex.settle(s, ctx())
    },
    /** To the signal of the draw on now. */
    toSignal() {
      this.to(view('ply_0').goAt)
    },
    tap(id: string, action: Record<string, unknown>) {
      const r = reflex.act(s, ctx(), id, { type: 'tap', ...action })
      if (!isRefusal(r)) s = r
      s = reflex.settle(s, ctx())
      return r
    },
    get now() {
      return now
    },
  }
}

describe('a draw', () => {
  test('arms with a random wait after the start, so nobody can count the signal in', () => {
    const t = tableAt(3)
    const v = t.view('ply_1')
    expect(v.phase).toBe('draw')
    expect(v.goAt).toBeGreaterThanOrEqual(t.now + START_LEAD_MS)
    expect(v.goAt).toBeLessThanOrEqual(t.now + START_LEAD_MS + WAIT_MAX_MS)
    expect(v.until).toBe(v.goAt + TAP_WINDOW_MS)
  })

  test('the fastest time takes the point, timed on its phone, not by when it arrived', () => {
    const t = tableAt(3)
    t.toSignal()
    t.to(t.now + 400)
    // P1's time arrives first but is slower than P2's.
    t.tap('ply_1', { ms: 310 })
    t.tap('ply_2', { ms: 240 })
    t.tap('ply_0', { ms: 280 })
    const v = t.view('ply_2')
    expect(v.phase).toBe('result')
    expect(v.rows.map((r) => [r.name, r.won])).toEqual([
      ['P2', true],
      ['P0', false],
      ['P1', false],
    ])
    expect(v.standings[0]).toMatchObject({ name: 'P2', points: 1, best: 240, you: true })
  })

  test('a tap before the signal, or quicker than a human, is a false start', () => {
    const t = tableAt(3)
    t.tap('ply_1', { early: true })
    t.tap('ply_2', { ms: 400 }) // arrives before the signal: it cannot have seen it
    t.toSignal()
    t.tap('ply_0', { ms: MIN_MS - 1 })
    const v = t.view('ply_0')
    expect(v.phase).toBe('result')
    expect(v.rows.every((r) => r.tap.kind === 'foul' && !r.won)).toBe(true)
    expect(v.standings.every((s) => s.points === 0)).toBe(true)
  })

  test('the first tap counts; whoever never taps misses when the draw runs out', () => {
    const t = tableAt(3)
    t.toSignal()
    t.tap('ply_1', { ms: 300 })
    t.tap('ply_1', { ms: 150 })
    expect(t.view('ply_1').yours).toEqual({ kind: 'time', ms: 300 })
    t.to(t.view('ply_0').until)
    const v = t.view('ply_0')
    expect(v.rows.find((r) => r.name === 'P0')?.tap).toEqual({ kind: 'miss' })
    expect(v.rows.find((r) => r.name === 'P1')?.won).toBe(true)
  })

  test('a player who left is not waited for', () => {
    const t = tableAt(3)
    t.connected.delete('ply_2')
    t.toSignal()
    t.tap('ply_0', { ms: 250 })
    t.tap('ply_1', { ms: 260 })
    expect(t.view('ply_0').phase).toBe('result')
  })

  test('a watcher cannot tap; the next draw arms after the table has been read', () => {
    const t = tableAt(2)
    expect(isRefusal(reflex.act(t.s, { ids: [], names: {}, connected: new Set(), hostId: 'ply_0', now: 0 }, 'ply_9', { type: 'tap', ms: 200 }))).toBe(true)
    t.toSignal()
    t.tap('ply_0', { ms: 250 })
    t.tap('ply_1', { ms: 260 })
    expect(t.view('ply_0').draw).toBe(1)
    t.to(t.now + RESULT_MS)
    const v = t.view('ply_0')
    expect(v.phase).toBe('draw')
    expect(v.draw).toBe(2)
    expect(v.yours).toBeNull()
  })
})

describe('a match', () => {
  test('first to the target wins; the points are گعدة’s scores', () => {
    const t = tableAt(3, 3)
    for (let draw = 0; draw < 10 && t.s.phase !== 'over'; draw++) {
      if (t.s.phase === 'result') t.to(t.s.until)
      t.toSignal()
      t.tap('ply_0', { ms: 300 })
      t.tap('ply_1', { ms: draw % 2 ? 200 : 350 })
      t.tap('ply_2', { ms: 220 })
    }
    expect(t.s.phase).toBe('over')
    expect(t.view('ply_0').winners).toEqual(['P2'])
    expect(reflex.scores(t.s)).toEqual([
      { player: 'ply_0', score: 0 },
      { player: 'ply_1', score: 2 },
      { player: 'ply_2', score: 3 },
    ])
    expect(reflex.wakeAt?.(t.s)).toBeNull()
  })

  test('only 3, 5 or 7 points to win', () => {
    expect(isRefusal(reflex.options({ target: 4 }))).toBe(true)
    expect(reflex.options({ target: 7 })).toEqual({ target: 7 })
  })
})
