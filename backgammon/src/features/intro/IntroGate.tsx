import { useState, type ReactNode } from 'react'
import { BoxIntro } from './BoxIntro'

/** The game mounts at once underneath (the room connects meanwhile); the box sits on top until it is opened. */
export function IntroGate({ children }: { children: ReactNode }) {
  const [closed, setClosed] = useState(true)
  return (
    <>
      {children}
      {closed && (
        <BoxIntro
          onDone={() => {
            setClosed(false)
          }}
        />
      )}
    </>
  )
}
