import { useEffect } from 'react'
import { isRefusal, type Ctx } from '@engine/engine'
import { backgammon } from '@engine/games/backgammon'
import { waitingOn, type State } from '@engine/games/backgammon/rules'
import type { Seat } from '@shared/backgammon/board'
import { bestPlay, takes, wantsToDouble } from '@shared/backgammon/bot'
import { diceOf } from '@shared/backgammon/moves'
import { usePersisted } from '@/lib/persisted-store'
import { toast } from '@/lib/toast-store'
import { localStore, type LocalMatch } from '../local-store'

/** How long الحجّي takes over each thing he does: a man at a café table, not a machine. */
const PACE = { roll: 900, firstMove: 1100, nextMove: 650, done: 500, answer: 1500, double: 700 } as const

function ctxOf(match: LocalMatch, now: number): Ctx {
  const ids = match.state.ids
  return {
    ids,
    names: { [ids[0]]: match.names[0], [ids[1]]: match.names[1] },
    connected: new Set(ids),
    hostId: ids[0],
    now,
  }
}

/** One step of الحجّي's, if the board waits on him: what he does, and after how long. */
function botStep(s: State): { action: Record<string, unknown>; after: number } | null {
  if (waitingOn(s) !== 1) return null
  const me = s.board[1]
  const them = s.board[0]
  const sense = { value: s.cube.value, length: s.options.length, mine: s.score[1], theirs: s.score[0] }
  if (s.phase === 'double') return { action: { type: takes(me, them, sense) ? 'take' : 'pass' }, after: PACE.answer }
  if (s.phase === 'roll') {
    const may = backgammon.view(s, { ids: s.ids, names: {}, connected: new Set(s.ids), hostId: s.ids[0], now: 0 }, s.ids[1]).view.canDouble
    return may && wantsToDouble(me, them, sense)
      ? { action: { type: 'double' }, after: PACE.double }
      : { action: { type: 'roll' }, after: PACE.roll }
  }
  if (s.phase !== 'move' || !s.dice) return null
  // His play is worked out from the turn's start each time (the same every time), and laid down a checker at a time.
  const plan = bestPlay(me, them, diceOf(s.dice))
  if (s.staged.length < plan.length) {
    return { action: { type: 'stage', moves: plan.slice(0, s.staged.length + 1) }, after: s.staged.length === 0 ? PACE.firstMove : PACE.nextMove }
  }
  return { action: { type: 'play', moves: plan }, after: PACE.done }
}

/** A move on this phone's board: the engine checks it, the store keeps it. */
function apply(current: LocalMatch, seat: Seat, action: Record<string, unknown>) {
  const ctx = ctxOf(current, Date.now())
  const next = backgammon.act(current.state, ctx, current.state.ids[seat], action)
  if (isRefusal(next)) {
    toast.error(next.error)
    return
  }
  localStore.set({ ...current, state: backgammon.settle(next, ctx) })
}

/**
 * A match on this phone alone, the engine run right here: against الحجّي
 * (who plays seat 1 at a café pace), or two people taking turns with the
 * phone. Kept in storage after every move, so closing the frame loses
 * nothing.
 */
export function useLocalMatch() {
  const match = usePersisted(localStore)

  // Every new board is a cue for الحجّي, if it waits on him.
  useEffect(() => {
    if (match?.mode !== 'bot') return
    const step = botStep(match.state)
    if (!step) return
    const t = window.setTimeout(() => {
      apply(match, 1, step.action)
    }, step.after)
    return () => {
      window.clearTimeout(t)
    }
  }, [match])

  if (!match) return null
  const { state: s, mode } = match
  // With الحجّي this screen always decides for seat 0; two on one phone, for whoever the board waits on.
  const controller: Seat = mode === 'bot' ? 0 : (waitingOn(s) ?? s.turn)
  const view = backgammon.view(s, ctxOf(match, 0), s.ids[controller]).view
  return {
    match,
    view,
    controller,
    act: (action: Record<string, unknown>) => {
      apply(match, controller, action)
    },
  }
}
