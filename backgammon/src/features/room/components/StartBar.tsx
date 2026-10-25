import { Play } from 'lucide-react'
import { ActionBar } from '@/components/layout/ActionBar'
import { Button } from '@/components/ui/button'

interface Props {
  isHost: boolean
  /** Online players in the room. */
  present: number
  min: number
  onStart: () => void
}

/** The lobby's bottom key: the host opens the box; the other side waits for them. */
export function StartBar({ isHost, present, min, onStart }: Props) {
  const short = Math.max(0, min - present)
  return (
    <ActionBar className="flex-col items-stretch gap-2">
      {short > 0 && <p className="text-center text-13 font-semibold text-brick-lit">ننتظر لاعب ثاني يدخل الغرفة</p>}
      {isHost ? (
        <Button size="lg" disabled={short > 0} onClick={onStart}>
          <Play />
          ابدأ المباراة
        </Button>
      ) : (
        <p className="py-3 text-center text-15 font-semibold text-ink-soft">ننتظر صاحب الغرفة يبدأ…</p>
      )}
    </ActionBar>
  )
}
