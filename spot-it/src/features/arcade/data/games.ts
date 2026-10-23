import type { SpriteName } from '@/data/sprites'

export type GameId = 'spot-it'

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

/** This game's cabinet: its title, marquee and sprite (no poster yet). */
export const GAME: GameInfo = {
  id: 'spot-it',
  title: 'لگطها!',
  code: 'QUICK EYE',
  tagline: 'أي ورقتين بيناتهن رمز واحد مشترك. منو أسرع عين؟',
  players: '2–8 لاعبين',
  sprite: 'eye',
  tone: 'neon',
}
