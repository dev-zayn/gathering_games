import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { MODES } from '../data/modes'
import { spotStore, useSpotOptions } from '../spot-store'

/** The host's pick of the box's five mini-games, kept on their phone. */
export function ModePicker() {
  const { mode } = useSpotOptions()
  const picked = MODES.find((m) => m.id === mode)
  return (
    <section className="flex flex-col gap-3 rounded-card border-2 border-hairline bg-card p-4 shadow-pixel">
      <h2 className="font-display text-16 font-bold">شنو نلعب؟</h2>
      <ToggleGroup
        type="single"
        variant="tile"
        size="lg"
        value={mode}
        onValueChange={(v) => {
          const next = MODES.find((m) => m.id === v)
          if (next) spotStore.set({ mode: next.id })
        }}
        className="grid grid-cols-2"
      >
        {MODES.map((m) => (
          <ToggleGroupItem key={m.id} value={m.id} className="h-auto flex-col gap-0.5 py-2.5 whitespace-normal last:col-span-2">
            <span className="font-display text-14 font-bold">{m.title}</span>
            <span className="text-11 font-medium text-ink-faint">{m.goal}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {picked && <p className="text-13 leading-relaxed text-ink-soft">{picked.how}</p>}
    </section>
  )
}
