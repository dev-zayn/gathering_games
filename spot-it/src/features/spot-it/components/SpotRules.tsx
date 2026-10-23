import { MODES } from '../data/modes'

/** How لگطها is played, with the five mini-games the host picks from. */
export function SpotRules() {
  return (
    <section className="flex flex-col gap-3 rounded-card border-2 border-hairline bg-card p-4 shadow-pixel">
      <h2 className="font-display text-16 font-bold">شلون نلعب؟</h2>
      <p className="text-14 leading-relaxed text-ink-soft">
        بكل ورقة ثمن رموز، وأي ورقتين بيناتهن رمز واحد بس مشترك. أول واحد يلگطه ويدوس عليه ياخذ الحركة.
        الدوسة الغلط تجمّدك ثانيتين.
      </p>
      <ul className="flex flex-col gap-2">
        {MODES.map((m) => (
          <li key={m.id} className="flex flex-col gap-0.5 border-t border-divider pt-2">
            <span className="font-display text-14 font-bold text-coin">
              {m.title} <span className="text-12 font-semibold text-ink-faint">· {m.goal}</span>
            </span>
            <span className="text-13 leading-relaxed text-ink-soft">{m.how}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
