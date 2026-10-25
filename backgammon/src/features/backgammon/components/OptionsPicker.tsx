import { BG_LENGTHS, type BgOptions } from '@shared/protocol'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { optionsStore, useOptions } from '../options-store'

const LENGTH_WORDS: Record<BgOptions['length'], { title: string; note: string }> = {
  1: { title: 'لعبة', note: 'وحدة' },
  3: { title: '3 نقاط', note: 'قصيرة' },
  5: { title: '5 نقاط', note: 'متوسطة' },
  7: { title: '7 نقاط', note: 'طويلة' },
}

/** The set-up, kept on this phone: how long the match is, and whether the cube is in play. */
export function OptionsPicker() {
  const options = useOptions()
  const set = (patch: Partial<BgOptions>) => {
    optionsStore.set((o) => ({ ...o, ...patch }))
  }
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-2">
        <h3 className="text-14 font-semibold text-ink-soft">لحد كم نلعب؟</h3>
        <ToggleGroup
          type="single"
          variant="tile"
          value={String(options.length)}
          onValueChange={(v) => {
            const length = BG_LENGTHS.find((l) => String(l) === v)
            if (length) set({ length })
          }}
          className="grid grid-cols-4"
        >
          {BG_LENGTHS.map((l) => (
            <ToggleGroupItem key={l} value={String(l)} className="h-auto flex-col gap-0.5 py-2 whitespace-normal">
              <span className="text-14 font-semibold">{LENGTH_WORDS[l].title}</span>
              <span className="text-11 font-normal text-ink-faint">{LENGTH_WORDS[l].note}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-14 font-semibold text-ink-soft">مكعب المضاعفة</h3>
        <ToggleGroup
          type="single"
          variant="tile"
          size="lg"
          value={options.cube ? 'on' : 'off'}
          onValueChange={(v) => {
            if (v) set({ cube: v === 'on' })
          }}
          className="grid grid-cols-2"
        >
          <ToggleGroupItem value="on">ويّاه</ToggleGroupItem>
          <ToggleGroupItem value="off">بلاه</ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  )
}
