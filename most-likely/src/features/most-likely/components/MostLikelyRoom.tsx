import { Crown } from 'lucide-react'
import type { RoomView } from '@shared/protocol'
import { PixelSprite } from '@/components/PixelSprite'
import { GameScreen } from '@/components/game/GameScreen'
import { PixelTag } from '@/components/game/PixelTag'
import { Scoreboard } from '@/components/game/Scoreboard'
import { Button } from '@/components/ui/button'
import { WaitingFor } from '@/features/room/components/WaitingFor'
import { viewOf } from '@/features/room/hooks/use-room'
import { realtime } from '@/lib/realtime/connection'

interface Props {
  room: RoomView
  isHost: boolean
}

/** منو أكثر واحد؟ online — the card, your secret vote, the crowning. */
export function MostLikelyRoom({ room, isHost }: Props) {
  const view = viewOf(room, 'most-likely')
  if (!view) return null
  const act = realtime.act
  const crowns = Object.fromEntries(view.crowns.map((c) => [c.name, c.score]))
  const gains = view.reveal ? Object.fromEntries(view.reveal.crowned.map((n) => [n, 1])) : undefined

  return (
    <div className="flex flex-col gap-4">
      <GameScreen tone="coin">
        <PixelTag className="text-coin">{`CARD #${String(view.card)}`}</PixelTag>
        <PixelSprite name="crown" className="size-12 animate-sprite-hop" />
        <p className="text-16 text-ink-soft">منو أكثر واحد…</p>
        <p key={view.prompt} className="animate-pixel-pop font-display text-28 leading-snug font-extrabold text-coin glow-text">
          {view.prompt}
        </p>
      </GameScreen>

      {view.phase === 'voting' &&
        (view.voted ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <PixelTag className="text-success">VOTE CAST</PixelTag>
            <WaitingFor names={view.waitingOn} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {view.candidates.map((p) => (
              <Button key={p.id} size="lg" variant="outline" onClick={() => { act({ type: 'vote', target: p.id }) }}>
                <Crown className="text-coin" />
                {p.name}
              </Button>
            ))}
          </div>
        ))}

      {view.phase === 'reveal' && view.reveal && (
        <section className="flex animate-rise-in flex-col gap-3">
          <h2 className="animate-celebrate text-center font-display text-22 font-extrabold text-coin">
            👑 {view.reveal.crowned.join(' و ')}
          </h2>
          <p className="text-center text-13 text-ink-faint">
            {view.reveal.counts.map((c) => `${c.name} ${String(c.votes)}`).join(' · ')}
          </p>
          {isHost ? (
            <Button size="xl" onClick={() => { act({ type: 'next' }) }}>
              البطاقة الجاية
            </Button>
          ) : (
            <p className="text-center text-14 text-ink-faint">ننتظر صاحب الغرفة يقلب البطاقة…</p>
          )}
        </section>
      )}

      <Scoreboard title="CROWNS" scores={crowns} players={view.crowns.map((c) => c.name)} gains={gains} />
    </div>
  )
}
