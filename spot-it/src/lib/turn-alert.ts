// «YOUR TURN»: a buzz, an 8-bit chime and a blinking title. A phone whose
// game is not on screen hears nothing: گعدة keeps a playing room's frame up.

import { haptic } from '@/lib/miniapp'

let audio: AudioContext | null = null

// Browsers only let audio start after a gesture — unlock on the first tap.
function unlock() {
  try {
    audio ??= new AudioContext()
    void audio.resume()
  } catch {
    // No Web Audio here.
  }
}
window.addEventListener('pointerdown', unlock, { once: true, passive: true })

/** A rising three-note square-wave arpeggio — the arcade's «your go». */
export function chime(): void {
  if (audio?.state !== 'running') return
  const t0 = audio.currentTime
  ;[523.25, 659.25, 1046.5].forEach((freq, i) => {
    if (!audio) return
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.type = 'square'
    osc.frequency.value = freq
    const at = t0 + i * 0.09
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(0.08, at + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.12)
    osc.connect(gain).connect(audio.destination)
    osc.start(at)
    osc.stop(at + 0.13)
  })
}

let titleTimer = 0
let baseTitle = ''

/** Blinks the tab title until the page is looked at again. */
function flashTitle(text: string) {
  if (!document.hidden) return
  window.clearInterval(titleTimer)
  baseTitle = baseTitle || document.title
  let on = false
  titleTimer = window.setInterval(() => {
    on = !on
    document.title = on ? `🔔 ${text}` : baseTitle
  }, 900)
  const stop = () => {
    window.clearInterval(titleTimer)
    document.title = baseTitle
    baseTitle = ''
    document.removeEventListener('visibilitychange', stop)
  }
  document.addEventListener('visibilitychange', stop)
}

/** Fire everything for a fresh turn. */
export function alertTurn(text: string): void {
  haptic('long')
  chime()
  flashTitle(text)
}
