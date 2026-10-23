import { Check, MessageCircleQuestion, Vote } from 'lucide-react'
import type { OutsiderView } from '@shared/protocol'
import { GameScreen } from '@/components/game/GameScreen'
import { PixelTag } from '@/components/game/PixelTag'
import { Button } from '@/components/ui/button'

interface Props {
  view: OutsiderView
  isHost: boolean
  onAsked: () => void
  onVote: () => void
}

/** Who asks whom right now. The asker (or the host) moves it on; the host calls the vote. */
export function OutsiderAsk({ view, isHost, onAsked, onVote }: Props) {
  const ask = view.ask
  if (!ask) return null
  return (
    <div className="flex flex-col gap-4">
      <GameScreen tone={ask.mine ? 'coin' : 'neon'}>
        <PixelTag className="text-coin">{`Q ${String(ask.index)} / ${String(ask.total)}`}</PixelTag>
        <p key={ask.asker} className="animate-pixel-pop font-display text-32 font-extrabold text-coin glow-text">
          {ask.mine ? 'إنت' : ask.asker}
        </p>
        <MessageCircleQuestion aria-hidden className="size-7 animate-sprite-hop text-ink-faint" />
        <p className="text-14 text-ink-soft">{ask.mine ? 'تسأل' : 'يسأل'}</p>
        <p key={ask.target} className="animate-pixel-pop font-display text-32 font-extrabold text-neon glow-text">{ask.target}</p>
        <p className="text-13 text-ink-faint">السالفة من نوع {view.category}</p>
      </GameScreen>
      {(ask.mine || isHost) && (
        <Button size="xl" onClick={onAsked}>
          <Check />
          {ask.mine ? 'سألت' : 'السؤال الجاي'}
        </Button>
      )}
      {isHost && (
        <Button size="lg" variant="plasma" onClick={onVote}>
          <Vote />
          خلاص، نصوّت
        </Button>
      )}
    </div>
  )
}
