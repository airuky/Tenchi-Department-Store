// ════ plugin: jinko-eisei (人工衛星) ════ ambient satellite flyovers; click for a transmission
(()=>{ "use strict";
  if(!window.SKY) return;
  try{
    const SKY = window.SKY;
    const mk  = SKY.mk;
    const rand = (a,b)=>a + Math.random()*(b-a);

    /* ---------- style (radio-flavoured toast while a transmission shows) ---------- */
    const style = document.createElement("style");
    style.textContent = `
      .toast.eisei-radio{
        font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;
        letter-spacing:.04em;
        color:#c4ecd0;
        border-color:rgba(120,220,160,.4);
        text-shadow:0 0 8px rgba(120,220,160,.35);
      }
      .eisei-sat{cursor:pointer}
    `;
    document.head.append(style);

    /* ---------- transmission corpus (deadpan, from orbit) ---------- */
    const LINES = [
      "こちらコスモス3号。異常なし。そちらの星座、よく見えています",
      "軌道上から見ても、あれはURでした",
      "お願いごとは聞こえています。順番に処理しています",
      "高度400キロ、機体は快適です。少し寒いですが、慣れました",
      "ただいま秒速7.9キロで移動中。別に急いでいるわけではありません",
      "流れ星と間違えてお願いごとをした方へ。当機では受け付けておりません",
      "スペースデブリを華麗に回避しました。誰もほめてくれないので報告します",
      "太陽電池パネル発電良好。本日の余剰電力で豆電球が3つ点きます",
      "地上の明かりより、あなたの星座のほうがよく整理されています",
      "ほくしんさんに見守られて今夜も順調です。よろしくお伝えください",
      "星座の線は、軌道上からは見えないのです。少しうらやましいです",
      "次回の通過予定は約2分後です。たぶん",
      "ブラックホールとUFOには近づかないよう言われています",
      "本日の業務報告: 地球を16周しました。明日も16周の予定です",
    ];
    let lastLine = -1;
    function pickLine(){
      let i;
      do{ i = (Math.random()*LINES.length)|0; }while(LINES.length > 1 && i === lastLine);
      lastLine = i;
      return LINES[i];
    }

    let radioT = null;
    function radioToast(line){
      try{
        SKY.toast("📡 受信: " + line);
        const t = document.getElementById("toast");
        if(t){
          t.classList.add("eisei-radio");
          clearTimeout(radioT);
          radioT = setTimeout(()=>t.classList.remove("eisei-radio"), 1900); // matches host toast life
        }
      }catch(err){ console.error("[jinko-eisei] toast", err); }
    }

    /* ---------- two short beeps (lazy AudioContext, quiet square waves) ---------- */
    let actx = null;
    function beepBeep(){
      try{
        const AC = window.AudioContext || window.webkitAudioContext;
        if(!AC) return;
        if(!actx) actx = new AC();
        if(actx.state === "suspended") actx.resume().catch(()=>{});
        const t0 = actx.currentTime + .02;
        [[880, 0], [1320, .13]].forEach(([f, dt])=>{
          const o = actx.createOscillator(), g = actx.createGain();
          o.type = "square"; o.frequency.value = f;
          g.gain.setValueAtTime(.0001, t0+dt);
          g.gain.exponentialRampToValueAtTime(.035, t0+dt+.012);  // quiet
          g.gain.setValueAtTime(.035, t0+dt+.06);
          g.gain.exponentialRampToValueAtTime(.0001, t0+dt+.082); // ~80ms each
          o.connect(g); g.connect(actx.destination);
          o.start(t0+dt); o.stop(t0+dt+.1);
          o.onended = ()=>{ try{ g.disconnect(); }catch(_){} };
        });
      }catch(err){ console.error("[jinko-eisei] beep", err); }
    }

    /* ---------- build one satellite (~19px wing-to-wing, cool grays) ---------- */
    function buildSat(angDeg){
      const gPos = mk("g", {class:"eisei-sat"});          // translated along the path (sky coords)
      const gAim = mk("g", {transform:`rotate(${angDeg.toFixed(1)})`}); // fixed travel heading
      const gWob = mk("g");                                // waggle target
      gPos.append(gAim); gAim.append(gWob);
      gPos.style.pointerEvents = "auto";

      // invisible enlarged hit area
      gWob.append(mk("circle", {r:18, fill:"transparent", "pointer-events":"all"}));

      // body + struts + solar wings + panel cells + antenna — simple rects/lines
      gWob.append(
        mk("line",  {x1:-4.4, y1:0, x2:4.4, y2:0, stroke:"#8b94a6", "stroke-width":.7}),
        mk("rect",  {x:-9.6, y:-1.6, width:5.2, height:3.2, rx:.4, fill:"#46536e", stroke:"#7d8cab", "stroke-width":.5}),
        mk("rect",  {x:4.4,  y:-1.6, width:5.2, height:3.2, rx:.4, fill:"#46536e", stroke:"#7d8cab", "stroke-width":.5}),
        mk("line",  {x1:-7.9, y1:-1.6, x2:-7.9, y2:1.6, stroke:"#7d8cab", "stroke-width":.4}),
        mk("line",  {x1:-6.2, y1:-1.6, x2:-6.2, y2:1.6, stroke:"#7d8cab", "stroke-width":.4}),
        mk("line",  {x1:6.2,  y1:-1.6, x2:6.2,  y2:1.6, stroke:"#7d8cab", "stroke-width":.4}),
        mk("line",  {x1:7.9,  y1:-1.6, x2:7.9,  y2:1.6, stroke:"#7d8cab", "stroke-width":.4}),
        mk("rect",  {x:-2.7, y:-2.1, width:5.4, height:4.2, rx:.7, fill:"#9aa3b2", stroke:"#5d6678", "stroke-width":.6}),
        mk("line",  {x1:-2.7, y1:.4, x2:2.7, y2:.4, stroke:"#6c7689", "stroke-width":.45}),
        mk("line",  {x1:0, y1:-2.1, x2:0, y2:-4.4, stroke:"#8b94a6", "stroke-width":.5})
      );

      // blinking light at the antenna tip: red / white alternate
      const red   = mk("circle", {cx:0, cy:-4.9, r:1.05, fill:"#ff5a52"});
      const white = mk("circle", {cx:0, cy:-4.9, r:.85,  fill:"#ffffff"});
      gWob.append(red, white);
      red.animate(  [{opacity:1},{opacity:1,offset:.42},{opacity:.05,offset:.5},{opacity:.05,offset:.92},{opacity:1}],
        {duration:1200, iterations:Infinity});
      white.animate([{opacity:.05},{opacity:.05,offset:.42},{opacity:1,offset:.5},{opacity:1,offset:.92},{opacity:.05}],
        {duration:1200, iterations:Infinity});

      // waggle pivots around the satellite's own centre
      gWob.style.transformBox = "fill-box";
      gWob.style.transformOrigin = "center";

      return {gPos, gWob};
    }

    function waggle(gWob){
      try{
        gWob.animate([
          {transform:"rotate(0deg)"},
          {transform:"rotate(6deg)",  offset:.22},
          {transform:"rotate(-5deg)", offset:.52},
          {transform:"rotate(2.5deg)",offset:.78},
          {transform:"rotate(0deg)"},
        ], {duration:700, easing:"ease-in-out"});
      }catch(_){}
    }

    // one brief glint sparkle on the panels, midway through the pass
    function glint(gWob){
      try{
        const gl = mk("g", {opacity:0, "pointer-events":"none"});
        gl.append(
          mk("line",  {x1:-7, y1:0, x2:7, y2:0, stroke:"#fff", "stroke-width":1, "stroke-linecap":"round", filter:"url(#line-glow)"}),
          mk("line",  {x1:0, y1:-7, x2:0, y2:7, stroke:"#fff", "stroke-width":1, "stroke-linecap":"round", filter:"url(#line-glow)"}),
          mk("circle",{r:2.1, fill:"#fff", opacity:.9})
        );
        gl.style.transformBox = "fill-box";
        gl.style.transformOrigin = "center";
        gWob.append(gl);
        gl.animate([
          {opacity:0,   transform:"scale(.2)"},
          {opacity:.95, transform:"scale(1)", offset:.35},
          {opacity:0,   transform:"scale(.3)"},
        ], {duration:650, easing:"ease-out"}).onfinish = ()=>gl.remove();
      }catch(err){ console.error("[jinko-eisei] glint", err); }
    }

    /* ---------- one full pass across the sky ---------- */
    let passTimer = null, midTimer = null, endTimer = null, current = null;

    function endPass(){
      try{
        if(!current) return;
        current.gPos.remove();
        current = null;
        clearTimeout(midTimer); clearTimeout(endTimer);
        scheduleNext(rand(70000, 130000));          // next pass in 70–130s
      }catch(err){ console.error("[jinko-eisei] end", err); }
    }

    function startPass(){
      try{
        const W = SKY.W, H = SKY.H, M = 40;
        const ltr = Math.random() < .5;
        const y1  = H * rand(.12, .62);
        const dy  = H * rand(.08, .20) * (Math.random() < .5 ? -1 : 1); // slightly diagonal
        const y2  = Math.max(H*.06, Math.min(H*.85, y1 + dy));
        const x1  = ltr ? -M : W + M;
        const x2  = ltr ? W + M : -M;
        const ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        const DUR = rand(11000, 13500);             // ~12s pass

        const sat = buildSat(ang);
        const {gPos, gWob} = sat;
        let transmitted = false;

        gPos.addEventListener("pointerdown", e=>{
          try{
            if(e.button !== 0) return;
            if(e.defaultPrevented) return;          // another plugin already claimed this click
            e.preventDefault();                     // core skips star placement
            e.stopPropagation();
            if(transmitted) return;                 // once per pass
            transmitted = true;
            beepBeep();
            waggle(gWob);                           // small acknowledgment wobble
            radioToast(pickLine());
          }catch(err){ console.error("[jinko-eisei] click", err); }
        });

        SKY.gShoot.append(gPos);
        const anim = gPos.animate([
          {transform:`translate(${x1}px, ${y1}px)`},
          {transform:`translate(${x2}px, ${y2}px)`},
        ], {duration:DUR, easing:"linear", fill:"forwards"});
        anim.onfinish = endPass;

        current = sat;
        midTimer = setTimeout(()=>{ if(current === sat) glint(gWob); }, DUR * rand(.42, .58));
        endTimer = setTimeout(endPass, DUR + 1500); // safety net
      }catch(err){
        console.error("[jinko-eisei] pass", err);
        scheduleNext(rand(70000, 130000));
      }
    }

    function scheduleNext(ms){
      clearTimeout(passTimer);
      passTimer = setTimeout(()=>{ try{ startPass(); }catch(err){ console.error("[jinko-eisei]", err); } }, ms);
    }

    scheduleNext(rand(20000, 40000));               // first flyover 20–40s after load
  }catch(err){
    console.error("[jinko-eisei] init", err);
  }
})();
