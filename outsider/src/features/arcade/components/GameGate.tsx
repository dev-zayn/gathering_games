import { useState, type ReactNode } from 'react'
import { GAME } from '../data/games'
import { GameIntro } from './GameIntro'

interface Props {
  children: ReactNode
}

/**
 * Every game route boots through its loading screen. The game mounts right
 * away underneath (setup is ready the instant the tube collapses); the intro
 * just sits on top until «PRESS START».
 */
export function GameGate({ children }: Props) {
  const [booting, setBooting] = useState(true)
  return (
    <>
      {children}
      {booting && (
        <GameIntro
          game={GAME}
          onDone={() => {
            setBooting(false)
          }}
        />
      )}
    </>
  )
}
