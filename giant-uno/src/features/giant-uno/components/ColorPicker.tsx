import { useState } from 'react'
import { X } from 'lucide-react'
import { COLORS, COLOR_NAMES } from '@shared/data/deck'
import type { UnoColor, UnoSeat } from '@shared/protocol'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { SUIT_BG } from '../lib/cards'

interface Props {
  title: string
  /** A warning under the title (a Draw Four played holding the colour). */
  note?: string | null
  /** «بدّل الورق»: who to swap hands with, picked before the colour. */
  targets?: UnoSeat[] | null
  onPick: (color: UnoColor, target?: string) => void
  onCancel?: () => void
}

/** A wild's colour, four big keys; for the swap rule, the player to swap with first. */
export function ColorPicker({ title, note, targets, onPick, onCancel }: Props) {
  const [target, setTarget] = useState('')
  const waiting = !!targets && !target
  return (
    <section className="flex animate-rise-in flex-col gap-3 rounded-card border-2 border-coin bg-card p-4 shadow-pixel">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-16 font-bold">{title}</h2>
        {onCancel && (
          <Button variant="ghost" size="icon" aria-label="رجوع" onClick={onCancel}>
            <X />
          </Button>
        )}
      </div>
      {note && <p className="text-13 font-semibold text-plasma">{note}</p>}
      {targets && (
        <ToggleGroup
          type="single"
          variant="tile"
          size="lg"
          value={target}
          onValueChange={setTarget}
          aria-label="وياه تبدّل"
          className="grid grid-cols-2"
        >
          {targets.map((s) => (
            <ToggleGroupItem key={s.id} value={s.id} className="min-w-0 font-display text-14 font-bold">
              <span className="truncate">{`${s.name} · ${String(s.count)}`}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
      <div className="grid grid-cols-2 gap-2">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            disabled={waiting}
            onClick={() => {
              onPick(c, target || undefined)
            }}
            className={cn(
              'h-14 rounded-button border-2 border-screen font-display text-16 font-extrabold text-suit-ink shadow-pixel transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-x-0.5 active:translate-y-1 active:shadow-none disabled:opacity-40',
              SUIT_BG[c],
            )}
          >
            {COLOR_NAMES[c]}
          </button>
        ))}
      </div>
    </section>
  )
}
