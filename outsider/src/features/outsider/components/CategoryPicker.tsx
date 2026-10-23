import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { allCategories, secretsOf, MIN_WORDS } from '@shared/outsider-words'
import { enabledStore, useCustom, useEnabled } from '../outsider-store'

/** Every category as a chip; lit ones are in the draw. */
export function CategoryPicker() {
  const custom = useCustom()
  const enabled = useEnabled()
  const all = allCategories(custom)

  return (
    <section className="flex flex-col gap-3 rounded-card border-2 border-hairline bg-card p-4 shadow-pixel">
      <h2 className="font-display text-16 font-bold">السوالف</h2>
      <ToggleGroup
        type="multiple"
        variant="chip"
        size="sm"
        value={enabled}
        onValueChange={(value) => {
          enabledStore.set(value)
        }}
        className="flex-wrap"
      >
        {Object.keys(all).map((name) => (
          <ToggleGroupItem
            key={name}
            value={name}
            disabled={secretsOf(all[name]).length < MIN_WORDS}
          >
            {name}
            {name in custom && <span aria-label="سالفة خاصة">✦</span>}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </section>
  )
}
