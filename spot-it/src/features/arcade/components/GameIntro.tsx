import { useState } from 'react'
import { PixelSprite } from '@/components/PixelSprite'
import { PixelTag } from '@/components/game/PixelTag'
import { haptic } from '@/lib/miniapp'
import { cn } from '@/lib/utils'
import type { GameInfo } from '../data/games'
import { usePosterReady } from '../hooks/use-poster-ready'

const BLOCKS = 12
/** The bar fills block by block over this long (and never ends sooner). */
const FILL_MS = 1500

const TUBES = { coin: 'text-coin', neon: 'text-neon', plasma: 'text-plasma' } as const

interface Props {
  game: GameInfo
  onDone: () => void
}

/**
 * A game's loading screen, as a cabinet would boot it: the tube switches on
 * into the poster, an 8-bit bar fills along the bottom, and «PRESS START»
 * blinks once it's ready. A tap at any moment starts the game — the tube
 * collapses to a line and the game is already mounted underneath.
 */
export function GameIntro({ game, onDone }: Props) {
  const ready = usePosterReady(game.poster, FILL_MS)
  const [leaving, setLeaving] = useState(false)
  const tube = TUBES[game.tone]

  const start = () => {
    if (leaving) return
    haptic()
    setLeaving(true)
    window.setTimeout(onDone, 340)
  }

  return (
    <button
      type="button"
      aria-label={`ابدأ ${game.title}`}
      onClick={start}
      className="fixed inset-0 z-70 flex justify-center bg-screen"
    >
      <div
        className={cn(
          'relative flex h-full w-full max-w-md flex-col overflow-hidden',
          leaving ? 'animate-crt-off' : 'animate-crt-on',
        )}
      >
        {game.poster ? (
          <img
            src={game.poster}
            alt=""
            decoding="async"
            className="absolute inset-0 size-full animate-poster-drift object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center pixel-grid grid-cell-6">
            <PixelSprite name={game.sprite} className="size-40 animate-sprite-hop" />
          </div>
        )}
        <div aria-hidden className="pointer-events-none absolute inset-0 scanlines" />
        {/* Darken top and bottom so the HUD reads over any poster. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-screen/85 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-linear-to-t from-screen via-screen/80 to-transparent" />

        <div className={cn('relative flex items-center justify-between px-4 pt-safe-4', tube)}>
          <PixelTag className="glow-text">{game.code}</PixelTag>
          <PixelTag className="text-ink-soft">CREDIT 01</PixelTag>
        </div>

        <div className="relative mt-auto flex flex-col items-center gap-4 px-6 pb-safe-8">
          <p className={cn('font-display text-32 font-extrabold glow-text', tube)}>{game.title}</p>
          <div
            role="progressbar"
            aria-label="جاري التحميل"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={ready ? 100 : undefined}
            className={cn('flex w-full gap-1 rounded-control border-2 border-current bg-screen/70 p-1', tube)}
          >
            {Array.from({ length: BLOCKS }, (_, i) => (
              <span
                key={i}
                className="h-3 flex-1 animate-block-on bg-current"
                style={{ animationDelay: `${String(Math.round(((i + 1) * FILL_MS) / BLOCKS))}ms` }}
              />
            ))}
          </div>
          <PixelTag className={cn('text-12', ready ? 'animate-blink text-coin glow-text' : 'text-ink-faint')}>
            {ready ? 'PRESS START' : 'LOADING…'}
          </PixelTag>
        </div>
      </div>
    </button>
  )
}
