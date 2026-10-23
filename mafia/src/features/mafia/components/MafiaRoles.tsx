import { ROLES, mafiaCount } from '@shared/data/mafia-roles'
import { PLAYER_LIMITS } from '@shared/games'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { mafiaStore, useMafiaOptions } from '../mafia-store'

interface Props {
  /** Players in the room; the cast is drawn once there are enough. Absent at the front door. */
  present?: number
}

/** The special roles the host deals, and the cast they make for the room as it is. */
export function MafiaRoles({ present }: Props) {
  const opts = useMafiaOptions()
  const value = [opts.doctor && 'doctor', opts.detective && 'detective'].filter((v): v is string => !!v)
  const mafia = present === undefined ? 0 : mafiaCount(present)
  const citizens = present === undefined ? 0 : Math.max(0, present - mafia - (opts.doctor ? 1 : 0) - (opts.detective ? 1 : 0))

  return (
    <section className="flex flex-col gap-3 rounded-card border-2 border-hairline bg-card p-4 shadow-pixel">
      <h2 className="font-display text-16 font-bold">الأدوار الخاصة</h2>
      <ToggleGroup
        type="multiple"
        variant="tile"
        size="lg"
        value={value}
        onValueChange={(v) => {
          mafiaStore.set({ doctor: v.includes('doctor'), detective: v.includes('detective') })
        }}
        className="grid grid-cols-2"
      >
        <ToggleGroupItem value="doctor">{ROLES.doctor.name}</ToggleGroupItem>
        <ToggleGroupItem value="detective">{ROLES.detective.name}</ToggleGroupItem>
      </ToggleGroup>
      {present !== undefined && present >= PLAYER_LIMITS.mafia.min && (
        <p className="text-14 leading-relaxed text-ink-soft">
          <b className="text-plasma">{mafia} مافيا</b>
          {opts.doctor && ' · طبيب'}
          {opts.detective && ' · محقق'}
          {` · ${String(citizens)} مواطنين`}
        </p>
      )}
    </section>
  )
}
