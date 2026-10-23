// The host's clock on a guest's phone, the way NTP reads a server's: ask
// the time, note the round trip, and take the host's answer as half a trip
// old. A view's own `now` is a whole one-way trip old, which is the very
// lag a race must not reward. The fastest of the recent samples wins: a
// trip the relay or the host's outbox held up says least about the clock.

const KEEP = 8
const BURST = 5
const BURST_GAP_MS = 300
const EVERY_MS = 4000

interface Sample {
  rtt: number
  offset: number
}

export class HostClock {
  private samples: Sample[] = []
  private timer = 0
  private left = 0
  private readonly ping: (t: number) => void
  private readonly changed: (offset: number) => void

  constructor(ping: (t: number) => void, changed: (offset: number) => void) {
    this.ping = ping
    this.changed = changed
  }

  /** hostNow − Date.now(), once a pong has come back. */
  get offset(): number | null {
    const best = this.samples.reduce<Sample | null>((a, s) => (a && a.rtt <= s.rtt ? a : s), null)
    return best?.offset ?? null
  }

  /** A few quick pings (on joining, after a reconnect), then one every few seconds. */
  burst(): void {
    this.left = BURST
    this.tick()
  }

  stop(): void {
    window.clearTimeout(this.timer)
    this.timer = 0
  }

  pong(t: number, now: number): void {
    const back = Date.now()
    const rtt = back - t
    if (!Number.isFinite(rtt) || rtt < 0) return
    this.samples = [...this.samples, { rtt, offset: now + rtt / 2 - back }].slice(-KEEP)
    const offset = this.offset
    if (offset !== null) this.changed(offset)
  }

  private tick(): void {
    window.clearTimeout(this.timer)
    this.ping(Date.now())
    this.left = Math.max(0, this.left - 1)
    this.timer = window.setTimeout(
      () => {
        this.tick()
      },
      this.left > 0 ? BURST_GAP_MS : EVERY_MS,
    )
  }
}
