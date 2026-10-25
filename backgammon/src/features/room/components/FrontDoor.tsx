import { useState, type ReactNode } from 'react'
import { LogIn, Users } from 'lucide-react'
import { InlayRule } from '@/components/art/InlayRule'
import { TeaGlass } from '@/components/art/TeaGlass'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { GAME } from '@/features/backgammon/data/game'
import { realtime, useRealtime } from '@/lib/realtime/connection'
import { cn } from '@/lib/utils'
import { roomWords } from '../data/room-words'
import { TournamentDoor } from './TournamentDoor'

/**
 * The game opened on its own, outside a room: the name over the table,
 * the way into a room with a friend («العب ويّا ربعك» makes one with this
 * phone as host, «انضم لغرفة» opens گعدة's Join sheet), a tournament when
 * the app has them, then the game's own part (`children`): a match on this
 * phone and the rules. Outside the app only the phone's own match is open.
 */
export function FrontDoor({ children }: { children?: ReactNode }) {
  const { me, inApp, tournaments } = useRealtime()
  const [busy, setBusy] = useState(false)
  const [friendsOnly, setFriendsOnly] = useState(false)
  const [line, setLine] = useState<{ text: string; refused: boolean } | null>(null)

  const enter = async (kind: 'create' | 'join') => {
    setBusy(true)
    setLine(kind === 'create' ? { text: 'دا نسوّي الغرفة…', refused: false } : null)
    try {
      const code = await realtime.enter(kind, friendsOnly ? 'friends' : 'private')
      setLine({ text: `الغرفة ${code} جاهزة.`, refused: false })
    } catch (e) {
      setBusy(false)
      const code = e instanceof Error ? e.message : ''
      setLine(code === 'cancelled' ? null : { text: roomWords(code), refused: true })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="relative flex flex-col items-center gap-2 px-6 pt-4 pb-2 text-center">
        <TeaGlass className="absolute end-2 top-6 w-11 opacity-90" />
        <p className="font-hand text-64 leading-tight font-bold text-brass-lit">{GAME.title}</p>
        {me && <p className="text-16 font-semibold text-ink">{`هلا ${me.nickname}`}</p>}
        <p className="max-w-72 text-14 leading-relaxed text-ink-soft">{GAME.tagline}</p>
        <InlayRule className="mt-2 w-40" />
      </header>

      {inApp && (
        <section aria-labelledby="room-door" className="flex flex-col gap-3 rounded-card border border-hairline bg-slab p-4 shadow-slab">
          <h2 id="room-door" className="text-16 font-semibold text-ink">
            ويّا ربعك
          </h2>
          <Button size="xl" disabled={busy} onClick={() => void enter('create')}>
            <Users />
            العب ويّا ربعك
          </Button>
          <Button size="lg" variant="outline" disabled={busy} onClick={() => void enter('join')}>
            <LogIn />
            انضم لغرفة
          </Button>
          <div className="flex min-h-11 items-center gap-3">
            <Checkbox
              id="friends-only"
              checked={friendsOnly}
              disabled={busy}
              onCheckedChange={(v) => {
                setFriendsOnly(v === true)
              }}
            />
            <Label htmlFor="friends-only" className="text-14 font-normal text-ink-soft">
              الغرفة لأصدقائي بس
            </Label>
          </div>
          {line && (
            <p role="status" aria-live="polite" className={cn('text-center text-14 font-semibold', line.refused ? 'text-brick-lit' : 'text-turquoise-lit')}>
              {line.text}
            </p>
          )}
        </section>
      )}

      {inApp && tournaments && <TournamentDoor />}

      {children}

      {!inApp && <p className="text-center text-12 text-ink-faint">الغرف والبطولات تشتغل داخل تطبيق گعدة.</p>}
    </div>
  )
}
