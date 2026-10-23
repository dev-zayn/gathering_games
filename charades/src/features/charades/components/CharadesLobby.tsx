import { PLAYER_LIMITS } from '@shared/games'
import { StartBar } from '@/features/room/components/StartBar'
import { realtime } from '@/lib/realtime/connection'
import { charadesStore, useCharadesOptions } from '../charades-store'
import { CharadesRules } from './CharadesRules'
import { CharadesSettings } from './CharadesSettings'

interface Props {
  isHost: boolean
  present: number
}

/** مثّلها's setup in the room: turn length, turns per team, word decks. Teams are drawn at start. */
export function CharadesLobby({ isHost, present }: Props) {
  const opts = useCharadesOptions()
  return (
    <>
      <div className="flex flex-col gap-4">
        <CharadesRules />
        {isHost && <CharadesSettings />}
      </div>
      <StartBar
        isHost={isHost}
        present={present}
        min={PLAYER_LIMITS.charades.min}
        disabled={opts.decks.length === 0}
        onStart={() => {
          realtime.start(charadesStore.get())
        }}
      />
    </>
  )
}
