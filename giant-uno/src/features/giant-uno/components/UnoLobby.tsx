import { PLAYER_LIMITS } from '@shared/games'
import { StartBar } from '@/features/room/components/StartBar'
import { realtime } from '@/lib/realtime/connection'
import { unoStore } from '../uno-store'
import { OptionsPicker } from './OptionsPicker'
import { UnoRules } from './UnoRules'

interface Props {
  isHost: boolean
  present: number
}

/** بقت وحدة!'s lobby: the host sets the game up; everyone else reads how it goes. */
export function UnoLobby({ isHost, present }: Props) {
  return (
    <>
      {isHost ? <OptionsPicker /> : <UnoRules />}
      <StartBar
        isHost={isHost}
        present={present}
        min={PLAYER_LIMITS['giant-uno'].min}
        onStart={() => {
          realtime.start(unoStore.get())
        }}
      />
    </>
  )
}
