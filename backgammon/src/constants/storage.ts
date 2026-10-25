// The single source of truth for this game's browser-storage keys. The
// fixtures serve every game from one origin, so each key names its game.
// Bump the version suffix when a stored shape changes incompatibly.

/** localStorage — persists across sessions. */
export const StorageKeys = {
  /** The last set-up picked: the match's length and the cube. */
  options: 'arcade.backgammon.options.v1',
  /** A game against الحجّي or two on one phone, kept to carry on after the frame closes. */
  local: 'arcade.backgammon.local.v1',
} as const
