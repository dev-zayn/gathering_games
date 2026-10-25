import { Bot, Play, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePersisted } from '@/lib/persisted-store'
import { localStore, localTable, startLocal } from '../local-store'
import { optionsStore } from '../options-store'
import { OptionsPicker } from './OptionsPicker'

/**
 * The front door's game on this phone, no room needed: against الحجّي, the
 * café regular, or two people passing one phone. A match left half played
 * is offered back first.
 */
export function LocalDoor({ myName }: { myName: string | null }) {
  const saved = usePersisted(localStore)
  const unfinished = saved && saved.state.phase !== 'over' ? saved : null
  return (
    <section aria-labelledby="local-door" className="flex flex-col gap-4 rounded-card border border-hairline bg-slab p-4 shadow-slab">
      <div className="flex flex-col gap-1">
        <h2 id="local-door" className="text-16 font-semibold text-ink">
          على هذا الموبايل
        </h2>
        <p className="text-13 text-ink-faint">بلا غرفة ولا إنترنت.</p>
      </div>
      {unfinished && (
        <Button
          size="lg"
          onClick={() => {
            localTable.open()
          }}
        >
          <Play />
          {unfinished.mode === 'bot' ? 'كمّل مباراتك ويّا الحجّي' : 'كمّل المباراة اللي على الموبايل'}
        </Button>
      )}
      <OptionsPicker />
      <div className="grid grid-cols-2 gap-2.5">
        <Button
          variant="teal"
          size="lg"
          onClick={() => {
            startLocal('bot', optionsStore.get(), myName)
          }}
        >
          <Bot />
          ويّا الحجّي
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            startLocal('pair', optionsStore.get(), null)
          }}
        >
          <Smartphone />
          اثنين بموبايل
        </Button>
      </div>
    </section>
  )
}
