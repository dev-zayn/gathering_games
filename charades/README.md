# مثّلها · SILENT MOVIE

A party game for گعدة (`arcade.charades`), 4–16 players, every one on
**their own phone** in one of گعدة's rooms, the phone buzzing when it's their
turn. Arabic-first (RTL), mobile-only. Ported from a standalone web app that ran
its own Bun game server; here گعدة owns the room and the host's phone runs the
game. One of the five arcade games, each a project of its own in
`gathering_games/`.

Two teams drawn at start. The actor's phone shows the word + صح/تخطي; the **other** team sees the word too; the guessers never do. The host's clock.

## How a round runs

```
host's phone                         گعدة relay                 other phones
┌───────────────────────────┐   room.send(view, {to})   ┌──────────────────────┐
│ Table (lib/gathering)     │ ─────────────────────────▶│ draws its own view   │
│  engine/ (pure rules)     │ ◀───────────────────────── │ {k:'sync'|'act'}     │
│  mailer: ≤ 20 frames/s    │                            └──────────────────────┘
└───────────────────────────┘
```

- Opened from the store, outside a room, the game greets the signed-in player
  and offers «العب ويا ربعك» (`room.create()`) and «انضم لغرفة»
  (`room.join()`); the room's lobby then takes the game's place.
- گعدة opens the game on every phone when the host starts a round. The
  host's page sets the game up (its own options), deals, and sends each phone
  **its own** `RoomView`: secrets never travel to a phone they are not for,
  and nothing goes in the room's shared state.
- The engine is the old server's, unchanged: `options → start → act →
  settle → view`, plus `scores` for گعدة's results.
- The host ends the round («النتائج» / «إنهاء الجولة»): `room.end({scores})`.
  گعدة ranks them, shows them in the room's lobby, and «العب مرة ثانية»
  opens a fresh page for the next round in the same room.
- A guest's page asks the host for its view until it comes, and again after
  a reconnect. A host's page reload resumes the round from localStorage; a
  host who leaves the room ends a round under way.

## Commands

| Command | What it does |
| --- | --- |
| `bun install` | the dependencies (never `npm`) |
| `bun run dev` | Vite; open `http://localhost:5173/?dev&name=P1` in several tabs to play one room across them |
| `bun run build` | `tsc -b`, then the page into `dist/` (the manifest included) |
| `bun run lint` | ESLint (strict, type-checked) |
| `bun run test` | whole rounds against the host's table over a fake relay |
| `bun run posters` | re-encode `art/*.png` to `public/images/games/charades.webp` (needs `cwebp`) |
| `bun run fonts` | re-download the self-hosted fonts into `src/fonts/` |

## Project structure

```
engine/                 the rules, run on the host's phone
├── engine.ts           the engine contract + helpers
└── games/              charades
shared/                 the view, the options, the game's data
src/
├── lib/gathering/      bridge, table (the host's room), mailer, wire, dev-bridge
├── lib/realtime/       the store the screens read (useRealtime / realtime.*)
├── features/room/      the round's screen: front door, setup, play, round over
├── features/charades/         the game's own setup and screens
└── features/arcade/    the poster loading screen, the cabinet
public/.well-known/     the manifest, copied into dist/
test/                   table.test.ts
art/                    the poster source
```

## The look

An arcade after closing. A night floor with a pixel grid, cabinets on hard
"pixel" shadows, CRT screens with scanlines, and three neon tubes: coin yellow,
cyan and hot pink. Latin labels (SCORE, 1UP, GO!) are 8-bit Press Start 2P;
Arabic text is Alexandria. The game boots through its poster loading screen.
