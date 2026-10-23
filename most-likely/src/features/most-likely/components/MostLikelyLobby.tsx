import { PLAYER_LIMITS } from '@shared/games'
import { StartBar } from '@/features/room/components/StartBar'
import { realtime } from '@/lib/realtime/connection'
import { MostLikelyRules } from './MostLikelyRules'

interface Props {
  isHost: boolean
  present: number
}

/** منو أكثر واحد؟'s lobby — nothing to set, just the rules. */
export function MostLikelyLobby({ isHost, present }: Props) {
  return (
    <>
      <MostLikelyRules />
      <StartBar
        isHost={isHost}
        present={present}
        min={PLAYER_LIMITS['most-likely'].min}
        onStart={() => {
          realtime.start(null)
        }}
      />
    </>
  )
}
