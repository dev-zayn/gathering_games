import { useState } from 'react'
import { Check, Eye } from 'lucide-react'
import { ROLES } from '@shared/data/mafia-roles'
import type { MafiaView } from '@shared/protocol'
import { PixelSprite } from '@/components/PixelSprite'
import { GameScreen } from '@/components/game/GameScreen'
import { PixelTag } from '@/components/game/PixelTag'
import { Button } from '@/components/ui/button'
import { WaitingFor } from '@/features/room/components/WaitingFor'
import { cn } from '@/lib/utils'

interface Props {
  view: MafiaView
  onSeen: () => void
}

const TEXT = { coin: 'text-coin', neon: 'text-neon', plasma: 'text-plasma' } as const

/** Your role, face down until you tap. */
export function MafiaRole({ view, onSeen }: Props) {
  const [open, setOpen] = useState(false)
  const info = ROLES[view.role]

  if (!open) {
    return (
      <div className="flex flex-col gap-4">
        <GameScreen tone="plasma">
          <PixelSprite name="mafia" className="size-20 animate-sprite-hop" />
          <p className="font-display text-24 font-extrabold">دورك جاهز</p>
          <p className="text-14 text-ink-soft">غطّي الشاشة واكشفه</p>
        </GameScreen>
        <Button size="xl" onClick={() => { setOpen(true) }}>
          <Eye />
          اكشف دوري
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <GameScreen tone={info.tone} className={view.role === 'mafia' ? 'animate-shake' : undefined}>
        <PixelSprite name={view.role === 'mafia' ? 'mafia' : 'moon'} className="size-18 animate-sprite-hop" />
        <PixelTag className={TEXT[info.tone]}>{info.code}</PixelTag>
        <p className={cn('animate-pixel-pop font-display text-40 font-extrabold glow-text', TEXT[info.tone])}>{info.name}</p>
        <p className="text-14 leading-relaxed text-ink-soft">{info.brief}</p>
        {view.partners.length > 0 && <p className="font-display text-16 font-bold text-plasma">جماعتك: {view.partners.join(' · ')}</p>}
      </GameScreen>
      {view.seen ? (
        <WaitingFor count={view.waiting} label="ننتظر" />
      ) : (
        <Button size="xl" variant="outline" onClick={onSeen}>
          <Check />
          حفظت دوري
        </Button>
      )}
    </div>
  )
}
