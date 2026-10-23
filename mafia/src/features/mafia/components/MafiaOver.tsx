import { Trophy } from 'lucide-react'
import { ROLES } from '@shared/data/mafia-roles'
import type { MafiaView } from '@shared/protocol'
import { PixelSprite } from '@/components/PixelSprite'
import { GameScreen } from '@/components/game/GameScreen'
import { PixelTag } from '@/components/game/PixelTag'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  view: MafiaView
  isHost: boolean
  onFinish: () => void
}

/** Game over: who won, and every card turned face up. */
export function MafiaOver({ view, isHost, onFinish }: Props) {
  const over = view.over
  if (!over) return null
  const mafia = over.winner === 'mafia'
  return (
    <div className="flex flex-col gap-4">
      <GameScreen tone={mafia ? 'plasma' : 'neon'}>
        <PixelTag className="animate-blink text-coin">GAME OVER</PixelTag>
        <PixelSprite name={mafia ? 'mafia' : 'crown'} className="size-18 animate-sprite-hop" />
        <p className={cn('animate-celebrate font-display text-32 font-extrabold glow-text', mafia ? 'text-plasma' : 'text-neon')}>
          {mafia ? 'المافيا سيطرت!' : 'المدينة فازت!'}
        </p>
      </GameScreen>
      <ul className="flex flex-col rounded-card border-2 border-hairline bg-card px-4 py-1 shadow-pixel">
        {over.seats.map((s) => (
          <li key={s.name} className="flex items-center gap-3 border-b border-divider py-2.5 last:border-b-0">
            <span className={cn('flex-1 font-display text-15 font-semibold', !s.alive && 'text-ink-faint line-through')}>{s.name}</span>
            <span className={cn('text-13 font-bold', s.role === 'mafia' ? 'text-plasma' : 'text-ink-soft')}>{ROLES[s.role].name}</span>
          </li>
        ))}
      </ul>
      {isHost && (
        <Button size="xl" onClick={onFinish}>
          <Trophy />
          النتائج
        </Button>
      )}
    </div>
  )
}
