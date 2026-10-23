import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LazyMotion, domMax } from 'framer-motion'
import { Direction } from 'radix-ui'
import './index.css'
import { Toaster } from '@/components/feedback/Toaster'
import { GameGate } from '@/features/arcade/components/GameGate'
import { RoomScreen } from '@/features/room/components/RoomScreen'

// App-like touch: suppress the webview's long-press context menu (save image /
// open link) on cards and illustrations — Android Chromium ignores
// `-webkit-touch-callout`. Form fields are exempt so paste still works.
document.addEventListener('contextmenu', (e) => {
  const el = e.target
  if (el instanceof Element && el.closest('input, textarea, [contenteditable="true"]')) return
  e.preventDefault()
})

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      {/* Radix stamps its own `dir` on every group it renders (toggle groups,
          radio groups, tabs) and defaults to LTR — which reverses their order
          and arrow-key navigation inside an Arabic page. */}
      <Direction.DirectionProvider dir="rtl">
        {/* One bundle per game, nothing fetched later: the full feature set
            up front (the segmented tabs' sliding pill uses `layoutId`). */}
        <LazyMotion features={domMax}>
          <Toaster />
          {/* Every game boots through its poster loading screen. */}
          <GameGate><RoomScreen game="mafia" /></GameGate>
        </LazyMotion>
      </Direction.DirectionProvider>
    </StrictMode>,
  )
}
