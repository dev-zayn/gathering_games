import { useState } from 'react'
import { Check, Eye } from 'lucide-react'
import type { OutsiderView } from '@shared/protocol'
import { PixelSprite } from '@/components/PixelSprite'
import { GameScreen } from '@/components/game/GameScreen'
import { PixelTag } from '@/components/game/PixelTag'
import { Button } from '@/components/ui/button'
import { WaitingFor } from '@/features/room/components/WaitingFor'

interface Props {
  view: OutsiderView
  onSeen: () => void
}

/** Your card, face down until you tap — the phone is yours, but the table has eyes. */
export function OutsiderCard({ view, onSeen }: Props) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <div className="flex flex-col gap-4">
        <GameScreen tone="coin">
          <PixelTag className="text-coin">{`ROUND ${String(view.round)}`}</PixelTag>
          <PixelSprite name="spy" className="size-20 animate-sprite-hop" />
          <p className="font-display text-24 font-extrabold">كرتك جاهز</p>
          <p className="text-14 text-ink-soft">غطّي الشاشة واكشفه</p>
        </GameScreen>
        <Button size="xl" onClick={() => { setOpen(true) }}>
          <Eye />
          اكشف كرتي
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {view.isOutsider ? (
        <GameScreen tone="plasma" className="animate-shake">
          <PixelSprite name="spy" className="size-20 animate-sprite-hop" />
          <PixelTag className="text-plasma">YOU ARE THE SPY</PixelTag>
          <p className="animate-pixel-pop font-display text-32 font-extrabold text-plasma glow-text">أنت برا السالفة</p>
          <p className="text-14 leading-relaxed text-ink-soft">
            السالفة من نوع <b className="text-ink">{view.category}</b>
            <br />
            افهمها من أسئلتهم، ولا تنكشف
          </p>
        </GameScreen>
      ) : (
        <GameScreen tone="neon">
          <p className="text-14 font-semibold text-neon">{view.category}</p>
          <p className="animate-pixel-pop font-display text-40 leading-tight font-extrabold text-neon glow-text">{view.secret?.word}</p>
          {view.secret?.meaning && <p className="font-display text-22 font-bold text-coin">= {view.secret.meaning}</p>}
          <p className="text-14 text-ink-faint">لا تفضحها!</p>
        </GameScreen>
      )}
      {view.seen ? (
        <WaitingFor names={view.waitingOn} label="ننتظر يشوفون كروتهم" />
      ) : (
        <Button size="xl" variant="outline" onClick={onSeen}>
          <Check />
          شفته، جاهز
        </Button>
      )}
    </div>
  )
}
