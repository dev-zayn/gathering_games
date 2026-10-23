import { MafiaRoles } from './MafiaRoles'
import { MafiaRules } from './MafiaRules'

/** المافيا's front door, under the keys into a room: the roles, picked ahead for when this phone hosts. */
export function MafiaDoor() {
  return (
    <>
      <h2 className="mt-2 font-display text-16 font-bold text-ink-soft">جهّز الأدوار قبل لا تسوّي الغرفة</h2>
      <MafiaRoles />
      <MafiaRules />
    </>
  )
}
