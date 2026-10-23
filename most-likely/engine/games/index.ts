import type { OnlineGameId } from '../../shared/games'
import type { Engine } from '../engine'
import { mostLikely } from './most-likely'

// Engines are stored type-erased: the room only ever hands each one back the
// state that same engine produced.
export const ENGINES: Record<OnlineGameId, Engine<unknown, unknown>> = {
  'most-likely': mostLikely as unknown as Engine<unknown, unknown>,
}
