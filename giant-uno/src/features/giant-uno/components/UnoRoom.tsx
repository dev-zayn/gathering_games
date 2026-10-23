import { useState } from 'react'
import { COLOR_NAMES, HOUSE_RULES } from '@shared/data/deck'
import type { RoomView, UnoCard } from '@shared/protocol'
import { viewOf } from '@/features/room/hooks/use-room'
import { realtime } from '@/lib/realtime/connection'
import { useHostNow } from '../hooks/use-host-now'
import { ChallengePanel } from './ChallengePanel'
import { ColorPicker } from './ColorPicker'
import { EventLog } from './EventLog'
import { HandGrid } from './HandGrid'
import { HandOver } from './HandOver'
import { MoveBar } from './MoveBar'
import { SeatGrid } from './SeatGrid'
import { ShownHand } from './ShownHand'
import { TableCenter } from './TableCenter'

interface Props {
  room: RoomView
  isHost: boolean
  clockOffset: number
}

const act = (action: Record<string, unknown>) => {
  realtime.act(action)
}

/**
 * بقت وحدة! on the table: the seats, the pile and its colour, what just
 * happened, then whatever this phone has to decide (a wild's colour, a Draw
 * Four, a draw or a pass) over its hand.
 */
export function UnoRoom({ room, isHost, clockOffset }: Props) {
  const view = viewOf(room, 'giant-uno')
  const now = useHostNow(clockOffset)
  const [picked, setPicked] = useState<number | null>(null)
  if (!view) return null

  const secs = Math.max(0, Math.ceil((view.until - now) / 1000))
  if (view.phase === 'between' || view.phase === 'over') return <HandOver view={view} isHost={isHost} secs={secs} />

  const yours = view.dealt && view.turn === room.you
  const playing = yours && view.phase === 'play'
  // A wild waiting for its colour; gone once the move has passed.
  const wild = picked !== null && view.playable.includes(picked) ? view.hand.find((c) => c.id === picked) : undefined
  const swap = wild?.kind === 'custom' && view.options.house === 'swap'
  const bluff = wild?.kind === 'wild4' && view.hand.some((c) => c.color === view.color)

  const pick = (card: UnoCard) => {
    if (card.color === null) {
      setPicked(card.id)
      return
    }
    setPicked(null)
    act({ type: 'play', card: card.id })
  }

  return (
    <div className="flex flex-col gap-3">
      <SeatGrid
        view={view}
        secs={secs}
        onCatch={(who) => {
          act({ type: 'catch', who })
        }}
      />
      <TableCenter
        view={view}
        canDraw={playing && view.drawn === null && !wild}
        onDraw={() => {
          act({ type: 'draw' })
        }}
      />
      <EventLog view={view} />
      {view.shown && <ShownHand shown={view.shown} />}

      {view.challenge ? (
        <ChallengePanel by={view.challenge.by} over={view.challenge.over} secs={secs} act={act} />
      ) : yours && view.phase === 'color' ? (
        <ColorPicker
          title="الورقة الأولى جوكر: اختار اللون"
          onPick={(color) => {
            act({ type: 'color', color })
          }}
        />
      ) : wild ? (
        <ColorPicker
          title={wild.kind === 'custom' ? `${HOUSE_RULES[view.options.house].title}: اختار اللون` : 'اختار اللون'}
          note={bluff ? `عندك ${COLOR_NAMES[view.color]}: إذا تحدّاك اللي بعدك تسحب إنت 4.` : null}
          targets={swap ? view.seats.filter((s) => !s.you) : null}
          onPick={(color, target) => {
            setPicked(null)
            act({ type: 'play', card: wild.id, color, target })
          }}
          onCancel={() => {
            setPicked(null)
          }}
        />
      ) : view.dealt ? (
        <MoveBar view={view} yours={playing} secs={secs} act={act} />
      ) : null}

      {view.dealt ? (
        <HandGrid view={view} yours={playing} picked={wild ? wild.id : null} onPick={pick} />
      ) : (
        <p className="text-center text-13 text-ink-faint">دخلت بعد التوزيع: تفرّج هاليد، وبالجولة الجاية تلعب.</p>
      )}
    </div>
  )
}
