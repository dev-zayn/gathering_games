import { Crown } from 'lucide-react'
import type { RoomView } from '@shared/protocol'
import { PixelTag } from '@/components/game/PixelTag'
import { cn } from '@/lib/utils'

interface Props {
  room: RoomView
}

/** Who's in the room — online dot, host crown, and «you». */
export function PlayerList({ room }: Props) {
  return (
    <section className="flex flex-col gap-2 rounded-card border-2 border-hairline bg-card p-4 shadow-pixel">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-16 font-bold">اللاعبين</h2>
        <PixelTag className="text-neon">{`${String(room.players.length)} P`}</PixelTag>
      </div>
      <ul className="flex flex-col">
        {room.players.map((p) => (
          <li key={p.id} className="flex min-h-11 animate-rise-in items-center gap-2.5 border-b border-divider last:border-b-0">
            <span
              aria-label={p.connected ? 'متصل' : 'مو متصل'}
              className={cn('size-2.5 rounded-control', p.connected ? 'bg-success' : 'bg-rule')}
            />
            <span className={cn('flex-1 truncate font-display text-15 font-semibold', !p.connected && 'text-ink-faint')}>
              {p.name}
              {p.id === room.you && <span className="ms-1.5 text-12 text-neon">(إنت)</span>}
            </span>
            {p.id === room.hostId && <Crown aria-label="صاحب الغرفة" className="size-4 text-coin" />}
          </li>
        ))}
      </ul>
    </section>
  )
}
