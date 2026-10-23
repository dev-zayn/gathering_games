import type { CharadesView } from '@shared/protocol'
import { PixelTag } from '@/components/game/PixelTag'
import { cn } from '@/lib/utils'

/** The two teams, their scores, and which one is on stage. */
export function CharadesTeams({ view }: { view: CharadesView }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {view.teams.map((t, i) => (
        <div
          key={t.name}
          className={cn(
            'flex flex-col items-center gap-1 rounded-card border-2 border-hairline bg-card px-2 py-3 text-center shadow-pixel',
            i === 0 ? 'text-neon' : 'text-plasma',
            view.team === i && view.phase !== 'final' && 'glow-box',
          )}
        >
          <PixelTag className="text-9">{i === 0 ? 'TEAM A' : 'TEAM B'}</PixelTag>
          <span className="font-display text-14 font-bold text-ink">
            {t.name}
            {view.yourTeam === i && <span className="ms-1 text-12 text-coin">(فريقك)</span>}
          </span>
          <PixelTag className="text-20">{String(t.score)}</PixelTag>
          <span className="text-11 leading-relaxed text-ink-faint">{t.members.join('، ')}</span>
        </div>
      ))}
    </div>
  )
}
