import { DoorOpen } from 'lucide-react'
import type { RoomView } from '@shared/protocol'
import { InlayRule } from '@/components/art/InlayRule'
import { Button } from '@/components/ui/button'
import { Swatch } from '@/features/backgammon/components/Swatch'
import type { Result } from '@/lib/gathering/bridge'
import { realtime } from '@/lib/realtime/connection'
import { cn } from '@/lib/utils'

interface Props {
  room: RoomView | null
  results: Result[] | null
}

/** The round is over: the two sides as گعدة ranked them, and the way back to the room. */
export function RoundOver({ room, results }: Props) {
  const nameOf = (id: string) => room?.players.find((p) => p.id === id)?.name ?? '؟'
  const seatOf = (id: string) => (room?.players[0]?.id === id ? 0 : 1)
  const rows = [...(results ?? [])].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
  const won = rows[0]?.player === room?.you && (rows[0]?.rank ?? 0) < (rows[1]?.rank ?? 2)
  return (
    <div className="flex flex-1 flex-col gap-4">
      <header className="flex flex-col items-center gap-2 pt-8 text-center">
        <p className="animate-celebrate font-hand text-48 leading-tight font-bold text-brass-lit">{won ? 'ربحتها!' : 'خلصت الجولة'}</p>
        <InlayRule className="w-40" />
      </header>
      {rows.length > 0 && (
        <ol className="flex flex-col rounded-card border border-hairline bg-slab px-4 py-1 shadow-slab">
          {rows.map((r) => (
            <li key={r.player} className="flex min-h-14 items-center gap-3 border-b border-hairline last:border-b-0">
              <Swatch seat={seatOf(r.player)} />
              <span className={cn('flex-1 truncate text-15 font-semibold', r.player === room?.you ? 'text-brass-lit' : 'text-ink')}>
                {nameOf(r.player)}
              </span>
              <span className="text-22 leading-none font-bold text-ink tabular-nums">{r.score}</span>
            </li>
          ))}
        </ol>
      )}
      <Button size="lg" className="mt-auto" onClick={() => { realtime.close() }}>
        <DoorOpen />
        رجوع للغرفة
      </Button>
    </div>
  )
}
