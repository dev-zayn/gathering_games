// The host's outbox. The relay lets a player send 30 frames a second and
// drops the rest without a word (ROOMS.md "Limits"), and one change in a
// sixteen-phone game is fifteen views. So the host keeps under a budget of
// its own: one pending message per phone, the newest replacing the older
// (a view is the whole picture, the last one is all that counts), sent as
// the budget allows, the longest-waiting phone first.

export interface Post {
  to: string | null
  data: unknown
}

const RATE = 20 // frames a second: under the relay's 30, with room for pings
const BURST = 20

export class Mailer {
  private tokens = BURST
  private at: number
  private readonly pending = new Map<string, Post>()
  private timer: ReturnType<typeof setTimeout> | null = null
  private readonly deliver: (post: Post) => void
  private readonly now: () => number

  constructor(deliver: (post: Post) => void, now: () => number = Date.now) {
    this.deliver = deliver
    this.now = now
    this.at = now()
  }

  /** Queues `data` for `to` (null: the whole room), replacing what waited under `key`. */
  post(key: string, to: string | null, data: unknown): void {
    // Re-inserting moves a replaced post to the back of the line: whoever
    // has waited longest goes first.
    this.pending.delete(key)
    this.pending.set(key, { to, data })
    this.flush()
  }

  dispose(): void {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
    this.pending.clear()
  }

  private flush(): void {
    const now = this.now()
    this.tokens = Math.min(BURST, this.tokens + ((now - this.at) / 1000) * RATE)
    this.at = now
    for (const [key, post] of this.pending) {
      if (this.tokens < 1) break
      this.tokens -= 1
      this.pending.delete(key)
      this.deliver(post)
    }
    if (this.pending.size > 0 && !this.timer) {
      this.timer = setTimeout(() => {
        this.timer = null
        this.flush()
      }, Math.ceil(1000 / RATE))
    }
  }
}
