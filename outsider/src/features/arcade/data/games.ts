import type { SpriteName } from '@/data/sprites'

export type GameId = 'outsider'

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
  id: 'outsider',
  poster: 'images/games/outsider.webp',
  title: 'برا السالفة',
  code: 'SPY HUNT',
  tagline: 'كلكم تعرفون السالفة… إلا واحد. اكشفوه قبل لا يفهمها.',
  players: '3+ لاعبين',
  sprite: 'spy',
  tone: 'plasma',
}
