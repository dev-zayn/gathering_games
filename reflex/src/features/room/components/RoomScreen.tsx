import { useEffect } from 'react'
import { Loader2, Trophy } from 'lucide-react'
import type { OnlineGameId } from '@shared/games'
import { PixelTag } from '@/components/game/PixelTag'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { GAME } from '@/features/arcade/data/games'
import { joinRound, realtime } from '@/lib/realtime/connection'
import { useRoom } from '../hooks/use-room'
import { ConnectionPill } from './ConnectionPill'
import { FrontDoor } from './FrontDoor'
import { GameDoor } from './GameDoor'
import { GameLobby } from './GameLobby'
import { GamePlay } from './GamePlay'
import { MatchBanner } from './MatchBanner'
import { PlayerList } from './PlayerList'
import { RoundOver } from './RoundOver'
import { TurnAlert } from './TurnAlert'

/**
 * One round of an online game in جمعة's room: the host's setup (the game's
 * own options), the game, and the round's end. The room itself — the code,
 * who joins, the start and the results — is the app's.
 */
export function RoomScreen({ game }: { game: OnlineGameId }) {
  const { room, phase, status, results, isHost, clockOffset, match } = useRoom()
  const info = GAME

  useEffect(() => {
    void joinRound(game)
  }, [game])

  return (
    <AppShell>
      <TurnAlert />
      <div className="flex flex-1 flex-col gap-4 px-4 pt-safe-4 pb-safe-8 pixel-grid">
        <div className="flex items-center justify-between">
          {phase === 'no-room' ? <span /> : <ConnectionPill status={status} />}
          {room && <PixelTag className="text-coin">{`ROOM ${room.code}`}</PixelTag>}
        </div>

        {match && phase !== 'no-room' && <MatchBanner match={match} room={room} />}

        {phase === 'booting' || phase === 'waiting' ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <Loader2 aria-label="جاري الاتصال" className="size-8 animate-spin text-neon" />
            {phase === 'waiting' && (
              <p className="font-display text-15 font-bold text-ink-soft">ننتظر موبايل صاحب الغرفة…</p>
            )}
          </div>
        ) : phase === 'no-room' ? (
          <FrontDoor game={info}>
            <GameDoor />
          </FrontDoor>
        ) : phase === 'ended' ? (
          <RoundOver room={room} results={results} />
        ) : room?.stage === 'lobby' ? (
          <>
            <PlayerList room={room} />
            <GameLobby room={room} isHost={isHost} />
          </>
        ) : room ? (
          <>
            <GamePlay room={room} isHost={isHost} clockOffset={clockOffset} />
            {/* Once the mini-game is decided its own key shows the results. */}
            {isHost && room.view?.phase !== 'over' && (
              <div className="mt-auto flex flex-col gap-1 pt-4">
                <Button variant="ghost" size="sm" className="text-ink-faint" onClick={() => void realtime.finish()}>
                  <Trophy />
                  إنهاء الجولة وعرض النتائج
                </Button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </AppShell>
  )
}
