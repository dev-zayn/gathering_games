import { TARGETS } from '@engine/games/reflex'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { reflexStore, useReflexOptions } from '../reflex-store'

/** The host's pick: how many points take the match. Kept on their phone. */
export function TargetPicker() {
  const { target } = useReflexOptions()
  return (
    <section className="flex flex-col gap-3 rounded-card border-2 border-hairline bg-card p-4 shadow-pixel">
      <h2 className="font-display text-16 font-bold">كم نقطة للفوز؟</h2>
      <ToggleGroup
        type="single"
        variant="tile"
        size="lg"
        value={String(target)}
        onValueChange={(v) => {
          const next = TARGETS.find((t) => String(t) === v)
          if (next) reflexStore.set({ target: next })
        }}
        className="grid grid-cols-3"
      >
        {TARGETS.map((t) => (
          <ToggleGroupItem key={t} value={String(t)}>
            {t} نقاط
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </section>
  )
}
