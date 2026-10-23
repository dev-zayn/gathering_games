import { HOUSE_RULES } from '@shared/data/deck'
import type { UnoHouseRule, UnoOptions } from '@shared/protocol'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { unoStore, useUnoOptions } from '../uno-store'

const TARGETS: { value: UnoOptions['target']; title: string; note: string }[] = [
  { value: 0, title: 'يد وحدة', note: 'جولة سريعة' },
  { value: 200, title: 'لين 200', note: 'كم يد' },
  { value: 500, title: 'لين 500', note: 'مثل العلبة' },
]

const SCORINGS: { value: UnoOptions['scoring']; title: string; note: string }[] = [
  { value: 'winner', title: 'اللي يخلّص ياخذ', note: 'نقاط ورق الباقين' },
  { value: 'low', title: 'كل واحد يحسب ورقه', note: 'الأقل يفوز' },
]

const HOUSES = Object.entries(HOUSE_RULES) as [UnoHouseRule, (typeof HOUSE_RULES)[UnoHouseRule]][]

/** The host's setup, kept on their phone: how long, how it counts, and what the blank cards do. */
export function OptionsPicker() {
  const options = useUnoOptions()
  const set = (patch: Partial<UnoOptions>) => {
    unoStore.set((o) => ({ ...o, ...patch }))
  }
  return (
    <section className="flex flex-col gap-4 rounded-card border-2 border-hairline bg-card p-4 shadow-pixel">
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-16 font-bold">كم نلعب؟</h2>
        <ToggleGroup
          type="single"
          variant="tile"
          size="lg"
          value={String(options.target)}
          onValueChange={(v) => {
            const t = TARGETS.find((x) => String(x.value) === v)
            if (t) set({ target: t.value })
          }}
          className="grid grid-cols-3"
        >
          {TARGETS.map((t) => (
            <ToggleGroupItem key={t.value} value={String(t.value)} className="h-auto flex-col gap-0.5 py-2.5 whitespace-normal">
              <span className="font-display text-14 font-bold">{t.title}</span>
              <span className="text-11 font-medium text-ink-faint">{t.note}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-display text-16 font-bold">شلون نحسب؟</h2>
        <ToggleGroup
          type="single"
          variant="tile"
          size="lg"
          value={options.scoring}
          onValueChange={(v) => {
            const s = SCORINGS.find((x) => x.value === v)
            if (s) set({ scoring: s.value })
          }}
          className="grid grid-cols-2"
        >
          {SCORINGS.map((s) => (
            <ToggleGroupItem key={s.value} value={s.value} className="h-auto flex-col gap-0.5 py-2.5 whitespace-normal">
              <span className="font-display text-14 font-bold">{s.title}</span>
              <span className="text-11 font-medium text-ink-faint">{s.note}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-display text-16 font-bold">جوكر القاعدة يسوّي…</h2>
        <ToggleGroup
          type="single"
          variant="tile"
          size="lg"
          value={options.house}
          onValueChange={(v) => {
            const h = HOUSES.find(([id]) => id === v)
            if (h) set({ house: h[0] })
          }}
          className="grid grid-cols-2"
        >
          {HOUSES.map(([id, rule]) => (
            <ToggleGroupItem key={id} value={id} className="h-auto py-2.5 font-display text-14 font-bold whitespace-normal last:col-span-2">
              {rule.title}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="text-13 leading-relaxed text-ink-soft">{HOUSE_RULES[options.house].how}</p>
      </div>
    </section>
  )
}
