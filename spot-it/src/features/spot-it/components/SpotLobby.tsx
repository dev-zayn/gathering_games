import { PLAYER_LIMITS } from '@shared/games'
import { StartBar } from '@/features/room/components/StartBar'
import { realtime } from '@/lib/realtime/connection'
import { spotStore } from '../spot-store'
import { ModePicker } from './ModePicker'
import { SpotRules } from './SpotRules'

interface Props {
  isHost: boolean
  present: number
}

/** لگطها's lobby: the host picks the mini-game; everyone else reads how they all go. */
export function SpotLobby({ isHost, present }: Props) {
  return (
    <>
      {isHost ? <ModePicker /> : <SpotRules />}
      <StartBar
        isHost={isHost}
        present={present}
        min={PLAYER_LIMITS['spot-it'].min}
        onStart={() => {
          realtime.start(spotStore.get())
        }}
      />
    </>
  )
}
