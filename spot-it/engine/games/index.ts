import type { OnlineGameId } from '../../shared/games'
import type { Engine } from '../engine'
import { spotIt } from './spot-it'

// Engines are stored type-erased: the room only ever hands each one back the
// state that same engine produced.
export const ENGINES: Record<OnlineGameId, Engine<unknown, unknown>> = {
  'spot-it': spotIt as unknown as Engine<unknown, unknown>,
}
