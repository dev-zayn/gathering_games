// The single source of truth for this game's browser-storage keys. The
// fixtures serve every game from one origin, so each key names its game.
// Bump the version suffix when a stored shape changes incompatibly.

/** localStorage — persists across sessions. */
export const StorageKeys = {
  /** مثّلها: turn length, turns per team, word decks. */
  charadesOptions: 'arcade.charades.options.v1',
} as const
