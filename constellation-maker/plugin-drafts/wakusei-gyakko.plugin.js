// ════ plugin: wakusei-gyakko (惑星の逆行) ════ ambient wandering planets with retrograde loops
(()=>{ "use strict";
  if(!window.SKY) return;
  try{
    const SKY = window.SKY;
    const mk  = SKY.mk;
    const PRE = "wakusei-gyakko";
    const TAU = Math.PI*2;
    const rand = (a,b)=>a + Math.random()*(b-a);
    // kept for safety — any string ever placed into innerHTML must pass through here
    const esc = s=>String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

    /* ---------- style ---------- */
    const style = document.createElement("style");
    style.textContent = `.${PRE}-planet{cursor:pointer}`;
    document.head.append(style);

    /* ---------- per-planet glow gradients (ids prefixed, no collisions) ---------- */
    function addGlow(id, stops){
      const g = mk("radialGradient", {id});
      for(const [offset, col, op] of stops)
        g.append(mk("stop", {offset, "stop-color":col, "stop-opacity":op}));
      SKY.defs.append(g);
    }
    addGlow(`${PRE}-glow-v`, [["0%","#ffffff",.95],["30%","#ffeecf",.55],["100%","#ffd98f",0]]);
    addGlow(`${PRE}-glow-m`, [["0%","#ffb09a",.8],["40%","#ff8866",.32],["100%","#ff8866",0]]);
    addGlow(`${PRE}-glow-j`, [["0%","#f7efd9",.8],["40%","#f0e6c8",.3],["100%","#f0e6c8",0]]);

    /* ---------- corpora ---------- */
    const lastPick = new WeakMap();
    function pickNR(arr){            // pick, never the same twice in a row
      let i, last = lastPick.has(arr) ? lastPick.get(arr) : -1;
      do{ i = (Math.random()*arr.length)|0; }while(arr.length > 1 && i === last);
      lastPick.set(arr, i);
      return arr[i];
    }

    const PLANETS = [
      {
        key:"venus", name:"金星",
        dur:[180000, 250000], band:[.12, .26],
        warn:[
          "過去の人から連絡が来ます。来ません。",
          "既読がつかないのは電波のせいです。今夜だけはそういうことにしましょう",
          "懐かしい名前を検索したくなりますが、おすすめはしません",
          "今夜書いた長文は、朝に読み返してから送ってください",
          "思わせぶりな星の並びに深い意味はありません",
        ],
        trivia:[
          "金星: 表面温度465℃。今夜の服装の参考にはなりません",
          "金星: 一日が一年より長い星です。月曜日が長いとお嘆きのあなたへ",
          "金星: 雲は硫酸でできています。それでも明けの明星と呼ばれます",
          "金星: 明るさはマイナス4等級。夜空ではほぼ優勝です",
          "金星: 自転が逆向きです。逆行とは別の話ですが、気持ちはわかります",
        ],
        draw(g){
          const halo = mk("circle", {r:13, fill:`url(#${PRE}-glow-v)`});
          g.append(halo, mk("circle",{r:3.2, fill:"#fff7e8"}), mk("circle",{r:1.3, fill:"#ffffff"}));
          try{ halo.animate([{opacity:.72},{opacity:1},{opacity:.72}], {duration:4200, iterations:Infinity, easing:"ease-in-out"}); }catch(_){}
          return 3.2;
        },
      },
      {
        key:"mars", name:"火星",
        dur:[210000, 300000], band:[.26, .42],
        warn:[
          "レビューコメントの口調にご注意ください",
          "今夜の「了解です」は冷たく届きます。絵文字をひとつ足してください",
          "送信ボタンの前で三秒数えると、だいたいの戦争は回避できます",
          "タイポは増えます。指摘する側の誤字は、もっと増えます",
          "強めの正論は今夜、誰も救いません",
        ],
        trivia:[
          "火星: 夕焼けは青いそうです。向こうからこちらの空がどう見えるかは不明です",
          "火星: 重力は地球の38%。体重の悩みが38%になるわけではありません",
          "火星: オリンポス山は高さ約2万メートル。登山届の提出先はまだありません",
          "火星: 衛星の名はフォボスとダイモス。意味は「恐怖」と「狼狽」。かわいい名前です",
          "火星: 砂嵐が星全体を覆うことがあります。洗濯物は室内干しが安全です",
        ],
        draw(g){
          g.append(
            mk("circle", {r:8, fill:`url(#${PRE}-glow-m)`}),
            mk("circle", {r:2.4, fill:"#ff8866", stroke:"#d96a4f", "stroke-width":.4})
          );
          return 2.4;
        },
      },
      {
        key:"jupiter", name:"木星",
        dur:[260000, 360000], band:[.40, .58],
        warn:[
          "財布のひもと締切がゆるみます",
          "「大は小を兼ねる」で買ったものは、だいたい大きすぎます",
          "計画が雄大になりがちです。見積もりは三割増しでお願いします",
          "ポイント還元は収入ではありません。今夜は特に",
          "サブスクがひとつ増えそうな夜です",
        ],
        trivia:[
          "木星: 大赤斑は350年続く嵐です。月曜日の比ではありません",
          "木星: 衛星は90個以上。全員の名前を覚えている人は神話の中にもいません",
          "木星: 一日は約10時間。締切が来るのも1.4倍速です",
          "木星: ほぼガスでできています。中身の話はあまり聞かないであげてください",
          "木星: 地球が1300個入ります。入れる予定はありません",
        ],
        draw(g){
          g.append(
            mk("circle", {r:10, fill:`url(#${PRE}-glow-j)`}),
            mk("circle", {r:3.6, fill:"#f0e6c8"}),
            mk("line", {x1:-3.2,  y1:-1.15, x2:3.2,  y2:-1.15, stroke:"#c5b08a", "stroke-width":.55, opacity:.6}),
            mk("line", {x1:-3.25, y1:1.05,  x2:3.25, y2:1.05,  stroke:"#c5b08a", "stroke-width":.55, opacity:.6})
          );
          return 3.6;
        },
      },
    ];

    /* ---------- build one planet group ---------- */
    function build(def){
      const g = mk("g", {class:`${PRE}-planet`, "data-planet":def.key});
      g.style.pointerEvents = "auto";
      g.style.display = "none";
      g.append(mk("circle", {r:16, fill:"transparent", "pointer-events":"all"})); // hit area
      const r = def.draw(g);
      const label = mk("text", {y:(r+13).toFixed(1), "text-anchor":"middle",
        "font-size":9, fill:"var(--dim)", opacity:.55,
        "font-family":"inherit", "letter-spacing":".12em", "pointer-events":"none"});
      label.textContent = def.name;
      g.append(label);
      g.addEventListener("pointerdown", e=>{
        try{
          if(e.button !== 0) return;
          if(e.defaultPrevented) return;     // another plugin claimed this click
          e.preventDefault();                // core skips star placement
          e.stopPropagation();
          SKY.toast(pickNR(def.trivia));
        }catch(err){ console.error("[wakusei-gyakko] click", err); }
      });
      return g;
    }

    /* ---------- retrograde trail dots ---------- */
    const gTrail = mk("g", {"pointer-events":"none"});
    let dotLive = 0;
    function dropDot(x, y){
      try{
        if(dotLive > 180) return;
        dotLive++;
        const c = mk("circle", {cx:x.toFixed(1), cy:y.toFixed(1), r:1.1, fill:"#cdd6ff", opacity:.5});
        gTrail.append(c);
        const a = c.animate([{opacity:.5},{opacity:.38, offset:.55},{opacity:0}],
          {duration:9000, easing:"linear", fill:"forwards"});
        a.onfinish = ()=>{ try{ c.remove(); }catch(_){} dotLive--; };
      }catch(err){ console.error("[wakusei-gyakko] dot", err); }
    }

    /* ---------- state machine (elapsed-wall-time driven) ---------- */
    const planets = PLANETS.map(def=>({def, el:build(def), state:"wait", tNext:Infinity}));
    SKY.gShoot.append(gTrail, ...planets.map(p=>p.el));

    const MARGIN = 70;                                   // off-screen overshoot, px
    function enter(pl, skip){
      try{
        const d = pl.def;
        pl.fromLeft = Math.random() < .5;                // may re-enter from either side
        pl.dur = rand(d.dur[0], d.dur[1]);               // 3–6 min crossing
        pl.yf  = rand(d.band[0], d.band[1]);             // own height band
        pl.amp = rand(12, 26);                           // gentle sine wander
        pl.cyc = rand(1.1, 2.3);
        pl.ph  = rand(0, TAU);
        pl.retro = null;
        if(Math.random() < .30){                         // rolled once at entry
          const w = 7500 / pl.dur;                       // half-window: 15s total
          pl.retro = {c:rand(.42,.58), w, K:(2*w/Math.PI)*1.8, B:rand(8,14),
                      toasted:false, lastDot:0, dotNow:false};
        }
        pl.t0 = performance.now() - (skip || 0)*pl.dur;  // stagger: start partway in
        pl.state = "cross";
        pl.el.style.display = "";
        try{ pl.el.animate([{opacity:0},{opacity:1}], {duration:1400, easing:"ease-out"}); }catch(_){}
      }catch(err){
        console.error("[wakusei-gyakko] enter", err);
        pl.state = "wait"; pl.tNext = performance.now() + 60000;
      }
    }

    function leave(pl){
      pl.el.style.display = "none";
      pl.state = "wait";
      pl.tNext = performance.now() + rand(30000, 90000); // off-screen 30–90s
    }

    function announceRetro(pl){
      try{
        SKY.toast(`⚠ ${pl.def.name}が逆行をはじめました。${pickNR(pl.def.warn)}`);
      }catch(err){ console.error("[wakusei-gyakko] retro toast", err); }
    }

    function frame(){
      try{
        const now = performance.now(), W = SKY.W, H = SKY.H;
        for(const pl of planets){
          if(pl.state === "wait"){
            if(now >= pl.tNext) enter(pl, 0);
            continue;
          }
          const p = (now - pl.t0) / pl.dur;
          if(p >= 1.001){ leave(pl); continue; }
          let pe = p, yEx = 0;
          const R = pl.retro;
          if(R){
            const t = (p - (R.c - R.w)) / (2*R.w);       // 0..1 inside the retro window
            if(t > 0 && t < 1){
              pe  = p - R.K * Math.sin(Math.PI*t)**2;    // decelerate → reverse → resume
              yEx = -R.B * Math.sin(TAU*t);              // slight vertical bulge → loop
              if(!R.toasted){
                R.toasted = true;
                if(t < .5) announceRetro(pl);            // skip stale toast after a bg tab
              }
              if(now - R.lastDot > 140){ R.lastDot = now; R.dotNow = true; }
            }
          }
          // x from CURRENT viewport width, so resizes mid-crossing stay correct
          const span = W + 2*MARGIN;
          const x = pl.fromLeft ? (-MARGIN + span*pe) : (W + MARGIN - span*pe);
          const y = H*pl.yf + pl.amp*Math.sin(pl.ph + pe*pl.cyc*TAU) + yEx;
          pl.el.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
          if(R && R.dotNow){ R.dotNow = false; dropDot(x, y); }
        }
      }catch(err){ console.error("[wakusei-gyakko] frame", err); }
      requestAnimationFrame(frame);
    }

    /* ---------- stagger: 2 visible early, 1 arrives later ---------- */
    enter(planets[0], rand(.12, .30));                   // 金星 — already partway across
    enter(planets[2], rand(.40, .60));                   // 木星 — mid-sky
    planets[1].tNext = performance.now() + rand(25000, 75000); // 火星 — first entry 25–75s

    requestAnimationFrame(frame);
  }catch(err){
    console.error("[wakusei-gyakko] init", err);
  }
})();
