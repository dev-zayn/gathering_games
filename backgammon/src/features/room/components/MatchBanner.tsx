import { ChevronLeft, Trophy } from 'lucide-react'
import type { RoomView } from '@shared/protocol'
import { Button } from '@/components/ui/button'
import type { RoomMatch } from '@/lib/gathering/bridge'
import { realtime } from '@/lib/realtime/connection'
import { matchLine } from '../data/tournament-words'

interface Props {
  match: RoomMatch
  room: RoomView | null
}

type TallyLine = RoomMatch['tally'][number]

/**
 * The tournament this room's rounds count for: its name, what is at stake,
 * and the tally so far — the two sides' round wins, or the league's leader
 * and this phone's points. «البطولة» shows the tournament over the game.
 */
export function MatchBanner({ match, room }: Props) {
  const you = room?.you
  const nameOf = (line: TallyLine) =>
    line.player === you ? 'إنت' : line.nickname || room?.players.find((p) => p.id === line.player)?.name || 'لاعب'
  const top = match.tally.at(0)
  const yours = match.tally.find((t) => t.player === you)
  const sides = [...match.tally].sort((a, b) => Number(b.player === you) - Number(a.player === you))
  const [first, second] = sides

  return (
    <section aria-label="مباراة البطولة" className="flex items-center gap-3 rounded-card border border-brass/35 bg-slab px-3.5 py-2.5 shadow-slab">
      <Trophy aria-hidden className="size-5 shrink-0 text-brass" />
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-14 font-semibold text-ink">{match.name}</p>
        <p className="truncate text-12 text-ink-faint">
          {matchLine(match)}
          {match.format === 'knockout' && first && second
            ? ` · ${nameOf(first)} ${String(first.wins)} - ${String(second.wins)} ${nameOf(second)}`
            : top
              ? ` · يتصدّر ${nameOf(top)} (${String(top.points)})${yours && yours.player !== top.player ? ` · إنت ${String(yours.points)}` : ''}`
              : ''}
        </p>
      </div>
      <Button variant="link" size="inline" onClick={() => { realtime.openTournament() }}>
        البطولة
        <ChevronLeft />
      </Button>
    </section>
  )
}
