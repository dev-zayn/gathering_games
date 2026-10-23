import type { OnlineGameId } from '../../shared/games'
import type { Engine } from '../engine'
import { giantUno } from './giant-uno'

// Engines are stored type-erased: the room only ever hands each one back the
// state that same engine produced.
export const ENGINES: Record<OnlineGameId, Engine<unknown, unknown>> = {
  'giant-uno': giantUno as unknown as Engine<unknown, unknown>,
}
