import type { SpriteName } from '@/data/sprites'

export type GameId = 'charades'

export interface GameInfo {
  id: GameId
  /** Arabic title on the cabinet. */
  title: string
  /** 8-bit Latin marquee above it. */
  code: string
  tagline: string
  /** «3+ لاعبين». */
  players: string
  sprite: SpriteName
  /** The cabinet's neon tube. */
  tone: 'coin' | 'neon' | 'plasma'
  /** Loading-screen art (`bun run posters`). Absent → the sprite stands in. */
  poster?: string
}

/** This game's cabinet: its title, marquee and poster. */
export const GAME: GameInfo = {
  id: 'charades',
  poster: 'images/games/charades.webp',
  title: 'مثّلها',
  code: 'SILENT MOVIE',
  tagline: 'مثّل الكلمة بدون حچي، وفريقك يحزر قبل لا يخلص الوقت.',
  players: '4+ · فريقين',
  sprite: 'clapper',
  tone: 'neon',
}
