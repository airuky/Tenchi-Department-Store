(() => {
  "use strict";
  if (!window.SKY) return;
  const SKY = window.SKY;

  // ====================================================================
  //  星座占い — 日替わり・真顔でふざける運勢プラグイン
  //  (星座名 + 日付) から決定論的に占うので、今日いちにち結果は不動です
  // ====================================================================

  // ---- corpora -------------------------------------------------------
  const ITEMS = [
    "養生テープ", "単3電池（残量不明）", "レシートの裏", "輪ゴム（2本まで）",
    "他人の傘袋", "賞味期限内のうまい棒", "USB-Cケーブル（充電専用かもしれない）",
    "半分にちぎったポイントカード", "角が丸くなった付箋", "微妙に甘くない飴",
    "ぬるくなった緑茶", "充電残量73%のモバイルバッテリー", "左手だけの軍手",
    "結束バンド（白・3本）", "対象外だった割引券", "インクの薄いボールペン",
    "押しても鳴らないプチプチ", "二つ折りの駐車券", "ラベルが剥がれかけの瓶",
    "去年のカレンダーの未使用ページ",
  ];
  const DIRS = [
    "北北西微北", "真上", "自宅から見てコンビニの方角", "進行方向やや左",
    "磁北と真北のあいだ", "南南東（ただし午前中のみ）", "エレベーターの扉が開く側",
    "昨日と同じ方角（覚えていれば）", "風上", "いちばん近い自動販売機の方角",
    "斜め45度上空", "Wi-Fiの電波が強いほう",
  ];
  const WORDS = [
    "全角スペースがあなたを試します", "「あとで読む」は読みません",
    "git push --force は方角が悪い", "セミコロンの忘れ物に注意",
    "本番環境は金曜の夕方に牙をむきます", "「一時的な対応」は永続します",
    "キャッシュを疑う前に、まず自分を疑いましょう", "既読スルーは星のせいにしてよい日です",
    "TODOコメントが3年目の誕生日を迎えます", "再起動で直るものは、再起動で直ります",
    "傘を持てば降らず、置いていけば降ります", "「すぐ終わる作業」ほど終わりません",
    "動いているコードに触りたい衝動を、星が止めています",
    "console.log の消し忘れが、誰かに発見されます",
    "名前を付けて保存、の名前で日が暮れます", "ゴミ出しの曜日感覚が一日ずれています",
  ];
  const ACTS = [
    "枕の向きを3度だけ変える", "観葉植物に今日の進捗を報告する",
    "冷蔵庫の中身を五十音順に並べる", "使っていないタブを7枚だけ閉じる",
    "靴下を左から履く", "湯呑みのお茶を時計回りに2回まわす",
    "スマホの充電を80%で止める勇気を持つ", "引き出しの3番目だけ整理する",
    "夜空に向かって小さく会釈する", "デスクトップのアイコンをひとつ成仏させる",
    "エレベーターの「閉」を押さずに待ってみる", "いつもより0.5秒長く深呼吸する",
    "パスワードを変えようと思うだけ思う", "消しゴムの角をひとつだけ使う",
  ];
  const OMNI = [
    "今日は省エネ運転が吉。無理は星に任せましょう。",
    "悪くはありません。期待さえしなければ。",
    "可もなく不可もなく。星々も平常運転です。",
    "だいたいうまくいきます。だいたいは。",
    "絶好調です。ただし調子に乗ると★2になります。",
  ];

  // ---- deterministic seed: (name + YYYY-MM-DD) -> mulberry32 ---------
  function hashSeed(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }
  function mulberry32(a) {
    return () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function fortune(name) {
    const d = new Date();
    const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const rng = mulberry32(hashSeed(name + "|" + ymd));
    const pk = a => a[(rng() * a.length) | 0];
    const lvl = 1 + ((rng() * 5) | 0);
    return {
      lvl, omni: OMNI[lvl - 1],
      item: pk(ITEMS), dir: pk(DIRS), word: pk(WORDS), act: pk(ACTS),
      dateLabel: `${d.getMonth() + 1}月${d.getDate()}日`,
    };
  }

  // ---- styles --------------------------------------------------------
  const style = document.createElement("style");
  style.textContent = `
    .uranai-act{display:inline-block;font-size:11px;color:#bda4ff;margin:7px 0 0 16px;
      cursor:pointer;letter-spacing:.05em;transition:.18s}
    .uranai-act:hover{color:var(--accent);text-shadow:0 0 9px rgba(255,210,122,.55)}
    .uranai-overlay{position:fixed;inset:0;z-index:8;display:flex;align-items:center;
      justify-content:center;background:rgba(3,4,14,.58);backdrop-filter:blur(5px)}
    .uranai-modal{position:relative;width:min(370px,88vw);max-height:84vh;overflow-y:auto;
      scrollbar-width:thin;border-radius:18px;padding:24px 26px 16px;color:var(--ink);
      background:radial-gradient(130% 95% at 50% -10%, rgba(86,52,150,.55) 0%,
        rgba(24,14,52,.97) 52%, rgba(10,6,26,.99) 100%);
      border:1px solid rgba(195,155,255,.38);
      box-shadow:0 0 46px rgba(140,90,240,.3), inset 0 0 60px rgba(90,50,170,.14),
        0 26px 70px rgba(0,0,0,.65)}
    .uranai-modal::-webkit-scrollbar{width:7px}
    .uranai-modal::-webkit-scrollbar-thumb{background:rgba(170,140,255,.3);border-radius:4px}
    .uranai-close{position:absolute;top:9px;right:12px;border:none;background:none;
      color:var(--dim);font-size:15px;line-height:1;padding:6px;cursor:pointer;transition:.2s}
    .uranai-close:hover{color:var(--ink);transform:rotate(90deg)}
    .uranai-head{text-align:center;font-size:15px;font-weight:600;letter-spacing:.06em;
      line-height:1.8;text-shadow:0 0 14px rgba(160,120,255,.45)}
    .uranai-date{text-align:center;font-size:10.5px;letter-spacing:.3em;color:#bda4ff;margin:3px 0 6px}
    .uranai-omni{text-align:center;margin-top:10px}
    .uranai-label{font-size:10px;letter-spacing:.3em;color:#bda4ff;margin-bottom:5px}
    .uranai-starline{font-size:20px;letter-spacing:.16em;color:var(--accent);
      text-shadow:0 0 11px rgba(255,210,122,.6)}
    .uranai-starline span{display:inline-block}
    .uranai-starline .uranai-off{color:rgba(180,150,255,.22);text-shadow:none}
    .uranai-omni-cm{font-size:12.5px;color:#cdd4ff;line-height:1.9;margin-top:5px}
    .uranai-sec{margin-top:13px;padding-top:12px;border-top:1px dashed rgba(190,150,255,.16)}
    .uranai-body{font-size:13px;line-height:1.9;color:#ece6ff}
    .uranai-foot{margin-top:16px;font-size:9.5px;color:var(--dim);line-height:1.7;
      text-align:center;opacity:.85}`;
  document.head.append(style);

  // ---- modal ---------------------------------------------------------
  const esc = s => String(s).replace(/[&<>"]/g,
    ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  const sec = (label, body) =>
    `<div class="uranai-sec"><div class="uranai-label">${label}</div>` +
    `<div class="uranai-body">${esc(body)}</div></div>`;

  let overlay = null;
  function onKey(e) { if (e.key === "Escape") closeModal(); }
  function closeModal() {
    try {
      if (!overlay) return;
      const o = overlay; overlay = null;
      document.removeEventListener("keydown", onKey);
      o.animate([{ opacity: 1 }, { opacity: 0 }],
        { duration: 200, easing: "ease-out", fill: "forwards" }).onfinish = () => o.remove();
    } catch (err) { console.error("[uranai]", err); }
  }
  function openModal(name) {
    try {
      closeModal();
      const f = fortune(name);
      const o = document.createElement("div");
      o.className = "uranai-overlay";
      const m = document.createElement("div");
      m.className = "uranai-modal";
      const starsHtml = Array.from({ length: 5 }, (_, i) =>
        i < f.lvl ? "<span>★</span>" : '<span class="uranai-off">☆</span>').join("");
      m.innerHTML =
        `<button class="uranai-close" aria-label="閉じる">✕</button>` +
        `<div class="uranai-head">${esc(name)}のあなたへ</div>` +
        `<div class="uranai-date">— ${f.dateLabel} —</div>` +
        `<div class="uranai-omni"><div class="uranai-label">総合運</div>` +
        `<div class="uranai-starline">${starsHtml}</div>` +
        `<div class="uranai-omni-cm">${esc(f.omni)}</div></div>` +
        sec("ラッキーアイテム", f.item) +
        sec("ラッキー方角", f.dir) +
        sec("今日のひとこと", f.word) +
        sec("開運アクション", f.act) +
        `<div class="uranai-foot">※本占いは星々の気分により予告なく変わります` +
        `（変わりません。日替わりです）</div>`;
      o.append(m);
      document.body.append(o);
      overlay = o;
      o.addEventListener("click", e => { if (e.target === o) closeModal(); });
      m.querySelector(".uranai-close").addEventListener("click", e => {
        e.stopPropagation(); closeModal();
      });
      document.addEventListener("keydown", onKey);
      // soft entrance: veil fades, card floats up, stars pop one by one
      o.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: "ease-out" });
      m.animate(
        [{ transform: "translateY(14px) scale(.94)", opacity: 0 },
         { transform: "translateY(0) scale(1)", opacity: 1 }],
        { duration: 380, easing: "cubic-bezier(.2,1.25,.35,1)" });
      m.querySelectorAll(".uranai-starline span").forEach((s, i) => {
        s.animate(
          [{ opacity: 0, transform: "scale(.2) rotate(-40deg)" },
           { opacity: 1, transform: "scale(1) rotate(0deg)" }],
          { duration: 420, delay: 160 + i * 85, fill: "backwards",
            easing: "cubic-bezier(.2,1.5,.4,1)" });
      });
    } catch (err) { console.error("[uranai]", err); }
  }

  // ---- per-card 「🔮 今日の運勢」 (cards are rebuilt on every render) ----
  SKY.on("panel-rendered", ({ container }) => {
    try {
      for (const card of container.querySelectorAll(".card")) {
        if (card.querySelector(".uranai-act")) continue;
        const cid = card.dataset.cid;
        const b = document.createElement("span");
        b.className = "uranai-act";
        b.textContent = "🔮 今日の運勢";
        b.addEventListener("click", e => {
          e.stopPropagation();
          try {
            const c = SKY.constellations.find(k => String(k.id) === String(cid));
            if (c && c.name) openModal(c.name);
          } catch (err) { console.error("[uranai]", err); }
        });
        card.append(b);
      }
    } catch (err) { console.error("[uranai]", err); }
  });

  SKY.on("cleared", closeModal);
})();
