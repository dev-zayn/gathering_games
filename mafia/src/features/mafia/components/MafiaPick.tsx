import { Moon, Sun } from 'lucide-react'
import type { MafiaView } from '@shared/protocol'
import { GameScreen } from '@/components/game/GameScreen'
import { PixelTag } from '@/components/game/PixelTag'
import { Button } from '@/components/ui/button'
import { WaitingFor } from '@/features/room/components/WaitingFor'

interface Props {
  view: MafiaView
  onPick: (target: string | null) => void
}

const NIGHT_PROMPT = {
  mafia: 'منو تقتلون الليلة؟',
  doctor: 'منو تحمي الليلة؟',
  detective: 'منو تحقق بيه؟',
  citizen: 'منو تشك بيه؟',
} as const

/**
 * Night move or day vote. Every role sees the same outlined keys — a pink
 * screen across the table would out the mafia.
 */
export function MafiaPick({ view, onPick }: Props) {
  const night = view.phase === 'night'

  if (!view.alive) {
    return (
      <GameScreen tone="plasma">
        <PixelTag className="text-plasma">GAME OVER</PixelTag>
        <p className="font-display text-28 font-extrabold">إنت طلعت 👻</p>
        <p className="text-14 text-ink-soft">تفرّج بصمت… ولا تفضح شي</p>
      </GameScreen>
    )
  }

  if (view.acted) {
    return (
      <div className="flex flex-col gap-4">
        {view.check && (
          <GameScreen tone={view.check.isMafia ? 'plasma' : 'neon'}>
            <PixelTag className="text-coin">CASE FILE</PixelTag>
            <p className="font-display text-28 font-extrabold">{view.check.name}</p>
            <p className={`animate-pixel-pop font-display text-24 font-extrabold glow-text ${view.check.isMafia ? 'text-plasma' : 'text-neon'}`}>
              {view.check.isMafia ? 'مافيا! 🔪' : 'بريء'}
            </p>
          </GameScreen>
        )}
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <PixelTag className="text-success">{night ? 'DONE' : 'VOTE CAST'}</PixelTag>
          <p className="font-display text-20 font-extrabold">{night ? 'غمّض عيونك… 😴' : 'صوّتت ✓'}</p>
          <WaitingFor count={view.waiting} />
        </div>
      </div>
    )
  }

  return (
    <section className="flex animate-rise-in flex-col gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        {night ? <Moon aria-hidden className="size-7 text-coin" /> : <Sun aria-hidden className="size-8 animate-sprite-hop text-coin" />}
        <PixelTag className="text-ink-faint">{night ? `NIGHT ${String(view.night)}` : `DAY ${String(view.night)}`}</PixelTag>
        <h2 className="font-display text-24 font-extrabold">{night ? NIGHT_PROMPT[view.role] : 'منو يطلع اليوم؟'}</h2>
        {night && view.partners.length > 0 && <p className="text-14 text-plasma">جماعتك: {view.partners.join(' · ')}</p>}
        {!night && <p className="text-14 text-ink-soft">تناقشوا بصوت عالي، وصوّتوا بالسر</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {view.targets.map((p) => (
          <Button key={p.id} size="xl" variant="outline" className="text-16" onClick={() => { onPick(p.id) }}>
            {p.name}
          </Button>
        ))}
      </div>
      {!night && (
        <Button variant="ghost" onClick={() => { onPick(null) }}>
          محد يطلع
        </Button>
      )}
    </section>
  )
}
