# أسرع إصبع · QUICK DRAW

A reaction party game for جمعة (`arcade.reflex`), 2–12 players, every one on
**their own phone** in one of جمعة's rooms. Each draw, every phone waits
dark; at a random moment they all light together, and the first finger down
takes the point. A tap before the light is a false start. First to the
target (3, 5 or 7, the host's pick) wins. One of the arcade games, each a
project of its own in `gathering_games/`.

Without a room, the front door still offers the original duel: two players
on **one phone**, the screen split in two.

## Fair over Wi-Fi

A reaction is a few hundred milliseconds, so the network must not decide it:

1. **One signal on every phone.** A draw carries `goAt`, a time on the host's
   clock. Guests read the host's clock NTP-style (`lib/gathering/host-clock.ts`:
   `ping`/`pong` through the relay, half the round trip, the fastest of the
   recent samples), so all the pads light within a few milliseconds of each
   other.
2. **Timed on the phone.** Each phone times its own player, from the frame
   its pad lit (`requestAnimationFrame`) to the finger's `pointerdown`
   `timeStamp`, and sends the milliseconds. How long the message takes to
   reach the host changes nothing. The host only collects the times.
3. **False starts.** A tap before the light, a time under 100 ms (`MIN_MS`,
   quicker than a human), or a time that reaches the host before the signal
   is a foul: out of that draw. The first tap counts; a draw closes when
   everyone here has gone, or 3 s after the signal (`TAP_WINDOW_MS`).

## How a round runs

```
host's phone                         جمعة relay                 other phones
┌───────────────────────────┐   room.send(view, {to})   ┌──────────────────────┐
│ Table (lib/gathering)     │ ─────────────────────────▶│ its own pad, lit at  │
│  engine/ (pure rules)     │ ◀───────────────────────── │ goAt; sends its ms   │
│  mailer: ≤ 20 frames/s    │                            │ {k:'act'|'ping'}     │
└───────────────────────────┘                            └──────────────────────┘
```

- Opened from the store, outside a room: «العب ويا ربعك» (`room.create()`),
  «انضم لغرفة» (`room.join()`), a tournament (it seats two, so knockout or
  league: `tournament.create()` with no format), or the duel on one phone.
- In the room's lobby the host picks the target and starts. Each draw: the
  pad says «استنى…», lights «دوس!», then the draw's table (every time, foul
  and miss) stays up 3 s before the next draw arms.
- The match is over at the target: the host's «النتائج» calls
  `room.end({scores})` with the points; جمعة ranks them, and «العب مرة
  ثانية» plays the next round in the same room.
- A host's page reload resumes the round from localStorage; a host who
  leaves ends a round under way.

## Commands

| Command | What it does |
| --- | --- |
| `bun install` | the dependencies (never `npm`) |
| `bun run dev` | Vite; open `http://localhost:5173/?dev&name=P1` in several tabs to play one room across them (without `?dev`: the front door and the duel) |
| `bun run build` | `tsc -b`, then the page into `dist/` (the manifest included) |
| `bun run lint` | ESLint (strict, type-checked) |
| `bun run test` | the draws and a whole match against the engine, the host's table over a fake relay |
| `bun run fonts` | re-download the self-hosted fonts into `src/fonts/` |

## Project structure

```
engine/                 the rules, run on the host's phone
├── engine.ts           the engine contract + helpers
└── games/reflex.ts     draws, false starts, points
shared/                 the view, the options
src/
├── lib/gathering/      bridge, table (the host's room), mailer, wire, host-clock, dev-bridge
├── lib/realtime/       the store the screens read (useRealtime / realtime.*)
├── lib/hi-scores.ts    the «HI» readout (this phone's best)
├── features/room/      the round's screen: front door, lobby, play, round over
├── features/reflex/    the room game (ReflexRoom, DrawPad, use-signal, use-draw-tap…)
│                       and the one-phone duel (Reflex, ReflexPad, use-reflex)
└── features/arcade/    the loading screen, the cabinet
public/.well-known/     the manifest, copied into dist/
test/                   reflex.test.ts, table.test.ts
```

## The look

An arcade after closing. A night floor with a pixel grid, cabinets on hard
"pixel" shadows, CRT screens with scanlines, and three neon tubes: coin yellow,
cyan and hot pink. The pad is one CRT that floods coin yellow on the signal.
Latin labels (DRAW, NOW!, FOUL) are 8-bit Press Start 2P; Arabic text is
Alexandria. The game boots through its loading screen (the bolt sprite).
