import { Hourglass } from 'lucide-react'

interface Props {
  /** Names still to move — or a bare count when names would give a secret away. */
  names?: string[]
  count?: number
  label?: string
}

/** «ننتظر: …» — who the room is waiting on. */
export function WaitingFor({ names, count, label = 'ننتظر' }: Props) {
  const n = names?.length ?? count ?? 0
  if (n === 0) return null
  return (
    <p className="flex items-center justify-center gap-2 text-center text-13 text-ink-faint">
      <Hourglass aria-hidden className="size-4 animate-sprite-hop text-coin" />
      {names ? `${label}: ${names.join('، ')}` : `${label} ${String(n)} لاعبين`}
    </p>
  )
}
