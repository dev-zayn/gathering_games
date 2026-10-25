import { useEffect } from 'react'
import { Flag, Loader2 } from 'lucide-react'
import type { OnlineGameId } from '@shared/games'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
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
 * One round of طاولي in گعدة's room: the host's set-up, the match, and the
 * round's end. The room itself — the code, who joins, the start and the
 * results — is the app's. Opened outside a room: the front door.
 */
export function RoomScreen({ game }: { game: OnlineGameId }) {
  const { room, phase, status, results, isHost, clockOffset, match, me } = useRoom()

  useEffect(() => {
    void joinRound(game)
  }, [game])

  const playing = phase !== 'no-room' && phase !== 'ended' && room?.stage === 'playing'
  return (
    <AppShell>
      <TurnAlert />
      <div className="flex flex-1 flex-col gap-3 px-3 pt-safe-3 pb-safe-4 board-chrome-70">
        <ConnectionPill status={status} />
        {match && phase !== 'no-room' && <MatchBanner match={match} room={room} />}

        {phase === 'booting' || phase === 'waiting' ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <Loader2 aria-label="جاري الاتصال" className="size-8 animate-spin text-brass" />
            {phase === 'waiting' && <p className="text-15 font-semibold text-ink-soft">ننتظر موبايل صاحب الغرفة…</p>}
          </div>
        ) : phase === 'no-room' ? (
          <FrontDoor>
            <GameDoor myName={me?.nickname ?? null} />
          </FrontDoor>
        ) : phase === 'ended' ? (
          <RoundOver room={room} results={results} />
        ) : room?.stage === 'lobby' ? (
          <>
            <PlayerList room={room} />
            <GameLobby room={room} isHost={isHost} />
          </>
        ) : room ? (
          <GamePlay room={room} isHost={isHost} clockOffset={clockOffset} />
        ) : null}

        {/* The host may end the round early: the scores as they stand. */}
        {playing && isHost && room.view?.phase !== 'over' && (
          <Button variant="ghost" size="sm" className="mt-auto self-center text-ink-faint" onClick={() => void realtime.finish()}>
            <Flag />
            إنهاء الجولة بالنتيجة الحالية
          </Button>
        )}
      </div>
    </AppShell>
  )
}
