import { describe, expect, test } from 'bun:test'
import { isRefusal, type Ctx } from '@engine/engine'
import { backgammon } from '@engine/games/backgammon'
import type { State } from '@engine/games/backgammon/rules'
import { OFF, isSound, other, type Seat } from '@shared/backgammon/board'
import { bestPlay, takes, wantsToDouble } from '@shared/backgammon/bot'
import { allPlays, diceOf, type Move } from '@shared/backgammon/moves'
import type { BgOptions } from '@shared/protocol'

// Whole matches played out through the engine, the way two phones would:
// every action goes through `act`, every board after it must be sound.

const ctx: Ctx = { ids: ['p0', 'p1'], names: { p0: 'P0', p1: 'P1' }, connected: new Set(['p0', 'p1']), hostId: 'p0', now: 1 }

type Player = 'bot' | 'random'

function decide(s: State, kind: Player): unknown {
  const seat = s.phase === 'double' ? other(s.turn) : s.turn
  const me = s.board[seat]
  const them = s.board[other(seat)]
  const sense = { value: s.cube.value, length: s.options.length, mine: s.score[seat], theirs: s.score[other(seat)] }
  switch (s.phase) {
    case 'roll': {
      const view = backgammon.view(s, ctx, s.ids[seat]).view
      if (view.canDouble && kind === 'bot' && wantsToDouble(me, them, sense)) return { type: 'double' }
      return { type: 'roll' }
    }
    case 'double':
      return { type: kind === 'random' || takes(me, them, sense) ? 'take' : 'pass' }
    case 'move': {
      const dice = s.dice ?? [1, 1]
      if (kind === 'bot') return { type: 'play', moves: bestPlay(me, them, diceOf(dice)) }
      const plays = allPlays(me, them, diceOf(dice))
      const pick = plays[Math.floor(Math.random() * plays.length)]
      return { type: 'play', moves: pick?.moves ?? ([] as Move[]) }
    }
    case 'between':
      return { type: 'next' }
    case 'over':
      return null
  }
}

/** One match to the end; the seat that won it. */
function playMatch(options: BgOptions, players: [Player, Player]): { winner: Seat; state: State; turns: number } {
  let s = backgammon.start(ctx, options)
  let steps = 0
  while (s.phase !== 'over') {
    if (++steps > 20_000) throw new Error('a match that never ends')
    const seat = s.phase === 'double' ? other(s.turn) : s.turn
    const action = decide(s, players[seat])
    const next = backgammon.act(s, ctx, s.ids[seat], action)
    if (isRefusal(next)) throw new Error(`${s.phase} ${JSON.stringify(action)} refused: ${next.error}`)
    s = backgammon.settle(next, ctx)
    if (!isSound(s.board)) throw new Error(`unsound board after ${JSON.stringify(action)}: ${JSON.stringify(s.board)}`)
  }
  if (s.winner === null) throw new Error('over without a winner')
  return { winner: s.winner, state: s, turns: s.turns }
}

describe('whole matches', () => {
  test('300 single games with the cube end soundly, worth 1–3 times a cube of 1–64', () => {
    for (let i = 0; i < 300; i++) {
      const { winner, state } = playMatch({ length: 1, cube: true }, ['bot', 'bot'])
      const r = state.result
      expect(r?.winner).toBe(winner)
      expect([1, 2, 3]).toContain(r?.kind ?? 0)
      expect(r?.points).toBe((r?.kind ?? 0) * (r?.cube ?? 0))
      expect(state.score[winner]).toBe(r?.points ?? -1)
      expect(state.score[other(winner)]).toBe(0)
      if (!r?.passed) expect(state.board[winner][OFF]).toBe(15)
    }
  }, 60_000)

  test('80 matches to 5 reach 5, with one Crawford game at most', () => {
    for (let i = 0; i < 80; i++) {
      const { winner, state } = playMatch({ length: 5, cube: true }, ['bot', 'bot'])
      expect(state.score[winner]).toBeGreaterThanOrEqual(5)
      expect(state.score[other(winner)]).toBeLessThan(5)
    }
  }, 60_000)

  test('random movers without the cube still finish every game', () => {
    for (let i = 0; i < 100; i++) {
      const { state } = playMatch({ length: 3, cube: false }, ['random', 'random'])
      expect(state.cube.value).toBe(1)
    }
  }, 60_000)

  test('الحجّي beats a random mover nearly every time', () => {
    let wins = 0
    const games = 60
    for (let i = 0; i < games; i++) {
      const bot: Seat = i % 2 === 0 ? 0 : 1
      const players: [Player, Player] = bot === 0 ? ['bot', 'random'] : ['random', 'bot']
      if (playMatch({ length: 1, cube: false }, players).winner === bot) wins++
    }
    expect(wins / games).toBeGreaterThan(0.85)
  }, 60_000)
})
