import { Wifi, WifiOff } from 'lucide-react'
import { PixelTag } from '@/components/game/PixelTag'
import type { Status } from '@/lib/realtime/connection'
import { cn } from '@/lib/utils'

/** ONLINE / RECONNECTING… — so a frozen screen is never a mystery. */
export function ConnectionPill({ status }: { status: Status }) {
  const online = status === 'open'
  const Icon = online ? Wifi : WifiOff
  return (
    <span
      role="status"
      className={cn(
        'flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1',
        online ? 'border-success/40 text-success' : 'animate-blink border-plasma/50 text-plasma',
      )}
    >
      <Icon aria-hidden className="size-3.5" />
      <PixelTag className="text-9">{online ? 'ONLINE' : 'RECONNECTING'}</PixelTag>
    </span>
  )
}
