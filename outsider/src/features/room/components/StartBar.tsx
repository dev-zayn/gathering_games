import { Play } from 'lucide-react'
import { ActionBar } from '@/components/layout/ActionBar'
import { Button } from '@/components/ui/button'

interface Props {
  isHost: boolean
  /** Online players in the room. */
  present: number
  min: number
  onStart: () => void
  disabled?: boolean
}

/** The lobby's bottom key: the host starts; everyone else waits for them. */
export function StartBar({ isHost, present, min, onStart, disabled = false }: Props) {
  const short = Math.max(0, min - present)
  return (
    <ActionBar className="flex-col items-stretch gap-2">
      {short > 0 && (
        <p className="text-center text-13 font-semibold text-plasma">
          {short === 1 ? 'تحتاجون لاعب واحد بعد' : `تحتاجون ${String(short)} لاعبين بعد`}
        </p>
      )}
      {isHost ? (
        <Button size="lg" disabled={short > 0 || disabled} onClick={onStart}>
          <Play />
          ابدأ اللعبة
        </Button>
      ) : (
        <p className="py-3 text-center font-display text-15 font-bold text-ink-soft">ننتظر صاحب الغرفة يبدأ…</p>
      )}
    </ActionBar>
  )
}
