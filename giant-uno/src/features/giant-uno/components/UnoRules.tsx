import { signed } from '@shared/data/deck'

const STEPS = [
  'كل واحد ياخذ 7 ورقات. بدورك العب ورقة تطابق اللي فوق الكومة باللون، أو الرقم، أو الرمز.',
  'ما عندك شي يركب؟ اسحب ورقة، وإذا ركبت تگدر تلعبها هسه.',
  'لمن تنزّل الورقة قبل الأخيرة صيح «وحدة!». إذا مسكك أحد ما صايح قبل الحركة الجاية، تسحب 2.',
  'أول واحد يخلّص ورقه ياخذ نقاط الورق اللي بإيد الباقين.',
] as const

const SPECIALS = [
  { name: 'تخطّي', how: 'اللي بعدك يروح دوره.' },
  { name: 'عكس', how: 'الدور يمشي بالعكس. إذا تلعبون ثنين، تلعب مرة ثانية.' },
  { name: signed(2), how: 'اللي بعدك يسحب ورقتين ويروح دوره.' },
  { name: 'جوكر', how: 'ينلعب على أي ورقة، وتختار اللون.' },
  { name: `جوكر ${signed(4)}`, how: 'تختار اللون واللي بعدك يسحب 4. ينلعب بس إذا ما عندك من اللون، واللي بعدك يگدر يتحدّاك.' },
  { name: 'جوكر القاعدة', how: 'ورقتين فارغات: صاحب الغرفة يختار شنو تسوّي قبل التوزيع.' },
] as const

/** How بقت وحدة! is played: the front door, and the guests' lobby while the host sets it up. */
export function UnoRules() {
  return (
    <section className="flex flex-col gap-3 rounded-card border-2 border-hairline bg-card p-4 shadow-pixel">
      <h2 className="font-display text-16 font-bold">شلون نلعب؟</h2>
      <ol className="flex flex-col gap-2">
        {STEPS.map((step, i) => (
          <li key={step} className="flex gap-2 text-14 leading-relaxed text-ink-soft">
            <span className="font-display font-bold text-coin">{`${String(i + 1)}.`}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <ul className="flex flex-col gap-2">
        {SPECIALS.map((s) => (
          <li key={s.name} className="flex flex-col gap-0.5 border-t border-divider pt-2">
            <span className="font-display text-14 font-bold text-plasma">{s.name}</span>
            <span className="text-13 leading-relaxed text-ink-soft">{s.how}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
