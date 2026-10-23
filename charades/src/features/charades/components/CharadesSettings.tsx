import { DECK_NAMES, SECONDS_CHOICES, TURN_CHOICES } from '@shared/data/charades-words'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { charadesStore, useCharadesOptions } from '../charades-store'

/** Turn length, turns per team, word decks — the host's, kept on their phone. */
export function CharadesSettings() {
  const opts = useCharadesOptions()
  return (
    <section className="flex flex-col gap-3 rounded-card border-2 border-hairline bg-card p-4 shadow-pixel">
      <h2 className="font-display text-16 font-bold">وقت الدور</h2>
      <ToggleGroup
        type="single"
        variant="tile"
        size="lg"
        value={String(opts.seconds)}
        onValueChange={(v) => {
          if (v) charadesStore.set({ ...opts, seconds: Number(v) })
        }}
        className="grid grid-cols-3"
      >
        {SECONDS_CHOICES.map((s) => (
          <ToggleGroupItem key={s} value={String(s)}>
            {s} ثانية
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <h2 className="font-display text-16 font-bold">كم دور لكل فريق</h2>
      <ToggleGroup
        type="single"
        variant="tile"
        size="lg"
        value={String(opts.turns)}
        onValueChange={(v) => {
          if (v) charadesStore.set({ ...opts, turns: Number(v) })
        }}
        className="grid grid-cols-3"
      >
        {TURN_CHOICES.map((t) => (
          <ToggleGroupItem key={t} value={String(t)}>
            {t} أدوار
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <h2 className="font-display text-16 font-bold">الكلمات</h2>
      <ToggleGroup
        type="multiple"
        variant="chip"
        size="sm"
        value={opts.decks}
        onValueChange={(decks) => {
          charadesStore.set({ ...opts, decks })
        }}
        className="flex-wrap"
      >
        {DECK_NAMES.map((d) => (
          <ToggleGroupItem key={d} value={d}>
            {d}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {opts.decks.length === 0 && <p className="text-13 font-semibold text-plasma">اختاروا مجموعة كلمات وحدة على الأقل</p>}
    </section>
  )
}
