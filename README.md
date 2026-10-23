# جمعة's games

Every minigame جمعة plays, one folder each, outside both projects: the
platform (`../gathering`) lists and serves them, the app (`../gathering_app`)
opens them in its game frame, and neither holds a copy. A game is a mini app
as a studio would ship one: a page beside its manifest at
`.well-known/gathering-game.json`, talking to جمعة only through
`window.gathering` (`../gathering_app/docs/GAME_BRIDGE.md`).

| Folder | Registry id | Players | What it is |
| --- | --- | --- | --- |
| `xo/` | `fixture.xo` | 2 | إكس أو: turn by turn, an authoritative host and a state blob. Plain HTML, CSS and JS. |
| `tap/` | `fixture.tap` | 2–8 | سباق النقر: ten seconds of real-time tapping, no state blob. Plain HTML, CSS and JS. |
| `outsider/` | `arcade.outsider` | 3–12 | برا السالفة: find the one who doesn't know the word. |
| `mafia/` | `arcade.mafia` | 5–16 | المافيا: private roles, night moves, a day vote. |
| `charades/` | `arcade.charades` | 4–16 | مثّلها: two teams, the actor's phone shows the word. |
| `most-likely/` | `arcade.most-likely` | 3–16 | منو أكثر واحد؟: secret votes, crowns as scores. |
| `reflex/` | `arcade.reflex` | 2–12 | أسرع إصبع: every phone lights at once, first finger down takes the point (timed on each phone, so lag never decides). Without a room: the split-screen duel on one phone. |
| `spot-it/` | `arcade.spot-it` | 2–8 | لگطها!: any two cards share one symbol; first to tap it wins. The box's five mini-games, a race made fair over Wi-Fi. |
| `giant-uno/` | `arcade.giant-uno` | 2–10 | بقت وحدة!: the colour-and-number card game (the Giant edition's 108 cards, its blank house-rule wilds): match the pile, Draw Four challenges, say «وحدة!» on your last card. One hand, or hands to 200 or 500. |

## Two shapes

- **A plain game** (`xo`, `tap`): the folder is the page. No build step,
  nothing loaded from the network; opened from disk in a desktop browser, a
  stand-in bridge keeps it working.
- **A built game** (the seven arcade games): a React + Vite project of its
  own (`bun install`, `bun run build`, `bun run lint`, `bun run test`), with
  its own `package.json`, `bun.lock`, tests, README and CLAUDE.md. The
  manifest's source is `public/.well-known/`; the build puts the page and
  the manifest in `dist/`. The first five began as one project and share a
  kit (components, the bridge, the host's table, the look); `spot-it` was
  built from منو أكثر واحد؟'s copy and `giant-uno` from `spot-it`'s. Each holds its own copy cut down to what
  it uses: change the kit in each game that has it. Only `spot-it`'s and
  `reflex`'s copies read the host's clock (`host-clock.ts`, `ping`/`pong` on
  the wire), which a reaction race needs.

## Tournaments

The room games take part in the platform's tournaments
(`../gathering/docs/TOURNAMENTS.md`) through `window.gathering.tournament`.
Opened outside a room, `xo`, `tap`, `reflex`, `spot-it` and `giant-uno` offer «سوّي
بطولة» and «انضم لبطولة» (any format: they seat two), and the four other
arcade room games offer a league («سوّي دوري»: they seat three or more, too
many for a knockout's duels). In a match room each shows a
banner with the match from `room.current().tournament` (the stage or the
league's round, the tally) that opens the tournament (`tournament.open()`),
and reads the tally again shortly after a round ends.

## Serving them on the laptop

The platform's fixtures server serves this folder. A game with a `dist/` is
answered from it (its sources and `node_modules` are never served), any
other from the folder itself, and `${PUBLIC_URL}` in a manifest or a page is
filled in with the server's address.

    cd ../gathering
    make games      # build the five arcade games, then the brand check over this folder
    PUBLIC_URL=http://localhost:8091 API_URL=http://localhost:8080 make fixtures

For a phone on the Wi-Fi, `PUBLIC_URL` is the Mac's address
(`http://<ip>:8091`). The registry keeps each game's manifest address, so
after the address changes, move every game to it from the console (or
`PUT /v1/admin/games/{id}/manifest`).

## Adding a game

A new folder with its page and `.well-known/gathering-game.json` (`id`,
`entry` as `${PUBLIC_URL}/<folder>/`, `room`, `scopes`; see the platform's
`docs/ROOMS.md` and the developer docs), then register it from the console
(Games, Register by URL: `<PUBLIC_URL>/<folder>/`). A built game also goes in
the platform Makefile's `ARCADE` so `make games` builds it. Nothing of
another product's brand: `make games` fails on one.
