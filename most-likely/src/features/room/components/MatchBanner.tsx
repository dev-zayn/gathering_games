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
  const yours = match.tally.find((t) => t.player === you)
  const top = match.tally.at(0)

  return (
    <section aria-label="مباراة البطولة" className="flex flex-col gap-3 rounded-card border-2 border-plasma bg-card p-4 shadow-pixel">
      <div className="flex items-center gap-3">
        <Trophy aria-hidden className="size-6 shrink-0 text-coin" />
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="truncate font-display text-16 font-extrabold text-ink">{match.name}</p>
          <p className="text-13 text-ink-soft">{matchLine(match)}</p>
        </div>
        <Button variant="link" size="inline" onClick={() => { realtime.openTournament() }}>
          البطولة
          <ChevronLeft />
        </Button>
      </div>

      {match.format === 'knockout' && match.tally.length > 0 ? (
        <Duel tally={match.tally} you={you} nameOf={nameOf} />
      ) : top ? (
        <div className="flex items-center gap-3 border-t-2 border-dashed border-divider pt-3">
          <p className="min-w-0 flex-1 truncate font-display text-14 font-bold text-ink">
            {`يتصدّر ${nameOf(top)} بـ ${String(top.points)} نقطة`}
          </p>
          {yours && yours.player !== top.player && (
            <p className="shrink-0 text-13 font-semibold text-ink-soft">{`إنت: ${String(yours.points)}`}</p>
          )}
        </div>
      ) : null}
    </section>
  )
}

/** The two sides with their round wins: this phone's side at the start. */
function Duel({ tally, you, nameOf }: { tally: TallyLine[]; you: string | undefined; nameOf: (l: TallyLine) => string }) {
  const sides = [...tally].sort((a, b) => Number(b.player === you) - Number(a.player === you))
  const [first, second] = sides
  if (!first) return null
  return (
    <div className="flex items-center gap-3 border-t-2 border-dashed border-divider pt-3">
      <span className="min-w-0 flex-1 truncate font-display text-14 font-bold text-ink">{nameOf(first)}</span>
      {/* Left to right, so each number sits by its own side in the RTL row. */}
      <span dir="ltr" className="shrink-0 font-display text-22 font-extrabold text-coin tabular-nums">
        {second ? `${String(second.wins)} : ${String(first.wins)}` : String(first.wins)}
      </span>
      <span className="min-w-0 flex-1 truncate text-end font-display text-14 font-bold text-ink">
        {second ? nameOf(second) : ''}
      </span>
    </div>
  )
}
