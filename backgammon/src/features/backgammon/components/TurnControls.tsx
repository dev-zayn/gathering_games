import type { ReactNode } from 'react'
import { other, type Seat } from '@shared/backgammon/board'
import type { BgView } from '@shared/protocol'
import type { TurnPlay } from '../hooks/use-turn-play'
import { rollText } from '../lib/words'
import { AnswerKeys } from './AnswerKeys'
import { MoveKeys } from './MoveKeys'
import { RollKeys } from './RollKeys'
import { Swatch } from './Swatch'
import { TurnNote as Note } from './TurnNote'

interface Props {
  view: BgView
  /** The seat this screen decides for now; null when it only watches. */
  controller: Seat | null
  play: TurnPlay
  names: [string, string]
  /** Two on one phone: say whose hands it is in. */
  sayWho: boolean
  /** What the other side is up to, while this one waits («دور علي…», «الحجّي يفكّر…»). */
  waiting: string
  throwKey: string
  throwing: boolean
  onRoll: () => void
  act: (action: Record<string, unknown>) => void
  /** The keys once a game is over: the next game, or the match's end. */
  after: ReactNode
}

/** Whatever this phone has to decide right now, under the thumb. */
export function TurnControls({ view, controller, play, names, sayWho, waiting, throwKey, throwing, onRoll, act, after }: Props) {
  if (view.phase === 'between' || view.phase === 'over') return <>{after}</>
  if (controller === null) return <Note>تتفرّج على هاللعبة</Note>

  const who = sayWho && (
    <p className="flex items-center gap-2 text-13 font-semibold text-brass-lit">
      <Swatch seat={controller} className="size-5" />
      {`دور ${names[controller]}`}
    </p>
  )

  if (view.phase === 'double') {
    if (view.turn === controller) return <Note waiting>{`ننتظر جواب ${names[other(controller)]}…`}</Note>
    return (
      <>
        {who}
        <AnswerKeys
          by={names[view.turn]}
          cube={view.cube.value}
          onTake={() => {
            act({ type: 'take' })
          }}
          onPass={() => {
            act({ type: 'pass' })
          }}
        />
      </>
    )
  }

  if (view.turn !== controller) {
    const last = view.last
    const blocked = last?.blocked && last.seat === controller
    return <Note waiting>{blocked ? `ذبّيت ${rollText(last.dice)} وما عندك لعب. ${waiting}` : waiting}</Note>
  }

  if (view.phase === 'roll') {
    return (
      <>
        {who}
        <RollKeys
          canDouble={view.canDouble}
          cube={view.cube.value}
          throwing={throwing}
          onRoll={onRoll}
          onDouble={() => {
            act({ type: 'double' })
          }}
        />
      </>
    )
  }

  if (!view.dice || !play.active) return null
  return (
    <>
      {who}
      <MoveKeys dice={view.dice} play={play} throwKey={throwKey} />
    </>
  )
}
