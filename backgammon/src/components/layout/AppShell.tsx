import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

/**
 * Every screen's frame. On a phone the WINDOW scrolls and <main> grows to
 * fit; on a wide screen the game sits in a phone-width card and <main>
 * becomes the scroller.
 */
export function AppShell({ children }: Props) {
  return (
    <div className="min-h-dvh cafe-ground sm:py-4">
      <div className="mx-auto flex min-h-dvh w-full flex-col sm:h-shell sm:min-h-0 sm:max-w-md sm:overflow-hidden sm:rounded-sheet sm:border sm:border-hairline">
        <main data-scroll-area className="flex flex-1 flex-col sm:min-h-0 sm:overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
