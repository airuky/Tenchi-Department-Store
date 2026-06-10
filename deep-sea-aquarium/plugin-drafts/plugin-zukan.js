(() => {
  "use strict";
  if (!window.SEA) return;
  const SEA = window.SEA;
  const KEY = "sea-zukan-v1";
  const CAP = 200;
  const ARCH_ORDER = ["fish", "eel", "jelly", "ray", "angler"];
  const ARCH_LABEL = { fish: "魚", eel: "ウナギ", jelly: "クラゲ", ray: "エイ", angler: "アンコウ" };
  const FLAVOR = "この個体と同じ模様は、二度と生成されません";

  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g,
    m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

  // ================= storage =================
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (Array.isArray(d)) return { total: d.length, entries: d };
        if (d && Array.isArray(d.entries)) return { total: Math.max(0, d.total | 0), entries: d.entries };
      }
    } catch (err) { console.error("[zukan] load", err); }
    return { total: 0, entries: [] };
  }
  let state = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (err) { console.error("[zukan] save", err); }
  }
  function dayKey(d) { return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }

  function record(c) {
    try {
      const g = c && c.genome;
      if (!g || !g.name) return;
      const today = dayKey(new Date());
      if (state.entries.some(e => e && e.name === g.name && dayKey(new Date(e.date)) === today)) return;
      state.entries.push({
        name: g.name,
        latin: g.latin || "",
        arch: g.arch || "fish",
        lenM: g.lenM || "？",
        depth: typeof g.depth === "number" ? g.depth : 0,
        eco: g.eco || "",
        date: new Date().toISOString(),
        genome: JSON.parse(JSON.stringify(g)),
      });
      while (state.entries.length > CAP) state.entries.shift();
      state.total++;
      save();
      if (overlay) renderModal();
    } catch (err) { console.error("[zukan] record", err); }
  }

  // ================= css =================
  const style = document.createElement("style");
  style.textContent = `
  .zukan-overlay{position:fixed;inset:0;z-index:8;display:flex;align-items:center;justify-content:center;
    background:rgba(0,4,9,.6);backdrop-filter:blur(3px);opacity:0;transition:opacity .28s;padding:18px}
  .zukan-overlay.zukan-show{opacity:1}
  .zukan-modal{width:min(720px,94vw);max-height:min(80vh,760px);display:flex;flex-direction:column;
    background:var(--panel);border:1px solid var(--panel-edge);border-radius:16px;backdrop-filter:blur(14px);
    box-shadow:0 22px 70px rgba(0,0,0,.65);overflow:hidden;transform:translateY(12px);transition:transform .28s}
  .zukan-overlay.zukan-show .zukan-modal{transform:translateY(0)}
  .zukan-head{position:relative;padding:15px 18px 12px;border-bottom:1px solid var(--panel-edge);flex:none}
  .zukan-title{font-size:16px;font-weight:600;letter-spacing:.08em;color:var(--ink)}
  .zukan-title small{margin-left:9px;font-weight:400;font-size:10px;color:var(--dim);letter-spacing:.22em}
  .zukan-x{position:absolute;top:11px;right:13px;color:var(--dim);cursor:pointer;font-size:14px;padding:4px;transition:.2s}
  .zukan-x:hover{color:var(--ink)}
  .zukan-stats{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px;font-size:11px;color:var(--dim)}
  .zukan-chip{border:1px solid var(--panel-edge);border-radius:999px;padding:3px 10px;
    background:rgba(255,255,255,.03);letter-spacing:.05em;white-space:nowrap}
  .zukan-chip b{color:var(--ink);font-weight:600;margin-left:5px}
  .zukan-chip small{font-size:10px}
  .zukan-grid{flex:1;overflow-y:auto;padding:14px;display:grid;
    grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:10px;align-content:start;scrollbar-width:thin}
  .zukan-grid::-webkit-scrollbar{width:7px}
  .zukan-grid::-webkit-scrollbar-thumb{background:rgba(95,232,210,.25);border-radius:4px}
  .zukan-empty{grid-column:1/-1;color:var(--dim);font-size:13px;line-height:2;text-align:center;padding:34px 10px}
  .zukan-cell{border:1px solid transparent;border-radius:12px;background:rgba(255,255,255,.025);
    padding:9px 8px 10px;cursor:pointer;transition:background .18s,border-color .18s;text-align:center;min-width:0}
  .zukan-cell:hover{background:rgba(95,232,210,.07);border-color:rgba(95,232,210,.3)}
  .zukan-cell.zukan-open{grid-column:1/-1;display:flex;gap:16px;align-items:flex-start;text-align:left;
    background:rgba(95,232,210,.06);border-color:rgba(95,232,210,.35)}
  .zukan-figwrap{min-width:0}
  .zukan-cell.zukan-open .zukan-figwrap{flex:none;width:148px;text-align:center}
  .zukan-thumb{display:block;width:100%;height:72px}
  .zukan-nm{font-size:12.5px;font-weight:600;letter-spacing:.03em;margin-top:5px;color:var(--ink);
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .zukan-date{font-size:10.5px;color:var(--dim);margin-top:2px;letter-spacing:.08em}
  .zukan-detail{display:none;min-width:0;flex:1}
  .zukan-cell.zukan-open .zukan-detail{display:block}
  .zukan-lat{font-style:italic;font-size:12px;color:#8fd8ff;letter-spacing:.05em;margin-top:2px}
  .zukan-meta{font-size:11px;color:var(--dim);margin-top:6px;letter-spacing:.05em}
  .zukan-eco{font-size:12.5px;line-height:2;color:#bfe2ee;margin-top:8px;
    border-left:2px solid rgba(95,232,210,.3);padding-left:10px}
  .zukan-flavor{font-size:11px;color:var(--warm);opacity:.85;margin-top:10px;letter-spacing:.06em}
  .zukan-foot{flex:none;display:flex;align-items:center;justify-content:space-between;gap:12px;
    padding:11px 16px;border-top:1px solid var(--panel-edge)}
  .zukan-wipe{cursor:pointer;font-family:inherit;font-size:11.5px;color:var(--dim);background:transparent;
    border:1px solid var(--panel-edge);border-radius:999px;padding:6px 13px;transition:.18s;white-space:nowrap}
  .zukan-wipe:hover{color:#ffb4a8;border-color:rgba(255,140,120,.45)}
  .zukan-count{font-size:11px;color:var(--dim);letter-spacing:.06em;text-align:right}`;
  document.head.append(style);

  // ================= thumbnails =================
  function fitScale(g) {
    const size = +g.size || 40;
    const extX = { fish: 1.0, eel: 2.05, jelly: 0.85, ray: 1.4, angler: 1.1 }[g.arch] || 1.3;
    let extY;
    switch (g.arch) {
      case "fish":   extY = (g.bodyR || .4) * 1.6 * Math.max(1, g.finS || 1); break;
      case "eel":    extY = (g.bodyR || .4) * 1.2; break;
      case "jelly":  extY = .78; break;
      case "ray":    extY = .55; break;
      case "angler": extY = .42 * (1.2 + (g.lure || 1) * .5); break;
      default:       extY = .8;
    }
    return Math.min(1, 56 / (size * extX), 36 / (size * extY));
  }

  function thumb(genome) {
    const sv = SEA.mk("svg", { viewBox: "-60 -40 120 80", class: "zukan-thumb", "aria-hidden": "true" });
    try {
      if (!genome || !genome.arch) throw new Error("missing genome");
      const grp = SEA.creatureGroup(genome);
      const s = fitScale(genome);
      const wrap = SEA.mk("g");
      let t = "";
      if (genome.arch === "jelly") t = `translate(0 ${(-(+genome.size || 40) * .35 * s).toFixed(1)}) `;
      wrap.setAttribute("transform", t + `scale(${s.toFixed(3)})`);
      wrap.append(grp);
      sv.append(wrap);
    } catch (err) {
      console.error("[zukan] thumb", err);
      sv.append(SEA.mk("circle", { cx: 0, cy: 0, r: 3, fill: "#5fe8d2", opacity: .55 }));
    }
    return sv;
  }

  // ================= modal =================
  let overlay = null;

  function onKey(e) { if (e.key === "Escape") closeModal(); }

  function cell(en) {
    const c = document.createElement("div");
    c.className = "zukan-cell";
    const d = new Date(en.date);
    const md = isNaN(d.getTime()) ? "—" : (d.getMonth() + 1) + "/" + d.getDate();
    const fig = document.createElement("div");
    fig.className = "zukan-figwrap";
    fig.append(thumb(en.genome));
    const cap = document.createElement("div");
    cap.innerHTML =
      `<div class="zukan-nm">${esc(en.name)}</div>` +
      `<div class="zukan-date">${esc(md)}</div>`;
    fig.append(cap);
    const det = document.createElement("div");
    det.className = "zukan-detail";
    det.innerHTML =
      `<div class="zukan-lat">${esc(en.latin)}</div>` +
      `<div class="zukan-meta">全長 ${esc(en.lenM)}　／　生息深度 ${esc(en.depth)}m</div>` +
      `<div class="zukan-eco">${esc(en.eco)}</div>` +
      `<div class="zukan-flavor">${esc(FLAVOR)}</div>`;
    c.append(fig, det);
    c.addEventListener("click", () => {
      try {
        const was = c.classList.contains("zukan-open");
        const parent = c.parentElement;
        if (parent) for (const o of parent.querySelectorAll(".zukan-open")) o.classList.remove("zukan-open");
        if (!was) c.classList.add("zukan-open");
      } catch (err) { console.error("[zukan] cell", err); }
    });
    return c;
  }

  function renderModal() {
    try {
      if (!overlay) return;
      const counts = { fish: 0, eel: 0, jelly: 0, ray: 0, angler: 0 };
      let deepest = 0;
      for (const e of state.entries) {
        if (e && counts[e.arch] != null) counts[e.arch]++;
        if (e && +e.depth > deepest) deepest = +e.depth;
      }
      overlay.querySelector(".zukan-stats").innerHTML =
        `<span class="zukan-chip">総記録数<b>${state.entries.length}</b></span>` +
        ARCH_ORDER.map(a =>
          `<span class="zukan-chip"><small>${ARCH_LABEL[a]}</small><b>${counts[a]}</b></span>`).join("") +
        `<span class="zukan-chip">最深記録<b>${deepest ? esc(deepest) + "m" : "—"}</b></span>`;

      const grid = overlay.querySelector(".zukan-grid");
      grid.replaceChildren();
      if (!state.entries.length) {
        const e = document.createElement("div");
        e.className = "zukan-empty";
        e.textContent = "まだ記録がありません。最初の来館者を、ここで待っています。";
        grid.append(e);
      } else {
        for (const en of state.entries.slice().reverse()) grid.append(cell(en));
      }
      overlay.querySelector(".zukan-count").textContent =
        `あなたはこれまでに ${state.total} の来館者を見送りました`;
    } catch (err) { console.error("[zukan] render", err); }
  }

  function openModal() {
    try {
      if (overlay) return;
      overlay = document.createElement("div");
      overlay.className = "zukan-overlay";
      overlay.innerHTML =
        `<div class="zukan-modal">` +
          `<div class="zukan-head">` +
            `<div class="zukan-title">深海図鑑<small>ABYSSAL RECORDS</small></div>` +
            `<span class="zukan-x" title="とじる">✕</span>` +
            `<div class="zukan-stats"></div>` +
          `</div>` +
          `<div class="zukan-grid"></div>` +
          `<div class="zukan-foot">` +
            `<button class="zukan-wipe">記録を全て消す</button>` +
            `<div class="zukan-count"></div>` +
          `</div>` +
        `</div>`;
      overlay.addEventListener("click", e => { if (e.target === overlay) closeModal(); });
      overlay.querySelector(".zukan-x").addEventListener("click", closeModal);
      overlay.querySelector(".zukan-wipe").addEventListener("click", () => {
        try {
          if (!confirm("図鑑の記録をすべて消しますか？\nこの操作は取り消せません。")) return;
          state = { total: 0, entries: [] };
          save();
          renderModal();
          SEA.toast("図鑑は白紙に戻りました");
        } catch (err) { console.error("[zukan] wipe", err); }
      });
      document.body.append(overlay);
      renderModal();
      requestAnimationFrame(() => { if (overlay) overlay.classList.add("zukan-show"); });
      document.addEventListener("keydown", onKey);
    } catch (err) { console.error("[zukan] open", err); }
  }

  function closeModal() {
    try {
      if (!overlay) return;
      const o = overlay;
      overlay = null;
      document.removeEventListener("keydown", onKey);
      o.classList.remove("zukan-show");
      setTimeout(() => o.remove(), 320);
    } catch (err) { console.error("[zukan] close", err); }
  }

  // ================= wiring =================
  SEA.on("creature-added", c => { try { record(c); } catch (err) { console.error("[zukan]", err); } });
  try { for (const c of [...SEA.creatures]) record(c); }
  catch (err) { console.error("[zukan] initial scan", err); }
  try {
    SEA.addButton("📖 図鑑", () => {
      try { overlay ? closeModal() : openModal(); }
      catch (err) { console.error("[zukan] button", err); }
    });
  } catch (err) { console.error("[zukan] dock", err); }
})();
