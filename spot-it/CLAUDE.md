# CLAUDE.md

لگطها! · QUICK EYE (`arcade.spot-it`): one party game, its own mini app in
گعدة, 2–8 players, each on their own phone: the card game where any two
cards share exactly one symbol, with the box's five mini-games (the tower,
the well, the hot potato, the poisoned gift, the triplet). Built on the
arcade kit (from منو أكثر واحد؟); the room is گعدة's and the host's phone runs
the game. React 19 + Vite 8 + Tailwind v4 + shadcn (radix-nova, RTL).
Arabic, RTL, mobile-only, retro-arcade look. See README.md.

It is a project of its own: nothing here imports from another game, the
platform (`../../gathering`) or the app (`../../gathering_app`). The kit it
shares with the other arcade games (`components/`, `lib/gathering/`, the look
in `index.css`, the engine contract) is a copy cut down to what this game uses; a
fix to the kit lands in each game that has it.

## Checks

`bun run build` (`tsc -b`, then `vite build` into `dist/`), `bun run lint` and
`bun run test` (the deck's one-shared-symbol property, the race, the five
mini-games played out by bots, the host's table over a fake relay) must
all be clean. Never `npm` — the lockfile is `bun.lock`.

## Serving

`dist/` is the game: `index.html`, one script, one stylesheet, the fonts
and the manifest `dist/.well-known/gathering-game.json` (its source is
`public/.well-known/`; whoever serves it fills in `${PUBLIC_URL}`). On the
laptop the platform's fixtures server serves `../` (`gathering_games`) and
answers `/spot-it/` from this folder's `dist/`, so build before opening it in the
app. The registry lists it as `arcade.spot-it`.

## The game's parts

`shared/games.ts` (the id and the player limits, in step with the manifest's
`room.players`) → `shared/protocol.ts` (the `RoomView`, `SpotView`,
`SpotOptions`) → `shared/data/spot-symbols.ts` (57 emoji, one per point of
the plane: a symbol's index is the number a card carries, so never
reorder; no name that is just «ورقة», the screens' word for a card) →
`engine/games/spot-it/`: `deck.ts` (the projective plane of order 7),
`rules.ts` (the five mini-games: dealing, `involved` (the cards a claim
matches across, in the order the phone's `seen` must list them), `apply`,
the timings), `index.ts` (the engine: claims, the window, the view, `scores`
— the mini-game's own count, negated where the fewest win) → `test/` →
`src/features/spot-it/`: `SpotRules` (front door, guests' lobby),
`ModePicker` + `spot-store.ts` (the host's pick), `SpotRoom` (the round),
`SpotDisc` (one card), `PairBoard` (tower, well), `FaceOffBoard` + `SeatCard`
(hot potato, gift), `TripletBoard`, `CatchLine`, `SpotStandings`,
`CountdownCover`, `FreezeCover`, `SpotOver` →
`features/room/components/GameDoor|GameLobby|GamePlay` (where the room's
screens hand over to the game) → the cabinet in
`features/arcade/data/games.ts` (no poster: the eye sprite stands in) → the
manifest in `public/.well-known/` (`pace: realtime`).

## Components

- One component per `.tsx`, named like the file, named export, ≤ 200 lines.
  Hooks: one per file, ≤ 120 lines. Pure helpers → `lib/`, tables → `data/`.
- shadcn first (`bunx shadcn add <name>` for one `components/ui` doesn't
  have yet): `Button`, `Badge`, `Card`, `Sheet`, `Toggle`/`ToggleGroup`,
  `RadioGroup`, `Tabs`, `Checkbox`, `Input`, `Skeleton`… Never a `div` with
  `onClick`. A new look used twice = a new `cva` variant in `components/ui`.
- Radix groups need the `DirectionProvider` in `main.tsx` — without it they
  render `dir="ltr"` and reverse inside the Arabic page.
- Icons: lucide only (`MaterialGlyph` is product illustration, not UI icons).
  Icon-only buttons get an Arabic `aria-label`; tap targets ≥ 44px. The
  cards' emoji are game content, not UI icons: each symbol key's
  `aria-label` is its Arabic name, and on the small cards (the triplet's
  grid, other players') the keys are smaller than 44px, as on the printed
  cards.
- Copy: Arabic inline, light Iraqi dialect (شنو، منو، انطي). `PixelTag` /
  `font-pixel` is for Latin only (SCORE, 1UP, GO!) — it has no Arabic glyphs.

## Styling

- Tokens only (`src/index.css` `@theme`): `text-13`, `bg-screen`, `text-coin`,
  `text-neon`, `text-plasma`, `border-hairline`, `rounded-card`, `shadow-pixel`,
  `glow-text`, `glow-box`, `scanlines`, `pixel-grid`… No arbitrary values
  (`text-[13px]`, `bg-[#…]`); bracket syntax only for selectors (`data-[state=on]:`).
  Spacing-scale multiples (`h-13.5`, `w-51`) are fine.
- Semantic colours only; no raw palette (`stone-500`) or hex in components. SVG
  illustrations use `fill-*` / `stroke-*` token utilities.
- Logical properties (`ps-` `pe-` `ms-` `me-` `start-` `end-`), never `pl-`/`left-`.
- `cn()` for conditional classes; `style={{}}` only for runtime values
  (animation delays by index, CSS-var handoffs).

## Motion

Transform/opacity only. Loops and entrances → CSS keyframes in `@theme`
(`animate-blink`, `animate-sprite-hop`, `animate-coin-spin`, `animate-pixel-pop`,
`animate-shake`, `animate-count-slam`, `animate-card-enter` + `cascadeDelay(i)`…);
8-bit loops use `steps()` easing. Interaction
physics → framer `m.*` (never `motion.*`) under `<LazyMotion>`.

## State & realtime

- One page is one round of one room (gathering_app/docs/GAME_BRIDGE.md). The
  room — code, members, start, results — is گعدة's; `lib/gathering/bridge.ts`
  types the calls the game makes, `lib/miniapp.ts` the haptics.
- The host's page runs the game: `lib/gathering/table.ts` (the old server's
  room, one round) over the engine in `engine/`. Other pages send it
  `{k: 'sync' | 'act'}` and draw the `RoomView` it sends back to them alone
  (`room.send(…, {to})`, `lib/gathering/wire.ts`). Never put a secret in a
  message to the whole room, and never in the room's state blob (every phone
  receives it): the manifest says `state: none`.
- The host's outbox (`mailer.ts`) keeps under the relay's 30 frames a second,
  one pending view per phone, the newest winning.
- The host ends the round with `realtime.finish()` → `room.end({scores})`
  (the engine's `scores`); گعدة ranks them and plays the next round in a
  fresh page. Never a "new game" inside a page.
- A host who leaves takes the game with them: a game not yet begun moves to
  the new host, one under way ends the round. A host's page reload resumes
  from localStorage (`arcade.table.<room>.<round>`).
- Timers are host epoch deadlines (`until`, a card's `at`); clients correct
  with `clockOffset`, which on a guest is the NTP-style reading of
  `lib/gathering/host-clock.ts` (`ping` → `pong` through the relay), not a
  view's `now`. The host's `wake` ends the countdown and closes a claim
  window, never the phone.
- The race is fair by design (README "A fair race over Wi-Fi"): a card shows
  at its `at` on every phone at once; a tap carries `at` on the host's clock
  (`use-spot.ts`), clamped by the engine between its cards showing and its
  arrival; the first right claim waits `WINDOW_MS` for earlier taps from
  slower phones, then the earliest stands. A claim on cards since changed is
  late (`seen` ≠ the cards now), never a freeze. Symbol keys fire on
  `pointerdown`, not on click. The host's own taps go straight to its table:
  their stamps, not their arrival, decide.
- Opened on its own (no room), the game shows its front door
  (`features/room/components/FrontDoor.tsx`): the signed-in player from
  `player.me()` (گعدة's session: a game never signs anyone in), «العب ويا
  ربعك» → `room.create({visibility})`, «انضم لغرفة» → `room.join()` (the
  app's Join sheet for this game), refusals in words
  (`features/room/data/room-words.ts`, إكس أو's table; `cancelled` says
  nothing). The app then puts the room's lobby in the page's place. Under
  the keys the game shows its rules (`GameDoor` → `SpotRules`).
- Tournaments (`../../gathering/docs/TOURNAMENTS.md`): in an app that has
  them (`snapshot.tournaments`: the bridge's `tournament` is there), the
  front door also offers a tournament of this game (`TournamentDoor`: «سوّي
  بطولة» → `tournament.create()` with no format — the game seats two, so a
  knockout of duels works too and the app's sheet asks — «انضم لبطولة» →
  `tournament.join()`; refusals in words,
  `features/room/data/tournament-words.ts`). The tournament's page
  then takes the page's place. In a match room (`room.current().tournament`,
  `snapshot.match`) `MatchBanner` sits over the round: the round of the
  league (or the stage), the leader and this phone's points, «البطولة» →
  `tournament.open()`. Each round is counted by the app as it closes, so the
  store reads the match again 1.5 s after `ended`.
- In a plain browser, `?dev&name=…` in several tabs plays one room across
  them (`lib/gathering/dev-bridge.ts`): `bun run dev`.
