import { BackgammonRules } from '@/features/backgammon/components/BackgammonRules'
import { LocalDoor } from '@/features/backgammon/components/LocalDoor'

/** The game's own part of its front door: a match on this phone, and how it is played. */
export function GameDoor({ myName }: { myName: string | null }) {
  return (
    <>
      <LocalDoor myName={myName} />
      <BackgammonRules />
    </>
  )
}
