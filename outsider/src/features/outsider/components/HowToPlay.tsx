import { ChevronDown } from 'lucide-react'

const RULES = [
  'كل واحد يشوف كرته على موبايله. الكل يعرف السالفة إلا واحد: «برا السالفة».',
  'الموبايل يگولك متى دورك تسأل ومنو تسأل. اسألوا بدون ما تفضحوها.',
  'اللي برا السالفة يحاول يفهمها من الأسئلة ويسوي نفسه يعرفها.',
  'كل واحد يصوّت بالسر من موبايله، وبعدها برا السالفة يحاول يحزرها.',
]

/** The rules, folded away until someone new asks «شلون نلعب؟». */
export function HowToPlay() {
  return (
    <details className="group rounded-card border-2 border-hairline bg-card p-4 shadow-pixel">
      <summary className="flex cursor-pointer list-none items-center justify-between font-display text-16 font-bold">
        شلون نلعب؟
        <ChevronDown aria-hidden className="size-5 text-ink-faint transition-transform group-open:rotate-180" />
      </summary>
      <ol className="mt-3 flex list-decimal flex-col gap-2 ps-5 text-14 leading-relaxed text-ink-soft">
        {RULES.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ol>
      <p className="mt-3 text-13 leading-relaxed text-coin">
        النقاط: كل واحد صوّت صح ياخذ نقطة. برا السالفة ياخذ نقطة إذا ما انكشف، ونقطة إذا حزر السالفة.
      </p>
    </details>
  )
}
