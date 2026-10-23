// The single source of truth for this game's browser-storage keys. The
// fixtures serve every game from one origin, so each key names its game.
// Bump the version suffix when a stored shape changes incompatibly.

/** localStorage — persists across sessions. */
export const StorageKeys = {
  /** برا السالفة: which categories are switched on. */
  outsiderCats: 'arcade.outsider.cats.v1',
  /** برا السالفة: the group's own categories («مصطلحات الشلة»). */
  outsiderCustom: 'arcade.outsider.custom.v1',
} as const
