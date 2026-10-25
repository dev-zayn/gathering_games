import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LazyMotion, domMax } from 'framer-motion'
import { Direction } from 'radix-ui'
import './index.css'
import { App } from '@/App'
import { Toaster } from '@/components/feedback/Toaster'
import { IntroGate } from '@/features/intro/IntroGate'

// App-like touch: suppress the webview's long-press context menu on the
// board and the art — Android Chromium ignores `-webkit-touch-callout`.
// Form fields are exempt so paste still works.
document.addEventListener('contextmenu', (e) => {
  const el = e.target
  if (el instanceof Element && el.closest('input, textarea, [contenteditable="true"]')) return
  e.preventDefault()
})

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      {/* Radix stamps its own `dir` on every group it renders and defaults to
          LTR, which reverses toggle groups inside an Arabic page. */}
      <Direction.DirectionProvider dir="rtl">
        {/* One bundle, nothing fetched later: the full motion set up front
            (the cube slides between places with `layoutId`). */}
        <LazyMotion features={domMax}>
          <Toaster />
          {/* The box opens over the game, which is already mounted under it. */}
          <IntroGate>
            <App />
          </IntroGate>
        </LazyMotion>
      </Direction.DirectionProvider>
    </StrictMode>,
  )
}
