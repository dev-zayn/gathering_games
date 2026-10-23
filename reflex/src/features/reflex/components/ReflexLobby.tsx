import { PLAYER_LIMITS } from '@shared/games'
import { StartBar } from '@/features/room/components/StartBar'
import { realtime } from '@/lib/realtime/connection'
import { reflexStore } from '../reflex-store'
import { ReflexRules } from './ReflexRules'
import { TargetPicker } from './TargetPicker'

interface Props {
  isHost: boolean
  present: number
}

/** أسرع إصبع's lobby: the host sets the target; everyone reads how it goes. */
export function ReflexLobby({ isHost, present }: Props) {
  return (
    <>
      {isHost && <TargetPicker />}
      <ReflexRules />
      <StartBar
        isHost={isHost}
        present={present}
        min={PLAYER_LIMITS.reflex.min}
        onStart={() => {
          realtime.start(reflexStore.get())
        }}
      />
    </>
  )
}
