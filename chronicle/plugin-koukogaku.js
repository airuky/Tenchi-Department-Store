(()=>{ "use strict";
  if(!window.REKISHI) return;
  const R = window.REKISHI;

  // ---------------- utils ----------------
  const esc = s => String(s).replace(/[&<>"']/g, ch =>
    ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  function hash(str){
    let h = 2166136261 >>> 0;
    for(let i = 0; i < str.length; i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mulberry(seed){
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rpick = (r, a) => a[Math.min(a.length - 1, (r() * a.length) | 0)];
  function rshuffle(r, a){
    const b = a.slice();
    for(let i = b.length - 1; i > 0; i--){ const j = (r() * (i + 1)) | 0; [b[i], b[j]] = [b[j], b[i]]; }
    return b;
  }

  // ---------------- style ----------------
  const style = document.createElement("style");
  style.textContent = `
  .koukogaku-ruin{cursor:pointer;transition:opacity .25s}
  .koukogaku-ruin:hover{opacity:.95}
  .koukogaku-overlay{position:fixed;inset:0;z-index:8;background:rgba(58,46,30,.45);
    display:flex;align-items:center;justify-content:center}
  .koukogaku-panel{width:min(430px,calc(100vw - 40px));max-height:min(580px,84vh);overflow-y:auto;
    background:linear-gradient(115deg,#f2e8cd,#ece1c4 55%,#e2d4b2);color:#4a3b28;
    border:double 5px rgba(74,59,40,.55);border-radius:4px;box-shadow:0 14px 44px rgba(40,30,16,.5);
    padding:22px 26px 18px;font-family:"Hiragino Mincho ProN","Yu Mincho",serif;
    animation:koukogaku-in .25s ease-out;scrollbar-width:thin}
  @keyframes koukogaku-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  .koukogaku-title{margin:0 0 6px;font-size:17px;letter-spacing:.12em;text-align:center;font-weight:700}
  .koukogaku-sub{text-align:center;font-size:12px;color:#7a6a52;letter-spacing:.08em}
  .koukogaku-rule{border-top:1px solid rgba(74,59,40,.35);margin:12px 0 10px}
  .koukogaku-label{font-size:11px;color:#7a6a52;letter-spacing:.3em;margin-bottom:6px}
  .koukogaku-item{margin:0 0 7px;font-size:12.8px;line-height:1.9;letter-spacing:.02em}
  .koukogaku-note{margin:0 0 6px;font-size:12.5px;line-height:1.9}
  .koukogaku-reroll{display:inline-block;margin-top:4px;font-size:11.5px;color:#8a4a32;
    text-decoration:underline dotted;cursor:pointer;letter-spacing:.04em}
  .koukogaku-reroll:hover{color:#4a3b28}
  .koukogaku-close{display:block;margin:14px auto 0;cursor:pointer;font-family:inherit;font-weight:600;
    border:1.5px solid rgba(74,59,40,.4);background:rgba(236,225,196,.9);color:#4a3b28;border-radius:8px;
    padding:7px 16px;font-size:12.5px;letter-spacing:.06em;transition:.18s}
  .koukogaku-close:hover{border-color:#8a4a32;transform:translateY(-1px)}`;
  document.head.append(style);

  // ---------------- history index (listen from load, key by civ name) ----------------
  const hist = new Map(); // civName -> [{k,...}]
  function rec(civ, item){
    try{
      const nm = civ && civ.name;
      if(!nm) return;
      let arr = hist.get(nm);
      if(!arr){ arr = []; hist.set(nm, arr); }
      if(arr.length < 60) arr.push(item);
    }catch(err){ console.error("[koukogaku] rec", err); }
  }
  const nameOf = v => (typeof v === "string") ? v : (v && (v.name || v.title)) || null;

  R.on("hatsumei:invented", e => { const n = nameOf(e && e.invention); if(e && e.civ && n) rec(e.civ, {k:"inv", n}); });
  R.on("ijin:born",  e => { const n = nameOf(e && e.person); if(e && e.civ && n) rec(e.civ, {k:"ijin", n}); });
  R.on("ijin:died",  e => { const n = nameOf(e && e.person); if(e && e.civ && n) rec(e.civ, {k:"ijin2", n}); });
  R.on("shukyo:spread", e => { const n = nameOf(e && e.faith); if(e && e.civ && n) rec(e.civ, {k:"faith", n}); });
  R.on("war-start",  e => { if(e && e.a && e.b){ rec(e.a, {k:"war", o:e.b.name, c:e.cause}); rec(e.b, {k:"war", o:e.a.name, c:e.cause}); } });
  R.on("war-end",    e => { if(e && e.a && e.b){ rec(e.a, {k:"peace", o:e.b.name}); rec(e.b, {k:"peace", o:e.a.name}); } });
  R.on("trade-start",e => { if(e && e.a && e.b){ rec(e.a, {k:"trade", o:e.b.name}); rec(e.b, {k:"trade", o:e.a.name}); } });
  R.on("harvest", e => { if(e && e.civ) rec(e.civ, {k:"harvest"}); });
  R.on("famine",  e => { if(e && e.civ) rec(e.civ, {k:"famine"}); });
  R.on("ekibyo:outbreak", e => { if(e && e.civ) rec(e.civ, {k:"plague"}); });
  R.on("city-founded", e => { if(e && e.civ && e.city && e.city.name) rec(e.civ, {k:"city", t:e.city.name}); });
  R.on("city-fell", e => {
    if(!e) return;
    if(e.winner) rec(e.winner, {k:"won", t:e.city && e.city.name});
    if(e.loser)  rec(e.loser,  {k:"lost", t:e.city && e.city.name});
  });

  // ---------------- artifact corpora ----------------
  function histArtifacts(ruin, r){
    const out = [];
    for(const it of hist.get(ruin.civName) || []){
      switch(it.k){
        case "inv":   out.push({a:`「${it.n}」の破片`, n:rpick(r, [
                        "組み立て直す勇気は、調査団の誰にもなかった",
                        "当時の最先端。今も当時のままである",
                        "説明書は出土しなかった（当時から無かった可能性がある）"])}); break;
        case "ijin":  out.push({a:`${it.n}の印章`, n:"持ち主より長持ちした"}); break;
        case "ijin2": out.push({a:`${it.n}を悼む小さな碑`, n:"碑文の末尾に「まだ信じられない」と追記がある"}); break;
        case "faith": out.push({a:`${it.n}の護符`, n:"裏に、前に信じていたものの図柄が透けている"}); break;
        case "war":   out.push({a:"矢尻の堆積", n:`${it.o}との戦の層。発端（${it.c || "諸説あり"}）までは出土しない`}); break;
        case "peace": out.push({a:`${it.o}との和約の写し`, n:"最後の頁にだけ、折り目がない"}); break;
        case "trade": out.push({a:"異国の秤", n:`${it.o}の度量衡。値切りに耐えた補強の痕がある`}); break;
        case "harvest": out.push({a:"増築された穀倉の礎石", n:"麦を預けた隣人の名簿が添えられている"}); break;
        case "famine":  out.push({a:"雨乞いの踊りの図解（改良版）", n:"効果の欄は空白のままである"}); break;
        case "plague":  out.push({a:"「とにかく寝ること」の布告板", n:"摩耗が激しい。よく読まれたのだろう"}); break;
        case "won":   out.push({a:"戦勝の柱の断片", n:"碑文の三割は誇張と鑑定された"}); break;
        case "lost":  out.push({a:"置き去りの漬物石", n:`${it.t || "陥落の都"}から運び出されなかった、最後の一つ`}); break;
        case "city":  out.push({a:`${it.t}の定礎の瓦`, n:"門の位置の修正案が、三つ刻まれている"}); break;
      }
    }
    const civ = (R.civs || []).find(c => c && c.name === ruin.civName);
    if(civ){
      if(civ.deity) out.push({a:`${civ.deity}の小さな祠`, n:"供物の皿は空のまま出土した"});
      if(civ.temperament) out.push({a:`「${civ.temperament}な民」と評した隣国の書簡`, n:"概ね当たっていたようである"});
    }
    return out;
  }

  const GENERIC = [
    {a:"欠けた皿", n:"欠けていないものは出土しない"},
    {a:"謎の小像", n:"当時から謎だった可能性がある"},
    {a:"税の記録", n:"未払いに丸がついている"},
    {a:"子供の落書きのある瓦", n:"上手い。役人の似顔絵と思われる"},
    {a:"鍵", n:"対応する錠は、まだ誰も見つけていない"},
    {a:"サイコロ", n:"六の面が三つある"},
    {a:"借用書の束", n:"いずれも「明日返す」とのみ記される"},
    {a:"編みかけの籠", n:"編み手は急用だったらしい"},
    {a:"空の酒壺", n:"中身の行方については諸説ある"},
    {a:"天文観測の記録", n:"曇りの日は愚痴が書かれている"},
    {a:"礎石に残る職人の署名", n:"設計者の名より深く彫られている"},
    {a:"香炉", n:"灰は当時のまま。香りは退役した"},
    {a:"大物の魚の骨", n:"数え役が休んだ年のものか"},
    {a:"鍋の蓋", n:"王冠の代用とされた時期がある"},
    {a:"古い地図", n:"戦争の発端になれる程度には、曖昧である"},
    {a:"砥石", n:"包丁より雄弁に、台所を語る"},
  ];

  const SHOKEN = [
    "総じて、よく生きた人々であったと思われる。",
    "出土品は暮らしの苦労を語るが、筆跡はどれも楽しげである。",
    "争いの跡と宴の跡が同じ深さから出る。両者の区別は困難である。",
    "滅びの原因は特定できなかった。家賃のような、静かな何かであろう。",
    "彼らが何を信じていたかは分かった。守っていたかどうかは、分からない。",
    "記録は几帳面だが、肝心の年だけ頁が破られている。",
    "掘れば掘るほど、現代との差が見当たらなくなる。",
  ];

  const P_DIG = [
    (n)=>`考古学者の一団、${n}跡に鋤を入れる。最も多く出土したのは、例によって土であった。`,
    (n)=>`${n}跡で発掘調査が始まる。近隣の住民は「前から何かあると思っていた」と述べた。`,
    (n)=>`学者たち、${n}跡を掘り返す。眠っていた歴史は、起こされて少し不機嫌である。`,
  ];

  // ---------------- report generation (deterministic per ruin; salt = 追加調査) ----------------
  function buildReport(ruin, salt){
    const seed = hash(`${ruin.name}|${ruin.year}`);
    const r = mulberry((seed + Math.imul(salt, 0x9E3779B9)) >>> 0);
    const count = 3 + ((r() * 3) | 0); // 3..5
    const fromHist = rshuffle(r, histArtifacts(ruin, r));
    const fromGen  = rshuffle(r, GENERIC);
    const lines = [], seen = new Set();
    for(const it of fromHist){ if(lines.length >= count - 1) break; if(seen.has(it.a)) continue; seen.add(it.a); lines.push(it); }
    for(const it of fromGen){ if(lines.length >= count) break; if(seen.has(it.a)) continue; seen.add(it.a); lines.push(it); }
    const shoken = rpick(mulberry(seed ^ 0x5F3759DF), SHOKEN); // 所見は追加調査でも揺らがない
    return {lines, shoken};
  }

  // ---------------- modal ----------------
  let overlay = null, escHandler = null;
  const visited = new Set();

  function closeReport(){
    try{
      if(overlay){ overlay.remove(); overlay = null; }
      if(escHandler){ document.removeEventListener("keydown", escHandler); escHandler = null; }
    }catch(err){ console.error("[koukogaku] close", err); }
  }

  function openReport(ruin){
    try{
      closeReport();
      let salt = 0;
      const name = ruin.name || "無名", master = ruin.civName || "不明の民";
      const yr = (typeof ruin.year === "number") ? ruin.year : "？";
      overlay = document.createElement("div");
      overlay.className = "koukogaku-overlay";
      const panel = document.createElement("div");
      panel.className = "koukogaku-panel";
      overlay.append(panel);

      function render(){
        const rep = buildReport(ruin, salt);
        panel.innerHTML = `
          <h2 class="koukogaku-title">${esc(name)}跡 発掘調査報告</h2>
          <div class="koukogaku-sub">往年の主: ${esc(master)}（${esc(yr)}年に没す）</div>
          <div class="koukogaku-rule"></div>
          <div class="koukogaku-label">出土品目録</div>
          ${rep.lines.map(it => `<p class="koukogaku-item">・${esc(it.a)}　—　${esc(it.n)}</p>`).join("")}
          <a class="koukogaku-reroll" href="#">※追加調査をすれば、別のものが出るかもしれない</a>
          <div class="koukogaku-rule"></div>
          <div class="koukogaku-label">所見</div>
          <p class="koukogaku-note">${esc(rep.shoken)}</p>
          <p class="koukogaku-note">調査団は日没により撤収した。</p>
          <button class="koukogaku-close">報告書を閉じる</button>`;
        panel.querySelector(".koukogaku-reroll").addEventListener("click", ev => {
          ev.preventDefault();
          try{ salt++; render(); }catch(err){ console.error("[koukogaku] reroll", err); }
        });
        panel.querySelector(".koukogaku-close").addEventListener("click", closeReport);
      }
      render();

      overlay.addEventListener("pointerdown", ev => { if(ev.target === overlay) closeReport(); });
      escHandler = ev => { if(ev.key === "Escape") closeReport(); };
      document.addEventListener("keydown", escHandler);
      document.body.append(overlay);

      const key = `${name}|${yr}`;
      if(!visited.has(key)){
        visited.add(key);
        R.write(R.pick(P_DIG)(name), "civic");
      }
    }catch(err){ console.error("[koukogaku] openReport", err); }
  }

  // ---------------- ruin binding (initial + late-created ruins) ----------------
  const bound = new WeakSet();
  function rescan(){
    try{
      for(const ruin of R.ruins || []){
        const el = ruin && ruin.el;
        if(!el || bound.has(el)) continue;
        bound.add(el);
        el.classList.add("koukogaku-ruin");
        el.addEventListener("pointerdown", ev => {
          try{
            if(ev.button !== 0) return;
            ev.preventDefault();
            openReport(ruin);
          }catch(err){ console.error("[koukogaku] ruin click", err); }
        });
      }
    }catch(err){ console.error("[koukogaku] rescan", err); }
  }
  R.on("year", rescan);
  R.on("civ-died", rescan);
  R.on("city-fell", rescan);
  rescan();
})();
