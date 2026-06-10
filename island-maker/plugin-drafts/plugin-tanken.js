(()=>{
"use strict";
if(!window.ISLE) return;
const I = window.ISLE;
try{

  // ================================================================
  //  探検家 (tanken) — a tiny explorer documents the islands
  // ================================================================
  const KEY = "isle-tanken-v1";
  const esc = s => String(s).replace(/[&<>"']/g, c =>
    ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const hhmm = t => {
    const d = new Date(t);
    return String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0");
  };

  // ---- corpora -----------------------------------------------------
  const REACT = [
    "味はする。",
    "二度目はないが、一度目でよかった。",
    "持ち帰りは断られた。理由は聞きそびれた。",
    "うまい。記録のため、もう一つ食べた。記録は大事だ。",
    "噛むほどに謎が深まったので、飲み込んで解決した。",
    "涙が出た。味のせいかどうかは調査中である。",
    "『そういうものです』と説明された。納得するほかなかった。",
    "食べ方を三人に聞いたら、三通りの答えが返ってきた。",
    "島の人は毎日これを食べているという。心から尊敬する。",
    "香りで一度、味で二度おどろいた。合計三度である。",
    "うまいかどうかより先に、強いと思った。",
    "保存はきかないらしい。食べてみて、理由がわかった。",
  ];
  const OBS = [
    (i,v)=>`最高地点（標高${i.peak}m）に登頂した。登った。眺めた。降りた。以上である。`,
    (i,v)=>`標高${i.peak}mの頂から海が見えた。島なので当然だが、良いものは良い。`,
    (i,v)=>`${v.name}の人口は${v.pop}とのこと。数え直す勇気は出なかった。`,
    (i,v)=>`面積は約${i.area}km²。歩いた体感ではもう少し広い。靴のせいかもしれない。`,
    (i,v)=>`言い伝えも採集した。曰く——${i.legend}　手帳には「要検証」と書いたが、検証の予定はない。`,
    (i,v)=>`島影を写生した。三枚描いて、三枚とも違う島になった。海図とはそういうものである。`,
  ];
  const REVISIT = [
    (i,v)=>`再訪。前より木が増えた気がするが、数えると増えるらしいので数えない。`,
    (i,v)=>`再訪。${v.name}の犬に覚えられていた。探検家冥利に尽きる。`,
    (i,v)=>`再訪。名産「${v.specialty}」に再挑戦した。成長していたのは、私ではなく味の方だった。`,
    (i,v)=>`再訪。新しい発見は特になし。「発見がない」という発見を、記録としてここに残す。`,
    (i,v)=>`再訪。前回の手帳の誤字を直しに来た。直した。良い航海だった。`,
    (i,v)=>`再訪。浜の砂は前回と同じ並びに見えた。たぶん違うが、見えたものは見えたのである。`,
  ];
  const SIGNOFF = [
    "本日もよい風でした。",
    "インクの残りが、すこし心配です。",
    "次の島は、たぶん右のほうにあります。",
    "帆の継ぎ当てがひとつ増えました。勲章です。",
    "迷ったぶんだけ、地図はくわしくなります。",
    "靴に入った砂は、出さずに取っておくことにしました。",
  ];

  // ---- journal store ----------------------------------------------
  let entries = [];
  try{
    const raw = localStorage.getItem(KEY);
    if(raw){
      const j = JSON.parse(raw);
      if(j && Array.isArray(j.entries))
        entries = j.entries.filter(e => e && typeof e.txt === "string"
          && typeof e.name === "string" && typeof e.t === "number").slice(0, 80);
    }
  }catch(err){ console.error("[tanken] 手帳の読込に失敗", err); }
  function persist(){
    try{ localStorage.setItem(KEY, JSON.stringify({entries})); }
    catch(err){ console.error("[tanken] 手帳の保存に失敗", err); }
  }
  function addEntry(name, txt){
    entries.unshift({t: Date.now(), name: String(name), txt: String(txt)});
    if(entries.length > 80) entries.length = 80;
    persist();
    if(overlay.classList.contains("tanken-show")) renderJournal();
  }

  function visitText(isl){
    try{
      let s = `${isl.name}に上陸。`;
      const v = isl.villages && isl.villages.length ? I.pick(isl.villages) : null;
      if(v) s += `${v.name}の名産「${v.specialty}」を試食した。${I.pick(REACT)}`;
      else  s += `村はまだ無い。誰もいない浜に、とりあえず挨拶をしておいた。`;
      if(!v || Math.random() < .55){
        s += I.pick(OBS)(isl, v || {name:"無人の浜", pop:"0人（推定）", specialty:"静けさ"});
      }
      return s;
    }catch(err){ console.error("[tanken] entry", err); return `${isl.name}に上陸。詳細は後日記す。`; }
  }
  function revisitText(isl){
    try{
      const v = isl.villages && isl.villages.length ? I.pick(isl.villages)
        : {name:"浜", pop:"0人（推定）", specialty:"静けさ"};
      return I.pick(REVISIT)(isl, v);
    }catch(err){ console.error("[tanken] entry", err); return `再訪。良い島は、二度目も良い。`; }
  }

  // ---- the boat ----------------------------------------------------
  const boat = I.mk("g", {class:"tanken-boat"});
  boat.setAttribute("pointer-events", "none");
  const bBody = I.mk("g");
  const wake = I.mk("path", {d:"M -12 4 q -7 -2 -13 0 M -11 6 q -8 2 -16 1",
    stroke:"#ffffff", "stroke-width":1.3, fill:"none", "stroke-linecap":"round", opacity:0});
  const hull = I.mk("path", {d:"M -11 2.5 L 11 2.5 L 7 7 L -7 7 Z",
    fill:"#a9805a", stroke:"#5d4636", "stroke-width":1, "stroke-linejoin":"round"});
  const mast = I.mk("line", {x1:0, y1:2.5, x2:0, y2:-14, stroke:"#5d4636", "stroke-width":1.1});
  const sail = I.mk("path", {d:"M 1 1 L 1 -12.5 L 10 -2 Z",
    fill:"#ffffff", stroke:"#c9bfa8", "stroke-width":.8, "stroke-linejoin":"round"});
  const flag = I.mk("path", {d:"M 0 -14 L 6.5 -12.4 L 0 -10.8 Z", fill:"#c97b4a"});
  bBody.append(wake, hull, mast, sail, flag);
  boat.append(bBody);
  I.gFx.append(boat);

  // ---- explorer state ----------------------------------------------
  const visited = new Set();
  let pos = {x:(I.W || 900)*(.35 + Math.random()*.3), y:(I.H || 600)*(.55 + Math.random()*.2)};
  let state = "drift";          // drift | sail | land
  let target = null, targetIsl = null;
  let landIsl = null, landedAt = 0, landDur = 8000, landFx = null;
  let restUntil = 0, lastVisitId = 0;
  let face = 1;
  let seaStart = 0, seaNoted = false;

  function pickDrift(){
    const W = I.W || 900, H = I.H || 600;
    target = {x: 70 + Math.random()*(W - 140), y: 90 + Math.random()*(H - 170)};
  }
  function chooseTarget(){
    const isls = I.islands;
    if(!isls.length) return;
    let cand = isls.filter(s => !visited.has(s.id));
    if(!cand.length) cand = isls.filter(s => s.id !== lastVisitId);
    if(!cand.length) cand = isls.slice();
    targetIsl = I.pick(cand);
    const a = Math.atan2(pos.y - targetIsl.y, pos.x - targetIsl.x);
    const r = targetIsl.size*1.38 + 8;
    target = {x: targetIsl.x + Math.cos(a)*r, y: targetIsl.y + Math.sin(a)*r};
    state = "sail";
  }

  function makeLandFx(isl){
    const g = I.mk("g", {"pointer-events":"none"});
    const ux = pos.x - isl.x, uy = pos.y - isl.y, L = Math.hypot(ux, uy) || 1;
    const dx = ux/L, dy = uy/L, px = -dy, py = dx;
    // tiny anchor dot, just seaward of the bow
    g.append(I.mk("circle", {cx:(pos.x + dx*5).toFixed(1), cy:(pos.y + dy*5).toFixed(1),
      r:2.3, fill:"#2b3a45", stroke:"#f4ecd9", "stroke-width":1, opacity:.9}));
    // dotted footprints: beach -> interior -> back, slightly offset
    const steps = 7, beach = .92, inner = .34;
    const dot = (f, side, lane) => [
      isl.x + dx*isl.size*f + px*(side*1.5 + lane) + (Math.random()-.5)*1.2,
      isl.y + dy*isl.size*f + py*(side*1.5 + lane) + (Math.random()-.5)*1.2,
    ];
    const pts = [];
    for(let i=0;i<steps;i++)    pts.push(dot(beach - (beach-inner)*i/(steps-1), i%2 ? 1 : -1, 0));
    for(let i=steps-1;i>=0;i--) pts.push(dot(beach - (beach-inner)*i/(steps-1), i%2 ? -1 : 1, 3.6));
    pts.forEach((p, i) => {
      const c = I.mk("circle", {cx:p[0].toFixed(1), cy:p[1].toFixed(1), r:1.25, fill:"#6b4f37", opacity:0});
      g.append(c);
      try{ c.animate([{opacity:0},{opacity:.85}], {duration:200, delay:420 + i*150, fill:"forwards"}); }
      catch(e){ c.setAttribute("opacity", .8); }
    });
    try{ g.animate([{opacity:1},{opacity:0}], {duration:1100, delay:5900, fill:"forwards"}); }catch(e){}
    return g;
  }

  function beginLanding(now){
    const isl = targetIsl;
    targetIsl = null; target = null;
    state = "land"; landIsl = isl; landedAt = now;
    landDur = 7400 + Math.random()*1600;
    landFx = makeLandFx(isl);
    I.gFx.append(landFx);
    const re = visited.has(isl.id);
    visited.add(isl.id); lastVisitId = isl.id;
    try{ I.emit("explorer:visited", {island: isl}); }catch(err){ console.error("[tanken] emit", err); }
    addEntry(isl.name, re ? revisitText(isl) : visitText(isl));
  }
  function endLanding(now){
    if(landFx){
      const f = landFx; landFx = null;
      try{ f.animate([{opacity:1},{opacity:0}], {duration:600, fill:"forwards"}).onfinish = () => f.remove(); }
      catch(e){ f.remove(); }
    }
    landIsl = null; state = "drift"; target = null;
    // if every island has been surveyed, take a long lazy patrol before revisiting
    const allSeen = I.islands.length > 0 && I.islands.every(s => visited.has(s.id));
    restUntil = (now || performance.now()) + (allSeen ? 16000 + Math.random()*14000 : 1200 + Math.random()*1800);
  }

  function render(now){
    const bob = Math.sin(now/620)*1.3;
    boat.setAttribute("transform", `translate(${pos.x.toFixed(1)} ${(pos.y + bob).toFixed(1)})`);
    bBody.setAttribute("transform", `scale(${face} 1) rotate(${(Math.sin(now/780)*2.6).toFixed(2)})`);
  }

  function step(now, dt){
    const isls = I.islands;
    if(state === "land"){
      if(!landIsl || isls.indexOf(landIsl) < 0 || now - landedAt >= landDur) endLanding(now);
      else { wake.setAttribute("opacity", 0); render(now); return; }
    }
    if(state === "sail" && targetIsl && isls.indexOf(targetIsl) < 0){
      targetIsl = null; target = null; state = "drift";
    }
    if(!isls.length){
      state = "drift"; targetIsl = null;
      if(!seaStart) seaStart = now;
      if(!seaNoted && now - seaStart > 45000){
        seaNoted = true;
        addEntry("海上", "海ばかりである。それはそれでよい。");
      }
    }else{
      seaStart = 0; seaNoted = false;
      if(!targetIsl && now >= restUntil) chooseTarget();   // otherwise: lazy drift below
    }
    if(!target) pickDrift();
    const dx = target.x - pos.x, dy = target.y - pos.y, d = Math.hypot(dx, dy);
    const sailing = state === "sail";
    if(d < (sailing ? 5 : 16)){
      if(sailing && targetIsl) beginLanding(now);
      else target = null;
    }else{
      const sp = sailing ? 34 : 9;
      pos.x += dx/d*sp*dt; pos.y += dy/d*sp*dt;
      if(Math.abs(dx) > 2) face = dx >= 0 ? 1 : -1;
    }
    wake.setAttribute("opacity", sailing ? .55 : .22);
    render(now);
  }

  let lastT = performance.now();
  function tick(now){
    try{
      const dt = Math.min(Math.max((now - lastT)/1000, 0), 1.5);
      lastT = now;
      step(now, dt);
    }catch(err){ console.error("[tanken] tick", err); }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  I.on("island-removed", isl => {
    if(targetIsl && targetIsl.id === isl.id){ targetIsl = null; target = null; state = "drift"; }
    if(landIsl && landIsl.id === isl.id) endLanding();
  });
  I.on("cleared", () => {
    if(state === "land") endLanding();
    targetIsl = null; target = null; state = "drift";
  });

  // ---- journal modal -------------------------------------------------
  const style = document.createElement("style");
  style.textContent = `
    .tanken-overlay{position:fixed;inset:0;z-index:8;display:flex;align-items:center;justify-content:center;
      background:rgba(31,48,56,.38);opacity:0;pointer-events:none;transition:opacity .25s;}
    .tanken-overlay.tanken-show{opacity:1;pointer-events:auto;}
    .tanken-book{width:min(430px,92vw);max-height:76vh;display:flex;flex-direction:column;
      background:linear-gradient(135deg,#8a6242,#6e4c30);border:2px solid #5a3d26;border-radius:14px;
      padding:12px;box-shadow:0 18px 50px rgba(20,40,50,.45), inset 0 0 0 1.5px rgba(244,232,208,.25);
      transform:translateY(12px);transition:transform .25s;
      font-family:"Hiragino Kaku Gothic ProN","Yu Gothic",-apple-system,system-ui,sans-serif;}
    .tanken-overlay.tanken-show .tanken-book{transform:translateY(0);}
    .tanken-head{display:flex;align-items:center;gap:10px;padding:2px 4px 10px;color:#f4e8d0;}
    .tanken-title{font-weight:700;font-size:15px;letter-spacing:.08em;}
    .tanken-count{font-size:11px;background:rgba(244,232,208,.16);border:1px solid rgba(244,232,208,.35);
      border-radius:999px;padding:3px 10px;letter-spacing:.05em;white-space:nowrap;}
    .tanken-x{margin-left:auto;background:none;border:none;color:#e8d8bc;font-size:14px;cursor:pointer;
      padding:4px 6px;font-family:inherit;}
    .tanken-x:hover{color:#fff;}
    .tanken-pages{flex:1;overflow-y:auto;background:#f7f0dd;border-radius:8px;padding:12px 14px;
      box-shadow:inset 0 1px 6px rgba(90,61,38,.25);scrollbar-width:thin;}
    .tanken-e{padding:9px 2px 10px;border-bottom:1.5px dashed rgba(122,90,58,.35);}
    .tanken-e:last-child{border-bottom:none;}
    .tanken-eh{display:flex;align-items:baseline;gap:8px;}
    .tanken-nm{font-weight:700;font-size:13.5px;color:#2b3a45;letter-spacing:.03em;}
    .tanken-tm{margin-left:auto;font-size:10.5px;color:#8a6a4f;letter-spacing:.08em;flex:none;}
    .tanken-tx{margin-top:5px;font-size:12.5px;line-height:1.95;color:#4a463c;}
    .tanken-empty{padding:22px 6px;color:#8a6a4f;font-size:12.5px;line-height:2;text-align:center;}
    .tanken-foot{padding:10px 6px 2px;text-align:right;font-size:11.5px;color:#f0e2c6;letter-spacing:.06em;}
  `;
  document.head.append(style);

  const overlay = document.createElement("div");
  overlay.className = "tanken-overlay";
  overlay.innerHTML =
    `<div class="tanken-book">`+
      `<div class="tanken-head">`+
        `<span class="tanken-title">⛵ 探検記</span>`+
        `<span class="tanken-count"></span>`+
        `<button class="tanken-x" title="とじる">✕</button>`+
      `</div>`+
      `<div class="tanken-pages"></div>`+
      `<div class="tanken-foot"></div>`+
    `</div>`;
  document.body.append(overlay);
  const countEl = overlay.querySelector(".tanken-count");
  const pagesEl = overlay.querySelector(".tanken-pages");
  const footEl  = overlay.querySelector(".tanken-foot");

  function renderJournal(){
    try{
      const n = I.islands.filter(s => visited.has(s.id)).length;
      const m = I.islands.length - n;
      countEl.textContent = `踏査済み: ${n}島／発見待ち: ${m}島`;
      pagesEl.innerHTML = entries.length
        ? entries.map(e =>
            `<div class="tanken-e">`+
              `<div class="tanken-eh"><span class="tanken-nm">${esc(e.name)}</span>`+
              `<span class="tanken-tm">${esc(hhmm(e.t))}</span></div>`+
              `<div class="tanken-tx">${esc(e.txt)}</div>`+
            `</div>`).join("")
        : `<div class="tanken-empty">まだ白紙である。白紙もまた、記録である。</div>`;
      footEl.textContent = `「${I.pick(SIGNOFF)}」 ——探検家`;
    }catch(err){ console.error("[tanken] journal", err); }
  }
  function openJournal(){ renderJournal(); overlay.classList.add("tanken-show"); pagesEl.scrollTop = 0; }
  function closeJournal(){ overlay.classList.remove("tanken-show"); }

  overlay.addEventListener("pointerdown", e => {
    if(e.target === overlay){ e.preventDefault(); closeJournal(); }
  });
  overlay.querySelector(".tanken-x").addEventListener("click", e => {
    e.stopPropagation(); closeJournal();
  });
  document.addEventListener("keydown", e => {
    if(e.key === "Escape" && overlay.classList.contains("tanken-show")) closeJournal();
  });

  I.addButton("⛵ 探検記", () => {
    try{ overlay.classList.contains("tanken-show") ? closeJournal() : openJournal(); }
    catch(err){ console.error("[tanken] button", err); }
  });

}catch(err){ console.error("[tanken] init failed", err); }
})();
