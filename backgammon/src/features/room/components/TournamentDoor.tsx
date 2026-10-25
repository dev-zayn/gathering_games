import { useState } from 'react'
import { Hash, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { realtime } from '@/lib/realtime/connection'
import { cn } from '@/lib/utils'
import { tournamentWords } from '../data/tournament-words'

/**
 * The front door's tournament with friends: طاولي seats two, so a knockout
 * of duels works as well as a league. «سوّي بطولة» opens گعدة's own sheet
 * to make one (the format picked there), «انضم لبطولة» its sheet for a
 * tournament's code; once in, the tournament's page takes this page's
 * place. Shown only in an app that has tournaments.
 */
export function TournamentDoor() {
  const [busy, setBusy] = useState(false)
  const [line, setLine] = useState<{ text: string; refused: boolean } | null>(null)

  const enter = async (kind: 'create' | 'join') => {
    setBusy(true)
    setLine(null)
    try {
      const code = await realtime.enterTournament(kind)
      setLine({ text: `البطولة ${code} جاهزة.`, refused: false })
    } catch (e) {
      setBusy(false)
      const code = e instanceof Error ? e.message : ''
      setLine(code === 'cancelled' ? null : { text: tournamentWords(code), refused: true })
    }
  }

  return (
    <section aria-labelledby="tournament-door" className="flex flex-col gap-3 rounded-card border border-hairline bg-slab p-4 shadow-slab">
      <h2 id="tournament-door" className="flex items-center gap-2 text-16 font-semibold text-ink">
        <Trophy aria-hidden className="size-4.5 text-brass" />
        بطولة الگهوة
      </h2>
      <p className="text-13 leading-relaxed text-ink-soft">خروج المغلوب بمواجهات ثنائية، أو دوري. اللي يفوز ياخذ اللقب.</p>
      <div className="grid grid-cols-2 gap-2.5">
        <Button variant="teal" disabled={busy} onClick={() => void enter('create')}>
          <Trophy />
          سوّي بطولة
        </Button>
        <Button variant="outline" disabled={busy} onClick={() => void enter('join')}>
          <Hash />
          انضم لبطولة
        </Button>
      </div>
      {line && (
        <p role="status" aria-live="polite" className={cn('text-center text-14 font-semibold', line.refused ? 'text-brick-lit' : 'text-turquoise-lit')}>
          {line.text}
        </p>
      )}
    </section>
  )
}
