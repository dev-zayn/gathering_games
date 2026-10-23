import { PROMPTS } from '../../shared/data/most-likely-prompts'
import type { MostLikelyView } from '../../shared/protocol'
import { shuffle } from '../../shared/random'
import { actionOf, count, nameOf, named, pending, refuse, type Engine } from '../engine'

interface State {
  ids: string[]
  deck: string[]
  card: number
  phase: MostLikelyView['phase']
  votes: Record<string, string>
  crowned: string[]
  crowns: Record<string, number>
}

export const mostLikely: Engine<State, null> = {
  id: 'most-likely',

  scores: (s) => s.ids.map((id) => ({ player: id, score: s.crowns[id] ?? 0 })),

  options: () => null,

  start: (ctx) => ({
    ids: [...ctx.ids],
    deck: shuffle(PROMPTS),
    card: 0,
    phase: 'voting',
    votes: {},
    crowned: [],
    crowns: {},
  }),

  act(s, ctx, me, raw) {
    const a = actionOf(raw)
    if (!s.ids.includes(me)) return refuse('إنت مو بهاي اللعبة')
    switch (a.type) {
      case 'vote':
        if (s.phase !== 'voting' || typeof a.target !== 'string' || a.target === me || !s.ids.includes(a.target)) {
          return refuse('تصويت مو صحيح')
        }
        return { ...s, votes: { ...s.votes, [me]: a.target } }
      case 'next': {
        if (s.phase !== 'reveal' || me !== ctx.hostId) return refuse('بس صاحب الغرفة يقلب البطاقة')
        const last = s.card >= s.deck.length - 1
        return { ...s, deck: last ? shuffle(PROMPTS) : s.deck, card: last ? 0 : s.card + 1, phase: 'voting', votes: {}, crowned: [] }
      }
      default:
        return refuse('حركة مو معروفة')
    }
  },

  settle(s, ctx) {
    if (s.phase !== 'voting' || Object.keys(s.votes).length === 0) return s
    if (pending(s.ids, (id) => id in s.votes, ctx).length > 0) return s
    const counts = count(s.votes)
    const top = counts[0]?.[1] ?? 0
    // Every name on the top count is crowned — a tie crowns them all.
    const crowned = counts.filter(([, n]) => n === top).map(([id]) => id)
    const crowns = { ...s.crowns }
    for (const id of crowned) crowns[id] = (crowns[id] ?? 0) + 1
    return { ...s, phase: 'reveal', crowned, crowns }
  },

  view(s, ctx, me) {
    const view: MostLikelyView = {
      game: 'most-likely',
      phase: s.phase,
      card: s.card + 1,
      prompt: s.deck[s.card] ?? '',
      candidates: named(
        ctx,
        s.ids.filter((id) => id !== me),
      ),
      voted: me in s.votes,
      waitingOn: pending(s.ids, (id) => id in s.votes, ctx).map((id) => nameOf(ctx, id)),
      reveal:
        s.phase === 'reveal'
          ? {
              counts: count(s.votes).map(([id, votes]) => ({ name: nameOf(ctx, id), votes })),
              crowned: s.crowned.map((id) => nameOf(ctx, id)),
            }
          : null,
      crowns: s.ids.map((id) => ({ name: nameOf(ctx, id), score: s.crowns[id] ?? 0 })).sort((a, b) => b.score - a.score),
    }
    const yourTurn = s.phase === 'voting' && !view.voted ? 'بطاقة جديدة! صوّت بالسر' : null
    return { view, yourTurn }
  },
}
