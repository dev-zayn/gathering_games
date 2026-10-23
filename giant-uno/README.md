# بقت وحدة! · ONE LEFT!

The colour-and-number card game for گعدة (`arcade.giant-uno`), 2–10 players,
every one on **their own phone** in one of گعدة's rooms, each hand hidden from
the others. Arabic-first (RTL), mobile-only. The rules are the Giant edition's
(https://officialgamerules.org/game-rules/giant-uno/), cards and all; on a
phone every card is giant anyway. Built on the same kit as the other arcade
games in `gathering_games/` (from لگطها!'s copy), as a project of its own.

## The game

- **The deck** is the box's 108 cards (`shared/data/deck.ts`): per colour
  (red, yellow, green, blue) one 0, two of each 1–9, two each of skip,
  reverse and draw two; then 2 wilds, 4 wild draw fours and the Giant
  edition's 2 blank **wild customizables**. A card's id is the same card on
  every phone; never reorder.
- **A turn**: play one card that matches the top of the pile by colour,
  number or symbol, or any wild (calling its colour). Or draw one: if it
  fits it may be played (only it), else the turn passes. Drawing with a
  playable card in hand is allowed, as the box says.
- **The cards**: skip (the next player loses the turn), reverse (with two at
  the table it works as a skip), draw two (the next draws 2 and loses the
  turn), wild (any colour), wild draw four (the next draws 4 and loses the
  turn; legal only holding none of the colour to follow).
- **The challenge**: a wild draw four can be challenged by its victim. The
  player who played it shows their hand to the challenger alone; held the
  colour → they draw 4 and the challenger plays; held none → the challenger
  draws 6 and loses the turn.
- **«وحدة!»**: said on the way down to one card (from two cards held, or
  right after). Down to one without it, anyone else may catch the player
  («مسكته!») until the next move: 2 cards. Drawing takes the call back.
- **The first card turned up** acts as the box says: a skip skips the first
  player, a reverse starts with the dealer the other way, a draw two hits
  the first player, a wild lets the first player call the colour, a wild
  draw four goes back in the deck. The first dealer is the highest card
  turned up (symbols count 0); each next hand, the deal moves one seat on.
- **Going out** ends the hand; a last draw two or draw four still lands
  first, and counts. An empty draw pile is the discards under the top,
  shuffled.

### What the host picks in the lobby

| Setting | Choices |
| --- | --- |
| كم نلعب؟ | one hand · hands until a total reaches 200 · 500 (the box) |
| شلون نحسب؟ | whoever goes out scores the cards everyone else holds (numbers at face value, skip/reverse/+2 20, wilds 50, the blank wilds 40) · the box's other count: everyone adds up their own hand, the fewest win |
| جوكر القاعدة | what the two blank cards do, agreed before the deal (the box leaves it to the table; these are its examples and two common ones): **دور ثاني** play again · **بدّل الورق** swap hands with a player you pick · **دوّر على اللون** the next player draws until your colour turns up and loses the turn · **ذب اللون** discard every card of your colour with it · **جوكر عادي** a plain wild |

Every blank wild also calls a colour. Played as the last card it goes out
without its rule (nothing left to swap or dump), except the hunt, which
still lands like a last draw card.

### Scores for گعدة

`room.end({scores})`, highest best: with a target, each player's total (below
zero under the other count); for one hand, the points the winner went out
with, and for everyone else what they were left holding, below zero. گعدة
ranks them. Stacking draw cards is a house rule the box mentions but does
not play, so it is left out.

### Turns over Wi-Fi

A move has 30 s (12 s after drawing, 15 s for a colour or a challenge);
then it is made for the player: one card drawn and kept, the colour most of
their hand is in, the four drawn. A player whose phone has gone gets 5 s.
Between hands the next deal comes in 15 s, or when the host taps «وزّع هسه».

## How a round runs

```
host's phone                         گعدة relay                 other phones
┌───────────────────────────┐   room.send(view, {to})   ┌──────────────────────┐
│ Table (lib/gathering)     │ ─────────────────────────▶│ draws its own view   │
│  engine/ (pure rules)     │ ◀───────────────────────── │ {k:'sync'|'act'}     │
│  mailer: ≤ 20 frames/s    │                            │                      │
└───────────────────────────┘                            └──────────────────────┘
```

- Opened from the store, outside a room, the game greets the signed-in player
  and offers «العب ويا ربعك» (`room.create()`) and «انضم لغرفة»
  (`room.join()`); the room's lobby then takes the game's place.
- گعدة opens the game on every phone when the host starts a round. The
  host's page deals and sends each phone its own `RoomView`: its own hand,
  everyone else's count. A hand never travels anywhere else.
- The host ends the round («النتائج» once it is decided, or «إنهاء الجولة»
  any time): `room.end({scores})`. «العب مرة ثانية» in گعدة opens a fresh
  page for the next round in the same room.
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
| `bun run test` | the deck, every rule in a scripted hand, 500 games played out by bots, the host's table over a fake relay |
| `bun run fonts` | re-download the self-hosted fonts into `src/fonts/` |

## Project structure

```
engine/                 the rules, run on the host's phone
├── engine.ts           the engine contract + helpers
└── games/giant-uno/    rules (state, deal, draw, scoring), moves (one function a move), words (each phone's lines), index (the engine)
shared/                 the view and options, the 108 cards
src/
├── lib/gathering/      bridge, table (the host's room), mailer, wire, dev-bridge
├── lib/realtime/       the store the screens read (useRealtime / realtime.*)
├── features/room/      the round's screen: front door, setup, play, round over
├── features/giant-uno/ the setup, the table, the cards, the hand, the panels
└── features/arcade/    the loading screen (the cards sprite stands in for a poster), the cabinet
public/.well-known/     the manifest, copied into dist/
test/                   giant-uno.test.ts, table.test.ts
art/icon.png            the store tile (art/icon.svg its source; the registry keeps its copy under the api's FILES_DIR; re-upload after a wipe: PUT /v1/admin/games/arcade.giant-uno/icon)
```

## The look

The arcade's: a night floor with a pixel grid, cabinets on hard "pixel"
shadows. A card is its colour round a CRT-black panel with the number or
symbol glowing in the middle; a wild's panel holds the four colours. The
table is a CRT that glows in the colour to follow. The four colours are
the `suit-*` tokens in `src/index.css`. No poster yet: the loading screen
shows the cards sprite.
