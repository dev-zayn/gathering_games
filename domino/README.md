# الدومينو — domino

A minigame for گعدة, one folder beside its manifest at
`.well-known/gathering-game.json`. Classic double‑six dominoes.

| | |
| --- | --- |
| Registry id | `arcade.domino` |
| Players | 2–4, each on their own phone in a گعدة room; or one player against the computer |
| Shape | A plain game — `index.html`, `style.css`, `rules.js`, `room.js`, `app.js`. No build step, nothing loaded from the network. Opened from disk in a desktop browser it just works (against the computer). |
| Served at | `https://games.ga3da.fun/domino/` (the deployed copy lives in `gathering_games/domino/`) |

## The game

الدومينو: ٢٨ حجرًا من ٠ إلى ٦. كل لاعب يأخذ ٧ أحجار، والباقي في «الكومة».
يبدأ حامل أعلى دبل، ثم بالدور يضع كل لاعب حجرًا يطابق أحد طرفَي الخط؛ من لا
يملك حركة يسحب من الكومة، فإن فرغت مرّر دوره. أول من يتخلّص من كل أحجاره
يفوز بالجولة، وإن انغلقت اللعبة يفوز صاحب أقل النقاط. تُجمع النقاط حتى يبلغ
لاعب الحد (٥٠ / ١٠٠ / ١٥٠) فيفوز بالمباراة.

## Two ways to play

- **In a گعدة room** (2–4 players, each on their own phone). The host's
  phone runs the game: it deals, checks every move against the rules and
  sends every phone its own view with `room.send(view, {to})`, so a hand
  never reaches a phone it is not for. Nothing goes in the room's state
  blob (every phone receives it): the manifest says `state: none`. The
  other phones send the host `{k: 'sync'}` for their view and
  `{k: 'act', action}` for a move. The host picks the target in the page's
  lobby and starts once a second page is up.
  - **The clock:** a turn has 45 s, a phone that dropped out 12 s; then the
    computer plays that turn (draws until it can, then its heaviest tile).
    The next round deals itself after 10 s («الجولة التالية» deals it at
    once). Once the match is decided the host's «النتائج» ends the round
    (`room.end({scores})`, every player's match points), or it ends itself
    after 30 s. The host's «إنهاء الجولة» ends it early at the score as it
    stands.
  - A host's page reload resumes from localStorage; a host who leaves ends a
    round under way. A page that opens after the deal watches.
  - **Tournaments:** in a match room a bar over the board shows the match;
    a tap opens the tournament.
- **Outside a room** the first screen is the old one: one player against
  1–3 computers, and inside گعدة, above it, «العب ويّا ربعك» (`room.create()`),
  «انضم لغرفة» (`room.join()`) and, in an app that has them, «سوّي بطولة» /
  «انضم لبطولة».

## The board layout

The played chain is drawn as one continuous, connected **rectangular loop**
with proper 90° corners: the tiles walk clockwise (top → right → bottom →
left) and spiral inward when they are many. The logical sequence is tracked
separately from the visual path, so matching ends always touch, doubles sit
**crosswise** (perpendicular to the line), nothing overlaps, and the two open
heads are highlighted. The whole block auto‑scales to fit the table on any
screen, phone or desktop. Drag a tile onto a glowing head to play it.

## Files

- `index.html` — markup and the page's manifest comment.
- `style.css` — the look (green felt table, tiles, highlights, responsive).
- `rules.js` — the rules alone (the deal, moves, the round's end, the
  computer's move, each player's view), shared by both ways to play.
- `room.js` — the room: the bridge, the host's table, the relay budget, the
  clock, and a `?dev` stand-in that plays one room across browser tabs.
- `app.js` — the page: drawing from a view, the `computeLayout` path engine,
  dragging tiles, the windows.
- `.well-known/gathering-game.json` — the game manifest.
- `test/` — `bun test test`: the rules over hundreds of whole matches, and
  the host's table over a fake relay (own-hand-only views, a whole match,
  the clock, a host reload, the relay budget).

## Trying a room without phones

Serve the folder over http and open `…/?dev&name=زينب`, `…/?dev&name=علي`
(up to four) in tabs of one browser: the first tab is the host.
