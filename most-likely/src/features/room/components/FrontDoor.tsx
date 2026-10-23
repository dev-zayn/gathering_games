import { useState, type ReactNode } from 'react'
import { DoorOpen, LogIn, Users } from 'lucide-react'
import { GameScreen } from '@/components/game/GameScreen'
import { PixelTag } from '@/components/game/PixelTag'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { GameInfo } from '@/features/arcade/data/games'
import { realtime, useRealtime } from '@/lib/realtime/connection'
import { cn } from '@/lib/utils'
import { roomWords } from '../data/room-words'
import { TournamentDoor } from './TournamentDoor'

interface Props {
  game: GameInfo
  /** The game's own setup, kept on this phone for when it hosts. */
  children?: ReactNode
}

/**
 * The game opened on its own, outside a room: who is playing (the app's
 * signed-in player), and the way into a room for this game — «العب ويا
 * ربعك» makes one with this phone as host, «انضم لغرفة» opens جمعة's Join
 * sheet for this game. Once in, the room's lobby takes this page's place.
 * Below, a league of this game (`TournamentDoor`), when the app has
 * tournaments.
 */
export function FrontDoor({ game, children }: Props) {
  const { me, inApp, tournaments } = useRealtime()
  const [busy, setBusy] = useState(false)
  const [friendsOnly, setFriendsOnly] = useState(false)
  const [line, setLine] = useState<{ text: string; refused: boolean } | null>(null)

  const enter = async (kind: 'create' | 'join') => {
    setBusy(true)
    setLine(kind === 'create' ? { text: 'دا نسوّي الغرفة…', refused: false } : null)
    try {
      const code = await realtime.enter(kind, friendsOnly ? 'friends' : 'private')
      // In: the app puts the room's lobby here now.
      setLine({ text: `الغرفة ${code} جاهزة.`, refused: false })
    } catch (e) {
      setBusy(false)
      const code = e instanceof Error ? e.message : ''
      setLine(code === 'cancelled' ? null : { text: roomWords(code), refused: true })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <GameScreen tone={game.tone}>
        <PixelTag className="text-coin">{me ? 'PLAYER 1' : 'INSERT COIN'}</PixelTag>
        <p className="font-display text-24 font-extrabold glow-text">{game.title}</p>
        {me && <p className="font-display text-17 font-bold text-ink">هلا {me.nickname} 👋</p>}
        <p className="text-15 text-ink-soft">{game.tagline}</p>
        <p className="font-display text-14 font-bold text-neon">{game.players}</p>
      </GameScreen>

      {inApp ? (
        <section className="flex flex-col gap-3 rounded-card border-2 border-hairline bg-card p-4 shadow-pixel">
          <Button size="xl" disabled={busy} onClick={() => void enter('create')}>
            <Users />
            العب ويا ربعك
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
            <Label htmlFor="friends-only" className="text-14 text-ink-soft">
              الغرفة لأصدقائي بس
            </Label>
          </div>
          {line && (
            <p role="status" aria-live="polite" className={cn('text-center text-14 font-semibold', line.refused ? 'text-plasma' : 'text-neon')}>
              {line.text}
            </p>
          )}
        </section>
      ) : (
        <GameScreen tone="plasma" className="min-h-0">
          <p className="text-15 text-ink-soft">الغرف تشتغل بس داخل تطبيق جمعة.</p>
          <Button variant="outline" onClick={() => { realtime.close() }}>
            <DoorOpen />
            رجوع
          </Button>
        </GameScreen>
      )}

      {inApp && tournaments && <TournamentDoor />}

      {children}
    </div>
  )
}
