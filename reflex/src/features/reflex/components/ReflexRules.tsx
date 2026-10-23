/** How أسرع إصبع is played in a room. */
export function ReflexRules() {
  return (
    <section className="flex flex-col gap-3 rounded-card border-2 border-hairline bg-card p-4 shadow-pixel">
      <h2 className="font-display text-16 font-bold">شلون نلعب؟</h2>
      <p className="text-14 leading-relaxed text-ink-soft">
        كل واحد على موبايله، وإصبعه جاهز. بلحظة عشوائية كل الموبايلات تضوي سوا: أول واحد يدوس ياخذ النقطة. اللي يدوس
        قبل الإشارة يطلع من الجولة. أول واحد يوصل للهدف يفوز.
      </p>
      <p className="text-13 text-ink-faint">كل موبايل يحسب سرعة صاحبه بنفسه، فالنت البطيء ما يخسّرك.</p>
    </section>
  )
}
