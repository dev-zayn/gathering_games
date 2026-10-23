import type { SpriteName } from '@/data/sprites'

export type GameId = 'mafia'

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
  id: 'mafia',
  poster: 'images/games/mafia.webp',
  title: 'المافيا',
  code: 'NIGHT CITY',
  tagline: 'بالليل المافيا تقتل، والطبيب يحمي، والمحقق يدوّر. بالنهار المدينة تحكم.',
  players: '5+ لاعبين',
  sprite: 'mafia',
  tone: 'plasma',
}
