import { useState } from 'react'
import { X } from 'lucide-react'
import type { UnoCard } from '@shared/protocol'
import { Button } from '@/components/ui/button'
import { sortHand } from '../lib/cards'
import { UnoCardFace } from './UnoCardFace'

interface Props {
  shown: { name: string; cards: UnoCard[] }
}

/** After a challenge, the challenger sees the hand it was about, until their next move or a tap on ×. */
export function ShownHand({ shown }: Props) {
  const key = `${shown.name}:${shown.cards.map((c) => c.id).join(',')}`
  const [closed, setClosed] = useState('')
  if (closed === key) return null
  return (
    <section className="flex animate-rise-in flex-col gap-2 rounded-card border-2 border-hairline bg-card p-3 shadow-pixel">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-14 font-bold">{`ورق ${shown.name} وقت التحدّي`}</h2>
        <Button
          variant="ghost"
          size="icon"
          aria-label="سكّر"
          onClick={() => {
            setClosed(key)
          }}
        >
          <X />
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {sortHand(shown.cards).map((card) => (
          <UnoCardFace key={card.id} card={card} size="sm" />
        ))}
      </div>
    </section>
  )
}
