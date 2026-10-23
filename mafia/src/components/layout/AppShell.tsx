import type { ReactNode } from 'react'

interface Props {
  /** A bar over the screen, sticky to the top. */
  hostBar?: ReactNode
  /** The tab bar or a screen's sticky action bar. */
  bottomBar?: ReactNode
  children: ReactNode
}

/**
 * Every screen's frame. On a phone the WINDOW scrolls — <main> grows to fit,
 * and the bars are `sticky` to the viewport edges, so no spacer has to guess
 * their height. On a wide screen the app sits in a phone-width card and <main>
 * becomes the scroller.
 */
export function AppShell({ hostBar, bottomBar, children }: Props) {
  return (
    <div className="min-h-dvh sm:py-4">
      <div className="mx-auto flex min-h-dvh w-full flex-col bg-background sm:h-shell sm:min-h-0 sm:max-w-md sm:overflow-hidden sm:rounded-card sm:border sm:border-hairline">
        {hostBar}
        <main data-scroll-area className="flex flex-1 flex-col sm:min-h-0 sm:overflow-y-auto">
          {children}
        </main>
        {bottomBar}
      </div>
    </div>
  )
}
