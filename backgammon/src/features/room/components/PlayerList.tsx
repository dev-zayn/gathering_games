import { Crown } from 'lucide-react'
import type { RoomView } from '@shared/protocol'
import { Swatch } from '@/features/backgammon/components/Swatch'
import { cn } from '@/lib/utils'

interface Props {
  room: RoomView
}

/** The two sides of the board: who sits at each (the host plays ivory), or the seat still empty. */
export function PlayerList({ room }: Props) {
  const seats = [room.players[0] ?? null, room.players[1] ?? null] as const
  return (
    <section aria-label="اللاعبين" className="grid grid-cols-2 gap-2.5">
      {seats.map((p, i) => (
        <div
          key={p?.id ?? `empty-${String(i)}`}
          className={cn(
            'flex min-h-28 animate-rise-in flex-col items-center justify-center gap-2 rounded-card border p-3 text-center shadow-slab',
            p ? 'border-hairline bg-slab' : 'border-dashed border-hairline-strong bg-transparent',
          )}
        >
          <Swatch seat={i === 0 ? 0 : 1} className={cn('size-10', !p && 'opacity-40')} />
          {p ? (
            <p className={cn('flex max-w-full items-center gap-1 text-15 font-semibold', p.connected ? 'text-ink' : 'text-ink-faint')}>
              <span className="truncate">{p.name}</span>
              {p.id === room.hostId && <Crown aria-label="صاحب الغرفة" className="size-3.5 shrink-0 text-brass" />}
            </p>
          ) : (
            <p className="text-13 text-ink-faint">ننتظر صاحبك…</p>
          )}
          {p?.id === room.you && <span className="text-11 text-brass-lit">إنت</span>}
        </div>
      ))}
    </section>
  )
}
