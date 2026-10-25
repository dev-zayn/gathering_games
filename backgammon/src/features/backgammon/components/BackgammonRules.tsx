import { BookOpen } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { RULES } from '../data/rules'

/** How طاولي is played, a section at a time. */
export function BackgammonRules() {
  return (
    <section aria-labelledby="rules-title" className="flex flex-col rounded-card border border-hairline bg-slab px-4 pt-3.5 pb-1 shadow-slab">
      <h2 id="rules-title" className="flex items-center gap-2 pb-1 text-16 font-semibold text-ink">
        <BookOpen aria-hidden className="size-4.5 text-brass" />
        القواعد
      </h2>
      <Accordion type="single" collapsible defaultValue="goal">
        {RULES.map((r) => (
          <AccordionItem key={r.id} value={r.id}>
            <AccordionTrigger>{r.title}</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-2">
              {r.body.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
