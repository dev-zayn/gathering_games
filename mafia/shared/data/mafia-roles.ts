export type Role = 'mafia' | 'doctor' | 'detective' | 'citizen'

export interface RoleInfo {
  name: string
  code: string
  tone: 'coin' | 'neon' | 'plasma'
  /** What the card tells its holder to do. */
  brief: string
}

export const ROLES: Record<Role, RoleInfo> = {
  mafia: {
    name: 'مافيا',
    code: 'MAFIA',
    tone: 'plasma',
    brief: 'كل ليلة تختارون ضحية. بالنهار سوّي نفسك مواطن بريء.',
  },
  doctor: {
    name: 'الطبيب',
    code: 'DOCTOR',
    tone: 'neon',
    brief: 'كل ليلة تختار واحد تحميه. إذا المافيا اختاروه، ما يموت.',
  },
  detective: {
    name: 'المحقق',
    code: 'DETECTIVE',
    tone: 'coin',
    brief: 'كل ليلة تحقق بواحد وتعرف إذا هو مافيا لو لا. لا تنكشف!',
  },
  citizen: {
    name: 'مواطن',
    code: 'CITIZEN',
    tone: 'neon',
    brief: 'ما عندك قوة بالليل. بالنهار ناقش وصوّت واكشف المافيا.',
  },
}

/** One mafioso per four players, at least one: 5–7 → 1, 8–11 → 2, 12+ → 3. */
export function mafiaCount(players: number): number {
  return Math.max(1, Math.floor(players / 4))
}
