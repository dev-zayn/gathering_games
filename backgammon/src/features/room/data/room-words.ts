/**
 * What a refusal from `room.create` / `room.join` means, in words (the same
 * as إكس أو's). `cancelled` (the Join sheet closed) says nothing.
 */
export const ROOM_WORDS: Readonly<Record<string, string>> = {
  in_room: 'إنت بغرفة هسّه.',
  not_a_room_game: 'هاللعبة ما تنلعب بغرف.',
  in_another_room: 'إنت بغرفة ثانية هسّه؛ ترجعلها من التنبيه تحت.',
  room_not_found: 'ما لكينا غرفة بهالرمز.',
  room_closed: 'هالغرفة انسدّت.',
  another_game: 'هالرمز لغرفة لعبة ثانية.',
  room_full: 'الغرفة مليانة.',
  room_started: 'اللعب بدا بهالغرفة، ما تكدر تدخلها هسّه.',
  friends_only: 'هالغرفة لأصدقاء المضيف بس.',
  kicked: 'المضيف طلّعك من هالغرفة.',
  not_found: 'هاللعبة مو متوفرة للغرف هسّه.',
  invalid_code: 'هذا مو رمز غرفة.',
  offline: 'ماكو اتصال؛ اتصل وجرّب مرة ثانية.',
  timeout: 'الشبكة بطيئة؛ جرّب مرة ثانية.',
  not_supported: 'الغرف تشتغل بس داخل تطبيق گعدة.',
  unknown_action: 'حدّث گعدة حتى تسوّي غرفة من داخل اللعبة.',
}

export const roomWords = (code: string): string => ROOM_WORDS[code] ?? 'ما صارت؛ جرّب مرة ثانية.'
