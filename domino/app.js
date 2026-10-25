"use strict";

/* الدومينو — الصفحة: ترسم اللعبة من «منظر» (view) واحد، سواء جاء من لعبة
   على هذا الموبايل ضد الكمبيوتر أو من غرفة گعدة (room.js). القوانين كلها في
   rules.js، والغرفة في room.js. */
(function () {
const D = window.Domino;
const R = window.Room;

/* ====================== أدوات مساعدة ====================== */
const $ = s => document.querySelector(s);
const el = (t,c)=>{const e=document.createElement(t); if(c)e.className=c; return e;};
const sum = h => h.reduce((a,t)=>a+t[0]+t[1],0);

/* ====================== حالة الصفحة ====================== */
const AI_NAMES = ["أنت","الكمبيوتر ١","الكمبيوتر ٢","الكمبيوتر ٣"];
const UI = {
  mode:"solo",         // solo: ضد الكمبيوتر على هذا الموبايل · room: غرفة گعدة
  solo:null,           // {s: حالة rules.js, ai:[bool]}
  numPlayers:2, targetScore:100,
  roomTarget:100,      // اختيار صاحب الغرفة
  snap:null,           // لقطة الغرفة من room.js
  room:null,           // واجهة room.js
  selected:null, pendingTile:null,
  lastSeen:0,          // آخر حدث انرسم (لسجل الحركات)
  modalKey:"",         // أي نافذة معروضة الآن
};

/* المنظر الحالي: ما يرسمه هذا الموبايل */
function currentView(){
  if(UI.mode==="solo") return UI.solo ? D.viewFor(UI.solo.s, 0) : null;
  const r = UI.snap && UI.snap.room;
  return r && r.stage==="playing" ? r.view : null;
}
function myTurn(v){ return !!v && v.phase==="play" && v.seat>=0 && v.turn===v.seat; }
function nameOf(v,i){
  const p=v.players[i]; if(!p) return "؟";
  if(UI.mode==="solo") return AI_NAMES[i];
  return i===v.seat ? "إنت" : p.name;
}

/* ====================== رسم الأحجار (البقع) ====================== */
const PIP_POS = {
  0:[],
  1:["posC"],
  2:["posTL","posBR"],
  3:["posTL","posC","posBR"],
  4:["posTL","posTR","posBL","posBR"],
  5:["posTL","posTR","posC","posBL","posBR"],
  6:["posTL","posTR","posML","posMR","posBL","posBR"],
};
function faceEl(n){
  const f = el("div","pips");
  for(const pos of PIP_POS[n]){ const i=el("i"); i.classList.add(pos); f.appendChild(i); }
  return f;
}
/* بناء عنصر حجر. orient: 'h' أفقي أو 'v' عمودي. [a,b] يُعرض a ثم b */
function tileEl(a,b,orient="h"){
  const t = el("div","tile "+orient);
  t.setAttribute("role","img"); t.setAttribute("aria-label",`حجر ${a} و ${b}`);
  const h1=el("div","half"), h2=el("div","half");
  h1.appendChild(faceEl(a)); h2.appendChild(faceEl(b));
  t.appendChild(h1); t.appendChild(h2);
  return t;
}

/* ====================== منطق الأطراف (من المنظر) ====================== */
function canPlayTile(v,t){
  if(v.board.length===0) return true;
  return t[0]===v.left||t[1]===v.left||t[0]===v.right||t[1]===v.right;
}
function handHasMove(v){ return v.hand.some(t=>canPlayTile(v,t)); }
function playableEnds(v,t){
  if(v.board.length===0) return ["left"];
  const ends=[];
  if(t[0]===v.left||t[1]===v.left) ends.push("left");
  if(t[0]===v.right||t[1]===v.right) ends.push("right");
  return ends;
}

/* ====================== الحركات ====================== */
/* كل حركة تمر من هنا: على هذا الموبايل تُطبَّق مباشرة، وبالغرفة تروح لموبايل صاحب الغرفة */
function act(action){
  if(UI.mode==="room"){ UI.room.act(action); return; }
  const s=UI.solo.s;
  const seat = action.type==="next" ? -1 : 0;
  const err=D.act(s, seat, action);
  if(err){ toast(err, true); return; }
  afterSolo();
}

/* ====================== على هذا الموبايل: ضد الكمبيوتر ====================== */
function startSolo(){
  const players=[];
  for(let i=0;i<UI.numPlayers;i++) players.push({id:"p"+i, name:AI_NAMES[i]});
  UI.solo={ s:D.newMatch(players, UI.targetScore), ai:players.map((_,i)=>i!==0) };
  UI.mode="solo"; UI.lastSeen=0;
  closeModal();
  afterSolo();
}

let aiTimer=0;
function afterSolo(){
  const s=UI.solo.s;
  draw();
  clearTimeout(aiTimer);
  if(s.phase==="play" && UI.solo.ai[s.turn]){
    // الكمبيوتر يسحب بسرعة، ويفكّر قبل ما يلعب
    const step=D.aiAction(s, s.turn);
    aiTimer=setTimeout(()=>{ D.act(s, s.turn, step); afterSolo(); }, step.type==="draw" ? 260 : 650);
  }
}

/* ====================== الغرفة ====================== */
function onRoom(snap){
  const prev=UI.snap;
  UI.snap=snap;
  if(snap.phase==="booting") return;
  if(snap.phase==="no-room"){
    UI.mode="solo";
    if(!prev || prev.phase!=="no-room"){ renderToolbar(); openSetup(); }
    return;
  }
  UI.mode="room";
  if(snap.notice && (!prev || !prev.notice || prev.notice.id!==snap.notice.id)) toast(snap.notice.text);
  if(snap.error && (!prev || !prev.error || prev.error.id!==snap.error.id)) toast(snap.error.text, true);
  if(snap.turn && (!prev || !prev.turn || prev.turn.id!==snap.turn.id)){ UI.room.haptic("medium"); flashTitle(); }
  renderToolbar();
  draw();
}

/* ====================== النوافذ ====================== */
function openModal(key, html){
  const m=$("#modal");
  if(UI.modalKey!==key){ m.innerHTML=html; UI.modalKey=key; }
  $("#overlay").classList.add("show");
  return m;
}
function closeModal(){ $("#overlay").classList.remove("show"); UI.modalKey=""; }

function seg(id, items, active, onPick){
  return `<div class="seg" id="${id}">${items.map(([v,label])=>`<button type="button" data-v="${v}" class="${v===active?"active":""}">${label}</button>`).join("")}</div>`;
}
function wireSeg(m, id, onPick){
  m.querySelectorAll(`#${id} button`).forEach(b=>b.onclick=()=>{
    m.querySelectorAll(`#${id} button`).forEach(x=>x.classList.remove("active"));
    b.classList.add("active"); onPick(+b.dataset.v);
  });
}

/* البداية: ضد الكمبيوتر على هذا الموبايل، أو غرفة ويّا الربع (داخل گعدة) */
function openSetup(){
  const snap=UI.snap||{};
  const hello = snap.me ? `<p class="hello">هلا ${escapeHtml(snap.me.nickname||"")} 👋</p>` : "";
  const together = snap.inApp ? `
    <div class="together">
      <h3>ويّا ربعك</h3>
      <p>كل واحد على موبايله، من ٢ إلى ٤ لاعبين.</p>
      <div class="row">
        <button type="button" class="btn" id="roomCreate">العب ويّا ربعك</button>
        <button type="button" class="btn ghost" id="roomJoin">انضم لغرفة</button>
      </div>
      <label class="check"><input type="checkbox" id="friendsOnly"> الغرفة لأصدقائي بس</label>
      ${snap.tournaments ? `<div class="row">
        <button type="button" class="btn ghost" id="tourCreate">سوّي بطولة</button>
        <button type="button" class="btn ghost" id="tourJoin">انضم لبطولة</button>
      </div>` : ""}
      <p class="line" id="togetherLine" hidden></p>
    </div>` : "";
  const m=openModal("setup", `
    <h2>لعبة الدومينو</h2>
    ${hello}
    ${together}
    <div class="solo">
      ${snap.inApp ? "<h3>ضد الكمبيوتر</h3>" : ""}
      <p>تخلّص من كل أحجارك أولًا لتفوز بالجولة. تُجمع النقاط حتى يبلغ أحد اللاعبين الحد.</p>
      <p style="margin-top:14px"><b>عدد اللاعبين</b></p>
      ${seg("segPlayers", [[2,"٢ لاعبين"],[3,"٣ لاعبين"],[4,"٤ لاعبين"]], UI.numPlayers)}
      <p style="margin-top:6px"><b>النقاط للفوز بالمباراة</b></p>
      ${seg("segTarget", [[50,"٥٠"],[100,"١٠٠"],[150,"١٥٠"]], UI.targetScore)}
      <div class="row"><button type="button" class="btn" id="startBtn">ابدأ اللعب</button></div>
    </div>`);
  wireSeg(m,"segPlayers",v=>UI.numPlayers=v);
  wireSeg(m,"segTarget",v=>UI.targetScore=v);
  $("#startBtn").onclick=startSolo;
  if(snap.inApp){
    const say=(text,bad)=>{ const l=$("#togetherLine"); l.hidden=!text; l.textContent=text||""; l.classList.toggle("bad",!!bad); };
    const hold=on=>["roomCreate","roomJoin","tourCreate","tourJoin"].forEach(id=>{ const b=document.getElementById(id); if(b) b.disabled=on; });
    const go=(p, ok, words)=>{ hold(true); p.then(code=>say(ok(code)), e=>{ hold(false); const c=R.codeOf(e); if(c!=="cancelled") say(words[c]||"ما صارت؛ جرّب مرة ثانية.", true); else say(""); }); };
    $("#roomCreate").onclick=()=>{ say("دا نسوّي الغرفة…"); go(UI.room.enter("create", $("#friendsOnly").checked?"friends":"private"), c=>`الغرفة ${c||""} جاهزة.`, ROOM_WORDS); };
    $("#roomJoin").onclick=()=>go(UI.room.enter("join"), c=>`الغرفة ${c||""} جاهزة.`, ROOM_WORDS);
    if(snap.tournaments){
      $("#tourCreate").onclick=()=>go(UI.room.enterTournament("create"), c=>`البطولة ${c||""} جاهزة.`, TOURNAMENT_WORDS);
      $("#tourJoin").onclick=()=>go(UI.room.enterTournament("join"), c=>`البطولة ${c||""} جاهزة.`, TOURNAMENT_WORDS);
    }
  }
}

const ROOM_WORDS = {
  in_room:"إنت بغرفة هسّه.", not_a_room_game:"هاللعبة ما تنلعب بغرف.",
  in_another_room:"إنت بغرفة ثانية هسّه؛ ترجعلها من التنبيه تحت.", room_not_found:"ما لكينا غرفة بهالرمز.",
  room_closed:"هالغرفة انسدّت.", another_game:"هالرمز لغرفة لعبة ثانية.", room_full:"الغرفة مليانة.",
  room_started:"اللعب بدا بهالغرفة، ما تكدر تدخلها هسّه.", friends_only:"هالغرفة لأصدقاء المضيف بس.",
  kicked:"المضيف طلّعك من هالغرفة.", not_found:"هاللعبة مو متوفرة للغرف هسّه.", invalid_code:"هذا مو رمز غرفة.",
  offline:"ماكو اتصال؛ اتصل وجرّب مرة ثانية.", timeout:"الشبكة بطيئة؛ جرّب مرة ثانية.",
  not_supported:"الغرف تشتغل بس داخل تطبيق گعدة.", unknown_action:"حدّث گعدة حتى تسوّي غرفة من داخل اللعبة.",
};
const TOURNAMENT_WORDS = {
  in_room:"إنت بغرفة هسّه.", not_a_room_game:"هاللعبة ما تنلعب ببطولات.", not_found:"هاللعبة مو متوفرة للبطولات هسّه.",
  invalid_code:"هذا مو رمز بطولة.", another_game:"هالرمز لبطولة لعبة ثانية.", tournament_not_found:"ما لكينا بطولة بهالرمز.",
  tournament_closed:"هالبطولة خلصت.", tournament_started:"هالبطولة بدت، ما تكدر تدخلها هسّه.",
  tournament_full:"هالبطولة مليانة.", friends_only:"هالبطولة لأصدقاء المنظّم بس.", removed:"المنظّم طلّعك من هالبطولة.",
  offline:"ماكو اتصال؛ اتصل وجرّب مرة ثانية.", timeout:"الشبكة بطيئة؛ جرّب مرة ثانية.",
  not_supported:"البطولات تشتغل بس داخل تطبيق گعدة.", unknown_action:"حدّث گعدة حتى تسوّي بطولة من داخل اللعبة.",
};

/* صالة الغرفة: صاحبها يختار حد النقاط ويبدأ، والباقي ينتظرون */
function openLobby(){
  const r=UI.snap.room, host=r.hostId===r.you;
  const list=r.players.map(p=>`<div>${escapeHtml(p.name)}${p.id===r.hostId?" 👑":""}${p.id===r.you?" (إنت)":""}</div>`).join("");
  const key="lobby:"+host+":"+r.players.map(p=>p.id).join();
  const m=openModal(key, `
    <h2>لعبة الدومينو</h2>
    <p>كل واحد على موبايله. الأحجار مخفية عن الباقين.</p>
    <div class="rules" style="text-align:center" id="lobbyPlayers">${list}</div>
    ${host ? `
      <p style="margin-top:12px"><b>النقاط للفوز بالمباراة</b></p>
      ${seg("segRoomTarget", [[50,"٥٠"],[100,"١٠٠"],[150,"١٥٠"]], UI.roomTarget)}
      <div class="row"><button type="button" class="btn" id="roomStart">ابدأ المباراة</button></div>
      <p class="line" id="lobbyLine">${r.players.length<2?"ننتظر لاعب ثاني يدخل…":""}</p>`
    : `<p class="line">ننتظر صاحب الغرفة يبدأ…</p>`}
  `);
  if(host){
    wireSeg(m,"segRoomTarget",v=>UI.roomTarget=v);
    $("#roomStart").onclick=()=>UI.room.start({target:UI.roomTarget});
    $("#roomStart").disabled = r.players.length<2;
  }
}

/* نهاية جولة أو مباراة */
function openRoundOver(v){
  const res=v.result; if(!res) return;
  const w=res.winner;
  // الأسماء من موبايلات ثانية: تنكتب نص، مو HTML
  const N=i=>escapeHtml(nameOf(v,i));
  const title = res.blocked
    ? `🔒 انغلقت اللعبة! ${w===v.seat?"عندك أقل النقاط وفزت.":N(w)+" يملك أقل النقاط ويفوز."}`
    : `🎉 ${w===v.seat?"تخلّصت من كل الأحجار وفزت بالجولة!":N(w)+" تخلّص من كل الأحجار وفاز بالجولة!"}`;
  const hands = res.hands.map((h,i)=>`${N(i)}: ${sum(h)}`).join(" · ");
  const sub = res.blocked ? `${hands} — ‏+${res.gained}` : `+${res.gained} نقطة`;
  const host = UI.mode==="room" && UI.snap.room.hostId===UI.snap.room.you;
  if(v.phase==="match"){
    const order=v.players.map((p,i)=>({p,i})).sort((a,b)=>b.p.score-a.p.score);
    const champ=v.winner;
    const keys = UI.mode==="solo"
      ? `<button type="button" class="btn" id="againBtn">مباراة جديدة</button>`
      : host ? `<button type="button" class="btn" id="resultsBtn">النتائج</button>` : `<p class="line">ننتظر صاحب الغرفة يعرض النتائج…</p>`;
    openModal("match:"+v.round, `
      <h2>🏆 انتهت المباراة</h2>
      <p>${champ===v.seat?"بلغت":N(champ)+" بلغ"} ${v.players[champ].score} نقطة ${champ===v.seat?"وفزت":"وفاز"} بالمباراة!</p>
      <div class="rules" style="text-align:center">
        ${order.map((x,k)=>`<div>${["🥇","🥈","🥉","٤"][k]} ${N(x.i)} — <b>${x.p.score}</b></div>`).join("")}
      </div>
      <div class="row">${keys}</div>`);
    if(UI.mode==="solo") $("#againBtn").onclick=()=>{ closeModal(); openSetup(); };
    else if(host) $("#resultsBtn").onclick=()=>UI.room.finish();
  } else {
    openModal("round:"+v.round, `
      <h2>${title}</h2>
      <p>${sub}</p>
      <div class="rules" style="text-align:center">
        ${v.players.map((p,i)=>`<div>${N(i)} — <b>${p.score}</b> / ${v.target}</div>`).join("")}
      </div>
      <div class="row"><button type="button" class="btn" id="nextBtn">الجولة التالية</button></div>
      <p class="line" id="nextLine"></p>`);
    $("#nextBtn").onclick=()=>{ $("#nextBtn").disabled=true; act({type:"next"}); };
  }
}

/* انتهت الجولة بالغرفة: ترتيب گعدة، والرجوع للغرفة */
function openEnded(){
  const snap=UI.snap, r=snap.room;
  const nameById=id=>{ const p=r && r.players.find(x=>x.id===id); return p ? (id===r.you?"إنت":p.name) : "لاعب"; };
  const rows=(snap.results||[]).slice().sort((a,b)=>(a.rank||0)-(b.rank||0));
  const m=openModal("ended", `
    <h2>خلصت الجولة</h2>
    <div class="rules" style="text-align:center">
      ${rows.length ? rows.map(x=>`<div>#${x.rank||"-"} ${escapeHtml(nameById(x.player))} — <b>${x.score}</b></div>`).join("") : "<div>ما انحسبت نتيجة لهالجولة.</div>"}
    </div>
    <div class="row"><button type="button" class="btn" id="backBtn">رجوع للغرفة</button></div>`);
  m.querySelector("#backBtn").onclick=()=>UI.room.close();
}

/* ====================== سحب القطعة (يعمل باللمس والماوس) ====================== */
let drag = null; // {idx, tile, ghost, origin, gw, gh}

function startDrag(ev, idx, te){
  const v=currentView();
  if(!myTurn(v)) return;
  const t = v.hand[idx];
  if(!canPlayTile(v,t)) return;
  ev.preventDefault();

  UI.selected = idx; UI.pendingTile = t;

  // أنشئ نسخة طائرة تتبع الإصبع
  const ghost = tileEl(t[0], t[1], "h");
  ghost.classList.add("ghost");
  document.body.appendChild(ghost);
  const r = te.getBoundingClientRect();
  ghost.style.width = r.width+"px"; ghost.style.height = r.height+"px";

  drag = { idx, tile:t, ghost, origin:te, gw:r.width, gh:r.height };
  te.classList.add("dragging");
  moveGhost(ev.clientX, ev.clientY);
  renderBoard(v);             // أضئ الرؤوس الصالحة
  $("#endpick").textContent = "اسحب الحجر إلى الرأس المضيء وافلته";

  window.addEventListener("pointermove", onDragMove, {passive:false});
  window.addEventListener("pointerup", onDragEnd);
  window.addEventListener("pointercancel", onDragEnd);
}

function moveGhost(x, y){
  if(!drag) return;
  drag.ghost.style.left = (x - drag.gw/2) + "px";
  drag.ghost.style.top  = (y - drag.gh/2) + "px";
}

/* الرأس الصالح للإفلات تحت المؤشّر (حجر .droplive أو خانة البداية) */
function zoneUnder(x, y){
  const e = document.elementFromPoint(x, y);
  if(!e) return null;
  return e.closest(".droplive, .startslot.active");
}

/* حوّل هدف الإفلات إلى طرف محدَّد صالح (يعالج حالة الحجر الواحد ذي الطرفين) */
function resolveSide(z, x){
  if(!z || !drag) return null;
  const v=currentView(); if(!v) return null;
  const ends = playableEnds(v, drag.tile);
  const side = z.dataset.side;
  if(side==="both"){
    if(ends.length===1) return ends[0];
    const r=z.getBoundingClientRect();
    return (x < r.left + r.width/2) ? "left" : "right";   // النصف الأقرب
  }
  return ends.includes(side) ? side : null;
}

function onDragMove(ev){
  if(!drag) return;
  ev.preventDefault();
  moveGhost(ev.clientX, ev.clientY);
  const z = zoneUnder(ev.clientX, ev.clientY);
  document.querySelectorAll(".over").forEach(d=>{ if(d!==z) d.classList.remove("over"); });
  if(z) z.classList.add("over");
}

function onDragEnd(ev){
  if(!drag) return;
  const z = zoneUnder(ev.clientX, ev.clientY);
  const side = resolveSide(z, ev.clientX);
  drag.ghost.remove();
  drag.origin.classList.remove("dragging");
  window.removeEventListener("pointermove", onDragMove);
  window.removeEventListener("pointerup", onDragEnd);
  window.removeEventListener("pointercancel", onDragEnd);
  const tile=UI.pendingTile;
  drag = null;
  UI.selected=null; UI.pendingTile=null;
  if(side && tile){ act({type:"play", tile, side}); }
  else draw();  // أُفلت خارج الرأس → إلغاء
}

/* ====================== الرسم / العرض ====================== */
function setStatus(s){ $("#status").textContent=s; }

/* الضلع القصير للحجر (نصف الحجر) بالبكسل — يطابق أحجام CSS حسب الشاشة */
function tileShort(){
  const w=window.innerWidth;
  if(w<=380) return 30;
  if(w<=560) return 36;
  return 50;
}

/* ====== محرّك تخطيط المسار: حلقة مستطيلة/مربّعة كاملة بأربعة أضلاع وزوايا ٩٠° ======
   يستقبل السلسلة المنطقية (كل حجر [p,q] حيث q_i == p_{i+1}).
   يسير المسار باتجاه عقارب الساعة (يمين ← أسفل ← يسار ← أعلى) مكوّنًا مستطيلًا،
   ثم يلتفّ للداخل حلزونيًا إن زادت الأحجار — بلا تداخل، مع تطابق الأرقام عند كل
   وصلة وكل زاوية. لا تُختلق أحجار ولا تُغيَّر قيمها؛ الطرفان المفتوحان يظهران كما هما. */
const _DIRS=[[1,0],[0,1],[-1,0],[0,-1]];  // R,D,L,U باتجاه عقارب الساعة
const _cw=d=>(d+1)%4;

function computeLayout(chain){
  const TS = tileShort();
  const N = chain.length;
  if(N===0) return { out:[], totalW:0, totalH:0, TS };
  // ضلع أكبر بواحد يمنع انغلاق الحلقة على نفسها مع الأحجار المتشابهة (بلا تداخل)
  const side = Math.max(2, Math.ceil(Math.sqrt(N))+1);
  const occ = new Set();
  const key=(c,r)=>c+","+r;
  const free = c => !occ.has(key(c[0],c[1]));

  // سجل حجر من خليتيه المرسومتين (الداخلة ثم الخارجة)
  function rec(cin, cout, vIn, vOut, dbl){
    let type,a,b,outIdx;
    if(cin[1]===cout[1]){ type='h';
      if(cin[0]<cout[0]){ a=vIn; b=vOut; outIdx=1; } else { a=vOut; b=vIn; outIdx=0; }
    } else { type='v';
      if(cin[1]<cout[1]){ a=vIn; b=vOut; outIdx=1; } else { a=vOut; b=vIn; outIdx=0; }
    }
    return { cin, cout, type, a, b, outIdx, dbl,
             minC:Math.min(cin[0],cout[0]), minR:Math.min(cin[1],cout[1]),
             cw:(type==='h'?2:1), ch:(type==='h'?1:2) };
  }

  const out = new Array(N);
  let dir=0, prevOut, sinceTurn=1;

  // الحجر الأول
  {
    const [p,q]=chain[0];
    if(p===q){ // دبل في البداية: عموديًا متقاطعًا، بروزه للأعلى (خارج المسار)
      out[0]=rec([0,0],[0,-1],p,q,true); out[0].runCell=[0,0];
      occ.add(key(0,0)); occ.add(key(0,-1)); prevOut=[0,0];
    } else {
      out[0]=rec([0,0],[1,0],p,q,false); out[0].runCell=[1,0];
      occ.add(key(0,0)); occ.add(key(1,0)); prevOut=[1,0];
    }
  }

  // يحاول وضع حجر باتجاه السير md؛ الدبل يُرسم متقاطعًا ببروزٍ للجهة الخارجية
  function tryPlace(md, p, q, isD){
    const d=_DIRS[md];
    const rc=[prevOut[0]+d[0], prevOut[1]+d[1]];     // خلية المسار (تتّصل بالسابق وتُكمل للتالي)
    if(isD){
      if(!free(rc)) return null;
      // البروز الخارجي أولًا (يسار اتجاه السير = خارج الحلقة) ثم الداخلي
      for(const pd of [ (md+3)%4, _cw(md) ]){
        const v=_DIRS[pd]; const oh=[rc[0]+v[0], rc[1]+v[1]];
        if(free(oh)){ const r=rec(rc,oh,p,q,true); r.runCell=rc; return {rec:r, prevOut:rc, cells:[rc,oh]}; }
      }
      // تعذّر التقاطع → ضعه مستقيمًا (نادر)
      const cout=[rc[0]+d[0], rc[1]+d[1]];
      if(free(cout)){ const r=rec(rc,cout,p,q,true); r.runCell=cout; return {rec:r, prevOut:cout, cells:[rc,cout]}; }
      return null;
    } else {
      const cout=[rc[0]+d[0], rc[1]+d[1]];
      if(free(rc)&&free(cout)){ const r=rec(rc,cout,p,q,false); r.runCell=cout; return {rec:r, prevOut:cout, cells:[rc,cout]}; }
      return null;
    }
  }

  for(let i=1;i<N;i++){
    const [p,q]=chain[i]; const isD=p===q;
    const wantTurn = sinceTurn>=side;
    const order = wantTurn ? [_cw(dir), dir, (dir+2)%4, (dir+3)%4]
                           : [dir, _cw(dir), (dir+2)%4, (dir+3)%4];
    let placed=null, chosenMd=null;
    for(const md of order){ const r=tryPlace(md,p,q,isD); if(r){ placed=r; chosenMd=md; break; } }
    if(!placed){ // احتياط نادر جدًا
      const d=_DIRS[dir]; const rc=[prevOut[0]+d[0], prevOut[1]+d[1]];
      const cout=[rc[0]+d[0], rc[1]+d[1]];
      placed={ rec:rec(rc,cout,p,q,isD), prevOut:cout, cells:[rc,cout] }; placed.rec.runCell=cout; chosenMd=dir;
    }
    out[i]=placed.rec;
    for(const c of placed.cells) occ.add(key(c[0],c[1]));
    sinceTurn = (chosenMd===dir) ? sinceTurn+1 : 0;
    dir = chosenMd; prevOut = placed.prevOut;
  }

  // تطبيع الإحداثيات إلى موجبة وتحويلها لبكسل
  let minC=Infinity,minR=Infinity,maxC=-Infinity,maxR=-Infinity;
  for(const o of out){ minC=Math.min(minC,o.minC); minR=Math.min(minR,o.minR);
    maxC=Math.max(maxC,o.cin[0],o.cout[0]); maxR=Math.max(maxR,o.cin[1],o.cout[1]); }
  for(const o of out){
    o.x=(o.minC-minC)*TS; o.y=(o.minR-minR)*TS;
    o.w=o.cw*TS; o.h=o.ch*TS;
  }
  return { out, totalW:(maxC-minC+1)*TS, totalH:(maxR-minR+1)*TS, TS };
}

/* رسم الطاولة: يضع كل حجر بموضعه المحسوب، يميّز الرأسين، ويبرز النصف المفتوح. */
function renderBoard(v){
  const bd=$("#board"); bd.innerHTML=""; bd.style.transform="scale(1)";
  if(!v){ bd.classList.add("empty"); bd.style.width=""; bd.style.height=""; return; }
  const mine = myTurn(v);
  const sel = UI.pendingTile;
  bd.classList.toggle("empty", v.board.length===0);

  if(v.board.length===0){
    bd.style.width=""; bd.style.height="";
    const slot=el("div","startslot"+((mine&&sel)?" active":""));
    slot.dataset.side="left"; slot.textContent="ضع أول حجر هنا";
    bd.appendChild(slot);
    requestAnimationFrame(fitBoard);
    return;
  }

  const {out,totalW,totalH} = computeLayout(v.board);
  bd.style.width = totalW+"px";
  bd.style.height = totalH+"px";

  const n=v.board.length;
  const leftOK  = mine && sel && playableEnds(v,sel).includes("left");
  const rightOK = mine && sel && playableEnds(v,sel).includes("right");

  out.forEach((c,i)=>{
    const te=tileEl(c.a, c.b, c.type);
    te.style.position="absolute";
    te.style.left=c.x+"px"; te.style.top=c.y+"px";
    te.style.width=c.w+"px"; te.style.height=c.h+"px";
    // الرأس الأيسر = الحجر 0 ، نصفه المفتوح هو الجهة غير المتّصلة بالتالي
    if(i===0){
      te.classList.add("endtile"); te.dataset.side="left";
      te.children[1-out[0].outIdx].classList.add("open");
      if(n===1){ te.children[out[0].outIdx].classList.add("open"); te.dataset.side="both"; }
      if(leftOK) te.classList.add("droplive");
    }
    // الرأس الأيمن = آخر حجر ، نصفه المفتوح هو الجهة المتّجهة للخارج (q)
    if(i===n-1 && n>1){
      te.classList.add("endtile"); te.dataset.side="right";
      te.children[c.outIdx].classList.add("open");
      if(rightOK) te.classList.add("droplive");
    }
    if(n===1 && (leftOK||rightOK)) te.classList.add("droplive");
    bd.appendChild(te);
  });

  requestAnimationFrame(fitBoard);
}

/* يُصغّر الكتلة بمقدار مناسب لتدخل كامل الصندوق بلا تمرير ولا قص */
function fitBoard(){
  const wrap=$(".boardwrap"), bd=$("#board");
  if(!wrap||!bd) return;
  bd.style.transform="scale(1)";
  const bw=bd.offsetWidth||1, bh=bd.offsetHeight||1;
  const availW=wrap.clientWidth-18, availH=wrap.clientHeight-18;
  const s=Math.min(1, availW/bw, availH/bh);
  bd.style.transform=`scale(${s})`;
}

/* سطر الحالة: دور منو، وآخر ثواني الدور بالغرفة */
function statusOf(v){
  if(v.phase!=="play") return "خلصت الجولة";
  const who=v.turn===v.seat ? null : nameOf(v,v.turn);
  let line;
  if(who) line = UI.mode==="solo" ? `${who} يفكّر...` : `دور ${who}…`;
  else if(handHasMove(v)) line="دورك — اسحب حجرًا إلى الطاولة";
  else if(v.boneyard>0) line="لا يمكنك اللعب — اسحب من الكومة";
  else line="لا يمكنك اللعب ولا توجد أحجار — مرر الدور";
  if(UI.mode==="room"){
    const r=UI.snap.room, left=Math.ceil((r.until-(Date.now()+UI.snap.clockOffset))/1000);
    if(left>=0 && left<=15) line+=` · باقي ${left} ث`;
  }
  return line;
}

/* ما تغيّر من آخر رسمة: سطر بالسجل لكل حدث جديد */
function logEvents(v){
  const last=v.last; if(!last || last.n<=UI.lastSeen) return;
  UI.lastSeen=last.n;
  const who=nameOf(v,last.seat);
  if(last.kind==="play") log(`${who} لعب [${last.tile[0]}|${last.tile[1]}]`);
  else if(last.kind==="draw") log(`${who} سحب حجرًا`);
  else if(last.kind==="pass") log(`${who} مرّر الدور`);
  else if(last.kind==="round") log(`بدأت جولة جديدة — يبدأ ${who}`);
  else if(last.kind==="end" && v.result) log(`${nameOf(v,v.result.winner)} فاز بالجولة (+${v.result.gained})`);
}

function draw(){
  const snap=UI.snap;
  renderMatch();
  if(UI.mode==="room"){
    if(snap.phase==="ended"){ openEnded(); return; }
    const r=snap.room;
    if(!r){ setStatus("ننتظر موبايل صاحب الغرفة…"); renderEmpty(); return; }
    if(r.stage==="lobby"){ setStatus("صالة الغرفة"); renderEmpty(); openLobby(); return; }
  }
  const v=currentView();
  if(!v){ renderEmpty(); return; }
  if(UI.modalKey.startsWith("lobby")) closeModal();
  logEvents(v);
  if(v.phase==="round"||v.phase==="match") openRoundOver(v);
  else if(UI.modalKey.startsWith("round:")||UI.modalKey.startsWith("match:")) closeModal();
  render(v);
}

function renderEmpty(){
  $("#scoreboard").innerHTML=""; renderBoard(null);
  $("#hand").innerHTML=""; $("#handInfo").textContent=""; $("#endpick").textContent="";
  $("#ends").textContent=""; $("#drawBtn").disabled=true; $("#passBtn").disabled=true;
}

function render(v){
  // لوحة النتائج
  const sb=$("#scoreboard"); sb.innerHTML="";
  v.players.forEach((p,i)=>{
    const on = i===v.turn && v.phase==="play";
    const away = v.connected && !v.connected[i];
    const c=el("div","pcard"+(on?" turn":"")+(i===v.seat?" me":"")+(away?" away":""));
    c.innerHTML=`<div class="nm">${on?'<span class="dot"></span>':''}${escapeHtml(nameOf(v,i))}</div>
      <div class="meta">${away?"غايب · ":""}أحجار: ${p.count}</div>
      <div class="sc">${p.score}</div>`;
    sb.appendChild(c);
  });

  const mine = myTurn(v);
  setStatus(statusOf(v));
  renderBoard(v);
  $("#ends").textContent = `في الكومة: ${v.boneyard}`;

  // يد اللاعب (لا نعيد بناءها والحجر بإصبعك)
  if(drag) return;
  const hd=$("#hand"); hd.innerHTML="";
  if(v.seat<0){
    $("#handInfo").textContent="تتفرّج على هالجولة";
  } else {
    v.hand.forEach((t,idx)=>{
      const can = canPlayTile(v,t);
      const te=tileEl(t[0],t[1], "h");   // اليد دائمًا أفقية لتبقى مُدمجة
      if(mine){
        if(can){ te.classList.add("playable"); te.addEventListener("pointerdown", ev=>startDrag(ev, idx, te)); }
        else te.classList.add("dead");
        if(UI.selected===idx) te.classList.add("selected");
      } else te.classList.add("dead");
      hd.appendChild(te);
    });
    $("#handInfo").textContent = `${v.hand.length} حجر · مجموع النقاط ${sum(v.hand)}`;
  }

  $("#endpick").textContent = mine && handHasMove(v) ? "اسحب الحجر بإصبعك نحو الرأس الذهبي المضيء وافلته" : "";
  $("#drawBtn").disabled = !v.canDraw;
  $("#passBtn").disabled = !v.canPass;
}

/* شريط البطولة فوق اللوحة: اسمها، شنو على المحك، والنتيجة لحد هسه */
function renderMatch(){
  const bar=$("#match"), m=UI.mode==="room" && UI.snap && UI.snap.match;
  bar.hidden=!m; if(!m) return;
  const me=UI.snap.room && UI.snap.room.you;
  const stage = m.format==="knockout"
    ? (m.stages-m.stage===0?"النهائي":m.stages-m.stage===1?"نصف النهائي":m.stages-m.stage===2?"ربع النهائي":"الدور "+m.stage)+" · "+(m.bestOf>1?"الأفضل من "+m.bestOf:"جولة وحدة تحسمها")
    : "الجولة "+Math.min(m.played+1, Math.max(m.rounds,1))+" من "+m.rounds;
  const top=(m.tally||[])[0];
  const lead = top ? ` · يتصدّر ${top.player===me?"إنت":escapeHtml(top.nickname||"لاعب")} (${top.points|0})` : "";
  bar.innerHTML=`🏆 <b>${escapeHtml(m.name||"البطولة")}</b> · ${stage}${lead}`;
}

/* أزرار الشريط العلوي حسب الوضع */
function renderToolbar(){
  const room = UI.mode==="room";
  const host = room && UI.room && UI.room.isHost();
  $("#newBtn").hidden = room;
  $("#endBtn").hidden = !(host && UI.snap.room && UI.snap.room.stage==="playing");
}

/* ====================== السجل والتنبيهات ====================== */
function log(msg){
  const b=$("#logBox");
  const line=el("div"); line.textContent="• "+msg;
  b.prepend(line);
  while(b.children.length>40) b.removeChild(b.lastChild);
}

let toastTimer=0;
function toast(text, bad){
  const t=$("#toast"); t.textContent=text; t.classList.toggle("bad",!!bad); t.classList.add("show");
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove("show"), 2600);
}

/* العنوان يرمش إذا إجا دورك والصفحة مخفية */
let titleTimer=0, baseTitle="";
function flashTitle(){
  if(!document.hidden) return;
  clearInterval(titleTimer); baseTitle=baseTitle||document.title;
  let on=false;
  titleTimer=setInterval(()=>{ on=!on; document.title=on?"🔔 دورك":baseTitle; }, 900);
  const stop=()=>{ clearInterval(titleTimer); document.title=baseTitle; baseTitle=""; document.removeEventListener("visibilitychange",stop); };
  document.addEventListener("visibilitychange",stop);
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

/* ====================== القوانين ====================== */
function openRules(){
  openModal("rules", `
    <h2>قوانين اللعبة</h2>
    <ul class="rules">
      <li>تُلعب بمجموعة ٢٨ حجرًا، كل حجر مقسوم لقسمين يحملان رقمين من ٠ إلى ٦.</li>
      <li>يحصل كل لاعب على ٧ أحجار، والباقي يوضع في «الكومة».</li>
      <li>يبدأ حامل أعلى «دبل»، وإن لم يوجد فحامل أعلى مجموع حجر.</li>
      <li>في دورك ضع حجرًا يطابق أحد طرفَي الخط (الأيسر أو الأيمن).</li>
      <li>إن لم تملك حجرًا مناسبًا اسحب من الكومة حتى تجد، فإن فرغت الكومة مرّر دورك.</li>
      <li>تنتهي الجولة بتخلّص لاعب من كل أحجاره، أو بانغلاق اللعبة (لا أحد يستطيع اللعب).</li>
      <li>عند الانغلاق يفوز صاحب أقل مجموع نقاط في يده.</li>
      <li>الفائز يكسب مجموع نقاط الأحجار المتبقية لدى الخصوم.</li>
      <li>تستمر الجولات حتى يبلغ لاعب النقاط المطلوبة فيفوز بالمباراة.</li>
      <li>بغرفة گعدة: كل دور إله ٤٥ ثانية؛ إذا خلصت، أو طلع اللاعب، يلعبه الكمبيوتر بداله.</li>
    </ul>
    <div class="row"><button type="button" class="btn" id="closeRules">حسنًا</button></div>`);
  $("#closeRules").onclick=()=>{ closeModal(); draw(); };
}

/* ====================== ربط الأزرار ====================== */
$("#newBtn").onclick=openSetup;
$("#rulesBtn").onclick=openRules;
$("#drawBtn").onclick=()=>act({type:"draw"});
$("#passBtn").onclick=()=>act({type:"pass"});
$("#logBtn").onclick=()=>$("#logBox").classList.toggle("show");
$("#match").onclick=()=>UI.room && UI.room.openTournament();
$("#endBtn").onclick=()=>{
  const m=openModal("end", `
    <h2>إنهاء الجولة؟</h2>
    <p>تنحسب النقاط مثل ما هي هسه.</p>
    <div class="row"><button type="button" class="btn" id="endYes">إنهاء</button><button type="button" class="btn ghost" id="endNo">رجوع</button></div>`);
  m.querySelector("#endYes").onclick=()=>UI.room.finish();
  m.querySelector("#endNo").onclick=()=>{ closeModal(); draw(); };
};
// روابط الموقع: داخل گعدة تنفتح برّا التطبيق
document.querySelectorAll("a[target=_blank]").forEach(a=>a.addEventListener("click", ev=>{
  if(UI.room && UI.room.openUrl(a.href)) ev.preventDefault();
}));

/* أعد ثني الأفعى عند تغيّر حجم الشاشة/الدوران */
let rzT;
window.addEventListener("resize", ()=>{
  if(drag) return;
  clearTimeout(rzT); rzT=setTimeout(()=>renderBoard(currentView()), 120);
});

/* عدّاد آخر ثواني الدور، وموعد الجولة الجاية، بالغرفة */
setInterval(()=>{
  if(UI.mode!=="room" || !UI.snap.room) return;
  const v=currentView(); if(!v) return;
  if(v.phase==="play") setStatus(statusOf(v));
  const nl=document.getElementById("nextLine");
  if(nl && v.phase==="round"){
    const left=Math.max(0, Math.ceil((UI.snap.room.until-(Date.now()+UI.snap.clockOffset))/1000));
    nl.textContent=`الجولة الجاية تتوزّع بعد ${left} ثانية`;
  }
}, 1000);

/* بدء: نسأل گعدة إذا انفتحت اللعبة بغرفة؛ برّاها، اللعب ضد الكمبيوتر */
setStatus("مرحبًا بك!");
UI.room = R.connect(onRoom);
})();
