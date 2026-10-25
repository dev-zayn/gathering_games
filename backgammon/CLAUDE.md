# CLAUDE.md

طاولي · BACKGAMMON (`arcade.backgammon`): backgammon by the box's rules (the
cube, gammons, Crawford) as its own mini app in گعدة: two players, each on
their own phone; the room is گعدة's and the host's phone runs the game.
Opened outside a room it also plays on one phone: against الحجّي (the
computer, seat 1) or two people passing it. React 19 + Vite 8 + Tailwind v4
+ shadcn (radix-nova, RTL). Arabic, RTL, mobile-only, portrait. Its look is
its own, NOT the arcade's (no pixel font, no neon, no CRT). See README.md.

It is a project of its own: nothing here imports from another game, the
platform (`../../gathering`) or the app (`../../gathering_app`). The kit it
shares with the other arcade games (`lib/gathering/`, `lib/realtime/`, the
room's screens' logic, the engine contract) is a copy cut down to what this
game uses (from بقت وحدة!'s); a fix to the kit lands in each game that has
it. This copy's table refuses a start until both sides' pages are up.

## Checks

`bun run build` (`tsc -b`, then `vite build` into `dist/`), `bun run lint`
and `bun run test` must all be clean. Never `npm` — the lockfile is
`bun.lock`. After any rules change, the whole-match tests in
`test/bots.test.ts` are the safety net: every board after every action
must stay sound (15 a side, never both sides on a point).

## Serving

`dist/` is the game: `index.html`, one script, one stylesheet, the fonts
and the manifest `dist/.well-known/gathering-game.json` (its source is
`public/.well-known/`; whoever serves it fills in `${PUBLIC_URL}`). On the
laptop the platform's fixtures server serves `../` (`gathering_games`) and
answers `/backgammon/` from this folder's `dist/`, so build before opening
it in the app. The registry lists it as `arcade.backgammon` (category
`brain`). It is in the platform Makefile's `ARCADE`.

## The game's parts

`shared/backgammon/board.ts` (a side is 26 counts in its own numbering: 0
off, 1–24, 25 the bar; the other side's p is this side's `across(p)` = 25 −
p; pips, contact, `winKind`, `isSound`) → `moves.ts` (`target` for one
die, `legalMoves` after the moves already made: max dice, the higher-die
rule; `isLegalStart`/`isLegalPlay`; `allPlays` deduped by end board;
`routesFrom` for the board's taps: one die or a checker's run through open
points) → `bot.ts` (الحجّي: `evaluate` in pips with blot risk over the 36
rolls, `bestPlay`, `wantsToDouble`/`takes` by the race rule) →
`shared/protocol.ts` (`BgOptions`, `BgView`, `BgMove`) → `shared/random.ts`
(`rollDie`, crypto; `setDieSource` for tests) → `engine/games/backgammon/`:
`rules.ts` (the state, `newGame` with the opening roll, `roll`, `play`,
`endGame` with points and Crawford, the timers), `moves.ts` (one function a
move; `timedOut` plays a quiet decision as الحجّي), `index.ts` (the engine:
options, settle (absent player → `AWAY_MS`), wake, the view, `scores`) →
`test/` → `src/features/backgammon/`: `BackgammonTable` (plates, board,
keys; shared by the room and one phone), `Board` = `BoardArt` (static SVG)
+ `CheckerDefs` + `CheckerLayer` (30 checkers by identity, `lib/stacks.ts`,
gliding with framer, heard landing) + `TargetMarks` + `PointKeys` (real
buttons laid over the drawing), `hooks/use-turn-play.ts` (the moves in
hand before «تمّ», `stage` on every change), `TurnControls` →
`RollKeys`/`MoveKeys`/`AnswerKeys`, `SidePlate`, `DiceTray`/`Die`, `Cube`
(one `layoutId`: it slides to its holder), `OpeningRoll`, `GameOver`,
`BackgammonRoom` (online), `LocalTable` + `hooks/use-local-match.ts` +
`local-store.ts` (one phone; الحجّي plays at a café pace, a checker at a
time), `LocalDoor`, `OptionsPicker` + `options-store.ts`, `BackgammonRules`
(+ `data/rules.ts`), `BackgammonLobby` → `features/room/components/` (the
round's screens) → `features/intro/` (`BoxIntro`: the lid swings open) →
`App.tsx` (the one-phone table or the room's screens) → the manifest in
`public/.well-known/` (`pace: turn`, players 2–2).

## The board's drawing

`lib/geometry.ts` holds it all, in the drawing's units (360 × 552): the
bar across the middle, this phone's points 1–12 down the right (1 at the
bottom), 13–24 down the left (24 at the bottom), its bar checkers on the
left half of the hinge, its tray on the right under its home. Every phone
draws from its own side (`perspective`); one phone draws from ivory's.
The SVG scales with `board-fit` (as wide as the page allows, never taller
than the screen minus `--board-chrome`, set with `board-chrome-*`). The
board is `dir="ltr"`: a picture, not text. Taps are real `<button>`s placed
by `percentBox`, never handlers on SVG shapes.

## Words

Iraqi, light: خانة a point, البيت the home board, الوسط the bar, أكل to
hit, شيل to bear off, نزّل to enter, مارس a gammon, مارس كبير a backgammon,
الزار the dice, «ذبّ الزار» throw, ضاعف / أقبل / أسلّم the cube. Western
digits. A move or a roll inside an Arabic line goes through `ltr()`
(`lib/words.ts`), or «24→18» reads backwards. The other side's moves are
written in this phone's numbers (the ones on its frame). Only the two
famous rolls are called out: شيش بيش (6-5), دو شيش (6-6).

## Components

- One component per `.tsx`, named like the file, named export, ≤ 200 lines.
  Hooks: one per file, ≤ 120 lines. Pure helpers → `lib/`, tables → `data/`.
- shadcn first (`Button`, `Toggle`/`ToggleGroup`, `Checkbox`, `Label`,
  `Accordion`). Never a `div` with `onClick`. A new look used twice = a new
  `cva` variant in `components/ui`.
- Radix groups need the `DirectionProvider` in `main.tsx`.
- Icons: lucide only (the art in `components/art/` is illustration).
  Icon-only buttons get an Arabic `aria-label`; tap targets ≥ 44px.

## Styling (the café's tokens, `src/index.css`)

- Tokens only: `bg-cafe`, `bg-slab`, `bg-slab-raised`, `text-ink(-soft,
  -faint)`, `border-hairline(-strong)`, `walnut*`, `field*`, `pearl*`,
  `brass*`, `turquoise*`, `brick*`, `ivory*`, `ebony*`, `tea*`, `mint`;
  `rounded-control|button|card|sheet`; `shadow-slab`, `shadow-key`;
  `cafe-ground`, `pearl-sheen`, `brass-face`, `turquoise-face`,
  `walnut-face`. No arbitrary values (`text-[13px]`, `bg-[#…]`,
  `[--x:…]`); bracket syntax only for selectors.
- SVG colours are token utilities too: `fill-*`, `stroke-*`, and `stop-*`
  for gradient stops (`<stop className="stop-brass-lit" />`). Gradient ids
  in components that can appear twice come from `useId()`.
- Numbers never in Aref Ruqaa (its Latin 0 reads as an Arabic ٥): scores
  and pips in Readex Pro. Ruqaa only from 20px up.
- Logical properties (`ps-` `pe-` `ms-` `me-` `start-` `end-`).
- `cn()` for conditional classes; `style={{}}` only for runtime values.

## Motion and sound

Transform/opacity only. Entrances and loops are keyframes in `@theme`
(`animate-rise-in`, `animate-lay-down`, `animate-lid-open`,
`animate-breathe` for legal landings, `animate-lamp` for the turn's plate,
`animate-stamp` for شيش بيش, `animate-steam`, `animate-celebrate`).
Checkers glide and dice tumble with framer `m.*` (never `motion.*`) under
`<LazyMotion>`; nothing blinks, nothing steps. Sounds are made in
`lib/sound.ts` and play only after the first touch.

## State & realtime

- One page is one round of one room (gathering_app/docs/GAME_BRIDGE.md).
  The host's page runs the game: `lib/gathering/table.ts` over the engine.
  The other page sends `{k: 'sync' | 'act'}` and draws the `RoomView` it
  is sent alone. Nothing is secret in backgammon, but the kit's rule holds:
  views go phone by phone, the manifest says `state: none`.
- Every move clones the state (`structuredClone`) and changes the clone; a
  refusal is an Arabic `{ error }` shown as a toast on that phone.
- Deadlines are host epoch ms (`until`); phones count down with
  `clockOffset`. `wake` plays a quiet decision; `settle` cuts an absent
  player's to `AWAY_MS`.
- `yourTurn` is «دورك» for the whole turn (roll and moves), so the istikan
  rings once a turn; answering a double has its own words.
- The host ends the round with `realtime.finish()` → `room.end({scores})`.
  Never a "new match" inside a room's page: گعدة plays the next round in a
  fresh page. (On one phone, «مباراة ثانية» starts one.)
- In a plain browser, `?dev&name=…` in two tabs plays one room across them
  (`lib/gathering/dev-bridge.ts`). Without `?dev`, the front door with the
  one-phone game.
