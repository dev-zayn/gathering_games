import { COLOR_NAMES, cardName, cardOf, signed } from '../../../shared/data/deck'
import type { UnoLine } from '../../../shared/protocol'
import type { Event } from './rules'

// What just happened, in a line for one phone: «لعبت أحمر 7» on yours,
// «علي لعب أحمر 7» on everyone else's.

type Name = (id: string) => string

function text(e: Event, me: string, name: Name): string {
  switch (e.k) {
    case 'deal':
      return e.dealer === me ? `إنت توزّع · اليد ${String(e.hand)}` : `${name(e.dealer)} يوزّع · اليد ${String(e.hand)}`
    case 'play': {
      const card = cardName(cardOf(e.card))
      const color = e.color ? COLOR_NAMES[e.color] : null
      return e.by === me ? `لعبت ${card}${color ? ` واخترت ${color}` : ''}` : `${name(e.by)} لعب ${card}${color ? ` واختار ${color}` : ''}`
    }
    case 'color':
      return e.by === me ? `اخترت ${COLOR_NAMES[e.color]}` : `${name(e.by)} اختار ${COLOR_NAMES[e.color]}`
    case 'draw': {
      const n = String(e.count)
      if (e.why === 'hunt') return e.by === me ? `سحبت ${n} لين طلع اللون` : `${name(e.by)} سحب ${n} لين طلع اللون`
      if (e.why === 'turn' || e.why === 'timeout') return e.by === me ? 'سحبت ورقة' : `${name(e.by)} سحب ورقة`
      return e.by === me ? `سحبت ${n} وراح دورك` : `${name(e.by)} سحب ${n} وراح دوره`
    }
    case 'skip':
      return e.who === me ? 'راح دورك' : `راح دور ${name(e.who)}`
    case 'reverse':
      return 'انعكس الدور ↺'
    case 'pass':
      return e.by === me ? 'عدّيت' : `${name(e.by)} عدّى`
    case 'call':
      return e.by === me ? 'صحت «وحدة!»' : `${name(e.by)} صاح «وحدة!»`
    case 'caught':
      if (e.by === me) return `مسكت ${name(e.who)} ما صاح! سحب 2`
      if (e.who === me) return `${name(e.by)} مسكك ما صحت! سحبت 2`
      return `${name(e.by)} مسك ${name(e.who)} ما صاح: سحب 2`
    case 'challenge':
      if (e.won) {
        if (e.by === me) return `كشفت ${name(e.of)}! عنده اللون، هو يسحب 4`
        if (e.of === me) return `${name(e.by)} كشفك! سحبت 4`
        return `${name(e.by)} كشف ${name(e.of)}: هو يسحب 4`
      }
      if (e.by === me) return `${name(e.of)} طلع صادق: سحبت 6`
      if (e.of === me) return `${name(e.by)} تحدّاك وطلعت صادق: سحب 6`
      return `${name(e.by)} تحدّى ${name(e.of)} وخسر: سحب 6`
    case 'swap':
      if (e.by === me) return `بدّلت ورقك ويا ${name(e.with)}`
      if (e.with === me) return `${name(e.by)} بدّل ورقه وياك`
      return `${name(e.by)} بدّل ورقه ويا ${name(e.with)}`
    case 'dump':
      return e.by === me ? `ذبيت ${String(e.count)} ورق ${COLOR_NAMES[e.color]}` : `${name(e.by)} ذب ${String(e.count)} ورق ${COLOR_NAMES[e.color]}`
    case 'again':
      return e.by === me ? 'تلعب مرة ثانية' : `${name(e.by)} يلعب مرة ثانية`
    case 'timeout':
      return e.who === me ? 'خلص وقتك' : `خلص وقت ${name(e.who)}`
    case 'out':
      return e.by === me ? `خلّصت ورقك! ${signed(e.points)}` : `${name(e.by)} خلّص ورقه! ${signed(e.points)}`
  }
}

/** Your move, or it lands on you, or neither. */
function tone(e: Event, me: string): UnoLine['tone'] {
  switch (e.k) {
    case 'draw':
      return e.by === me ? (e.why === 'turn' ? 'you' : 'hit') : 'plain'
    case 'skip':
      return e.who === me ? 'hit' : 'plain'
    case 'caught':
      return e.by === me ? 'you' : e.who === me ? 'hit' : 'plain'
    case 'challenge':
      if (e.by === me) return e.won ? 'you' : 'hit'
      if (e.of === me) return e.won ? 'hit' : 'you'
      return 'plain'
    case 'swap':
      return e.by === me ? 'you' : e.with === me ? 'hit' : 'plain'
    case 'timeout':
      return e.who === me ? 'hit' : 'plain'
    case 'play':
    case 'color':
    case 'pass':
    case 'call':
    case 'dump':
    case 'again':
    case 'out':
      return e.by === me ? 'you' : 'plain'
    default:
      return 'plain'
  }
}

export const lineFor = (e: Event, me: string, name: Name): UnoLine => ({ n: e.n, text: text(e, me, name), tone: tone(e, me) })
