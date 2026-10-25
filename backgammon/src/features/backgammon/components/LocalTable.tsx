import { ArrowRight, ChevronsLeft, RotateCcw } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useLocalMatch } from '../hooks/use-local-match'
import { localStore, localTable, rematch } from '../local-store'
import { BackgammonTable } from './BackgammonTable'

/**
 * A match on this phone alone: against الحجّي, or two people passing the
 * phone across. The board is drawn from the ivory side; «رجوع» keeps the
 * match to carry on later.
 */
export function LocalTable() {
  const local = useLocalMatch()
  if (!local) return null
  const { match, view, controller, act } = local
  const bot = match.mode === 'bot'
  const after =
    view.phase === 'over' ? (
      <div className="grid grid-cols-2 gap-2.5">
        <Button
          size="lg"
          onClick={() => {
            rematch(match)
          }}
        >
          <RotateCcw />
          مباراة ثانية
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            localStore.set(null)
            localTable.close()
          }}
        >
          رجوع
        </Button>
      </div>
    ) : (
      <Button
        size="lg"
        onClick={() => {
          act({ type: 'next' })
        }}
      >
        <ChevronsLeft />
        يلا الجاية
      </Button>
    )

  return (
    <AppShell>
      <div className={cn('flex flex-1 flex-col gap-2.5 px-3 pt-safe-3 pb-safe-4', bot ? 'board-chrome-76' : 'board-chrome-84')}>
        <header className="flex h-8 items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="-ms-1 h-8 text-ink-soft"
            onClick={() => {
              localTable.close()
            }}
          >
            <ArrowRight />
            رجوع
          </Button>
          <p className="flex-1 truncate text-end font-hand text-20 text-brass-lit">
            {bot ? 'ويّا الحجّي' : 'اثنين على موبايل واحد'}
          </p>
        </header>
        <BackgammonTable
          view={view}
          perspective={0}
          controller={controller}
          you={bot ? 0 : null}
          names={match.names}
          act={act}
          now={0}
          timed={false}
          waiting={bot ? 'الحجّي يفكّر…' : ''}
          after={after}
        />
      </div>
    </AppShell>
  )
}
