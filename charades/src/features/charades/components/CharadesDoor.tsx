import { CharadesRules } from './CharadesRules'
import { CharadesSettings } from './CharadesSettings'

/** مثّلها's front door, under the keys into a room: the settings, picked ahead for when this phone hosts. */
export function CharadesDoor() {
  return (
    <>
      <h2 className="mt-2 font-display text-16 font-bold text-ink-soft">جهّز اللعبة قبل لا تسوّي الغرفة</h2>
      <CharadesSettings />
      <CharadesRules />
    </>
  )
}
