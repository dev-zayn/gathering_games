import type { RoomMatch } from '@/lib/gathering/bridge'

/**
 * What a refusal from `tournament.create` / `tournament.join` means, in
 * words (the same as إكس أو's). The app's own sheets word the platform's
 * refusals; these are the ones that reach the page. `cancelled` (the sheet
 * closed) says nothing.
 */
export const TOURNAMENT_WORDS: Readonly<Record<string, string>> = {
  in_room: 'إنت بغرفة هسّه.',
  not_a_room_game: 'هاللعبة ما تنلعب ببطولات.',
  not_found: 'هاللعبة مو متوفرة للبطولات هسّه.',
  invalid_code: 'هذا مو رمز بطولة.',
  another_game: 'هالرمز لبطولة لعبة ثانية.',
  tournament_not_found: 'ما لكينا بطولة بهالرمز.',
  tournament_closed: 'هالبطولة خلصت.',
  tournament_started: 'هالبطولة بدت، ما تكدر تدخلها هسّه.',
  tournament_full: 'هالبطولة مليانة.',
  friends_only: 'هالبطولة لأصدقاء المنظّم بس.',
  removed: 'المنظّم طلّعك من هالبطولة.',
  offline: 'ماكو اتصال؛ اتصل وجرّب مرة ثانية.',
  timeout: 'الشبكة بطيئة؛ جرّب مرة ثانية.',
  not_supported: 'البطولات تشتغل بس داخل تطبيق گعدة.',
}

export const tournamentWords = (code: string): string => TOURNAMENT_WORDS[code] ?? 'ما صارت؛ جرّب مرة ثانية.'

/** A knockout stage as a player says it. */
export function stageName(stage: number, stages: number): string {
  const left = stages - stage
  if (left === 0) return 'النهائي'
  if (left === 1) return 'نصف النهائي'
  if (left === 2) return 'ربع النهائي'
  return `الدور ${String(stage)}`
}

/** What is at stake: the stage and how many rounds decide it, or the league's round. */
export function matchLine(m: RoomMatch): string {
  if (m.format === 'knockout') {
    return `${stageName(m.stage, m.stages)} · ${m.bestOf > 1 ? `الأفضل من ${String(m.bestOf)}` : 'جولة وحدة تحسمها'}`
  }
  return `الجولة ${String(Math.min(m.played + 1, Math.max(m.rounds, 1)))} من ${String(m.rounds)}`
}
