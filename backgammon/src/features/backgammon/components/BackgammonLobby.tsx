import { PLAYER_LIMITS } from '@shared/games'
import { StartBar } from '@/features/room/components/StartBar'
import { realtime } from '@/lib/realtime/connection'
import { optionsStore } from '../options-store'
import { BackgammonRules } from './BackgammonRules'
import { OptionsPicker } from './OptionsPicker'

interface Props {
  isHost: boolean
  present: number
}

/** The room's lobby: the host sets the match up; the other side reads how it goes. */
export function BackgammonLobby({ isHost, present }: Props) {
  return (
    <>
      {isHost ? (
        <section className="flex flex-col gap-3 rounded-card border border-hairline bg-slab p-4 shadow-slab">
          <h2 className="text-16 font-semibold text-ink">المباراة</h2>
          <OptionsPicker />
        </section>
      ) : (
        <BackgammonRules />
      )}
      <StartBar
        isHost={isHost}
        present={present}
        min={PLAYER_LIMITS.backgammon.min}
        onStart={() => {
          realtime.start(optionsStore.get())
        }}
      />
    </>
  )
}
