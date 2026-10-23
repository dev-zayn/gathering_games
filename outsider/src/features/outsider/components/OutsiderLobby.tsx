import { PLAYER_LIMITS } from '@shared/games'
import type { OutsiderOptions } from '@shared/protocol'
import { StartBar } from '@/features/room/components/StartBar'
import { realtime } from '@/lib/realtime/connection'
import { customStore, enabledStore } from '../outsider-store'
import { CategoryPicker } from './CategoryPicker'
import { CustomCategories } from './CustomCategories'
import { HowToPlay } from './HowToPlay'

interface Props {
  isHost: boolean
  present: number
}

/** برا السالفة's lobby: the host picks the categories (their own included). */
export function OutsiderLobby({ isHost, present }: Props) {
  const start = () => {
    const options: OutsiderOptions = { enabled: enabledStore.get(), custom: customStore.get() }
    realtime.start(options)
  }
  return (
    <>
      <div className="flex flex-col gap-4">
        {isHost && <CategoryPicker />}
        {isHost && <CustomCategories />}
        <HowToPlay />
      </div>
      <StartBar isHost={isHost} present={present} min={PLAYER_LIMITS.outsider.min} onStart={start} />
    </>
  )
}
