import { DoorOpen } from 'lucide-react'
import type { RoomView } from '@shared/protocol'
import { GameScreen } from '@/components/game/GameScreen'
import { PixelTag } from '@/components/game/PixelTag'
import { PixelSprite } from '@/components/PixelSprite'
import { Button } from '@/components/ui/button'
import type { Result } from '@/lib/gathering/bridge'
import { realtime } from '@/lib/realtime/connection'
import { cn } from '@/lib/utils'

interface Props {
  room: RoomView | null
  results: Result[] | null
}

/** The round is over: the standings as جمعة ranked them, and the way back to the room. */
export function RoundOver({ room, results }: Props) {
  const nameOf = (id: string) => room?.players.find((p) => p.id === id)?.name ?? '؟'
  const rows = [...(results ?? [])].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
  return (
    <div className="flex flex-col gap-4">
      <GameScreen tone="coin">
        <PixelTag className="animate-blink text-coin">GAME OVER</PixelTag>
        <PixelSprite name="crown" className="size-16 animate-sprite-hop" />
        <p className="font-display text-24 font-extrabold text-coin glow-text">خلصت الجولة</p>
      </GameScreen>
      {rows.length > 0 && (
        <ol className="flex flex-col rounded-card border-2 border-hairline bg-card px-4 py-1 shadow-pixel">
          {rows.map((r) => (
            <li key={r.player} className="flex min-h-11 items-center gap-3 border-b border-divider last:border-b-0">
              <PixelTag className={cn('w-8', r.rank === 1 ? 'text-coin' : 'text-ink-faint')}>{`#${String(r.rank ?? '-')}`}</PixelTag>
              <span className={cn('flex-1 truncate font-display text-15 font-semibold', r.player === room?.you && 'text-neon')}>
                {nameOf(r.player)}
              </span>
              <PixelTag className="text-ink-soft">{String(r.score)}</PixelTag>
            </li>
          ))}
        </ol>
      )}
      <Button size="lg" onClick={() => { realtime.close() }}>
        <DoorOpen />
        رجوع للغرفة
      </Button>
    </div>
  )
}
