// طاولي's sounds, made on the spot (Web Audio, nothing fetched): a checker
// clacking down on wood, the thud of one knocked to the bar, the dice
// rattling, and a spoon against a tea glass when it is your turn. Silent
// until the first touch (browsers allow audio only after a gesture), and
// never a throw: sound is garnish.

let audio: AudioContext | null = null

function unlock() {
  try {
    audio ??= new AudioContext()
    void audio.resume()
  } catch {
    // No Web Audio here.
  }
}
window.addEventListener('pointerdown', unlock, { passive: true })

const ready = (): AudioContext | null => (audio?.state === 'running' ? audio : null)

/** A short burst of filtered noise: the body of every knock. */
function knock(ctx: AudioContext, at: number, freq: number, q: number, gainPeak: number, length: number) {
  const frames = Math.max(1, Math.floor(ctx.sampleRate * length))
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames) ** 3
  const src = ctx.createBufferSource()
  src.buffer = buffer
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = freq
  band.Q.value = q
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(gainPeak, at)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length)
  src.connect(band).connect(gain).connect(ctx.destination)
  src.start(at)
}

/** A low sine that drops fast: the wood's weight under the knock. */
function thump(ctx: AudioContext, at: number, from: number, to: number, peak: number, length: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(from, at)
  osc.frequency.exponentialRampToValueAtTime(to, at + length)
  gain.gain.setValueAtTime(peak, at)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length)
  osc.connect(gain).connect(ctx.destination)
  osc.start(at)
  osc.stop(at + length + 0.02)
}

/** A checker set down, `delay` seconds from now. */
export function clack(delay = 0): void {
  const ctx = ready()
  if (!ctx) return
  const at = ctx.currentTime + delay
  knock(ctx, at, 2300, 1.4, 0.32, 0.05)
  thump(ctx, at, 320, 140, 0.16, 0.07)
}

/** A checker knocked to the bar. */
export function thud(delay = 0): void {
  const ctx = ready()
  if (!ctx) return
  const at = ctx.currentTime + delay
  knock(ctx, at, 900, 0.9, 0.3, 0.09)
  thump(ctx, at, 160, 60, 0.3, 0.16)
}

/** The dice shaken and thrown: a handful of bone-on-wood clicks. */
export function rattle(): void {
  const ctx = ready()
  if (!ctx) return
  const t0 = ctx.currentTime
  for (let i = 0; i < 7; i++) {
    const at = t0 + i * 0.045 + Math.random() * 0.03
    knock(ctx, at, 3200 + Math.random() * 1400, 2.2, 0.16 * (1 - i / 9), 0.03)
  }
  knock(ctx, t0 + 0.38, 2600, 1.6, 0.22, 0.05)
  knock(ctx, t0 + 0.47, 2400, 1.6, 0.14, 0.04)
}

/** A spoon against an istikan: two bright partials, a long fade. */
export function ting(): void {
  const ctx = ready()
  if (!ctx) return
  const t0 = ctx.currentTime
  ;[
    [2637, 0.07],
    [3951, 0.035],
    [5274, 0.015],
  ].forEach(([freq = 0, peak = 0], i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    const at = t0 + i * 0.004
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(peak, at + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.9)
    osc.connect(gain).connect(ctx.destination)
    osc.start(at)
    osc.stop(at + 0.95)
  })
}
