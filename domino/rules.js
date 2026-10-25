/* الدومينو — the rules, and nothing else: no page, no bridge. The same
   functions run the game against the computer on one phone and, in a
   گعدة room, on the host's phone for everyone (room.js).

   A state is plain data, safe to JSON: the players (id, name, hand,
   score), the chain on the table, its two open ends, the boneyard, whose
   turn it is, and where the match stands. Every move is checked here and
   answered with nothing (it happened) or an Arabic reason it cannot. */
(function (root) {
  'use strict';

  var HAND = 7;
  var TARGETS = [50, 100, 150];

  /** The 28 tiles of a double-six set. */
  function makeSet() {
    var set = [];
    for (var i = 0; i <= 6; i++) for (var j = i; j <= 6; j++) set.push([i, j]);
    return set;
  }

  function shuffle(a, rand) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  var sum = function (hand) { return hand.reduce(function (n, t) { return n + t[0] + t[1]; }, 0); };
  var same = function (a, b) { return (a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0]); };

  /** A new match: the players in seat order, the first round dealt. */
  function newMatch(players, target, rand) {
    var s = {
      players: players.map(function (p) { return { id: p.id, name: p.name, hand: [], score: 0 }; }),
      board: [], left: null, right: null, boneyard: [],
      turn: 0, passes: 0, target: target,
      phase: 'play', round: 0, result: null, winner: null,
      last: null, events: 0,
    };
    deal(s, rand || Math.random);
    return s;
  }

  /** A fresh round: seven each, the rest in the boneyard; the highest double starts, else the highest tile. */
  function deal(s, rand) {
    var deck = shuffle(makeSet(), rand || Math.random);
    s.players.forEach(function (p) { p.hand = []; });
    for (var i = 0; i < HAND; i++) s.players.forEach(function (p) { p.hand.push(deck.pop()); });
    s.boneyard = deck;
    s.board = []; s.left = null; s.right = null;
    s.passes = 0; s.phase = 'play'; s.result = null;
    s.round += 1;
    s.turn = starterOf(s.players);
    s.last = { kind: 'round', seat: s.turn, n: ++s.events };
    return s;
  }

  function starterOf(players) {
    var best = -1, who = 0;
    players.forEach(function (p, i) {
      p.hand.forEach(function (t) { if (t[0] === t[1] && t[0] > best) { best = t[0]; who = i; } });
    });
    if (best >= 0) return who;
    var top = -1;
    players.forEach(function (p, i) {
      p.hand.forEach(function (t) { if (t[0] + t[1] > top) { top = t[0] + t[1]; who = i; } });
    });
    return who;
  }

  function canPlay(s, t) {
    if (s.board.length === 0) return true;
    return t[0] === s.left || t[1] === s.left || t[0] === s.right || t[1] === s.right;
  }

  var hasMove = function (s, hand) { return hand.some(function (t) { return canPlay(s, t); }); };

  /** The ends a tile can go on: the first tile has just the one place. */
  function endsFor(s, t) {
    if (s.board.length === 0) return ['left'];
    var ends = [];
    if (t[0] === s.left || t[1] === s.left) ends.push('left');
    if (t[0] === s.right || t[1] === s.right) ends.push('right');
    return ends;
  }

  /** Lays a tile on an end, turned so it matches; false when it does not fit there. */
  function place(s, t, side) {
    var a = t[0], b = t[1];
    if (s.board.length === 0) { s.board.push([a, b]); s.left = a; s.right = b; return true; }
    if (side === 'left') {
      if (b === s.left) { s.board.unshift([a, b]); s.left = a; return true; }
      if (a === s.left) { s.board.unshift([b, a]); s.left = b; return true; }
      return false;
    }
    if (a === s.right) { s.board.push([a, b]); s.right = b; return true; }
    if (b === s.right) { s.board.push([b, a]); s.right = a; return true; }
    return false;
  }

  /**
   * A move by the player in `seat`: play a tile on an end, draw (only with
   * nothing to play), pass (only with nothing to play and nothing to
   * draw), or deal the next round once one is over. Returns null when it
   * happened, else the reason in Arabic. Changes `s`.
   */
  function act(s, seat, action, rand) {
    var type = action && action.type;
    if (type === 'next') {
      if (s.phase !== 'round') return 'الجولة بعدها ما خلصت';
      deal(s, rand || Math.random);
      return null;
    }
    if (s.phase !== 'play') return 'الجولة خلصت';
    if (seat !== s.turn) return 'مو دورك';
    var p = s.players[seat];
    if (type === 'play') {
      var tile = action.tile;
      if (!Array.isArray(tile) || tile.length !== 2) return 'هالحجر مو موجود';
      var i = p.hand.findIndex(function (h) { return same(h, tile); });
      if (i < 0) return 'هالحجر مو بيدك';
      var held = p.hand[i];
      var side = s.board.length === 0 ? 'left' : action.side;
      if (endsFor(s, held).indexOf(side) < 0) return 'هالحجر ما يركب على هالطرف';
      place(s, held, side);
      p.hand.splice(i, 1);
      s.passes = 0;
      s.last = { kind: 'play', seat: seat, tile: held, side: side, n: ++s.events };
      if (p.hand.length === 0) { endRound(s, seat, false); return null; }
      s.turn = (s.turn + 1) % s.players.length;
      return null;
    }
    if (type === 'draw') {
      if (hasMove(s, p.hand)) return 'عندك حجر يركب، ما تحتاج تسحب';
      if (s.boneyard.length === 0) return 'الكومة خلصت';
      p.hand.push(s.boneyard.pop());
      s.last = { kind: 'draw', seat: seat, n: ++s.events };
      return null;
    }
    if (type === 'pass') {
      if (hasMove(s, p.hand)) return 'ما تكدر تمرّر وعندك حركة';
      if (s.boneyard.length > 0) return 'اسحب من الكومة أول';
      s.passes += 1;
      s.last = { kind: 'pass', seat: seat, n: ++s.events };
      if (s.passes >= s.players.length) { endRound(s, null, true); return null; }
      s.turn = (s.turn + 1) % s.players.length;
      return null;
    }
    return 'ما فهمنا هالحركة';
  }

  /**
   * A round is over: the player who went out, or (blocked) the one holding
   * the fewest points, takes the sum of everyone else's hands. The match
   * ends once a score reaches the target.
   */
  function endRound(s, seat, blocked) {
    var winner = seat;
    if (blocked) {
      var min = Infinity;
      s.players.forEach(function (p, i) { var n = sum(p.hand); if (n < min) { min = n; winner = i; } });
    }
    var gained = 0;
    s.players.forEach(function (p, i) { if (i !== winner) gained += sum(p.hand); });
    s.players[winner].score += gained;
    s.result = {
      winner: winner, gained: gained, blocked: blocked,
      hands: s.players.map(function (p) { return p.hand.map(function (t) { return [t[0], t[1]]; }); }),
    };
    var champ = -1;
    s.players.forEach(function (p, i) { if (p.score >= s.target && (champ < 0 || p.score > s.players[champ].score)) champ = i; });
    s.phase = champ >= 0 ? 'match' : 'round';
    s.winner = champ >= 0 ? champ : null;
    s.last = { kind: 'end', seat: winner, n: ++s.events };
  }

  /** The computer's next step for the player in `seat`: draw while it must, then its heaviest tile, else pass. */
  function aiAction(s, seat) {
    var p = s.players[seat];
    if (!hasMove(s, p.hand)) return s.boneyard.length > 0 ? { type: 'draw' } : { type: 'pass' };
    var best = null;
    p.hand.forEach(function (t) {
      endsFor(s, t).forEach(function (side) {
        var v = t[0] + t[1];
        if (!best || v > best.v) best = { tile: t, side: side, v: v };
      });
    });
    return { type: 'play', tile: best.tile, side: best.side };
  }

  /** A whole turn played the computer's way (draws, then a tile or a pass): the clock's move for a quiet player. */
  function autoTurn(s, seat, rand) {
    for (var guard = 0; guard < 40; guard++) {
      if (s.phase !== 'play' || s.turn !== seat) return null;
      var step = aiAction(s, seat);
      var err = act(s, seat, step, rand);
      if (err) return err;
      if (step.type !== 'draw') return null;
    }
    return null;
  }

  /**
   * What one player sees: their own hand, everyone's count and score, the
   * table, and whether they may draw or pass. Nobody else's hand, except
   * every hand once a round is over (the result shows them).
   */
  function viewFor(s, seat) {
    var mine = seat >= 0 && seat < s.players.length ? s.players[seat] : null;
    var myTurn = !!mine && s.phase === 'play' && s.turn === seat;
    var movable = myTurn && hasMove(s, mine.hand);
    return {
      seat: mine ? seat : -1,
      players: s.players.map(function (p) { return { id: p.id, name: p.name, count: p.hand.length, score: p.score }; }),
      board: s.board.map(function (t) { return [t[0], t[1]]; }),
      left: s.left, right: s.right,
      boneyard: s.boneyard.length,
      turn: s.turn,
      hand: mine ? mine.hand.map(function (t) { return [t[0], t[1]]; }) : [],
      canDraw: myTurn && !movable && s.boneyard.length > 0,
      canPass: myTurn && !movable && s.boneyard.length === 0,
      phase: s.phase, round: s.round, target: s.target,
      result: s.result, winner: s.winner, last: s.last,
    };
  }

  var api = {
    HAND: HAND, TARGETS: TARGETS,
    makeSet: makeSet, newMatch: newMatch, deal: deal, starterOf: starterOf,
    canPlay: canPlay, hasMove: hasMove, endsFor: endsFor, place: place,
    act: act, aiAction: aiAction, autoTurn: autoTurn, viewFor: viewFor, sum: sum,
  };
  root.Domino = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
