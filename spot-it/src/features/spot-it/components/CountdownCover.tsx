import type { SpotView } from '@shared/protocol'
import { PixelTag } from '@/components/game/PixelTag'
import { cn } from '@/lib/utils'
import { useCountdown } from '../hooks/use-countdown'

interface Props {
  view: SpotView
  clockOffset: number
}

/** Over the face-down deal: 3 · 2 · 1, the same second on every phone; between potato deals, who lost the last. */
export function CountdownCover({ view, clockOffset }: Props) {
  const secs = useCountdown(view.until, clockOffset)
  const loser = view.mode === 'potato' && view.deal > 1 ? view.dealLoser : null
  if (secs <= 0) return null
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-section bg-background/80 px-6 text-center">
      {loser && (
        <p className={cn('animate-rise-in font-display text-18 font-extrabold', loser.you ? 'text-plasma' : 'text-ink')}>
          {loser.you ? `بقت بإيدك! خسرت ${String(loser.cards)} ورقات 🔥` : `${loser.name} بقى شايلها 🔥`}
        </p>
      )}
      {view.deals > 0 && <PixelTag className="text-neon">{`DEAL ${String(view.deal)}/${String(view.deals)}`}</PixelTag>}
      <span key={secs} dir="ltr" className="animate-count-slam font-pixel text-72 text-coin glow-text">
        {String(secs)}
      </span>
      <p className="font-display text-15 font-bold text-ink-soft">جهّز عيونك…</p>
    </div>
  )
}
