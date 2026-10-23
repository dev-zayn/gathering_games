import type { SpriteName } from '@/data/sprites'

export type GameId = 'reflex'

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

/** This game's cabinet: its title, marquee and poster. */
export const GAME: GameInfo = {
  id: 'reflex',
  title: 'أسرع إصبع',
  code: 'QUICK DRAW',
  tagline: 'كل الموبايلات تضوي سوا: أول واحد يدوس بعد الإشارة ياخذ النقطة.',
  players: '2–12 لاعبين',
  sprite: 'bolt',
  tone: 'coin',
}
