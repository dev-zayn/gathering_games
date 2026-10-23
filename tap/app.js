/* سباق النقر — a sample real-time game for گعدة (fixture.tap), served
   beside its manifest. It runs inside the app's game frame over
   `window.gathering` (docs/GAME_BRIDGE.md) and the five frame messages;
   opened from disk in a desktop browser, a stand-in bridge below keeps it
   working.

   Two to eight players, ten seconds, as many taps as a thumb can manage.
   In a room there is no state blob: the host starts the room, every phone
   counts down from the `started` event, every tap is a
   `room.send({type: 'tap'})`, every phone counts what it hears, and the
   host closes the race with `room.end({scores})`. Opened outside a room
   (`room.current()` answers null) the race is run alone, with the best
   score kept in `storage` (`tap.best`), and the first screen offers a room
   with a friend: "العب ويا صديق" makes one (`room.create()`), "انضم لغرفة"
   joins one through the app's Join sheet (`room.join()`); the room's lobby
   then takes this page's place. "سوّي بطولة" and "انضم لبطولة" do the same
   for a tournament of the race (`tournament.create()`,
   `tournament.join()`), and in a match room a banner over the race shows
   the match (`room.current().tournament`). */
(function () {
  'use strict';

  var GAME = 'tap';
  var noop = function () {};
  var $ = function (id) { return document.getElementById(id); };

  // ───────────────────────────── the bridge ─────────────────────────────

  // The app injects `window.gathering` when the document starts and again
  // when it finishes, usually after this script has begun. Its channel
  // (`window.GatheringBridge`) is there from the first script: a page that
  // sees the channel but no `window.gathering` is in the app, and waits.
  function bridgeReady() {
    if (window.gathering && window.gathering.__installed) return Promise.resolve(window.gathering);
    if (!window.GatheringBridge) return Promise.resolve(null);
    return new Promise(function (resolve) {
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        window.removeEventListener('gatheringready', finish);
        resolve(window.gathering && window.gathering.__installed ? window.gathering : null);
      }
      window.addEventListener('gatheringready', finish);
      // Ten seconds covers a slow load without leaving the page hanging on
      // a broken host.
      setTimeout(finish, 10000);
    });
  }

  /** The frame contract: in the app the page is the top document, so
   *  `window.parent` is the window itself and the shim hears it. */
  function post(type, payload) {
    var msg = Object.assign({ type: type }, payload || {});
    try { window.parent.postMessage(msg, '*'); } catch (e) { /* no frame */ }
  }

  var g = null; // window.gathering, or the stand-in
  var inHost = false;

  /** A stand-in for window.gathering, so the page works opened from disk.
   *  It answers as the app does with nobody else around: nobody is in a
   *  room, no other player is known (friends.status and friends.add reject
   *  not_found), the sample asks no friends:read (friends.list rejects
   *  scope_required), the player is "you", and storage is this browser's.
   *  No room can be made or joined outside the app (room.create and
   *  room.join reject not_supported). */
  function browserStub() {
    var toastEl = $('toast');
    var toastTimer = 0;
    function toast(title, subtitle) {
      if (!title && !subtitle) return;
      toastEl.textContent = '';
      if (title) { var b = document.createElement('b'); b.textContent = title; toastEl.appendChild(b); }
      if (subtitle) { var s = document.createElement('span'); s.textContent = subtitle; toastEl.appendChild(s); }
      toastEl.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2600);
    }
    function refuse(code) { return function () { return Promise.reject(code); }; }
    var prefix = 'gathering.' + GAME + '.';
    var listeners = {};
    var muted = false;
    var audio = null;
    var TONES = { tap: [660, 0.05], tick: [880, 0.04], join: [523, 0.14], leave: [392, 0.14], win: [784, 0.3], lose: [220, 0.35], countdown: [440, 0.16] };
    function beep(id) {
      var tone = TONES[id];
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!tone || !AC) return;
      try {
        audio = audio || new AC();
        var osc = audio.createOscillator();
        var gain = audio.createGain();
        var now = audio.currentTime;
        osc.type = 'triangle';
        osc.frequency.value = tone[0];
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + tone[1]);
        osc.connect(gain);
        gain.connect(audio.destination);
        osc.start(now);
        osc.stop(now + tone[1]);
      } catch (e) { /* no sound here */ }
    }
    return {
      __stub: true,
      send: function (action) { toast('send', action); },
      call: function (action, payload) {
        if (action === 'setOrientation') {
          var o = payload && payload.orientation;
          return ['portrait', 'landscape', 'auto'].indexOf(o) >= 0 ? Promise.resolve(null) : Promise.reject('invalid_orientation');
        }
        return Promise.reject('unknown_action');
      },
      showDialog: function (o) {
        o = o || {};
        var text = [o.title, o.body].filter(Boolean).join('\n\n');
        if (o.cancelText) return Promise.resolve(window.confirm(text));
        window.alert(text);
        return Promise.resolve(true);
      },
      prompt: function (o) {
        o = o || {};
        return Promise.resolve(window.prompt([o.title, o.message].filter(Boolean).join('\n'), o.initialValue || ''));
      },
      showToast: function (o) { o = o || {}; toast(o.title, o.subtitle); },
      showActionSheet: function (o) {
        o = o || {};
        var options = o.options || [];
        var lines = options.map(function (x, i) { return (i + 1) + ') ' + (typeof x === 'string' ? x : x.label); });
        var answer = window.prompt([o.title, o.message].concat(lines).filter(Boolean).join('\n'), '1');
        var i = parseInt(answer, 10) - 1;
        if (isNaN(i) || i < 0 || i >= options.length) return Promise.resolve(null);
        var picked = options[i];
        return Promise.resolve({ index: i, value: typeof picked === 'string' ? picked : picked.value });
      },
      showLoading: function (o) { toast((o && o.message) || 'لحظة…'); },
      hideLoading: noop,
      setAppBar: noop, showAppBar: noop, hideAppBar: noop,
      setAppBarColor: noop, setStatusBarColor: noop,
      setZoom: noop, setTextSelection: noop,
      showSplash: noop, hideSplash: noop, setOrientation: noop,
      celebrate: function (o) { return celebrateHere(o); },
      haptic: function (type) {
        try { if (navigator.vibrate) navigator.vibrate(type === 'heavy' ? 30 : type === 'medium' ? 20 : 10); } catch (e) { /* no motor */ }
      },
      copyToClipboard: function (text) {
        try { navigator.clipboard.writeText(String(text)).catch(noop); } catch (e) { /* no clipboard */ }
      },
      getFromClipboard: function () {
        try { return navigator.clipboard.readText().catch(function () { return null; }); } catch (e) { return Promise.resolve(null); }
      },
      openExternalUrl: function (url) {
        var w = window.open(url, '_blank');
        if (w) w.opener = null;
        return Promise.resolve(!!w);
      },
      playSound: function (id) { if (!muted) beep(id); },
      setMuted: function (m) { muted = m !== false; },
      getDeviceInfo: function () {
        var lang = navigator.language || 'ar';
        return Promise.resolve({
          platform: 'other',
          osVersion: navigator.userAgent,
          locale: lang,
          languageCode: lang.slice(0, 2),
          isDarkMode: !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches),
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight,
        });
      },
      getAppInfo: function () {
        return Promise.resolve({ name: 'المتصفح', version: '-', build: '-', isDebug: true, language: (navigator.language || 'ar').slice(0, 2) });
      },
      getAuthCode: function () { return Promise.resolve(null); },
      player: {
        me: function () { return Promise.resolve({ id: 'local', nickname: 'أنت', handle: 'you', avatar: null, avatarUrl: null }); },
      },
      storage: {
        get: function (k) {
          try { var v = localStorage.getItem(prefix + k); return Promise.resolve(v == null ? null : JSON.parse(v)); } catch (e) { return Promise.resolve(null); }
        },
        set: function (k, v) {
          try { localStorage.setItem(prefix + k, JSON.stringify(v === undefined ? null : v)); } catch (e) { /* private mode */ }
          return Promise.resolve(null);
        },
        remove: function (k) {
          try { localStorage.removeItem(prefix + k); } catch (e) { /* private mode */ }
          return Promise.resolve(null);
        },
      },
      permissions: {
        request: function () { return Promise.resolve('denied'); },
        status: function () { return Promise.resolve('prompt'); },
        openSettings: function () { return Promise.resolve(false); },
      },
      room: {
        current: function () { return Promise.resolve(null); },
        members: function () { return Promise.resolve([]); },
        send: noop,
        getState: refuse('not_in_room'),
        setState: refuse('not_in_room'),
        start: refuse('not_in_room'),
        end: refuse('not_in_room'),
        leave: refuse('not_in_room'),
        kick: refuse('not_in_room'),
        invite: refuse('not_in_room'),
        ticket: refuse('not_in_room'),
        create: refuse('not_supported'),
        join: refuse('not_supported'),
        on: function (event, fn) { (listeners[event] = listeners[event] || []).push(fn); },
        off: function (event, fn) {
          listeners[event] = (listeners[event] || []).filter(function (f) { return fn && f !== fn; });
        },
      },
      tournament: {
        current: function () { return Promise.resolve(null); },
        open: refuse('not_in_tournament'),
        list: function () { return Promise.resolve([]); },
        create: refuse('not_supported'),
        join: refuse('not_supported'),
      },
      friends: {
        add: refuse('not_found'),
        status: refuse('not_found'),
        list: refuse('scope_required'),
        invite: refuse('not_in_room'),
      },
      close: function () { toast('خارج التطبيق', 'ماكو إطار يتسكّر.'); },
      minimize: function () { toast('خارج التطبيق', 'التصغير يشتغل بس داخل گعدة.'); },
      goBack: function () { history.back(); },
      reload: function () { location.reload(); },
      reloadHome: function () { location.replace(location.pathname); },
      log: function () { console.log.apply(console, ['[' + GAME + ']'].concat([].slice.call(arguments))); },
    };
  }

  /** The stand-in's celebration. In the app the host draws its own card;
   *  here a card over the page, with a little confetti, gone on its key. */
  function celebrateHere(o) {
    o = o || {};
    var titles = { win: 'فزت!', lose: 'حظ أوفر المرة الجاية', draw: 'تعادل', rank: 'طلعت النتائج' };
    return new Promise(function (resolve) {
      var layer = document.createElement('div');
      layer.className = 'celebrate';
      layer.setAttribute('role', 'dialog');
      layer.setAttribute('aria-modal', 'true');
      var bits = document.createElement('div');
      bits.className = 'bits';
      if (o.kind !== 'lose') {
        var colours = ['var(--accent)', 'var(--secondary)', 'var(--success)'];
        for (var i = 0; i < 28; i++) {
          var bit = document.createElement('i');
          bit.className = 'bit';
          bit.style.left = Math.round(Math.random() * 100) + '%';
          bit.style.background = colours[i % colours.length];
          bit.style.animationDelay = (Math.random() * 0.5).toFixed(2) + 's';
          bits.appendChild(bit);
        }
      }
      var card = document.createElement('div');
      card.className = 'card';
      var h = document.createElement('h2');
      h.textContent = o.title || titles[o.kind] || titles.rank;
      card.appendChild(h);
      if (o.message) {
        var p = document.createElement('p');
        p.textContent = o.message;
        card.appendChild(p);
      }
      var done = document.createElement('button');
      done.type = 'button';
      done.className = 'key primary';
      done.textContent = 'حلو';
      done.addEventListener('click', function () { layer.remove(); resolve(null); });
      card.appendChild(done);
      layer.appendChild(bits);
      layer.appendChild(card);
      document.body.appendChild(layer);
      done.focus();
    });
  }


  // ───────────────────────────── the game ─────────────────────────────

  var RACE_MS = 10000;
  var COUNT_MS = 3000;
  var COOL_MS = 1200;
  var RANKS = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن'];

  // idle → countdown → race → done (a beat, so the last taps do not start
  // the next race) → idle.
  var phase = 'idle';
  var count = 0;
  var best = 0;
  var raced = false;
  var endsAt = 0;
  var frame = 0;

  // The room, when the game was opened into one; `room.current()` answers
  // null outside a room, and `inRoom` stays false.
  var inRoom = false;
  var isHost = false;
  var me = null;
  var members = [];
  var counts = {};

  function setKey(text, look) {
    var k = $('tap');
    k.textContent = text;
    k.className = 'tap' + (look ? ' ' + look : '');
  }

  function tell(text) { $('status').textContent = text; }

  function renderKey() {
    if (phase === 'race') setKey('انقر!');
    else if (phase === 'idle') setKey(raced ? 'مرة ثانية' : 'ابدأ');
  }

  function renderCount(bump) {
    $('count').textContent = String(count);
    if (!bump) return;
    var box = $('count').parentNode;
    box.classList.remove('bump');
    void box.offsetWidth; // restart the animation
    box.classList.add('bump');
  }

  function renderTime(left) {
    $('time').textContent = (left / 1000).toFixed(1);
    $('meter-fill').style.transform = 'scaleX(' + (left / RACE_MS).toFixed(4) + ')';
  }

  function renderBest(bump) {
    $('best').textContent = best ? String(best) : '—';
    if (!bump) return;
    var box = $('best').parentNode;
    box.classList.remove('bump');
    void box.offsetWidth;
    box.classList.add('bump');
  }

  function render() {
    renderKey();
    renderCount();
    renderTime(phase === 'race' ? Math.max(0, endsAt - Date.now()) : RACE_MS);
    renderBest();
    $('mode').textContent = inRoom ? (match ? 'مباراة' : 'غرفة') : 'لحالك';
    $('mode').classList.toggle('room', inRoom);
    $('leaders').hidden = !inRoom;
    $('together').hidden = inRoom;
    renderMatch();
    $('hint').textContent = inRoom
      ? 'كل تلفون يحسب نقرات الكل؛ المضيف يسكّر السباق بالنتائج.'
      : 'لحالك: تسابق رقمك القياسي. وحتى تسابق أصدقاءك، سوّي غرفة أو انضم لغرفتهم، أو سوّوا بطولة.';
    if (inRoom) renderLeaders();
  }

  /** The key, pressed. Counted on the way down, so a fast thumb is not
   *  held back by the click that follows the lift. */
  function onTap() {
    if (phase === 'race') {
      count += 1;
      g.playSound('tap');
      if (inRoom) g.room.send({ type: 'tap' });
      renderCount(true);
      if (inRoom) renderLeaders();
      return;
    }
    if (phase === 'idle') start();
  }

  function start() {
    if (inRoom) { roomStart(); return; }
    countdown(race);
  }

  /** 3, 2, 1: a sound and a knock each second, then the race. */
  function countdown(then) {
    phase = 'countdown';
    count = 0;
    renderCount();
    renderTime(RACE_MS);
    tell('استعد…');
    var n = 3;
    (function step() {
      if (phase !== 'countdown') return;
      if (n === 0) { then(); return; }
      setKey(String(n), 'rest digit');
      g.playSound('countdown');
      g.haptic('medium');
      n -= 1;
      setTimeout(step, 1000);
    })();
  }

  /** The race, to `until` (a time on the clock) or ten seconds from now. */
  function race(until) {
    phase = 'race';
    raced = true;
    count = 0;
    endsAt = typeof until === 'number' ? until : Date.now() + RACE_MS;
    renderKey();
    renderCount();
    tell('انقر! انقر! انقر!');
    // The meter runs on animation frames; the timer is the guard for a
    // frame that stopped drawing (the game parked mid-race).
    setTimeout(finish, Math.max(0, endsAt - Date.now()) + 50);
    tick();
  }

  function tick() {
    if (phase !== 'race') return;
    var left = Math.max(0, endsAt - Date.now());
    renderTime(left);
    if (left === 0) { finish(); return; }
    frame = requestAnimationFrame(tick);
  }

  function finish() {
    if (phase !== 'race') return;
    cancelAnimationFrame(frame);
    phase = 'done';
    renderTime(0);
    setKey('خلص!', 'rest');
    setTimeout(function () {
      if (phase !== 'done') return;
      phase = 'idle';
      renderKey();
    }, COOL_MS);
    if (inRoom) { roomFinish(); return; }

    var first = best === 0 && count > 0;
    var record = count > best;
    if (record) {
      best = count;
      g.storage.set('tap.best', best).catch(noop);
    }
    renderBest(record);
    g.playSound('win');
    g.haptic('heavy');
    var line = count === 0
      ? 'ولا نقرة! جرّب مرة ثانية.'
      : record && !first ? 'رقم قياسي جديد!'
      : first ? 'هذا رقمك الأول؛ حاول تكسره.'
      : 'أفضل نتيجة لك: ' + best + ' نقرة.';
    tell(line);
    g.celebrate({ kind: 'rank', title: 'نتيجتك: ' + count + ' نقرة', message: line }).catch(noop);
  }

  // ───────────────────────────── with a friend ─────────────────────────────
  //
  // Outside a room the first screen offers one for this game: "العب ويا
  // صديق" makes it (`room.create()`: this phone hosts), "انضم لغرفة" joins
  // one through the app's Join sheet for this game (`room.join()`: rooms
  // nearby, or the friend's code). Once in, the app puts the room's lobby
  // in this page's place right after the promise settles, so nothing here
  // counts on running after it; the host starts the race there, and the
  // game opens again, in the room. A refusal is said under the keys.

  var ROOM_WORDS = {
    in_room: 'إنت بغرفة هسّه.',
    not_a_room_game: 'هاللعبة ما تنلعب بغرف.',
    in_another_room: 'إنت بغرفة ثانية هسّه؛ ترجعلها من التنبيه تحت.',
    room_not_found: 'ما لكينا غرفة بهالرمز.',
    room_closed: 'هالغرفة انسدّت.',
    another_game: 'هالرمز لغرفة لعبة ثانية.',
    room_full: 'الغرفة مليانة.',
    room_started: 'اللعب بدا بهالغرفة، ما تكدر تدخلها هسّه.',
    friends_only: 'هالغرفة لأصدقاء المضيف بس.',
    kicked: 'المضيف طلّعك من هالغرفة.',
    not_found: 'هاللعبة مو متوفرة للغرف هسّه.',
    invalid_code: 'هذا مو رمز غرفة.',
    offline: 'ماكو اتصال؛ اتصل وجرّب مرة ثانية.',
    timeout: 'الشبكة بطيئة؛ جرّب مرة ثانية.',
    not_supported: 'الغرف تشتغل بس داخل تطبيق گعدة.',
    unknown_action: 'حدّث گعدة حتى تسوّي غرفة من داخل اللعبة.',
  };

  var entering = false;

  /** The line under the keys: what is happening, or why it did not. */
  function sayTogether(text, refused) {
    var line = $('together-line');
    line.textContent = text || '';
    line.hidden = !text;
    line.classList.toggle('err', !!refused);
  }

  /** Into a room from here: `create` makes one, `join` opens the app's
   *  Join sheet for this game. */
  function enterRoomHere(kind) {
    if (entering || inRoom) return;
    entering = true;
    holdTogether(true);
    sayTogether(kind === 'create' ? 'دا نسوّي الغرفة…' : '');
    g.haptic('light');
    var asked = kind === 'create' ? g.room.create() : g.room.join();
    asked.then(function (room) {
      // In: the room's lobby takes this page's place now.
      sayTogether(room && room.code ? 'الغرفة ' + room.code + ' جاهزة.' : 'الغرفة جاهزة.');
      g.log('room.' + kind + ':', room && room.code);
    }, function (e) {
      entering = false;
      holdTogether(false);
      var code = codeOf(e);
      // Closed the sheet: nothing to say.
      if (code === 'cancelled') { sayTogether(''); return; }
      sayTogether(ROOM_WORDS[code] || 'ما صارت؛ جرّب مرة ثانية.', true);
      g.haptic('medium');
    });
  }

  // ───────────────────────────── a tournament ─────────────────────────────
  //
  // Outside a room the first screen offers a tournament of this game too:
  // "سوّي بطولة" opens the app's own sheet to make one
  // (`tournament.create()`), "انضم لبطولة" its sheet for a tournament's
  // code (`tournament.join()`); once in, the tournament's page takes this
  // page's place, as a room's lobby does. The app's sheets word the
  // platform's own refusals; what comes back here is said under the keys.
  //
  // In a match room (`room.current().tournament`) a banner says what is at
  // stake: the stage and how many rounds decide it, or the league's round,
  // and the tally so far. A tap shows the tournament over the game
  // (`tournament.open()`). The app counts each round when it closes, so the
  // tally is read again a moment after the round's `ended`.

  var match = null;

  var TOURNAMENT_WORDS = {
    in_room: 'إنت بغرفة هسّه.',
    not_a_room_game: 'هاللعبة ما تنلعب ببطولات.',
    not_found: 'هاللعبة مو متوفرة للبطولات هسّه.',
    invalid_code: 'هذا مو رمز بطولة.',
    another_game: 'هالرمز لبطولة لعبة ثانية.',
    tournament_not_found: 'ما لكينا بطولة بهالرمز.',
    tournament_closed: 'هالبطولة خلصت.',
    tournament_started: 'هالبطولة بدت، ما تكدر تدخلها هسّه.',
    tournament_full: 'هالبطولة مليانة.',
    friends_only: 'هالبطولة لأصدقاء المنظّم بس.',
    removed: 'المنظّم طلّعك من هالبطولة.',
    offline: 'ماكو اتصال؛ اتصل وجرّب مرة ثانية.',
    timeout: 'الشبكة بطيئة؛ جرّب مرة ثانية.',
    not_supported: 'البطولات تشتغل بس داخل تطبيق گعدة.',
    unknown_action: 'حدّث گعدة حتى تسوّي بطولة من داخل اللعبة.',
  };

  /** The four keys under the game, held while one of them is at work. */
  function holdTogether(held) {
    ['play-friend', 'join-room', 'make-tournament', 'join-tournament'].forEach(function (id) {
      $(id).disabled = held;
    });
  }

  /** Into a tournament from here: `create` opens the app's sheet to make
   *  one of this game, `join` its sheet for a tournament's code. An app
   *  from before tournaments has no `tournament` at all. */
  function enterTournamentHere(kind) {
    if (entering || inRoom) return;
    var t = g.tournament;
    entering = true;
    holdTogether(true);
    sayTogether('');
    g.haptic('light');
    var asked = !t ? Promise.reject('unknown_action') : kind === 'create' ? t.create() : t.join();
    asked.then(function (made) {
      // In: the tournament's page takes this page's place now.
      sayTogether(made && made.code ? 'البطولة ' + made.code + ' جاهزة.' : 'البطولة جاهزة.');
      g.log('tournament.' + kind + ':', made && made.code);
    }, function (e) {
      entering = false;
      holdTogether(false);
      var code = codeOf(e);
      // Closed the sheet: nothing to say.
      if (code === 'cancelled') { sayTogether(''); return; }
      sayTogether(TOURNAMENT_WORDS[code] || 'ما صارت؛ جرّب مرة ثانية.', true);
      g.haptic('medium');
    });
  }

  /** A knockout stage as a player says it. */
  function stageName(stage, stages) {
    var left = stages - stage;
    if (left === 0) return 'النهائي';
    if (left === 1) return 'نصف النهائي';
    if (left === 2) return 'ربع النهائي';
    return 'الدور ' + stage;
  }

  /** Who a tally line is: "إنت" on this phone, else the nickname. */
  function whoOf(line) {
    if (me && line.player === me.id) return 'إنت';
    return line.nickname || 'لاعب';
  }

  /** The match the room plays, from here on: the banner, and the tally
   *  read again after every round. */
  function watchMatch(m) {
    match = m;
    g.room.on('ended', function () { setTimeout(readMatch, 1500); });
  }

  function readMatch() {
    g.room.current().then(function (r) {
      if (!r || !r.tournament) return;
      match = r.tournament;
      renderMatch();
    }, noop);
  }

  function openTournament() {
    if (!g.tournament) return;
    g.haptic('light');
    g.tournament.open().catch(function (e) { g.log('tournament.open refused:', codeOf(e)); });
  }

  /** The banner: the name, what is at stake, the tally. Hidden outside a
   *  match room. */
  function renderMatch() {
    $('match').hidden = !match;
    if (!match) return;
    var m = match;
    $('match-name').textContent = m.name || 'البطولة';
    $('match-line').textContent = m.format === 'knockout'
      ? stageName(m.stage, m.stages) + ' · ' + (m.bestOf > 1 ? 'الأفضل من ' + m.bestOf : 'جولة وحدة تحسمها')
      : 'الجولة ' + Math.min(m.played + 1, Math.max(m.rounds, 1)) + ' من ' + m.rounds;

    var el = $('match-tally');
    var tally = Array.isArray(m.tally) ? m.tally : [];
    el.textContent = '';
    el.hidden = tally.length === 0;
    if (!tally.length) return;
    if (m.format === 'knockout') {
      // This phone's side first (at the start of the line), the score
      // between, written left to right so each number sits by its side.
      var sides = tally.slice().sort(function (a, b) {
        return (me && b.player === me.id ? 1 : 0) - (me && a.player === me.id ? 1 : 0);
      });
      var mine = sides[0];
      var theirs = sides[1];
      var score = document.createElement('b');
      score.className = 'match-score num';
      score.textContent = theirs ? (theirs.wins | 0) + ' : ' + (mine.wins | 0) : String(mine.wins | 0);
      el.append(side(mine), score);
      if (theirs) el.append(side(theirs));
    } else {
      var top = tally[0];
      var you = me && tally.filter(function (t) { return t.player === me.id; })[0];
      var lead = document.createElement('span');
      lead.className = 'match-side';
      lead.textContent = 'يتصدّر ' + whoOf(top) + ' بـ ' + (top.points | 0) + ' نقطة';
      el.append(lead);
      if (you && you.player !== top.player) {
        var own = document.createElement('span');
        own.className = 'match-side own';
        own.textContent = 'إنت: ' + (you.points | 0);
        el.append(own);
      }
    }
  }

  function side(line) {
    var s = document.createElement('span');
    s.className = 'match-side';
    s.textContent = whoOf(line);
    return s;
  }

  // ───────────────────────────── the room ─────────────────────────────
  //
  // Every phone counts every tap; the host closes the race. Runs only
  // when `room.current()` answers a room.

  async function enterRoom(current) {
    inRoom = true;
    isHost = !!(current.you && current.you.role === 'host');
    me = await g.player.me().catch(function () { return null; });
    members = membersOf(await g.room.members().catch(function () { return []; }));

    g.room.on('members', function (d) { members = membersOf(d); renderLeaders(); });
    // Its own taps a phone counted as they happened; the others it hears.
    g.room.on('message', function (msg) {
      if (phase !== 'race' || !msg || !msg.data || msg.data.type !== 'tap') return;
      if (me && msg.from === me.id) return;
      counts[msg.from] = (counts[msg.from] || 0) + 1;
      renderLeaders();
    });
    // The host starts the room; every phone counts down from that moment.
    g.room.on('started', function () {
      counts = {};
      countdown(race);
    });
    g.room.on('ended', function (e) { celebrateRank(e && e.results); });
    tell(isHost ? 'إنت المضيف: ابدأ لمن يجهز الكل.' : 'المضيف يبدي السباق.');
    // Opened on a room already playing (the app opens every member's game
    // on the start): the `started` event went by before this page was
    // here, so the race runs on the room's clock instead.
    if (current.status === 'playing') {
      raceFrom(typeof current.startedAt === 'number' ? current.startedAt : Date.now());
    }
  }

  /** The race of a room that started at `startedAt` (milliseconds since the
   *  epoch): the count down ends three seconds after the start, the race
   *  ten seconds after that. A page that opens late counts down what is
   *  left of the three, or races for what is left of the ten; one that
   *  opens after the race is over finishes it at once (the host then
   *  finishes the round with what it counted; the room stays open for
   *  the next one, which the app opens as a fresh page). */
  function raceFrom(startedAt) {
    var go = startedAt + COUNT_MS;
    var over = go + RACE_MS;
    var now = Date.now();
    counts = {};
    if (now < go) { countdownTo(go, over); return; }
    if (now < over) { race(over); return; }
    phase = 'race';
    raced = true;
    count = 0;
    endsAt = over;
    finish();
  }

  /** 3, 2, 1 on the room's clock: each number on its second, up to `go`,
   *  then the race to `over`. */
  function countdownTo(go, over) {
    phase = 'countdown';
    count = 0;
    renderCount();
    renderTime(RACE_MS);
    tell('استعد…');
    (function step() {
      if (phase !== 'countdown') return;
      var left = go - Date.now();
      if (left <= 0) { race(over); return; }
      var n = Math.ceil(left / 1000);
      setKey(String(n), 'rest digit');
      g.playSound('countdown');
      g.haptic('medium');
      setTimeout(step, left - (n - 1) * 1000);
    })();
  }

  /** The members event's detail: the list, or the relay's `{list}`. */
  function membersOf(d) {
    return Array.isArray(d) ? d : (d && Array.isArray(d.list) ? d.list : []);
  }

  function players() {
    return members.filter(function (m) { return m.role !== 'spectator'; });
  }

  function tapsOf(id) {
    return me && id === me.id ? count : counts[id] || 0;
  }

  function renderLeaders() {
    var list = $('leaders');
    list.textContent = '';
    var ranked = players().slice().sort(function (a, b) { return tapsOf(b.id) - tapsOf(a.id); });
    ranked.forEach(function (m, i) {
      var li = document.createElement('li');
      li.className = (me && m.id === me.id ? 'me' : '') + (i === 0 && tapsOf(m.id) > 0 ? ' first' : '');
      var name = document.createElement('span');
      name.textContent = m.nickname || m.id;
      var taps = document.createElement('b');
      taps.className = 'num';
      taps.textContent = String(tapsOf(m.id));
      li.append(name, taps);
      list.appendChild(li);
    });
  }

  function roomStart() {
    if (!isHost) {
      g.showToast({ title: 'المضيف يبدي السباق', subtitle: 'استعد لمن يبدي العد.' });
      return;
    }
    g.room.start().catch(function (code) { g.showToast({ title: 'ما بدا السباق', subtitle: String(code) }); });
  }

  /** The host waits a beat for the last taps in flight, then ranks everyone
   *  by what this phone counted and closes the race. Equal counts share a
   *  rank. */
  function roomFinish() {
    if (!isHost) return;
    setTimeout(function () {
      var scores = players()
        .map(function (m) { return { player: m.id, score: tapsOf(m.id) }; })
        .sort(function (a, b) { return b.score - a.score; });
      scores.forEach(function (s, i) {
        s.rank = i > 0 && scores[i - 1].score === s.score ? scores[i - 1].rank : i + 1;
      });
      g.room.end({ scores: scores }).catch(function (code) { g.log('room.end refused:', code); });
    }, 800);
  }

  /** Every phone hears the end and celebrates its own place. */
  function celebrateRank(results) {
    var mine = (results || []).filter(function (r) { return me && r.player === me.id; })[0];
    g.playSound(mine && mine.rank === 1 ? 'win' : 'lose');
    g.celebrate({
      kind: 'rank',
      title: mine ? 'طلعت ' + (RANKS[mine.rank - 1] || mine.rank) : 'خلص السباق',
      message: 'نتيجتك: ' + count + ' نقرة',
    }).catch(noop);
  }

  // ───────────────────────────── المزيد: the tester ─────────────────────────────
  //
  // Every window.gathering call, one row each: a key runs it, and the line
  // under it says what came back — the value it resolved to (→), the code it
  // was refused with (✕), or that it was sent and answers nothing (↗).

  function key(label, call, run, opts) {
    return Object.assign({ label: label, call: call, run: run }, opts || {});
  }

  function row(name, note, keys) {
    return { name: name, note: note, keys: keys };
  }

  function settle(p) {
    return p.then(function (v) { return '→ ' + show(v); }, function (e) { return '✕ ' + codeOf(e); });
  }

  function all(calls) {
    var names = Object.keys(calls);
    return Promise.all(names.map(function (n) { return settle(calls[n]); })).then(function (lines) {
      var o = {};
      names.forEach(function (n, i) { o[n] = lines[i]; });
      return o;
    });
  }

  function codeOf(e) {
    return typeof e === 'string' ? e : (e && (e.code || e.message)) || String(e);
  }

  function show(v) {
    if (v === undefined) return 'undefined';
    var s;
    try { s = JSON.stringify(v, null, 1); } catch (e) { s = String(v); }
    return s.length > 600 ? s.slice(0, 600) + '…' : s;
  }

  function calls() {
    return [
      { section: 'الواجهة', note: 'أسئلة المضيف وأدواته فوق الإطار.' },
      row('showDialog(opts)', 'سؤال بمفتاحين يرجع true أو false. بلا cancelText يصير خبر بمفتاح واحد.', [
        key('اسأل', 'showDialog({title, body, confirmText, cancelText})', function () {
          return g.showDialog({ title: 'سؤال من اللعبة', body: 'نكمل الجولة؟', confirmText: 'إي', cancelText: 'لا' });
        }),
        key('خبر', 'showDialog({title, body, confirmText})', function () {
          return g.showDialog({ title: 'خبر', body: 'جملة إلها طريق واحد.', confirmText: 'تمام' });
        }),
      ]),
      row('prompt(opts)', 'خانة نص؛ يرجع النص، أو null إذا انلغى.', [
        key('اكتب', 'prompt({title, message, initialValue})', function () {
          return g.prompt({ title: 'اسمك باللعبة', message: 'يبين لباقي اللاعبين.', confirmText: 'حفظ', cancelText: 'إلغاء', initialValue: 'زين' });
        }),
      ]),
      row('showToast(opts)', 'رسالة عابرة تحت الشاشة.', [
        key('اعرض', 'showToast({title, subtitle})', function () {
          g.showToast({ title: 'وصلت', subtitle: 'هاي رسالة من اللعبة' });
        }),
      ]),
      row('showActionSheet(opts)', 'قائمة خيارات؛ ترجع {index, value} أو null.', [
        key('اختار', 'showActionSheet({title, options, cancelText})', function () {
          return g.showActionSheet({
            title: 'شتريد؟',
            message: 'خيار واحد.',
            options: ['الأول', { label: 'الثاني', value: 'second' }, { label: 'احذف', value: 'delete', destructive: true }],
            cancelText: 'إلغاء',
          });
        }),
      ]),
      row('showLoading(opts) · hideLoading()', 'تحميل يحجب الشاشة؛ ينشال بعد ثانية ونص.', [
        key('حمّل', "showLoading({message}) … hideLoading()", function (say) {
          g.showLoading({ message: 'لحظة…' });
          setTimeout(function () { g.hideLoading(); say('انشال بعد 1.5 ثانية.'); }, 1500);
        }),
      ]),
      row('setAppBar(visible) · hideAppBar() · showAppBar()', 'شريط المضيف فوق اللعبة.', [
        key('اخفِ', 'setAppBar(false)', function () { g.setAppBar(false); }),
        key('رجّع', 'setAppBar(true)', function () { g.setAppBar(true); }),
        key('hideAppBar', 'hideAppBar()', function () { g.hideAppBar(); }),
        key('showAppBar', 'showAppBar()', function () { g.showAppBar(); }),
      ]),
      row('setAppBarColor(color)', 'لون الشريط؛ الفارغ يرجّع لونه.', [
        key('بنفسجي', "setAppBarColor('#7C4DFF')", function () { g.setAppBarColor('#7C4DFF'); }),
        key('لونه', "setAppBarColor('')", function () { g.setAppBarColor(''); }),
      ]),
      row('setStatusBarColor(color)', 'لون شريط الحالة؛ الفارغ يرجّع لونه.', [
        key('بنفسجي', "setStatusBarColor('#7C4DFF')", function () { g.setStatusBarColor('#7C4DFF'); }),
        key('لونه', "setStatusBarColor('')", function () { g.setStatusBarColor(''); }),
      ]),
      row('setZoom(enabled)', 'التكبير بالإصبعين؛ مطفي من البداية.', [
        key('شغّل', 'setZoom(true)', function () { g.setZoom(true); }),
        key('طفّي', 'setZoom(false)', function () { g.setZoom(false); }),
      ]),
      row('setTextSelection(enabled)', 'تحديد النص ونسخه؛ مطفي من البداية.', [
        key('شغّل', 'setTextSelection(true)', function () { g.setTextSelection(true); }),
        key('طفّي', 'setTextSelection(false)', function () { g.setTextSelection(false); }),
      ]),
      row('showSplash(message) · hideSplash()', 'الغطاء فوق الإطار؛ ينشال بعد ثانيتين.', [
        key('غطّي', "showSplash('…') … hideSplash()", function (say) {
          g.showSplash('دا نجرّب الغطاء…');
          setTimeout(function () { g.hideSplash(); say('انشال الغطاء بعد ثانيتين.'); }, 2000);
        }),
      ]),
      row('setOrientation(orientation)', 'يدوّر الإطار ضمن اللي يسمح بيه البيان. هاي اللعبة عمودية.', [
        key('بالعرض', "setOrientation('landscape')", function (say) {
          var wasWide = window.innerWidth > window.innerHeight;
          g.setOrientation('landscape');
          setTimeout(function () {
            var wide = window.innerWidth > window.innerHeight;
            say(wide && !wasWide
              ? 'انقلب الإطار بالعرض.'
              : 'ما انقلب: اللعبة عمودية، والمضيف تجاهل الطلب (بسجله: refused).');
          }, 900);
        }, { sent: 'أُرسلت؛ نشوف بعد لحظة إذا انقلب الإطار…' }),
        key('عمودي', "setOrientation('portrait')", function () { g.setOrientation('portrait'); }),
        key('قيمة غلط', "call('setOrientation', {orientation: 'sideways'})", function () {
          return g.call('setOrientation', { orientation: 'sideways' });
        }),
      ]),
      row('celebrate({kind, title?, message?})', 'بطاقة المضيف؛ ترجع لمن تنسدّ.', [
        key('فوز', "celebrate({kind: 'win'})", function () { return g.celebrate({ kind: 'win' }); }),
        key('خسارة', "celebrate({kind: 'lose'})", function () { return g.celebrate({ kind: 'lose' }); }),
        key('تعادل', "celebrate({kind: 'draw'})", function () { return g.celebrate({ kind: 'draw' }); }),
        key('ترتيب', "celebrate({kind: 'rank', title, message})", function () {
          return g.celebrate({ kind: 'rank', title: 'طلعت الثاني', message: 'من أصل أربعة.' });
        }),
      ]),

      { section: 'النظام', note: 'الاهتزاز والحافظة والروابط والأصوات.' },
      row('haptic(type)', 'اهتزاز التلفون.', [
        key('خفيف', "haptic('light')", function () { g.haptic('light'); }),
        key('وسط', "haptic('medium')", function () { g.haptic('medium'); }),
        key('قوي', "haptic('heavy')", function () { g.haptic('heavy'); }),
        key('اختيار', "haptic('selection')", function () { g.haptic('selection'); }),
        key('رجّة', "haptic('vibrate')", function () { g.haptic('vibrate'); }),
      ]),
      row('copyToClipboard(text) · getFromClipboard()', 'النسخ ما يرجع شي؛ القراءة ترجع النص أو null.', [
        key('انسخ', "copyToClipboard('گعدة · سباق النقر')", function () { g.copyToClipboard('گعدة · سباق النقر'); }),
        key('اقرأ', 'getFromClipboard()', function () { return g.getFromClipboard(); }),
      ]),
      row('openExternalUrl(url)', 'يفتح الرابط برّا التطبيق؛ يرجع true إذا انفتح.', [
        key('افتح', "openExternalUrl('https://example.com')", function () { return g.openExternalUrl('https://example.com'); }),
      ]),
      row('playSound(id)', 'أصوات المضيف؛ لحد ما توصل، كل صوت سطر بالسجل وتكّة.', ['tap', 'tick', 'join', 'leave', 'win', 'lose', 'countdown'].map(function (id) {
        return key(id, "playSound('" + id + "')", function () { g.playSound(id); });
      })),
      row('setMuted(muted)', 'كتم الأصوات؛ يبقى عبر كل الألعاب.', [
        key('اكتم', 'setMuted(true)', function () { g.setMuted(true); }),
        key('رجّع الصوت', 'setMuted(false)', function () { g.setMuted(false); }),
      ]),

      { section: 'المعلومات', note: 'الجهاز والتطبيق واللاعب.' },
      row('getDeviceInfo()', 'المنصة واللغة والوضع والشاشة.', [
        key('اقرأ', 'getDeviceInfo()', function () { return g.getDeviceInfo(); }),
      ]),
      row('getAppInfo()', 'اسم التطبيق ونسخته.', [
        key('اقرأ', 'getAppInfo()', function () { return g.getAppInfo(); }),
      ]),
      row('player.me()', 'مَن يلعب: {id, nickname, handle, avatar, avatarUrl}، بلا رقم التلفون.', [
        key('مَن أنا؟', 'player.me()', function () { return g.player.me(); }),
      ]),
      row('getAuthCode()', 'رمز الإطلاق اللي إجى ويّا الرابط، أو null.', [
        key('اقرأ', 'getAuthCode()', function () { return g.getAuthCode(); }, {
          then: function (v) { return v ? 'الرمز اللي إجى ويّا رابط الإطلاق.' : 'صفحة مضمّنة بالتطبيق: ماكو رمز.'; },
        }),
      ]),

      { section: 'التخزين', note: 'مساحة لكل لعبة: game.<id>.<key>.' },
      row('storage.set(key, value) · get(key) · remove(key)', 'قيمة JSON تحت المفتاح demo.', [
        key('احفظ', "storage.set('demo', {at, game})", function () {
          return g.storage.set('demo', { at: new Date().toISOString(), game: GAME });
        }),
        key('اقرأ', "storage.get('demo')", function () { return g.storage.get('demo'); }),
        key('امسح', "storage.remove('demo')", function () { return g.storage.remove('demo'); }),
      ]),

      { section: 'الصلاحيات', note: 'موافقتك لهاي اللعبة أول، بعدين طلب التلفون.' },
      row("permissions.status('camera')", 'ترجع prompt لحد ما توافق لهاي اللعبة.', [
        key('الحالة', "permissions.status('camera')", function () { return g.permissions.status('camera'); }),
      ]),
      row("permissions.request('camera')", 'ورقة الموافقة، بعدها طلب التلفون؛ يرجع الحالة الأخيرة.', [
        key('اطلب', "permissions.request('camera')", function () { return g.permissions.request('camera'); }),
      ]),
      row('permissions.openSettings()', 'يفتح صفحة التطبيق بإعدادات التلفون.', [
        key('الإعدادات', 'permissions.openSettings()', function () { return g.permissions.openSettings(); }),
      ]),

      { section: 'الغرفة', note: 'برّا الغرفة current() يرجع null، و create و join يدخلونك غرفة، والباقي يرفض not_in_room. بغرفة create و join يرفضون in_room.' },
      row('room.current()', 'الغرفة اللي انفتحت بيها اللعبة، أو null.', [
        key('اقرأ', 'room.current()', function () { return g.room.current(); }),
      ]),
      row('room.members()', 'اللاعبين بالغرفة.', [
        key('اقرأ', 'room.members()', function () { return g.room.members(); }),
      ]),
      row('room.getState()', 'حالة الغرفة {version, data}.', [
        key('اقرأ', 'room.getState()', function () { return g.room.getState(); }),
      ]),
      row('room.send(data, {to?})', 'رسالة لباقي الغرفة.', [
        key('أرسل', "room.send({type: 'ping'})", function () { g.room.send({ type: 'ping' }); }, {
          sent: 'أُرسلت؛ برّا الغرفة ماكو أحد يستلمها.',
        }),
      ]),
      row('room.on(event, fn) · room.off(event, fn)', 'أحداث الغرفة: message, members, joined, left, state, started, ended, host, kicked, connection.', [
        key('سجّل', "room.on('message', fn)", function () { g.room.on('message', onRoomEcho); }, {
          sent: 'مسجّل؛ ما توصل أحداث لحد ما تجي الغرف.',
        }),
        key('شيل', "room.off('message', fn)", function () { g.room.off('message', onRoomEcho); }, { sent: 'انشال.' }),
      ]),
      row('room.create({visibility?})', 'برّا الغرفة: غرفة لهاي اللعبة وإنت مضيفها، ترجع {id, code}، وبعدها صالة الغرفة تاخذ مكان اللعبة. visibility: private أو friends.', [
        key('سوّي غرفة', 'room.create()', function () { return g.room.create(); }),
        key('للأصدقاء', "room.create({visibility: 'friends'})", function () { return g.room.create({ visibility: 'friends' }); }),
        key('قيمة غلط', "room.create({visibility: 'public'})", function () { return g.room.create({ visibility: 'public' }); }),
      ]),
      row('room.join({code?})', 'بلا رمز: ورقة الانضمام لهاي اللعبة (cancelled إذا تسدّها). برمز: تنضم مثل ما تكتبه، لغرف هاي اللعبة بس (another_game). وبعدها صالة الغرفة تاخذ مكان اللعبة.', [
        key('الورقة', 'room.join()', function () { return g.room.join(); }),
        key('برمز', 'room.join({code})', function () {
          return g.prompt({ title: 'رمز الغرفة', message: 'ست خانات من صديقك.', confirmText: 'انضم', cancelText: 'إلغاء' })
            .then(function (code) { return code == null ? Promise.reject('cancelled') : g.room.join({ code: code }); });
        }),
        key('رمز غلط', "room.join({code: 'X'})", function () { return g.room.join({ code: 'X' }); }),
      ]),
      row('room.setState · start · end · leave · kick · invite · ticket', 'الباقي كله، وكل وحدة ترجع رمزها.', [
        key('جرّبها كلها', 'room.*()', function () {
          if (inRoom) return Promise.reject('in_room: جرّبها من شاشة اللعبة');
          return all({
            setState: g.room.setState({}, 0),
            start: g.room.start(),
            end: g.room.end({ scores: [] }),
            leave: g.room.leave(),
            kick: g.room.kick('ply_none'),
            invite: g.room.invite(),
            ticket: g.room.ticket(),
          });
        }),
      ]),

      { section: 'البطولة', note: 'بغرفة مباراة current() يرجع المباراة، وبرّاها null. create و join يفتحون أوراق التطبيق برّا الغرفة.' },
      row('tournament.current()', 'المباراة اللي تلعبها الغرفة، أو null.', [
        key('اقرأ', 'tournament.current()', function () { return g.tournament.current(); }),
      ]),
      row('tournament.list()', 'بطولاتك لهاللعبة والرسمية.', [
        key('اقرأ', 'tournament.list()', function () { return g.tournament.list(); }),
      ]),
      row('tournament.open()', 'صفحة البطولة فوق اللعبة؛ برّا المباراة يرفض not_in_tournament.', [
        key('افتح', 'tournament.open()', function () { return g.tournament.open(); }),
      ]),
      row('tournament.create() · join()', 'ورقة البطولة الجديدة، أو ورقة رمز البطولة.', [
        key('سوّي', 'tournament.create()', function () { return g.tournament.create(); }),
        key('انضم', 'tournament.join()', function () { return g.tournament.join(); }),
      ]),

      { section: 'الأصدقاء', note: 'علاقتك باللاعب، والإضافة (التطبيق يسألك أول)، والقائمة (تحتاج friends:read)، والدعوة للغرفة.' },
      row("friends.status('x')", 'شنو علاقتك باللاعب.', [
        key('اقرأ', "friends.status('x')", function () { return g.friends.status('x'); }),
      ]),
      row('friends.add · list · invite', 'الباقي كله.', [
        key('جرّبها كلها', 'friends.*()', function () {
          return all({ add: g.friends.add('x'), list: g.friends.list(), invite: g.friends.invite('x') });
        }),
      ]),

      { section: 'التشخيص', note: 'السجل والنداءين الأساسيين.' },
      row('log(...args)', 'سطر بسجل التطبيق.', [
        key('اكتب', "log('…')", function () { g.log('سباق النقر:', 'سطر من المزيد', new Date().toISOString()); }, {
          sent: 'بسجل التطبيق: Game JS: …',
        }),
      ]),
      row('send(action, payload) · call(action, payload)', 'كل نداء مبني عليهن؛ نداء ما يعرفه المضيف يرفض unknown_action.', [
        key('send', "send('haptic', {type: 'selection'})", function () { g.send('haptic', { type: 'selection' }); }),
        key('call مجهول', "call('noSuchAction')", function () { return g.call('noSuchAction'); }),
      ]),

      { section: 'الإطار', note: 'خمس رسائل postMessage وبس.' },
      row('gathering:loading → gathering:ready', 'يرفع الغطاء، وبعد ثانية يشيله.', [
        key('غطاء ثانية', "postMessage({type: 'gathering:loading'}) … 'gathering:ready'", function (say) {
          post('gathering:loading', { message: 'دا نجرّب رسائل الإطار…' });
          setTimeout(function () { post('gathering:ready'); say('gathering:ready بعد ثانية.'); }, 1000);
        }),
      ]),
      row('gathering:resize {height}', 'طول الصفحة؛ المضيف يحفظه.', [
        key('أرسل الطول', "postMessage({type: 'gathering:resize', height})", function (say) {
          var height = document.documentElement.scrollHeight;
          post('gathering:resize', { height: height });
          say('الطول: ' + height);
        }),
      ]),
      row('gathering:fullscreen {on}', 'الإطار ياخذ الشاشة كلها، أو يرجّعها.', [
        key('شغّل', "postMessage({type: 'gathering:fullscreen', on: true})", function () { post('gathering:fullscreen', { on: true }); }),
        key('طفّي', "postMessage({type: 'gathering:fullscreen', on: false})", function () { post('gathering:fullscreen', { on: false }); }),
      ]),
      row('gathering:close', 'يسكّر اللعبة، بعد ما توافق.', [
        key('سكّر', "postMessage({type: 'gathering:close'})", function () {
          return g.showDialog({ title: 'نسكّر اللعبة؟', body: 'رسالة gathering:close.', confirmText: 'سكّر', cancelText: 'لا' })
            .then(function (ok) { if (ok) post('gathering:close'); return ok; });
        }),
      ]),

      { section: 'التنقّل', note: 'الرجوع والتصغير وإعادة التحميل والتسكير.' },
      row('minimize()', 'تطلع اللعبة من الشاشة وتبقى شغّالة؛ ترجع من الشريط تحت.', [
        key('صغّر', 'minimize()', function () { g.minimize(); }),
      ]),
      row('goBack()', 'خطوة لورا بتاريخ الإطار؛ من أول صفحة تسكّر اللعبة.', [
        key('لورا', 'goBack()', function () { g.goBack(); }),
      ]),
      row('reload() · reloadHome()', 'يعيد تحميل الصفحة، أو يبدي من رابط الإطلاق.', [
        key('أعد التحميل', 'reload()', function () { g.reload(); }),
        key('من البداية', 'reloadHome()', function () { g.reloadHome(); }),
      ]),
      row('close()', 'يسكّر اللعبة، بعد ما توافق.', [
        key('سكّر اللعبة', 'close()', function () {
          return g.showDialog({ title: 'نسكّر اللعبة؟', body: 'نداء close().', confirmText: 'سكّر', cancelText: 'لا' })
            .then(function (ok) { if (ok) g.close(); return ok; });
        }),
      ]),
    ];
  }

  function onRoomEcho(detail) {
    g.showToast({ title: 'حدث غرفة', subtitle: show(detail).slice(0, 80) });
  }

  function invoke(k, out) {
    function paint(kind, text) {
      out.hidden = false;
      out.className = 'out ' + kind;
      out.textContent = '';
      var c = document.createElement('code');
      c.className = 'ltr';
      c.textContent = k.call + '\n' + text;
      out.appendChild(c);
    }
    function say(text) {
      var w = document.createElement('span');
      w.className = 'why';
      w.textContent = text;
      out.appendChild(w);
    }
    var result;
    try {
      result = k.run(say);
    } catch (e) {
      paint('err', '✕ ' + codeOf(e));
      return;
    }
    if (result && typeof result.then === 'function') {
      paint('wait', '…');
      result.then(function (v) {
        paint('ok', '→ ' + show(v));
        if (k.then) say(k.then(v));
      }, function (e) {
        paint('err', '✕ ' + codeOf(e));
      });
      return;
    }
    paint('sent', '↗ send');
    say(k.sent || 'أُرسلت؛ نداء send ما يرجع جواب.');
  }

  function buildCalls() {
    var list = $('calls');
    list.textContent = '';
    calls().forEach(function (item) {
      if (item.section) {
        var head = document.createElement('h2');
        head.className = 'section';
        head.textContent = item.section;
        var small = document.createElement('small');
        small.textContent = item.note;
        head.appendChild(small);
        list.appendChild(head);
        return;
      }
      var box = document.createElement('div');
      box.className = 'call';
      var name = document.createElement('code');
      name.className = 'name ltr';
      name.textContent = item.name;
      var note = document.createElement('p');
      note.className = 'note';
      note.textContent = item.note;
      var keys = document.createElement('div');
      keys.className = 'keys';
      var out = document.createElement('div');
      out.className = 'out';
      out.hidden = true;
      out.setAttribute('aria-live', 'polite');
      item.keys.forEach(function (k) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'key';
        b.textContent = k.label;
        b.addEventListener('click', function () { invoke(k, out); });
        keys.appendChild(b);
      });
      box.append(name, note, keys, out);
      list.appendChild(box);
    });
  }

  /** The tester is its own entry in the frame's history (`#more`), so the
   *  phone's back, and `goBack()`, return to the game. */
  function route() {
    var more = location.hash === '#more';
    $('game').hidden = more;
    $('more').hidden = !more;
    if (more && !$('calls').firstChild) buildCalls();
    window.scrollTo(0, 0);
  }

  function renderWhere() {
    var where = $('where');
    where.textContent = '';
    var b = document.createElement('b');
    b.textContent = inHost ? 'داخل گعدة' : 'بالمتصفح';
    where.append(b, document.createTextNode(inHost
      ? ': كل نداء يروح لـ window.gathering ويرجع بجواب المضيف.'
      : ': ماكو مضيف، فبديل الجسر يجاوب بداله (التخزين بهذا المتصفح، وماكو غرفة).'));
  }

  // ───────────────────────────── boot ─────────────────────────────

  async function boot() {
    var host = await bridgeReady();
    inHost = !!host;
    g = host || browserStub();

    var key = $('tap');
    key.addEventListener('pointerdown', function (e) {
      if (e.button > 0) return;
      e.preventDefault(); // no focus ring, no zoom, no selection under a fast thumb
      key.classList.add('down');
      onTap();
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (type) {
      key.addEventListener(type, function () { key.classList.remove('down'); });
    });
    // The keyboard's Enter and Space click without a pointer.
    key.addEventListener('click', function (e) { if (e.detail === 0) onTap(); });
    $('play-friend').addEventListener('click', function () { enterRoomHere('create'); });
    $('join-room').addEventListener('click', function () { enterRoomHere('join'); });
    $('make-tournament').addEventListener('click', function () { enterTournamentHere('create'); });
    $('join-tournament').addEventListener('click', function () { enterTournamentHere('join'); });
    $('match').addEventListener('click', openTournament);
    $('open-more').addEventListener('click', function () { location.hash = '#more'; });
    $('close-more').addEventListener('click', function () {
      if (history.length > 1) history.back(); else location.hash = '';
    });
    window.addEventListener('hashchange', route);

    var saved = await g.storage.get('tap.best').catch(function () { return null; });
    best = typeof saved === 'number' && saved > 0 ? Math.floor(saved) : 0;

    // Opened into a room, the race is run by everyone in it. Outside one:
    // alone, with the keys into a room.
    var current = await g.room.current().catch(function () { return null; });
    if (current && current.tournament) watchMatch(current.tournament);
    if (current) await enterRoom(current);

    render();
    renderWhere();
    route();
    // The manifest does not ask for the splash, so this changes nothing
    // here; a game whose manifest does must send it, on every path.
    post('gathering:ready');
    g.log('سباق النقر جاهز:', inHost ? 'داخل التطبيق' : 'بالمتصفح', inRoom ? (match ? '(مباراة بطولة)' : '(غرفة)') : '(لحالك)');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
