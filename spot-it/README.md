# لگطها! · QUICK EYE

A speed-matching party game for جمعة (`arcade.spot-it`), 2–8 players, every
one on **their own phone** in one of جمعة's rooms. Arabic-first (RTL),
mobile-only. The well-known card game where any two cards share exactly one
symbol (rules: https://officialgamerules.org/game-rules/spot-it/), with the
box's five mini-games. Built on the same kit as the other arcade games in
`gathering_games/`, as a project of its own.

## The game

- **The deck** is the projective plane of order 7
  (`engine/games/spot-it/deck.ts`): 57 cards of 8 symbols, any two cards
  sharing exactly one symbol, every symbol on 8 cards. The box prints 55 of
  them. The symbols are 57 emoji (`shared/data/spot-symbols.ts`), each card
  laid out with its own sizes and turns (`src/features/spot-it/lib/layout.ts`).
- **A catch** is a tap on the shared symbol. Everyone plays at once. A wrong
  tap freezes you for 2 s (`FREEZE_MS`), so you can't just tap everything.
- **The host picks one of five mini-games** in the lobby:

| Mini-game | Board | A catch | Ends | Wins |
| --- | --- | --- | --- | --- |
| البرج · The Tower | middle card over yours | the middle card goes on your tower, the next one is drawn | the draw pile runs out | the tallest tower |
| البير · The Well | the well over your pile's top | your card goes into the well | someone empties their pile | that player |
| البطاطا الحارة · Hot Potato | your card over everyone's | tap the symbol on THEIR card: they get all your cards | one player holds the whole deal (5 deals) | the fewest cards lost |
| الهدية المسمومة · Poisoned Gift | middle card over everyone's | tap the symbol on THEIR card: the middle card goes to them | the draw pile runs out | the fewest cards |
| الثلاثي · Triplet | 9 cards face up | a symbol on three cards: you take those three | no triplet left and none to deal | the most cards |

  Triplet deals three more cards whenever no symbol shows on three (the box
  leaves that case open). Scores for جمعة's results are each mini-game's own
  count, below zero where the fewest win; جمعة ranks them. The box's
  tournament points (+5, +10, −20…) are left out: جمعة's tournaments already
  score each round by place.

## A fair race over Wi-Fi

A reaction race must not be won by the phone nearest the host, nor by the
host's phone itself, which runs the game:

1. **Synced reveals.** Each card carries `at`, a time on the host's clock.
   Every phone keeps it face down until then. Guests read the host's clock
   NTP-style (`lib/gathering/host-clock.ts`: `ping`/`pong` through the relay,
   half the round trip, the fastest of the recent samples), not from a view's
   `now`, which is a whole one-way trip old.
2. **Stamped taps.** A tap carries `at` on the host's clock. The engine clamps
   it between the moment its cards showed and the moment it arrived.
3. **A short window.** The first right claim waits `WINDOW_MS` (250 ms) for
   any claim tapped earlier on a slower phone; then they are applied earliest
   first, each checked again. A claim on cards that changed since is late
   («سبقوك عليها»), never wrong, so it never freezes anyone.
4. A new card lands face down for `REVEAL_MS` (700 ms) on every phone: time
   for the catch line, and for the view to reach every phone before the next
   race begins.

## How a round runs

```
host's phone                         جمعة relay                 other phones
┌───────────────────────────┐   room.send(view, {to})   ┌──────────────────────┐
│ Table (lib/gathering)     │ ─────────────────────────▶│ draws its own view   │
│  engine/ (pure rules)     │ ◀───────────────────────── │ {k:'sync'|'act'|     │
│  mailer: ≤ 20 frames/s    │                            │  'ping'}             │
└───────────────────────────┘                            └──────────────────────┘
```

- Opened from the store, outside a room, the game greets the signed-in player
  and offers «العب ويا ربعك» (`room.create()`) and «انضم لغرفة»
  (`room.join()`); the room's lobby then takes the game's place.
- جمعة opens the game on every phone when the host starts a round. The
  host's page deals and sends each phone its own `RoomView`.
- The host ends the round («النتائج» once the mini-game is decided, or
  «إنهاء الجولة» any time): `room.end({scores})`. جمعة ranks them, shows them
  in the room's lobby, and «العب مرة ثانية» opens a fresh page for the next
  round in the same room, where the host can pick another mini-game.
- A host's page reload resumes the round from localStorage; a host who
  leaves the room ends a round under way.
- Tournaments: the game seats two, so its front door offers both formats
  (`tournament.create()` without a format: the app's sheet asks).

## Commands

| Command | What it does |
| --- | --- |
| `bun install` | the dependencies (never `npm`) |
| `bun run dev` | Vite; open `http://localhost:5173/?dev&name=P1` in several tabs to play one room across them |
| `bun run build` | `tsc -b`, then the page into `dist/` (the manifest included) |
| `bun run lint` | ESLint (strict, type-checked) |
| `bun run test` | the deck, the race, all five mini-games played out by bots, and the host's table over a fake relay |
| `bun run fonts` | re-download the self-hosted fonts into `src/fonts/` |

## Project structure

```
engine/                 the rules, run on the host's phone
├── engine.ts           the engine contract + helpers
└── games/spot-it/      deck (the plane), rules (the five mini-games), index (claims, the window, the view)
shared/                 the view, the options, the 57 symbols
src/
├── lib/gathering/      bridge, table (the host's room), mailer, wire, host-clock, dev-bridge
├── lib/realtime/       the store the screens read (useRealtime / realtime.*)
├── features/room/      the round's screen: front door, setup, play, round over
├── features/spot-it/   the mini-game picker, the cards, the boards
└── features/arcade/    the loading screen (the eye sprite stands in for a poster), the cabinet
public/.well-known/     the manifest, copied into dist/
test/                   spot-it.test.ts, table.test.ts
art/icon.png            the store tile (the registry keeps its copy under the api's FILES_DIR; re-upload after a wipe: PUT /v1/admin/games/arcade.spot-it/icon)
```

## The look

The arcade's: a night floor with a pixel grid, cabinets on hard "pixel"
shadows, three neon tubes (coin yellow for the middle card, cyan for yours,
hot pink for everyone else's). Cards are round, as in the box. No poster yet:
the loading screen shows the eye sprite; drop art in and add a `poster` to
`features/arcade/data/games.ts` (the other games' `bun run posters` script
shows how).
