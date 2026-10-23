import type { SpriteName } from '@/data/sprites'

export type GameId = 'giant-uno'

export interface GameInfo {
  id: GameId
  /** Arabic title on the cabinet. */
  title: string
  /** 8-bit Latin marquee above it. */
  code: string
  tagline: string
  /** «2+ لاعبين». */
  players: string
  sprite: SpriteName
  /** The cabinet's neon tube. */
  tone: 'coin' | 'neon' | 'plasma'
  /** Loading-screen art. Absent → the sprite stands in. */
  poster?: string
}

/** This game's cabinet: its title, marquee and sprite (no poster yet: the cards sprite stands in). */
export const GAME: GameInfo = {
  id: 'giant-uno',
  title: 'بقت وحدة!',
  code: 'ONE LEFT!',
  tagline: 'طابق اللون أو الرقم، خلّص ورقك قبل الكل، ولا تنسى تصيح «وحدة!»',
  players: '2–10 لاعبين',
  sprite: 'cards',
  tone: 'plasma',
}
