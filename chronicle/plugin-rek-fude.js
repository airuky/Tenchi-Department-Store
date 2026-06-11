// ════ plugin: rek-fude ════ 🖋 帳面の筆触 — the chronicle gains marginalia; the map learns to answer a glance.
(()=>{ "use strict";
if(!window.REKISHI) return;
const R = window.REKISHI;
const TAG = "[rek-fude]";
try{

const INK = "#4a3b28";
const esc = s => String(s==null?"":s).replace(/[&<>"']/g, c =>
  ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

const entriesEl = document.getElementById("entries");
if(!entriesEl){ console.error(TAG, "no entries container"); return; }

// ------------------------------------------------------------------ css
const style = document.createElement("style");
style.textContent = `
/* ---- margin glyphs ---- */
.rek-fude-dec{position:relative;}
.rek-fude-g{position:absolute;left:-14px;top:3px;width:12px;height:13px;opacity:.6;
  color:#5d4c35;font-size:11px;line-height:13px;text-align:center;pointer-events:none;
  font-family:"Hiragino Mincho ProN","Yu Mincho",serif;}
.rek-fude-g svg{display:block;width:12px;height:12px;margin-top:1px;}
/* ---- founding mini-map ---- */
.rek-fude-mini{float:right;margin:2px 0 2px 7px;line-height:0;padding:1px;opacity:.9;
  border:1px solid rgba(74,59,40,.3);border-radius:3px;background:rgba(207,220,202,.35);}
.rek-fude-mini svg{display:block;}
/* ---- illuminated era separators ---- */
.ent.rek-fude-era{font-size:12.6px;letter-spacing:.22em;padding:9px 0 11px;
  border-top:3px double rgba(74,59,40,.45);border-bottom:3px double rgba(74,59,40,.45);}
.rek-fude-eraname{font-size:14px;font-weight:700;letter-spacing:.18em;color:#4a3b28;}
.rek-fude-flo{display:flex;align-items:center;justify-content:center;gap:8px;margin:0 0 5px;}
.rek-fude-flo i{display:block;width:30px;height:1px;background:rgba(74,59,40,.35);}
.rek-fude-flo b{font-size:7.5px;font-weight:400;color:rgba(74,59,40,.55);line-height:1;}
/* ---- floating civ name chip ---- */
.rek-fude-chip{position:fixed;z-index:7;pointer-events:none;display:none;white-space:nowrap;
  padding:5px 12px 6px;border:1.5px solid rgba(74,59,40,.45);border-radius:7px;
  background:linear-gradient(115deg,rgba(244,234,210,.96),rgba(228,214,180,.96));
  color:#4a3b28;font-family:"Hiragino Mincho ProN","Yu Mincho",serif;
  font-size:11.5px;letter-spacing:.05em;line-height:1.6;
  box-shadow:0 3px 10px rgba(74,59,40,.25);}
.rek-fude-chip b{font-weight:700;letter-spacing:.07em;}
.rek-fude-chip span{color:#7a6a52;}
/* ---- map legend chips (yields the slot to kokkyo's legend) ---- */
.rek-fude-legend{position:fixed;left:12px;bottom:118px;z-index:5;display:flex;flex-wrap:wrap;
  gap:5px;max-width:min(46vw,560px);align-items:flex-end;}
.rek-fude-chiplet{display:inline-flex;align-items:center;gap:5px;padding:3px 9px 4px;
  border:1.5px solid rgba(74,59,40,.35);border-radius:999px;cursor:pointer;
  background:linear-gradient(115deg,rgba(244,234,210,.92),rgba(228,214,180,.92));
  color:#4a3b28;font-family:"Hiragino Mincho ProN","Yu Mincho",serif;
  font-size:11px;letter-spacing:.04em;line-height:1.5;
  box-shadow:0 2px 6px rgba(74,59,40,.18);transition:border-color .18s, background .18s;}
.rek-fude-chiplet:hover{border-color:#8a4a32;}
.rek-fude-chiplet.rek-fude-on{border-color:#8a4a32;background:rgba(138,74,50,.16);box-shadow:inset 0 1px 3px rgba(74,59,40,.2);}
.rek-fude-chiplet i{flex:none;width:8px;height:8px;border-radius:50%;border:1px solid rgba(74,59,40,.5);}
.rek-fude-chiplet em{font-style:normal;font-size:9.5px;color:#7a6a52;letter-spacing:.02em;}
/* ---- quiet-continent watermark ---- */
.rek-fude-water{position:fixed;left:calc((100vw - 374px)/2);top:55%;transform:translate(-50%,-50%);
  z-index:2;pointer-events:none;display:none;color:rgba(74,59,40,.32);
  font-family:"Hiragino Mincho ProN","Yu Mincho",serif;font-size:15px;
  letter-spacing:.4em;padding-left:.4em;}
`;
document.head.append(style);

// ==================================================================
//  1) entry glyphs — small ink marginalia per entry type
// ==================================================================
const gsvg = inner => `<svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" fill="none" `+
  `stroke="${INK}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
const GLYPHS = {
  war:   "⚔︎",                                  // ⚔ forced text presentation
  birth: "✦",                                        // ✦
  doom:  gsvg(`<path d="M3.7 2.6h4.6M4.6 2.6c.2 1.7-.9 2.5-.9 4 0 1.6 1 2.6 2.3 2.6s2.3-1 2.3-2.6c0-1.5-1.1-2.3-.9-4M4.3 10.1h3.4"/>`),
  good:  gsvg(`<path d="M6 10.6C6 8 6 5.4 6.3 2.6M6.1 4.1 4.5 3M6.1 5.8 4.4 4.8M6.1 7.5 4.6 6.6M6.2 4.1 7.8 3M6.2 5.8 7.9 4.8M6.2 7.5 7.7 6.6"/>`),
  bad:   gsvg(`<path d="M4.4 10.6c0-3 .2-5.2 2-6.6 1.2-.9 2.6-.5 2.7.4.1.8-.9 1.5-2.2 1.2M9.3 7.9l-.6 1.6"/>`),
  trade: gsvg(`<circle cx="4.4" cy="6" r="2.3"/><circle cx="7.6" cy="6" r="2.3"/>`),
  peace: gsvg(`<path d="M2.8 9.4C2.8 5.8 5.6 3 9.4 2.8 9.2 6.6 6.4 9.4 2.8 9.4ZM3.7 8.5C5.3 6.9 6.9 5.3 8.5 3.7"/>`),
};

function addGlyph(el, t){
  const g = GLYPHS[t];
  if(!g) return;
  el.classList.add("rek-fude-dec");
  const s = document.createElement("span");
  s.className = "rek-fude-g";
  s.innerHTML = g;                               // own static markup only
  el.prepend(s);                                 // before .y; text nodes untouched (kenetsu-safe)
}

// ==================================================================
//  2) founding mini-map — where on the continent the cradle stood
// ==================================================================
function addMini(el, e){
  const civ = (R.civs || [])[(R.civs || []).length - 1];
  if(!civ || !Array.isArray(civ.cities) || !civ.cities[0]) return;
  if(e && e.text && civ.name && String(e.text).indexOf(civ.name) < 0) return;  // not this civ's line
  const land = R.gLand && R.gLand.querySelector("path");
  const d = land && land.getAttribute("d");
  if(!d) return;
  const W = Math.max(1, R.W|0), H = Math.max(1, R.H|0);
  const cap = civ.cities[0];
  const sc = Math.min(28/W, 22/H);               // display px per map unit
  const dotR = 1.5/Math.max(1e-6, sc);
  const wrap = document.createElement("span");
  wrap.className = "rek-fude-mini";
  wrap.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="28" height="22" preserveAspectRatio="xMidYMid meet" aria-hidden="true">`+
    `<path d="${d}" fill="rgba(74,59,40,.12)" stroke="${INK}" stroke-width=".7" vector-effect="non-scaling-stroke" stroke-opacity=".6"/>`+
    `<circle cx="${(+cap.x).toFixed(1)}" cy="${(+cap.y).toFixed(1)}" r="${dotR.toFixed(1)}" fill="#8a4a32" opacity=".85"/></svg>`;
  el.insertBefore(wrap, el.firstChild);          // floats right, text wraps around it
}

// ==================================================================
//  3) illuminated era separators
// ==================================================================
function decorateEra(el){
  el.classList.add("rek-fude-era");
  const txt = el.textContent || "";
  const m = /^(.*「)(.+?)(」.*)$/.exec(txt);
  if(m){                                          // enlarge the era name itself (DOM nodes, no innerHTML)
    el.textContent = "";
    const b = document.createElement("span");
    b.className = "rek-fude-eraname";
    b.textContent = m[2];
    el.append(document.createTextNode(m[1]), b, document.createTextNode(m[3]));
  }
  const f = document.createElement("span");
  f.className = "rek-fude-flo";
  f.innerHTML = "<i></i><b>◆</b><i></i>";    // ── ◆ ──
  el.prepend(f);
}

R.on("written", e => {
  try{
    if(!e) return;
    const el = entriesEl.lastElementChild;
    if(!el || !el.classList || !el.classList.contains("ent") || el.dataset.rekFude) return;
    const t = String(e.type || "");
    if(t && !el.classList.contains("t-" + t)) return;  // make sure this is the entry we heard about
    el.dataset.rekFude = "1";
    if(t === "era"){ decorateEra(el); return; }
    if(t === "birth") addMini(el, e);
    addGlyph(el, t);
  }catch(err){ console.error(TAG, "written", err); }
});

// ==================================================================
//  4) civ highlight — hover the wash or a city, the rest fades
//     (pure geometric hit-test on pointermove: no proxies, never
//      steals events from toshi-keikan's city tooltips or land clicks)
// ==================================================================
let hoverCiv = null, stickyCiv = null;
const bornEra = new Map();                        // civ.id -> era name at founding

function setOp(el, o){
  if(!el) return;
  try{
    if(!el.style.transition) el.style.transition = "opacity .25s ease";
    el.style.opacity = o;
  }catch(_){}
}
function currentTarget(){
  if(stickyCiv && stickyCiv.alive) return stickyCiv;
  if(hoverCiv && hoverCiv.alive) return hoverCiv;
  return null;
}
function reapply(){
  const tgt = currentTarget();
  for(const c of R.civs || []){
    if(!c) continue;
    const o = tgt ? (c === tgt ? "1" : ".35") : "";
    setOp(c.el, o); setOp(c.tEl, o);
  }
}

// territory radius mirrors core redrawTerritory: r = 20 + min(55, sqrt(pop)*.5), per-city * ct.size
function civAt(x, y){
  let best = null, bestScore = 1e9;
  for(const c of R.civs || []){
    if(!c || !c.alive || !Array.isArray(c.cities)) continue;
    const r = 20 + Math.min(55, Math.sqrt(Math.max(0, c.pop)) * .5);
    for(const ct of c.cities){
      if(!ct) continue;
      const d = Math.hypot(ct.x - x, ct.y - y);
      if(d < 13){                                 // city mark / label zone wins outright
        const s = d/13 - 2;
        if(s < bestScore){ bestScore = s; best = c; }
      } else {
        const rr = r * (ct.size || 1);
        if(d <= rr){
          const s = d/rr;
          if(s < bestScore){ bestScore = s; best = c; }
        }
      }
    }
  }
  return best;
}

// ---- floating name chip ----
const chip = document.createElement("div");
chip.className = "rek-fude-chip";
document.body.append(chip);
let chipHtml = "";
function showChip(civ){
  const since = bornEra.get(civ.id) || `${civ.born|0}年`;
  const h = `<b>${esc(civ.name)}</b>　<span>${(Math.max(0, civ.pop)|0).toLocaleString()}人・${esc(since)}より</span>`;
  if(h !== chipHtml){ chipHtml = h; chip.innerHTML = h; }
  chip.style.display = "block";
}
function hideChip(){ chip.style.display = "none"; chipHtml = ""; }
function placeChip(){
  if(chip.style.display === "none") return;
  const rect = R.svg.getBoundingClientRect();
  const w = chip.offsetWidth || 150, h = chip.offsetHeight || 30;
  let lx = pmX + 16, ly = pmY + 20;
  const maxX = rect.left + Math.min(R.W, rect.width) - w - 8;
  if(lx > maxX) lx = pmX - w - 14;
  if(ly + h > window.innerHeight - 8) ly = pmY - h - 14;
  chip.style.left = lx + "px"; chip.style.top = ly + "px";
}

let pmX = 0, pmY = 0, pmQueued = false;
function onMove(){
  const rect = R.svg.getBoundingClientRect();
  const c = civAt(pmX - rect.left, pmY - rect.top);
  if(!stickyCiv && c !== hoverCiv){ hoverCiv = c; reapply(); }
  const tgt = currentTarget();
  if(tgt && c === tgt) showChip(tgt); else hideChip();
  placeChip();
}
R.svg.addEventListener("pointermove", e => {
  pmX = e.clientX; pmY = e.clientY;
  if(pmQueued) return;
  pmQueued = true;
  requestAnimationFrame(() => {
    pmQueued = false;
    try{ onMove(); }catch(err){ console.error(TAG, "move", err); }
  });
});
R.svg.addEventListener("pointerleave", () => {
  try{
    if(!stickyCiv && hoverCiv){ hoverCiv = null; reapply(); }
    hideChip();
  }catch(err){ console.error(TAG, "leave", err); }
});

// ==================================================================
//  5) map legend — parchment chips, click = sticky highlight
// ==================================================================
const legend = document.createElement("div");
legend.className = "rek-fude-legend";
document.body.append(legend);
const water = document.createElement("div");
water.className = "rek-fude-water";
water.textContent = "大陸は、まだ静かです";
document.body.append(water);

function fmtPop(p){
  p = Math.max(0, p|0);
  return p >= 10000 ? (p/10000).toFixed(1).replace(/\.0$/, "") + "万" : String(p);
}
function syncVisibility(){
  const alive = (R.civs || []).some(c => c && c.alive);
  const kok = document.querySelector(".kokkyo-legend");          // political map legend owns the same corner
  const kokOn = !!(kok && kok.style.display !== "none");
  legend.style.display = (alive && !kokOn) ? "" : "none";
  const hint = document.getElementById("hint");
  const hintGone = !hint || hint.style.opacity === "0";          // don't stack on the opening hint
  water.style.display = (!alive && hintGone) ? "block" : "none";
}
function renderLegend(){
  try{
    const alive = (R.civs || []).filter(c => c && c.alive);
    legend.innerHTML = alive.map(c =>
      `<button type="button" class="rek-fude-chiplet${stickyCiv === c ? " rek-fude-on" : ""}" data-id="${c.id|0}">`+
      `<i style="background:${esc(c.color)}"></i><span>${esc(c.name)}</span><em>${fmtPop(c.pop)}</em></button>`).join("");
    syncVisibility();
  }catch(err){ console.error(TAG, "legend", err); }
}
legend.addEventListener("click", e => {
  try{
    const b = e.target && e.target.closest && e.target.closest(".rek-fude-chiplet");
    if(!b) return;
    const id = +b.dataset.id;
    const civ = (R.civs || []).find(c => c && c.alive && c.id === id);
    if(!civ) return;
    stickyCiv = (stickyCiv === civ) ? null : civ;                // sticky until clicked again
    hoverCiv = null;
    hideChip();
    reapply();
    renderLegend();
  }catch(err){ console.error(TAG, "chip click", err); }
});

// UI-only visibility sync (kokkyo toggling, hint fading) — wall clock is fine for chrome
setInterval(() => { try{ if(!document.hidden) syncVisibility(); }catch(_){} }, 1000);

// ==================================================================
//  hooks
// ==================================================================
let lastLegendYear = -1e9;
R.on("year", e => {
  try{
    const y = (e && typeof e.year === "number") ? e.year : (R.year|0);
    if(y - lastLegendYear >= 3){ lastLegendYear = y; renderLegend(); }   // throttled pop refresh
  }catch(err){ console.error(TAG, "year", err); }
});
R.on("civ-born", c => {
  try{
    if(c && typeof c.id === "number") bornEra.set(c.id, String(R.era || ""));
    renderLegend();
    reapply();                                    // a newborn joins an active highlight correctly dimmed
  }catch(err){ console.error(TAG, "civ-born", err); }
});
R.on("civ-died", c => {
  try{
    if(stickyCiv === c) stickyCiv = null;
    if(hoverCiv === c) hoverCiv = null;
    hideChip();
    reapply();
    renderLegend();
  }catch(err){ console.error(TAG, "civ-died", err); }
});
R.on("reset", () => {
  try{
    stickyCiv = null; hoverCiv = null;
    bornEra.clear();
    hideChip();
    lastLegendYear = -1e9;
    renderLegend();                               // empty -> hidden; watermark takes over via sync
  }catch(err){ console.error(TAG, "reset", err); }
});

// bootstrap against whatever already stands
for(const c of R.civs || []){ if(c && c.alive) bornEra.set(c.id, String(R.era || "")); }
renderLegend();

}catch(err){ console.error(TAG, "init failed", err); }
})();
