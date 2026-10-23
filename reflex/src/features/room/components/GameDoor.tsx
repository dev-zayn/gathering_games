import { Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReflexRules } from '@/features/reflex/components/ReflexRules'
import { duel } from '@/features/reflex/duel-store'

/** The game's own part of its front door: how it is played, and the duel on one phone for when there is no room. */
export function GameDoor() {
  return (
    <>
      <ReflexRules />
      <section className="flex flex-col gap-3 rounded-card border-2 border-hairline bg-card p-4 shadow-pixel">
        <h2 className="font-display text-16 font-bold">اثنين على موبايل واحد</h2>
        <p className="text-14 text-ink-soft">بدون غرفة: الشاشة تنقسم نصين، وكل واحد يدوس على نصه.</p>
        <Button
          variant="outline"
          onClick={() => {
            duel.set(true)
          }}
        >
          <Smartphone />
          مبارزة على موبايل واحد
        </Button>
      </section>
    </>
  )
}
