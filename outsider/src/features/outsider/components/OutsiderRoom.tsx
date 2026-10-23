import type { RoomView } from '@shared/protocol'
import { realtime } from '@/lib/realtime/connection'
import { viewOf } from '@/features/room/hooks/use-room'
import { OutsiderAsk } from './OutsiderAsk'
import { OutsiderCard } from './OutsiderCard'
import { OutsiderGuess } from './OutsiderGuess'
import { OutsiderResult } from './OutsiderResult'
import { OutsiderVote } from './OutsiderVote'

interface Props {
  room: RoomView
  isHost: boolean
}

/** برا السالفة online — the screen for whichever phase the server says we're in. */
export function OutsiderRoom({ room, isHost }: Props) {
  const view = viewOf(room, 'outsider')
  if (!view) return null
  const act = realtime.act
  switch (view.phase) {
    case 'reveal':
      return <OutsiderCard key={view.round} view={view} onSeen={() => { act({ type: 'seen' }) }} />
    case 'questions':
      return (
        <OutsiderAsk
          view={view}
          isHost={isHost}
          onAsked={() => { act({ type: 'asked' }) }}
          onVote={() => { act({ type: 'toVote' }) }}
        />
      )
    case 'vote':
      return <OutsiderVote view={view} onVote={(target) => { act({ type: 'vote', target }) }} />
    case 'guess':
      return (
        <OutsiderGuess
          view={view}
          isHost={isHost}
          onGuess={(word) => { act({ type: 'guess', word }) }}
          onSkip={() => { act({ type: 'skipGuess' }) }}
        />
      )
    case 'result':
      return <OutsiderResult view={view} isHost={isHost} onNext={() => { act({ type: 'next' }) }} />
  }
}
