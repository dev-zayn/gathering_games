# طاولي · BACKGAMMON

Backgammon for گعدة (`arcade.backgammon`): two players, each on **their own
phone** in one of گعدة's rooms, or on **one phone** with no room at all
(against الحجّي, the café regular, or two people passing it across).
Arabic-first (RTL), mobile-only, portrait. The rules are the box's
(https://officialgamerules.org/game-rules/backgammon-rules/), the doubling
cube, gammons and the Crawford rule included. Built on the kit the arcade
games share (from بقت وحدة!'s copy), as a project of its own, with a look of
its own (see "The look").

## The game

- **The board**: 24 points, 15 checkers a side, set up 2 on the 24-point, 5
  on the 13, 3 on the 8 and 5 on the 6 (each side counting from its own
  home). Seat 0 (the room's host) plays ivory, seat 1 ebony.
- **The opening roll**: one die each, thrown again on a tie; the higher die
  moves first with both numbers.
- **A turn**: each die is a move of its own, one checker or two. A checker
  lands on an open point, its own, or a lone opposing checker (a blot, hit
  to the bar); two or more opposing checkers block a point. Doubles play
  four times. As many dice as can be used must be; when only one of two
  can, the higher one if it can. No legal move passes the turn at once.
- **The bar**: a checker hit waits there and must enter the other side's
  home board before anything else moves.
- **Bearing off**: once all fifteen are home. A die takes a checker off its
  own point; from a higher point the checkers must move; with nothing
  higher, the highest checker comes off. Bearing off is never forced.
- **The cube** (if picked): before rolling, a player who holds the cube (or
  when it is in the middle) may double. The other side takes (the cube is
  theirs at twice the value) or passes (losing the game at the value
  before). Up to 64. In a match, the game after a side first reaches one
  point short is the Crawford game: no doubling in it.
- **Winning**: the first side to bear off all fifteen. A single game is
  worth the cube; a gammon (مارس, the loser bore nothing off) twice; a
  backgammon (مارس كبير, and still has a checker on the bar or in the
  winner's home) three times.

The optional variants on the rules page (automatic doubles, beavers, the
Jacoby rule) are not played; they are money-game customs.

### What the host picks in the lobby

| Setting | Choices |
| --- | --- |
| لحد كم نلعب؟ | one game (its worth is the score) · a match to 3 · 5 · 7 points |
| مكعب المضاعفة | ويّاه (the cube and the Crawford rule) · بلاه |

The same two choices set up a match on one phone.

### Scores for گعدة

`room.end({scores})`: each side's match points (for one game, the winner's
points and 0). گعدة ranks them; in a knockout the side ranked better takes
the round.

### The clock over Wi-Fi

A roll and an answer to a double have 60 s, a turn's moves 120 s; a phone
that has dropped out gets 25 s. Then the decision plays itself the way
الحجّي would (the roll thrown, the double answered, the turn finished from
whatever was already moved). The last 20 s show on the player's plate. The
next game of a match deals itself after 8 s, or at once on «يلا الجاية». On
one phone there is no clock.

## How a round runs

```
host's phone                         گعدة relay                 other phone
┌───────────────────────────┐   room.send(view, {to})   ┌──────────────────────┐
│ Table (lib/gathering)     │ ─────────────────────────▶│ draws the board from │
│  engine/ (pure rules)     │ ◀───────────────────────── │ its own side         │
│  mailer: ≤ 20 frames/s    │  {k:'sync'|'act'}          │ {stage, play, …}     │
└───────────────────────────┘                            └──────────────────────┘
```

- The phone to move works its turn out on its own (the rules are shared
  code: legal moves light up at once, no round trip), sends every change as
  `stage` so the other phone watches the checkers move, and `play` on «تمّ».
  The host checks both against the rules.
- Opened from the store, outside a room: the front door. «العب ويّا ربعك»
  (`room.create()`), «انضم لغرفة» (`room.join()`), a tournament (it seats
  two: both formats), and «على هذا الموبايل» (against الحجّي or two on one
  phone, kept in localStorage to carry on later). Outside the app (a plain
  browser) only the one-phone game is open.
- The host ends the round («النتائج» once the match is decided, or
  «إنهاء الجولة بالنتيجة الحالية» any time). A host's page reload resumes
  from localStorage; a host who leaves ends a round under way.

## Commands

| Command | What it does |
| --- | --- |
| `bun install` | the dependencies (never `npm`) |
| `bun run dev` | Vite; `http://localhost:5173/?dev&name=P1` in two tabs plays one room across them; without `?dev`, the front door and the one-phone game |
| `bun run build` | `tsc -b`, then the page into `dist/` (the manifest included) |
| `bun run lint` | ESLint (strict, type-checked) |
| `bun run test` | the rules' corner cases, the engine's scenarios (cube, gammons, Crawford, the clock), hundreds of whole matches between bots, the host's table over a fake relay |
| `bun run fonts` | re-download the self-hosted fonts into `src/fonts/` |

## Project structure

```
shared/backgammon/      board (sides, pips, gammons), moves (legal moves, routes for taps), bot (الحجّي)
shared/                 games, protocol (BgView, BgOptions), random (the dice)
engine/games/backgammon rules (state, games, the cube, Crawford), moves (one function a move, the clock), index (the engine)
src/
├── lib/gathering/      bridge, table (the host's room), mailer, wire, dev-bridge
├── lib/realtime/       the store the screens read (useRealtime / realtime.*)
├── lib/sound.ts        the clack, the thud, the dice, the tea glass (Web Audio, nothing fetched)
├── features/intro/     the box opening on its hinge (the loading screen)
├── features/room/      the round's screens: front door, lobby, play, round over
├── features/backgammon/ the board (art, checkers, marks, keys), dice, cube, plates, keys, the one-phone game
└── components/art/     the box lid, the istikan, the inlay star and strip
public/.well-known/     the manifest, copied into dist/
art/icon.png            the store tile (art/icon.svg its source)
```

## The look

Its own, not the arcade's: a Baghdad café at night. The page is the room's
espresso dark under a lamp's pool of light, with a shanasheel lattice faint
over it. The board is the walnut box opened flat, banded with
mother-of-pearl, its points in turquoise and brick (the domes and the
brickwork), the hinge across the middle with brass pins and the inlaid
star the cube rests on, the tray sunk under the home boards. Checkers are
ivory with a brick heart and ebony with a brass rim, both with a turned
groove. Brass is everything a hand reaches for. Titles are in Aref Ruqaa,
the Ruqʿa hand of café signs; everything else in Readex Pro. The loading
screen is the closed box: a tap swings the lid open and the table shows
through. «دورك» is a spoon against an istikan.

The board stands upright for a phone in portrait: the bar runs across the
middle, the outer boards above it, both home boards below. Each phone draws
it from its own side: its checkers go up the left, across the top and down
the right into its home (bottom right), and off into the tray under it.
