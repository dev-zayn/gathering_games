import type { SpriteName } from '@/data/sprites'

export type GameId = 'most-likely'

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
  id: 'most-likely',
  poster: 'images/games/most-likely.webp',
  title: 'منو أكثر واحد؟',
  code: 'CROWN RUSH',
  tagline: 'سؤال، عدّ لثلاثة، والكل يأشّر. منو ياخذ أكثر تيجان؟',
  players: '3+ لاعبين',
  sprite: 'crown',
  tone: 'coin',
}
