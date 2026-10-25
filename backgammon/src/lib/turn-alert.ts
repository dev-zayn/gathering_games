// «دورك»: a light buzz, the tea glass, and a title that blinks while the
// page is out of sight. A phone whose game is not on screen hears nothing:
// گعدة keeps a playing room's frame up.

import { haptic } from '@/lib/miniapp'
import { ting } from '@/lib/sound'

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
  haptic('short')
  ting()
  flashTitle(text)
}
