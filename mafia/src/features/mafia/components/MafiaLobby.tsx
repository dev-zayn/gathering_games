import { PLAYER_LIMITS } from '@shared/games'
import { StartBar } from '@/features/room/components/StartBar'
import { realtime } from '@/lib/realtime/connection'
import { mafiaStore } from '../mafia-store'
import { MafiaRoles } from './MafiaRoles'
import { MafiaRules } from './MafiaRules'

interface Props {
  isHost: boolean
  present: number
}

/** المافيا's setup in the room: the special roles, the resulting cast, the rules. */
export function MafiaLobby({ isHost, present }: Props) {
  return (
    <>
      <div className="flex flex-col gap-4">
        {isHost && <MafiaRoles present={present} />}
        <MafiaRules />
      </div>
      <StartBar
        isHost={isHost}
        present={present}
        min={PLAYER_LIMITS.mafia.min}
        onStart={() => {
          realtime.start(mafiaStore.get())
        }}
      />
    </>
  )
}
