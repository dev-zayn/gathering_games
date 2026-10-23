# CLAUDE.md

أسرع إصبع · QUICK DRAW (`arcade.reflex`): one party game, its own mini app
in گعدة, 2–12 players, each on their own phone: every pad lights at one
moment and the first finger down takes the point. Without a room, the front
door also opens the original split-screen duel for two on **one phone**.
The room is گعدة's and the host's phone runs the game. React 19 + Vite 8 +
Tailwind v4 + shadcn (radix-nova, RTL). Arabic, RTL, mobile-only,
retro-arcade look. See README.md.

It is a project of its own: nothing here imports from another game, the
platform (`../../gathering`) or the app (`../../gathering_app`). The kit it
shares with the other arcade games (`components/`, `lib/gathering/`, the look
in `index.css`, the engine contract) is a copy cut down to what this game
uses (taken from لگطها!'s, with its host clock); a fix to the kit lands in
each game that has it.

## Checks

`bun run build` (`tsc -b`, then `vite build` into `dist/`), `bun run lint`
and `bun run test` (the draws and a whole match against the engine, the
host's table over a fake relay) must all be clean. Never `npm` — the
lockfile is `bun.lock`.

## Serving

`dist/` is the game: `index.html`, one script, one stylesheet, the fonts
and the manifest `dist/.well-known/gathering-game.json` (its source is
`public/.well-known/`; whoever serves it fills in `${PUBLIC_URL}`). On the
laptop the platform's fixtures server serves `../` (`gathering_games`) and
answers `/reflex/` from this folder's `dist/`, so build before opening it in the
app. The registry lists it as `arcade.reflex`.

## The game's parts

`shared/games.ts` (the id and the player limits, in step with the manifest's
`room.players` 2–12) → `shared/protocol.ts` (`ReflexView`, `ReflexOptions`,
`ReflexTap`) → `engine/games/reflex.ts` (the draws: `goAt` a random 1.5–4.5 s
after arming, the times the phones send, false starts, the point to the
fastest, first to the target; `scores` = points; registered in
`engine/games/index.ts`) → `test/` → `src/features/reflex/`: the room game
(`ReflexRules`, `TargetPicker` + `reflex-store.ts`, `ReflexLobby`,
`ReflexRoom`, `DrawPad`, `DrawTable`, `ReflexStandings`, `ReflexOver`;
`hooks/use-signal.ts` lights the pad at `goAt` and notes the frame it was
painted in, `hooks/use-draw-tap.ts` times and sends the tap) and the
one-phone duel (`Reflex`, `ReflexPad`, `hooks/use-reflex.ts`, opened by
`duel-store.ts` from `GameDoor`; `App` picks between it and `RoomScreen`) →
`features/room/components/GameDoor|GameLobby|GamePlay` (where the room's
screens hand over to the game) → `lib/hi-scores.ts` (the «HI» readout, kept
in localStorage; the keys in `constants/storage.ts`) → the cabinet in
`features/arcade/data/games.ts` (no poster: the bolt sprite stands in) → the
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
  Icon-only buttons get an Arabic `aria-label`; tap targets ≥ 44px.
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
- The host's page runs the game: `lib/gathering/table.ts` over the engine in
  `engine/`. Other pages send it `{k: 'sync' | 'act' | 'ping'}` and draw the
  `RoomView` it sends back to them alone (`room.send(…, {to})`,
  `lib/gathering/wire.ts`). Nothing goes in the room's state blob: the
  manifest says `state: none`.
- **A reaction is never timed over the network.** The pad lights at `goAt`
  on the host's clock (guests read it with `lib/gathering/host-clock.ts`,
  NTP-style, not from a view's `now`); the phone times its player from the
  `requestAnimationFrame` of the lit frame to the `pointerdown`'s
  `timeStamp` and sends `{type: 'tap', ms}` (or `{early: true}`). The engine
  only checks it: under `MIN_MS`, or arriving before `goAt`, is a foul. The
  pad fires on pointer-DOWN and the signal shows without an entrance
  animation.
- The host's outbox (`mailer.ts`) keeps under the relay's 30 frames a second,
  one pending view per phone, the newest winning.
- The host ends the round with `realtime.finish()` → `room.end({scores})`
  (the points); گعدة ranks them and plays the next round in a fresh page.
  Never a "new game" inside a page.
- A host who leaves takes the game with them: a game not yet begun moves to
  the new host, one under way ends the round. A host's page reload resumes
  from localStorage (`arcade.table.<room>.<round>`).
- Opened on its own (no room), the game shows its front door
  (`features/room/components/FrontDoor.tsx`): «العب ويا ربعك» →
  `room.create({visibility})`, «انضم لغرفة» → `room.join()`, refusals in
  words (`features/room/data/room-words.ts`); a tournament
  (`TournamentDoor`: `tournament.create()` with no format — it seats two, so
  the app's sheet asks knockout or league — and `tournament.join()`); and
  under them `GameDoor`: the rules and «مبارزة على موبايل واحد», the duel,
  which never touches the network.
- In a match room `MatchBanner` sits over the round (`room.current().tournament`),
  read again 1.5 s after `ended`.
- In a plain browser, `?dev&name=…` in several tabs plays one room across
  them (`lib/gathering/dev-bridge.ts`): `bun run dev`. Without `?dev`, the
  front door (and the duel).
