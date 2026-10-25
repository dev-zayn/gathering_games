// The rules alone: `bun test test` from the game's folder.
const { describe, expect, test } = require('bun:test')
const D = require('../rules.js')

const players = (n) => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}` }))
const key = (t) => `${Math.min(t[0], t[1])}-${Math.max(t[0], t[1])}`

/** Every tile is somewhere, once: in a hand, the boneyard or the chain. */
function accounted(s) {
  const all = [...s.boneyard, ...s.board, ...s.players.flatMap((p) => p.hand)].map(key)
  return all.length === 28 && new Set(all).size === 28
}

/** The chain touches at every joint and its ends are what the state says. */
function chained(s) {
  for (let i = 1; i < s.board.length; i++) if (s.board[i - 1][1] !== s.board[i][0]) return false
  return s.board.length === 0 || (s.board[0][0] === s.left && s.board[s.board.length - 1][1] === s.right)
}

describe('the set and the deal', () => {
  test('28 tiles, seven each, the rest in the boneyard', () => {
    expect(D.makeSet()).toHaveLength(28)
    for (const n of [2, 3, 4]) {
      const s = D.newMatch(players(n), 100)
      expect(s.players.every((p) => p.hand.length === 7)).toBe(true)
      expect(s.boneyard).toHaveLength(28 - 7 * n)
      expect(accounted(s)).toBe(true)
    }
  })

  test('the highest double starts, else the highest tile', () => {
    const ps = [{ hand: [[1, 2], [5, 5]] }, { hand: [[6, 6], [0, 1]] }]
    expect(D.starterOf(ps)).toBe(1)
    expect(D.starterOf([{ hand: [[1, 2]] }, { hand: [[5, 6]] }])).toBe(1)
  })
})

describe('a move', () => {
  function table() {
    const s = D.newMatch(players(2), 100)
    s.players[0].hand = [[6, 6], [6, 3], [1, 2]]
    s.players[1].hand = [[3, 4], [0, 0]]
    s.boneyard = [[2, 2]]
    s.turn = 0
    return s
  }

  test('only on your turn, only a tile you hold, only on an end it fits', () => {
    const s = table()
    expect(D.act(s, 1, { type: 'play', tile: [3, 4], side: 'left' })).toBe('مو دورك')
    expect(D.act(s, 0, { type: 'play', tile: [4, 4], side: 'left' })).toBe('هالحجر مو بيدك')
    expect(D.act(s, 0, { type: 'play', tile: [6, 6] })).toBeNull()
    expect(s.left).toBe(6)
    expect(s.right).toBe(6)
    expect(D.act(s, 1, { type: 'play', tile: [3, 4], side: 'right' })).toBe('هالحجر ما يركب على هالطرف')
  })

  test('a tile turns to match the end it is laid on', () => {
    const s = table()
    D.act(s, 0, { type: 'play', tile: [6, 6] })
    s.turn = 0
    D.act(s, 0, { type: 'play', tile: [3, 6], side: 'left' })
    expect(s.board).toEqual([[3, 6], [6, 6]])
    expect(s.left).toBe(3)
    expect(chained(s)).toBe(true)
  })

  test('draw only with nothing to play; pass only with nothing to draw either', () => {
    const s = table()
    D.act(s, 0, { type: 'play', tile: [6, 6] })
    expect(D.act(s, 1, { type: 'pass' })).toBe('اسحب من الكومة أول')
    expect(D.act(s, 1, { type: 'draw' })).toBeNull()
    expect(s.players[1].hand).toHaveLength(3)
    expect(D.act(s, 1, { type: 'draw' })).toBe('الكومة خلصت')
    expect(D.act(s, 1, { type: 'pass' })).toBeNull()
    expect(s.turn).toBe(0)
    expect(D.act(s, 0, { type: 'draw' })).toBe('عندك حجر يركب، ما تحتاج تسحب')
  })

  test('going out wins the round and everyone else’s points', () => {
    const s = table()
    s.players[0].hand = [[6, 6]]
    D.act(s, 0, { type: 'play', tile: [6, 6] })
    expect(s.phase).toBe('round')
    expect(s.result.winner).toBe(0)
    expect(s.result.gained).toBe(7)
    expect(s.players[0].score).toBe(7)
  })

  test('a blocked round goes to the lightest hand', () => {
    const s = table()
    s.players[0].hand = [[1, 1], [6, 6]]
    s.players[1].hand = [[2, 3]]
    s.boneyard = []
    D.act(s, 0, { type: 'play', tile: [6, 6] })
    expect(D.act(s, 1, { type: 'pass' })).toBeNull()
    expect(D.act(s, 0, { type: 'pass' })).toBeNull()
    expect(s.phase).toBe('round')
    expect(s.result.blocked).toBe(true)
    expect(s.result.winner).toBe(0)
    expect(s.result.gained).toBe(5)
  })

  test('the match ends at the target', () => {
    const s = table()
    s.players[0].score = 95
    s.players[0].hand = [[6, 6]]
    D.act(s, 0, { type: 'play', tile: [6, 6] })
    expect(s.phase).toBe('match')
    expect(s.winner).toBe(0)
    expect(D.act(s, 0, { type: 'next' })).toBe('الجولة بعدها ما خلصت')
  })
})

describe('whole matches', () => {
  test('computers play 300 matches of 2–4 out: every tile accounted for, the chain always joined', () => {
    for (let i = 0; i < 300; i++) {
      const n = 2 + (i % 3)
      const s = D.newMatch(players(n), [50, 100, 150][i % 3])
      for (let step = 0; step < 20000 && s.phase !== 'match'; step++) {
        if (s.phase === 'round') { expect(D.act(s, -1, { type: 'next' })).toBeNull(); continue }
        expect(D.act(s, s.turn, D.aiAction(s, s.turn))).toBeNull()
        if (!accounted(s) || !chained(s)) throw new Error(`broken table at match ${i}, step ${step}`)
      }
      expect(s.phase).toBe('match')
      expect(s.players[s.winner].score).toBeGreaterThanOrEqual(s.target)
    }
  })

  test('the clock’s whole turn draws until it can play, then plays or passes', () => {
    const s = D.newMatch(players(2), 100)
    for (let k = 0; k < 200 && s.phase === 'play'; k++) {
      const seat = s.turn
      expect(D.autoTurn(s, seat)).toBeNull()
      expect(s.phase !== 'play' || s.turn !== seat).toBe(true)
    }
  })

  test('a view holds only its own hand until the round is over', () => {
    const s = D.newMatch(players(3), 100)
    const v = D.viewFor(s, 1)
    expect(v.hand).toEqual(s.players[1].hand)
    expect(JSON.stringify(v)).not.toContain(JSON.stringify(s.players[0].hand))
    expect(v.players.map((p) => p.count)).toEqual([7, 7, 7])
  })
})
