import type { SpotMode } from '@shared/protocol'

// The box's five mini-games, as the lobby lists them and the board heads them.

export interface ModeInfo {
  id: SpotMode
  title: string
  /** 8-bit Latin for the board's head. */
  code: string
  /** What wins, in a few words. */
  goal: string
  how: string
}

const BY_ID: Record<SpotMode, ModeInfo> = {
  tower: {
    id: 'tower',
    title: 'البرج',
    code: 'THE TOWER',
    goal: 'اجمع أكثر ورق',
    how: 'لگط الرمز اللي بين ورقتك وورقة النص، وورقة النص تصير فوق برجك. لمن يخلص الكوم، أطول برج يفوز.',
  },
  well: {
    id: 'well',
    title: 'البير',
    code: 'THE WELL',
    goal: 'خلّص ورقك أول واحد',
    how: 'الكوم كله يتوزع عليكم. لگط الرمز اللي بين ورقتك وورقة النص وذب ورقتك بالبير. أول واحد يخلّص ورقه يفوز.',
  },
  potato: {
    id: 'potato',
    title: 'البطاطا الحارة',
    code: 'HOT POTATO',
    goal: 'لا تبقى شايل الورق',
    how: 'ورقة لكل واحد. لگط رمز بين ورقتك وورقة واحد ثاني وانطيه كل ورقك. اللي يبقى شايل الكل يخسر الجولة. خمس جولات، والأقل ورق خسران يفوز.',
  },
  gift: {
    id: 'gift',
    title: 'الهدية المسمومة',
    code: 'POISON GIFT',
    goal: 'اهدي غيرك',
    how: 'لگط رمز بين ورقة النص وورقة واحد ثاني، وورقة النص تروح له. لمن يخلص الكوم، الأقل ورق يفوز.',
  },
  triplet: {
    id: 'triplet',
    title: 'الثلاثي',
    code: 'TRIPLET',
    goal: 'ثلاث ورقات بنفس الرمز',
    how: 'ورق مكشوف بالنص. لگط رمز موجود على ثلاث ورقات وهن يصيرن إلك. لمن ما يبقى ثلاثي، الأكثر ورق يفوز.',
  },
}

/** In the lobby's order. */
export const MODES: readonly ModeInfo[] = Object.values(BY_ID)

export const modeOf = (id: SpotMode): ModeInfo => BY_ID[id]

/** What a player's count means in each mini-game, for the standings. */
export const COUNT_WORDS: Record<SpotMode, string> = {
  tower: 'ورقة بالبرج',
  well: 'ورقة باقية',
  potato: 'ورقة خسرانة',
  gift: 'ورقة مسمومة',
  triplet: 'ورقة',
}
