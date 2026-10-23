/** The rules, folded away until someone new asks «شلون نلعب؟». */
export function MafiaRules() {
  return (
    <details className="rounded-card border-2 border-hairline bg-card p-4 shadow-pixel">
      <summary className="cursor-pointer list-none font-display text-16 font-bold">شلون نلعب؟</summary>
      <ol className="mt-3 flex list-decimal flex-col gap-2 ps-5 text-14 leading-relaxed text-ink-soft">
        <li>كل واحد يشوف دوره على موبايله. المافيا يعرفون بعض.</li>
        <li>بالليل الكل يختار من موبايله: المافيا ضحية، الطبيب يحمي، المحقق يحقق، والباقين يختارون منو يشكون بيه.</li>
        <li>الصبح تنعرف الضحية. تناقشون، وكل واحد يصوّت من موبايله منو يطلع.</li>
        <li>المدينة تفوز إذا طلعت كل المافيا. المافيا تفوز إذا صار عددهم يساوي الباقين.</li>
      </ol>
    </details>
  )
}
