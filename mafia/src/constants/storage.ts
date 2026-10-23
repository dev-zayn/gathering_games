// The single source of truth for this game's browser-storage keys. The
// fixtures serve every game from one origin, so each key names its game.
// Bump the version suffix when a stored shape changes incompatibly.

/** localStorage — persists across sessions. */
export const StorageKeys = {
  /** المافيا: the special roles the host deals. */
  mafiaRoles: 'arcade.mafia.roles.v1',
} as const
