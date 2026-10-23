# CLAUDE.md

بقت وحدة! · ONE LEFT! (`arcade.giant-uno`): one card game, its own mini app in
جمعة, 2–10 players, each on their own phone with a hand nobody else sees:
the colour-and-number game by the Giant edition's rules (108 cards with two
blank house-rule wilds, Draw Four challenges, «وحدة!» on the last card,
one hand or hands to 200/500). Built on the arcade kit (from لگطها!'s copy);
the room is جمعة's and the host's phone runs the game. React 19 + Vite 8 +
Tailwind v4 + shadcn (radix-nova, RTL). Arabic, RTL, mobile-only,
retro-arcade look. See README.md.

It is a project of its own: nothing here imports from another game, the
platform (`../../gathering`) or the app (`../../gathering_app`). The kit it
shares with the other arcade games (`components/`, `lib/gathering/`, the look
in `index.css`, the engine contract) is a copy cut down to what this game
uses; a fix to the kit lands in each game that has it. Unlike لگطها!'s copy it
has no host clock (`host-clock.ts`, `ping`/`pong`): turns need the view's
`now`, not a race's milliseconds.

## Checks

`bun run build` (`tsc -b`, then `vite build` into `dist/`), `bun run lint` and
`bun run test` (the deck, each rule in a scripted hand, 500 games of every
size and setup played out by bots with every card accounted for, the host's
table over a fake relay) must all be clean. Never `npm` — the lockfile is
`bun.lock`.

## Serving

`dist/` is the game: `index.html`, one script, one stylesheet, the fonts
and the manifest `dist/.well-known/gathering-game.json` (its source is
`public/.well-known/`; whoever serves it fills in `${PUBLIC_URL}`). On the
laptop the platform's fixtures server serves `../` (`gathering_games`) and
answers `/giant-uno/` from this folder's `dist/`, so build before opening it
in the app. The registry lists it as `arcade.giant-uno` (category `party`).

## The game's parts

`shared/games.ts` (the id and the player limits, in step with the manifest's
`room.players`) → `shared/protocol.ts` (`UnoOptions`, `UnoCard`, `UnoView`)
→ `shared/data/deck.ts` (the 108 cards: an id is a card on the wire, so
never reorder; points, Arabic names, the house rules' words, `signed()` for
a «+2» inside Arabic text) → `engine/games/giant-uno/`: `rules.ts` (the
state, `fits`, drawing with the reshuffle, the deal and the first card, the
hand's end and scoring), `moves.ts` (play, draw, pass, the first colour,
«وحدة!», the catch, the challenge, the clock's moves), `words.ts` (each
event worded for one phone: «لعبت» or «علي لعب»), `index.ts` (the engine:
options, settle, wake, the view, `scores`) → `test/` →
`src/features/giant-uno/`: `UnoRules` (front door, guests' lobby),
`OptionsPicker` + `uno-store.ts` (the host's setup), `UnoRoom` (the hand),
`SeatGrid`, `TableCenter`, `EventLog`, `HandGrid`, `MoveBar`, `ColorPicker`,
`ChallengePanel`, `ShownHand`, `HandOver` + `ResultRows`, `UnoCardFace` +
`CardBack` → `features/room/components/GameDoor|GameLobby|GamePlay` (where
the room's screens hand over to the game) → the cabinet in
`features/arcade/data/games.ts` (no poster: the cards sprite stands in) →
the manifest in `public/.well-known/` (`pace: turn`).

## Components

- One component per `.tsx`, named like the file, named export, ≤ 200 lines.
  Hooks: one per file, ≤ 120 lines. Pure helpers → `lib/`, tables → `data/`.
- shadcn first (`bunx shadcn add <name>` for one `components/ui` doesn't
  have yet): `Button`, `Badge`, `Card`, `Sheet`, `Toggle`/`ToggleGroup`,
  `RadioGroup`, `Tabs`, `Checkbox`, `Input`, `Skeleton`… Never a `div` with
  `onClick`. A new look used twice = a new `cva` variant in `components/ui`.
- Radix groups need the `DirectionProvider` in `main.tsx` — without it they
  render `dir="ltr"` and reverse inside the Arabic page.
- Icons: lucide only (`PixelSprite` is product illustration, not UI icons).
  Icon-only buttons get an Arabic `aria-label`; tap targets ≥ 44px. A card
  is `role="img"` with its Arabic name («أحمر 7»); in the hand it is a key
  («العب أحمر 7») only while it fits.
- Copy: Arabic inline, light Iraqi dialect (شنو، منو، انطي، هسه). Western
  digits. A signed number inside an Arabic line goes through `signed()`
  (an LTR isolate), or it shows as «2+». `PixelTag` / `font-pixel` is for
  Latin only (DRAW, HAND 2, YOU WIN!) — it has no Arabic glyphs.

## Styling

- Tokens only (`src/index.css` `@theme`): `text-13`, `bg-screen`, `text-coin`,
  `text-neon`, `text-plasma`, `bg-suit-red`…`bg-suit-blue`, `text-suit-ink`,
  `border-hairline`, `rounded-card`, `shadow-pixel`, `glow-text`, `glow-box`,
  `scanlines`, `pixel-grid`… No arbitrary values (`text-[13px]`, `bg-[#…]`);
  bracket syntax only for selectors (`data-[state=on]:`). Spacing-scale
  multiples (`h-13.5`, `w-51`) and fractions (`aspect-2/3`) are fine.
- Semantic colours only; no raw palette (`stone-500`) or hex in components.
  A card's colour comes from `lib/cards.ts` (`SUIT_BG`, `SUIT_TEXT`).
- Logical properties (`ps-` `pe-` `ms-` `me-` `start-` `end-`), never `pl-`/`left-`.
- `cn()` for conditional classes; `style={{}}` only for runtime values.

## Motion

Transform/opacity only. Loops and entrances → CSS keyframes in `@theme`
(`animate-blink`, `animate-sprite-hop`, `animate-pixel-pop` for a card
landing on the pile or drawn into the hand, `animate-rise-in` for a panel,
`animate-celebrate`…); 8-bit loops use `steps()` easing. Interaction physics
→ framer `m.*` (never `motion.*`) under `<LazyMotion>`.

## State & realtime

- One page is one round of one room (gathering_app/docs/GAME_BRIDGE.md). The
  room — code, members, start, results — is جمعة's; `lib/gathering/bridge.ts`
  types the calls the game makes, `lib/miniapp.ts` the haptics. With a
  target, the hands to it are dealt inside the one round: the round ends
  when a total reaches it, never a "new game" inside a page.
- The host's page runs the game: `lib/gathering/table.ts` (the old server's
  room, one round) over the engine in `engine/`. Other pages send it
  `{k: 'sync' | 'act'}` and draw the `RoomView` it sends back to them alone
  (`room.send(…, {to})`, `lib/gathering/wire.ts`). A hand is the secret:
  never put one in a message to the whole room, nor in the room's state
  blob (every phone receives it): the manifest says `state: none`. A
  challenged hand goes to the challenger's view only (`shown`).
- Every move clones the state (`structuredClone`) and changes the clone; a
  refusal is an Arabic `{ error }` shown as a toast on that phone.
- Timers are host epoch deadlines (`until`); clients count down with
  `clockOffset` (the view's `now`). The host's `wake` plays a timed-out move
  (draw and keep, the likely colour, accept the four) and deals the next
  hand; `settle` cuts an absent player's move to `AWAY_MS`.
- The turn alert (`yourTurn`) is the same words for a whole turn, so drawing
  does not ring it again; it clears as soon as the move is made (it covers
  the seats, where «مسكته!» is).
- The host ends the round with `realtime.finish()` → `room.end({scores})`
  (the engine's `scores`); جمعة ranks them and plays the next round in a
  fresh page.
- A host who leaves takes the game with them: a game not yet begun moves to
  the new host, one under way ends the round. A host's page reload resumes
  from localStorage (`arcade.table.<room>.<round>`).
- Opened on its own (no room), the game shows its front door
  (`features/room/components/FrontDoor.tsx`): the signed-in player from
  `player.me()`, «العب ويا ربعك» → `room.create({visibility})`, «انضم
  لغرفة» → `room.join()`, refusals in words
  (`features/room/data/room-words.ts`; `cancelled` says nothing). Under the
  keys the game shows its rules (`GameDoor` → `UnoRules`).
- Tournaments (`../../gathering/docs/TOURNAMENTS.md`): in an app that has
  them, the front door also offers «سوّي بطولة» → `tournament.create()` with
  no format (the game seats two: knockout duels or a league) and «انضم
  لبطولة» → `tournament.join()`. In a match room `MatchBanner` sits over the
  round; the store reads the match again 1.5 s after `ended`.
- In a plain browser, `?dev&name=…` in several tabs plays one room across
  them (`lib/gathering/dev-bridge.ts`): `bun run dev`.
