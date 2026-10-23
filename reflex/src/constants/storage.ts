// The single source of truth for this game's browser-storage keys. The
// fixtures serve every game from one origin, so each key names its game.
// Bump the version suffix when a stored shape changes incompatibly.

/** localStorage — persists across sessions. */
export const StorageKeys = {
  /** High score per arcade game, for the cabinet's «HI» readout. */
  hiScores: 'arcade.hiscores.v1',
  /** أسرع إصبع: the points to win the host last picked. */
  reflexOptions: 'arcade.reflex.options.v1',
} as const
