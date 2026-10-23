import { Snowflake } from 'lucide-react'
import { useCountdown } from '../hooks/use-countdown'

interface Props {
  until: number
  clockOffset: number
}

/** A wrong tap's freeze over your cards: no tapping everything till the right one lights. */
export function FreezeCover({ until, clockOffset }: Props) {
  const secs = useCountdown(until, clockOffset)
  if (secs <= 0) return null
  return (
    <div className="absolute inset-0 z-10 flex animate-pixel-pop flex-col items-center justify-center gap-2 rounded-section bg-neon-soft/80 text-center">
      <Snowflake aria-hidden className="size-14 text-neon" />
      <p className="font-display text-20 font-extrabold text-neon">غلط! مجمّد {secs}</p>
    </div>
  )
}
