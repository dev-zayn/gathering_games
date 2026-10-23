import { useState } from 'react'
import { Hash, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { realtime } from '@/lib/realtime/connection'
import { cn } from '@/lib/utils'
import { tournamentWords } from '../data/tournament-words'

/**
 * The front door's tournament with friends: لگطها seats two, so a
 * knockout of duels works as well as a league round one table. «سوّي
 * بطولة» opens جمعة's own sheet to make one (the format picked there),
 * «انضم لبطولة» its sheet for a tournament's code; once in, the
 * tournament's page takes this page's place. Shown only in an app that has
 * tournaments.
 */
export function TournamentDoor() {
  const [busy, setBusy] = useState(false)
  const [line, setLine] = useState<{ text: string; refused: boolean } | null>(null)

  const enter = async (kind: 'create' | 'join') => {
    setBusy(true)
    setLine(null)
    try {
      const code = await realtime.enterTournament(kind)
      // In: the app puts the tournament's page here now.
      setLine({ text: `البطولة ${code} جاهزة.`, refused: false })
    } catch (e) {
      setBusy(false)
      const code = e instanceof Error ? e.message : ''
      setLine(code === 'cancelled' ? null : { text: tournamentWords(code), refused: true })
    }
  }

  return (
    <section aria-labelledby="tournament-door" className="flex flex-col gap-3 rounded-card border-2 border-hairline bg-card p-4 shadow-pixel">
      <div className="flex items-center gap-2">
        <Trophy aria-hidden className="size-5 text-coin" />
        <h2 id="tournament-door" className="font-display text-16 font-bold text-ink">
          بطولة ويا ربعك
        </h2>
      </div>
      <p className="text-14 text-ink-soft">خروج المغلوب بمواجهات ثنائية، أو دوري على طاولة وحدة. اللي يفوز ياخذ اللقب.</p>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="neon" disabled={busy} onClick={() => void enter('create')}>
          <Trophy />
          سوّي بطولة
        </Button>
        <Button variant="outline" disabled={busy} onClick={() => void enter('join')}>
          <Hash />
          انضم لبطولة
        </Button>
      </div>
      {line && (
        <p role="status" aria-live="polite" className={cn('text-center text-14 font-semibold', line.refused ? 'text-plasma' : 'text-neon')}>
          {line.text}
        </p>
      )}
    </section>
  )
}
