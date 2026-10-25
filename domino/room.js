/* الدومينو in a گعدة room: 2–4 players, each on their own phone.

   The room — its code, who is in it, the start, the results — is گعدة's,
   reached through `window.gathering` (docs/GAME_BRIDGE.md). The game runs
   on the host's phone (`Table`): it deals, checks every move with the rules
   (rules.js) and sends every phone its own view with `room.send(view,
   {to})`, so a hand never reaches a phone it is not for (and nothing goes
   in the room's state blob, which every phone receives: the manifest says
   `state: none`). The other phones send it `{k: 'sync'}` to ask for their
   view and `{k: 'act', action}` for a move.

   The clock keeps a round moving: a turn has TURN_MS, a phone that has
   dropped out AWAY_MS, then the turn is played the computer's way. The
   next round deals itself after ROUND_MS; once the match is decided the
   host ends the round (`room.end({scores})`), by hand or after MATCH_MS.

   Opened in a plain browser with `?dev&name=…` in several tabs, a stand-in
   bridge plays one room across them (one BroadcastChannel). */
(function (root) {
  'use strict';

  var Domino = root.Domino || (typeof require === 'function' ? require('./rules.js') : null);

  var TURN_MS = 45000;
  var AWAY_MS = 12000;
  var ROUND_MS = 10000;
  var MATCH_MS = 30000;
  var MIN = 2;
  var MAX = 4;

  // ───────────────────────────── the host's outbox ─────────────────────────────
  //
  // The relay lets a phone send 30 frames a second and drops the rest
  // without a word. One pending message per key (a view replaces the one
  // before it: the last is all that counts), 20 a second, the longest
  // waiting first.

  function Mailer(deliver, now) {
    this.deliver = deliver;
    this.now = now || Date.now;
    this.tokens = 20;
    this.at = this.now();
    this.pending = new Map();
    this.timer = null;
  }
  Mailer.prototype.post = function (key, to, data) {
    this.pending.delete(key);
    this.pending.set(key, { to: to, data: data });
    this.flush();
  };
  Mailer.prototype.flush = function () {
    var self = this;
    var now = this.now();
    this.tokens = Math.min(20, this.tokens + ((now - this.at) / 1000) * 20);
    this.at = now;
    this.pending.forEach(function (post, key) {
      if (self.tokens < 1) return;
      self.tokens -= 1;
      self.pending.delete(key);
      self.deliver(post);
    });
    if (this.pending.size > 0 && !this.timer) {
      this.timer = setTimeout(function () { self.timer = null; self.flush(); }, 50);
    }
  };
  Mailer.prototype.dispose = function () {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.pending.clear();
  };

  // ───────────────────────────── the host's table ─────────────────────────────

  /** Nicknames are shown raw on other phones: control characters out, cut to fit. */
  function cleanName(raw) {
    // eslint-disable-next-line no-control-regex
    var name = String(raw || '').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
    return Array.from(name).slice(0, 16).join('') || '؟';
  }

  /**
   * The game, on the host's phone. `o`: code, hostId, members, deliver(post),
   * local(view) (the host's own view), refused(text) (the host's own move
   * refused), save(snapshot), restore, finish() (the match is decided and
   * its time is up), now(), rand().
   */
  function Table(o) {
    var self = this;
    this.o = o;
    this.now = o.now || Date.now;
    this.rand = o.rand || Math.random;
    this.stage = 'lobby';
    this.state = null;
    this.until = 0;
    this.members = o.members || [];
    this.names = {};
    this.ready = new Set([o.hostId]);
    this.sent = new Map();
    this.timer = null;
    this.mailer = new Mailer(o.deliver, this.now);
    if (o.restore) {
      this.stage = o.restore.stage;
      this.state = o.restore.state;
      this.until = o.restore.until || 0;
      this.names = Object.assign({}, o.restore.names);
    }
    this.members.forEach(function (m) { self.names[m.id] = cleanName(m.nickname); });
  }

  Table.prototype.open = function () {
    this.mailer.post('hello', null, { k: 'hello' });
    this.update();
  };

  Table.prototype.dispose = function () {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.mailer.dispose();
  };

  Table.prototype.setMembers = function (members) {
    var self = this;
    this.members = members;
    members.forEach(function (m) { self.names[m.id] = cleanName(m.nickname); });
    this.update();
  };

  /** A message from a phone; the host's own moves come through here too. */
  Table.prototype.receive = function (from, wire) {
    if (!wire || typeof wire.k !== 'string') return;
    if (wire.k === 'sync') {
      this.ready.add(from);
      this.sent.delete(from);
      this.update();
    } else if (wire.k === 'start') {
      this.start(from, wire.options);
    } else if (wire.k === 'act') {
      this.ready.add(from);
      this.act(from, wire.action);
    }
  };

  /** Seated: in the room as a player, online, with the game's page open. The host always. */
  Table.prototype.present = function () {
    var self = this;
    return this.members
      .filter(function (m) { return m.role !== 'spectator' && (m.connected || m.id === self.o.hostId) && self.ready.has(m.id); })
      .sort(function (a, b) { return (a.seat || 0) - (b.seat || 0); });
  };

  Table.prototype.start = function (from, options) {
    if (from !== this.o.hostId) { this.refuse(from, 'بس صاحب الغرفة يبدأ'); return; }
    if (this.stage !== 'lobby') return;
    var target = options && Domino.TARGETS.indexOf(options.target) >= 0 ? options.target : 100;
    var seated = this.present().slice(0, MAX);
    if (seated.length < MIN) { this.refuse(from, 'ننتظر لاعب ثاني يفتح اللعبة'); return; }
    var self = this;
    this.state = Domino.newMatch(seated.map(function (m) { return { id: m.id, name: self.names[m.id] || '؟' }; }), target, this.rand);
    this.stage = 'playing';
    this.clock();
    this.mailer.post('notice', null, { k: 'notice', text: 'بدت المباراة، بالتوفيق!' });
    this.update();
  };

  Table.prototype.seatOf = function (id) {
    if (!this.state) return -1;
    for (var i = 0; i < this.state.players.length; i++) if (this.state.players[i].id === id) return i;
    return -1;
  };

  Table.prototype.act = function (from, action) {
    if (this.stage !== 'playing' || !this.state) return;
    var seat = this.seatOf(from);
    // The next round may be dealt by anyone at the table.
    if (seat < 0 && !(action && action.type === 'next')) { this.refuse(from, 'إنت تتفرّج على هالجولة'); return; }
    var next = JSON.parse(JSON.stringify(this.state));
    var err = Domino.act(next, seat, action, this.rand);
    if (err) { this.refuse(from, err); return; }
    this.state = next;
    this.clock();
    this.update();
  };

  /** A new deadline for whatever the game now waits on. */
  Table.prototype.clock = function () {
    var s = this.state;
    var now = this.now();
    this.until = s.phase === 'play' ? now + TURN_MS : s.phase === 'round' ? now + ROUND_MS : now + MATCH_MS;
  };

  Table.prototype.refuse = function (to, text) {
    if (to === this.o.hostId) { if (this.o.refused) this.o.refused(text); return; }
    this.mailer.post('error:' + to, to, { k: 'error', message: text });
  };

  Table.prototype.connected = function () {
    var self = this;
    return new Set(this.members
      .filter(function (m) { return (m.connected || m.id === self.o.hostId) && self.ready.has(m.id); })
      .map(function (m) { return m.id; }));
  };

  /** After any change: an absent player's clock cut short, the timer re-armed, saved, everyone told. */
  Table.prototype.update = function () {
    if (this.stage === 'playing' && this.state && this.state.phase === 'play') {
      var who = this.state.players[this.state.turn];
      if (who && !this.connected().has(who.id)) this.until = Math.min(this.until, this.now() + AWAY_MS);
    }
    this.schedule();
    if (this.o.save) this.o.save({ stage: this.stage, state: this.state, until: this.until, names: this.names });
    this.broadcast();
  };

  Table.prototype.schedule = function () {
    var self = this;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (this.stage !== 'playing' || !this.state) return;
    this.timer = setTimeout(function () { self.timer = null; self.wake(); }, Math.max(0, this.until - this.now()));
  };

  /** The deadline came: the quiet player's turn played the computer's way, the next round dealt, or the match closed. */
  Table.prototype.wake = function () {
    if (this.stage !== 'playing' || !this.state) return;
    if (this.now() < this.until) { this.schedule(); return; }
    var s = this.state;
    if (s.phase === 'match') { if (this.o.finish) this.o.finish(); return; }
    var next = JSON.parse(JSON.stringify(s));
    if (s.phase === 'play') Domino.autoTurn(next, s.turn, this.rand);
    else Domino.act(next, -1, { type: 'next' }, this.rand);
    this.state = next;
    this.clock();
    this.update();
  };

  /** Each phone's view of the room, and the turn alert's words when the board waits on it. */
  Table.prototype.viewFor = function (id, connected) {
    var self = this;
    var seated = new Set(this.members.map(function (m) { return m.id; }));
    var players = this.members.slice().sort(function (a, b) { return (a.seat || 0) - (b.seat || 0); })
      .filter(function (m) { return m.role !== 'spectator'; })
      .map(function (m) { return { id: m.id, name: self.names[m.id] || cleanName(m.nickname), connected: connected.has(m.id) }; });
    // A player dealt in who has left keeps their place on the board.
    if (this.state) {
      this.state.players.forEach(function (p) {
        if (!seated.has(p.id)) players.push({ id: p.id, name: p.name, connected: false });
      });
    }
    var game = this.stage === 'playing' && this.state ? Domino.viewFor(this.state, this.seatOf(id)) : null;
    if (game) {
      game.connected = this.state.players.map(function (p) { return connected.has(p.id); });
    }
    var yourTurn = game && game.phase === 'play' && game.seat === game.turn ? 'دورك' : null;
    return {
      code: this.o.code, you: id, hostId: this.o.hostId, players: players,
      stage: this.stage, view: game, until: this.until, yourTurn: yourTurn, now: this.now(),
    };
  };

  Table.prototype.broadcast = function () {
    var self = this;
    var connected = this.connected();
    connected.forEach(function (id) {
      var view = self.viewFor(id, connected);
      if (id === self.o.hostId) { self.o.local(view); return; }
      // `now` moves on every call; whether anything else did decides the send.
      var key = JSON.stringify(Object.assign({}, view, { now: 0 }));
      if (self.sent.get(id) === key) return;
      self.sent.set(id, key);
      self.mailer.post('view:' + id, id, { k: 'view', room: view });
    });
  };

  /** The round's results for گعدة: every player dealt in, their match points. Null before the start. */
  Table.prototype.scores = function () {
    if (this.stage !== 'playing' || !this.state) return null;
    return this.state.players.map(function (p) { return { player: p.id, score: p.score }; });
  };

  // ───────────────────────────── the bridge ─────────────────────────────

  var ready = null;

  /** `window.gathering` once the app has injected it; the ?dev stand-in in a plain browser; else null. */
  function bridge() {
    if (ready) return ready;
    ready = new Promise(function (resolve) {
      var installed = function () { return window.gathering && window.gathering.__installed ? window.gathering : null; };
      if (installed()) { resolve(installed()); return; }
      if (!window.GatheringBridge) {
        resolve(new URLSearchParams(location.search).has('dev') ? devBridge() : null);
        return;
      }
      var done = false;
      var finish = function () {
        if (done) return;
        done = true;
        window.removeEventListener('gatheringready', finish);
        resolve(installed());
      };
      window.addEventListener('gatheringready', finish);
      setTimeout(finish, 10000);
    });
    return ready;
  }

  function codeOf(e) {
    if (typeof e === 'string') return e;
    if (e && typeof e.code === 'string') return e.code;
    if (e && typeof e.message === 'string') return e.message;
    return String(e);
  }

  /** A stand-in room across this browser's tabs (`?dev&name=…`), with the relay's rules: a message to the room comes back to its sender, one with `to` reaches that tab alone. The first tab is the host. */
  function devBridge() {
    var channel = new BroadcastChannel('domino-dev:' + location.pathname);
    function sessionValue(key, make) {
      try { var v = sessionStorage.getItem(key); if (v) return v; v = make(); sessionStorage.setItem(key, v); return v; } catch (e) { return make(); }
    }
    var id = sessionValue('domino.dev.id', function () { return 'dev_' + Math.random().toString(36).slice(2, 8); });
    var joinedAt = Number(sessionValue('domino.dev.joined', function () { return String(Date.now()); }));
    var name = new URLSearchParams(location.search).get('name') || 'لاعب ' + id.slice(-3);
    var peers = new Map();
    var handlers = {};
    var lastMembers = '';
    var lastHost = '';
    function emit(event, detail) { (handlers[event] || []).forEach(function (fn) { fn(detail); }); }
    function me() { return { id: id, name: name, joinedAt: joinedAt, at: Date.now() }; }
    function members() {
      var now = Date.now();
      var all = [me()].concat(Array.from(peers.values()))
        .filter(function (p) { return p.id === id || now - p.at < 3000; })
        .sort(function (a, b) { return a.joinedAt - b.joinedAt || a.id.localeCompare(b.id); });
      var host = all[0] && all[0].id;
      return all.map(function (p, seat) { return { id: p.id, nickname: p.name, role: p.id === host ? 'host' : 'player', seat: seat, connected: true }; });
    }
    function refresh() {
      var list = members();
      var key = JSON.stringify(list);
      if (key !== lastMembers) { lastMembers = key; emit('members', list); }
      var host = (list.filter(function (m) { return m.role === 'host'; })[0] || {}).id || '';
      if (lastHost && host !== lastHost) emit('host', { player: host, by: null });
      lastHost = host;
    }
    channel.onmessage = function (e) {
      var p = e.data;
      if (p.t === 'presence') {
        var known = peers.has(p.p.id);
        peers.set(p.p.id, p.p);
        if (!known) channel.postMessage({ t: 'presence', p: me() });
        refresh();
      } else if (p.t === 'msg') {
        if (!p.to || p.to === id) emit('message', { from: p.from, data: p.data, to: p.to });
      } else if (p.t === 'ended') {
        emit('ended', { reason: 'host', round: 1, results: p.results });
      }
    };
    channel.postMessage({ t: 'presence', p: me() });
    setInterval(function () { channel.postMessage({ t: 'presence', p: me() }); refresh(); }, 1000);
    return {
      __dev: true,
      room: {
        current: function () {
          return new Promise(function (resolve) {
            setTimeout(function () {
              var seat = members().findIndex(function (m) { return m.id === id; });
              resolve({ id: 'room_dev', code: 'DEV123', status: 'playing', round: 1, you: { role: seat === 0 ? 'host' : 'player', seat: seat } });
            }, 400);
          });
        },
        members: function () { return Promise.resolve(members()); },
        create: function () { return Promise.reject('in_room'); },
        join: function () { return Promise.reject('in_room'); },
        send: function (data, opts) {
          channel.postMessage({ t: 'msg', from: id, data: data, to: opts && opts.to });
          if (!(opts && opts.to)) emit('message', { from: id, data: data });
        },
        end: function (opts) {
          var scores = (opts && opts.scores) || [];
          var results = scores.map(function (s) {
            return Object.assign({}, s, { rank: 1 + scores.filter(function (o) { return o.score > s.score; }).length });
          });
          channel.postMessage({ t: 'ended', results: results });
          emit('ended', { reason: 'host', round: 1, results: results });
          return Promise.resolve();
        },
        on: function (event, fn) { (handlers[event] = handlers[event] || []).push(fn); },
      },
      player: { me: function () { return Promise.resolve({ id: id, nickname: name }); } },
      haptic: function () {},
      hideSplash: function () {},
      close: function () { location.reload(); },
      openExternalUrl: function (url) { return Promise.resolve(window.open(url, '_blank', 'noopener') !== null); },
    };
  }

  // ───────────────────────────── this phone in the round ─────────────────────────────
  //
  // The host's phone runs the Table; every other phone asks it for its
  // view and sends it moves. The page reads one snapshot either way
  // (`connect(onChange)`).

  function connect(onChange) {
    var snap = { phase: 'booting', status: 'connecting', room: null, results: null, me: null, inApp: false, tournaments: false, match: null, clockOffset: 0, turn: null };
    var g = null, me = '', hostId = '', roomKey = '', table = null, syncTimer = 0, finishing = false;

    function set(patch) { snap = Object.assign({}, snap, patch); onChange(snap); }

    function show(room, offset) {
      clearInterval(syncTimer);
      var turn = room.yourTurn;
      if (turn && turn !== (snap.room && snap.room.yourTurn)) set({ turn: { text: turn, id: ((snap.turn && snap.turn.id) || 0) + 1 } });
      else if (!turn && snap.turn) set({ turn: null });
      set({ room: room, clockOffset: offset, phase: snap.phase === 'ended' ? 'ended' : 'live' });
    }

    function post(data, to) { if (g) g.room.send(data, to ? { to: to } : undefined); }

    function askForView() {
      clearInterval(syncTimer);
      post({ k: 'sync' }, hostId);
      syncTimer = setInterval(function () { post({ k: 'sync' }, hostId); }, 2000);
    }

    function load() { try { var raw = localStorage.getItem(roomKey); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
    function save(s) { try { if (s) localStorage.setItem(roomKey, JSON.stringify(s)); else localStorage.removeItem(roomKey); } catch (e) { /* no storage */ } }

    function host(code, members, restore) {
      if (table) table.dispose();
      table = new Table({
        code: code, hostId: me, members: members,
        deliver: function (p) {
          g.room.send(p.data, p.to ? { to: p.to } : undefined);
          if (p.data && p.data.k === 'notice') set({ notice: { text: p.data.text, id: Date.now() } });
        },
        local: function (view) { show(view, 0); },
        refused: function (text) { set({ error: { text: text, id: Date.now() } }); },
        save: save,
        restore: restore,
        finish: function () { api.finish(); },
      });
      table.open();
    }

    function onMessage(from, data, to) {
      if (!data || typeof data.k !== 'string' || (from === me && !to)) return;
      if (table) { table.receive(from, data); return; }
      if (from !== hostId) return;
      if (data.k === 'hello') { if (!snap.room) askForView(); else post({ k: 'sync' }, hostId); }
      else if (data.k === 'view') show(data.room, data.room.now - Date.now());
      else if (data.k === 'error') set({ error: { text: data.message, id: Date.now() } });
      else if (data.k === 'notice') set({ notice: { text: data.text, id: Date.now() } });
    }

    function readMatch() {
      g.room.current().then(function (info) { if (info && info.tournament) set({ match: info.tournament }); }, function () {});
    }

    async function join() {
      g = await bridge();
      var info = g ? await g.room.current().catch(function () { return null; }) : null;
      if (!g || !info || info.status !== 'playing') {
        var self = g ? await g.player.me().catch(function () { return null; }) : null;
        set({ phase: 'no-room', status: 'idle', me: self, inApp: !!g && !g.__dev, tournaments: !!(g && g.tournament) });
        if (g && g.hideSplash) g.hideSplash();
        return;
      }
      var members = await g.room.members();
      var self2 = await g.player.me().catch(function () { return null; });
      me = (self2 && self2.id) || (members.filter(function (m) { return m.seat === info.you.seat; })[0] || {}).id || '';
      hostId = (members.filter(function (m) { return m.role === 'host'; })[0] || {}).id || '';
      roomKey = 'arcade.domino.table.' + info.id + '.' + info.round;
      set({ phase: 'waiting', status: 'open', me: self2, inApp: true, match: info.tournament || null });
      if (g.hideSplash) g.hideSplash();

      g.room.on('message', function (d) { onMessage(d.from, d.data, d.to); });
      g.room.on('members', function (list) {
        var arr = Array.isArray(list) ? list : (list && list.list) || [];
        if (table) table.setMembers(arr);
      });
      g.room.on('host', function (d) {
        hostId = d.player;
        if (d.player !== me || table) return;
        // The host left with the game on their phone. A game not begun moves
        // here; one under way cannot, so the round ends.
        if (snap.room && snap.room.stage === 'playing') {
          set({ notice: { text: 'صاحب الغرفة طلع، وانتهت الجولة', id: Date.now() } });
          g.room.end({ scores: [] }).catch(function () {});
          return;
        }
        g.room.members().then(function (list) { host(info.code, list, null); });
      });
      g.room.on('ended', function (d) {
        clearInterval(syncTimer);
        if (table) table.dispose();
        table = null;
        save(null);
        set({ phase: 'ended', results: d.results, turn: null });
        if (snap.match) setTimeout(readMatch, 1500);
      });
      g.room.on('connection', function (d) {
        set({ status: d.state === 'open' ? 'open' : d.state === 'closed' ? 'idle' : 'reconnecting' });
        if (d.state === 'open' && !table && snap.phase !== 'ended') post({ k: 'sync' }, hostId);
      });

      if (hostId === me) host(info.code, members, load());
      else askForView();
    }

    var api = {
      start: function (options) { if (table) table.receive(me, { k: 'start', options: options }); },
      act: function (action) {
        if (table) table.receive(me, { k: 'act', action: action });
        else post({ k: 'act', action: action }, hostId);
      },
      /** The host ends the round: گعدة ranks the scores and shows them in the room. */
      finish: function () {
        if (!g || !table || finishing) return Promise.resolve();
        finishing = true;
        return g.room.end({ scores: table.scores() || [] }).catch(function () {
          finishing = false;
          set({ error: { text: 'ما گدرنا ننهي الجولة، جرّب مرة ثانية', id: Date.now() } });
        });
      },
      enter: function (kind, visibility) {
        if (!g) return Promise.reject(new Error('not_supported'));
        g.haptic('light');
        var asked = kind === 'create' ? g.room.create({ visibility: visibility || 'private' }) : g.room.join();
        return asked.then(function (r) { return r && r.code; }, function (e) { throw new Error(codeOf(e)); });
      },
      enterTournament: function (kind) {
        var t = g && g.tournament;
        if (!t) return Promise.reject(new Error('not_supported'));
        g.haptic('light');
        var asked = kind === 'create' ? t.create() : t.join();
        return asked.then(function (r) { return r && r.code; }, function (e) { throw new Error(codeOf(e)); });
      },
      openTournament: function () { if (g && g.tournament) g.tournament.open().catch(function () {}); },
      openUrl: function (url) { if (g && !g.__dev) { g.openExternalUrl(url).catch(function () {}); return true; } return false; },
      haptic: function (kind) { try { if (g) g.haptic(kind || 'light'); else if (navigator.vibrate) navigator.vibrate(15); } catch (e) { /* none */ } },
      dismissTurn: function () { set({ turn: null }); },
      close: function () { if (g) g.close(); },
      isHost: function () { return !!table; },
    };

    join();
    return api;
  }

  var api = { Table: Table, Mailer: Mailer, connect: connect, bridge: bridge, codeOf: codeOf, cleanName: cleanName,
    TURN_MS: TURN_MS, AWAY_MS: AWAY_MS, ROUND_MS: ROUND_MS, MATCH_MS: MATCH_MS, MIN: MIN, MAX: MAX };
  root.Room = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
