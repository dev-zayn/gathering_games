import { WifiOff } from 'lucide-react'
import type { Status } from '@/lib/realtime/connection'

/** Shown only while the room's line is down, so a still board is never a mystery. */
export function ConnectionPill({ status }: { status: Status }) {
  if (status === 'open' || status === 'idle') return null
  return (
    <span role="status" className="flex animate-lamp items-center gap-1.5 self-center rounded-full border border-brick/50 bg-brick-soft px-3 py-1 text-12 font-semibold text-brick-lit">
      <WifiOff aria-hidden className="size-3.5" />
      {status === 'connecting' ? 'دا نتصل…' : 'انقطع الخط، دا نرجع…'}
    </span>
  )
}
