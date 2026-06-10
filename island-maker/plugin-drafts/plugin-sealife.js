(()=>{ "use strict";
if(!window.ISLE) return;
const I = window.ISLE;
const mk = I.mk;
const TAU = Math.PI*2;
const rnd = (a,b)=>a+Math.random()*(b-a);
const edge = (u,k)=>Math.max(0,Math.min(1,u*k,(1-u)*k)); // fade-in/out ramp

try{
  const style=document.createElement("style");
  style.textContent=".sealife-hit{cursor:pointer}";
  document.head.append(style);
  const f=mk("filter",{id:"sealife-blur",x:"-80%",y:"-80%",width:"260%",height:"260%"});
  f.append(mk("feGaussianBlur",{stdDeviation:2.2}));
  I.defs.append(f);
}catch(err){ console.error("[sealife]",err); }

const WHALE_LINES=[
  "目が合いました。クジラは会釈をしました",
  "クジラは気づいていないふりをしています",
  "クジラから特にコメントはありませんでした",
  "クジラはこちらを確認しましたが、急いでいるそうです",
  "クジラは尾びれを少しだけ上げました。挨拶とみられます",
];

/* ============ actor ticker — elapsed wall time ============ */
const actors=new Set();
let rafOn=false;
function addActor(a){
  a.t0=performance.now();
  actors.add(a);
  if(!rafOn){ rafOn=true; requestAnimationFrame(loop); }
}
function loop(){
  const t=performance.now();
  for(const a of [...actors]){
    try{
      const u=(t-a.t0)/a.dur;
      if(a.dead || u>=1){
        if(!a.dead) a.tick(1,t);          // fire any missed beats once
        actors.delete(a); a.el.remove(); if(a.done) a.done();
      }else a.tick(u,t);
    }catch(err){
      console.error("[sealife actor]",err);
      actors.delete(a);
      try{ a.el.remove(); if(a.done) a.done(); }catch(_){}
    }
  }
  if(actors.size) requestAnimationFrame(loop); else rafOn=false;
}

/* ============ small splash / ripple / spout fx ============ */
function ripple(x,y,r0){
  for(let i=0;i<2;i++){
    const ring=mk("ellipse",{cx:x,cy:y,rx:r0,ry:r0*.34,fill:"none",stroke:"#ffffff",
      "stroke-width":1.5,opacity:.6,"pointer-events":"none"});
    ring.style.transformOrigin=`${x}px ${y}px`;
    I.gFx.append(ring);
    ring.animate([{transform:"scale(.4)",opacity:.6},{transform:`scale(${1.9+i*.7})`,opacity:0}],
      {duration:1100+i*450,easing:"ease-out"}).onfinish=()=>ring.remove();
  }
}
function splash(x,y,k){
  const n=6+(Math.random()*4|0);
  for(let i=0;i<n;i++){
    const c=mk("circle",{cx:x,cy:y,r:rnd(.9,2.4),fill:"#ffffff",opacity:.9,"pointer-events":"none"});
    I.gFx.append(c);
    const dx=rnd(-20,20)*k, up=rnd(7,22)*k;
    c.animate([
      {transform:"translate(0,0)",opacity:.9},
      {transform:`translate(${dx}px,${-up}px)`,opacity:.75,offset:.45},
      {transform:`translate(${(dx*1.4).toFixed(1)}px,${rnd(2,7).toFixed(1)}px)`,opacity:0}
    ],{duration:rnd(500,850),easing:"ease-out"}).onfinish=()=>c.remove();
  }
}
function spout(x,y,dir){
  const g=mk("g",{"pointer-events":"none"});
  for(const fx of [-1,-.5,0,.5,1]){
    const len=rnd(11,18);
    g.append(mk("path",{d:`M ${x} ${y} Q ${x+fx*6} ${y-len*.6} ${x+fx*9} ${y-len}`,
      stroke:"#ffffff","stroke-width":1.6,fill:"none","stroke-linecap":"round"}));
  }
  I.gFx.append(g);
  g.animate([{opacity:0},{opacity:.95,offset:.25},{opacity:0}],
    {duration:1000,easing:"ease-out"}).onfinish=()=>g.remove();
  const mist=mk("circle",{cx:x,cy:y-14,r:7,fill:"#ffffff",opacity:.5,
    filter:"url(#sealife-blur)","pointer-events":"none"});
  mist.style.transformOrigin=`${x}px ${y-14}px`;
  I.gFx.append(mist);
  mist.animate([
    {transform:"translate(0,0) scale(1)",opacity:.5},
    {transform:`translate(${dir*14}px,-16px) scale(1.9)`,opacity:0}
  ],{duration:1800,easing:"ease-out"}).onfinish=()=>mist.remove();
}

/* ============ WHALE ============ */
let whaleClipN=0, whaleActive=false;

function findLane(){ // straightish line across open water, max clearance from islands
  const W=I.W,H=I.H;
  if(W<300||H<260) return null;
  let best=null,score=-1;
  for(let k=0;k<26;k++){
    const dir=Math.random()<.5?1:-1;
    const ya=rnd(120,H-100);
    const yb=Math.max(120,Math.min(H-100, ya+rnd(-H*.18,H*.18)));
    const A={x:dir>0?-90:W+90, y:ya}, B={x:dir>0?W+90:-90, y:yb};
    let minC=1e9;
    for(let s=0;s<=12;s++){
      const px=A.x+(B.x-A.x)*s/12, py=A.y+(B.y-A.y)*s/12;
      for(const isl of I.islands){
        const c=Math.hypot(isl.x-px,isl.y-py)-isl.size*1.5;
        if(c<minC) minC=c;
      }
    }
    if(!I.islands.length) minC=500;
    if(minC>score){ score=minC; best={A,B,dir}; }
  }
  return score>70 ? best : null;
}

function startWhale(lane){
  whaleActive=true;
  const {A,B,dir}=lane, dur=20000;
  const nB=Math.random()<.5?2:3, hw=.075;
  const wins=[];
  for(let k=0;k<nB;k++){
    wins.push({c:(k+.55)/nB*.86+.04+rnd(-.02,.02), hw, kind:"back",
      first:k===0, started:false, crested:false, exited:false});
  }
  wins.push({c:wins[nB-1].c+hw+.06, hw:.05, kind:"fluke",
    started:false, crested:true, exited:false});

  const gW=mk("g",{"pointer-events":"none"});
  const shadow=mk("ellipse",{rx:40,ry:9,fill:"#143038",opacity:0});
  const clipId="sealife-clip-"+(++whaleClipN);
  const clip=mk("clipPath",{id:clipId});
  clip.append(mk("rect",{x:-160,y:-180,width:320,height:180})); // show only above waterline
  I.defs.append(clip);
  const gSurf=mk("g");
  const gClip=mk("g",{"clip-path":`url(#${clipId})`});
  const backG=mk("g",{visibility:"hidden"});
  backG.append(
    mk("path",{d:"M -46 18 C -36 -6 -18 -16 0 -16 C 18 -16 36 -6 46 18 Z",
      fill:"#3e5866",stroke:"#27424f","stroke-width":1,"stroke-opacity":.5}),
    mk("path",{d:"M -16 -13 C -14 -19 -10 -24 -4 -27 C -7 -20 -7 -16 -6 -12 Z",fill:"#3e5866"})
  );
  const flukeG=mk("g",{visibility:"hidden"});
  flukeG.append(
    mk("path",{d:"M -5 30 C -4 18 -4 10 -2 3 L 3 3 C 2 10 2 18 4 30 Z",fill:"#3e5866"}),
    mk("path",{d:"M 0 6 C -9 8 -19 3 -27 -11 C -15 -15 -4 -10 0 -1 C 4 -10 15 -15 27 -11 C 19 3 9 8 0 6 Z",
      fill:"#3e5866",stroke:"#27424f","stroke-width":1,"stroke-opacity":.5})
  );
  gClip.append(backG,flukeG);
  const hit=mk("ellipse",{cx:0,cy:-8,rx:66,ry:44,fill:"none",
    "pointer-events":"none",class:"sealife-hit"});
  gSurf.append(gClip,hit);
  gW.append(shadow,gSurf);
  I.gFx.append(gW);

  let clicked=false;
  hit.addEventListener("pointerdown",e=>{
    try{
      if(e.button!==0) return;
      e.preventDefault(); e.stopPropagation();   // no island under the whale, please
      if(!clicked){ clicked=true; I.toast(I.pick(WHALE_LINES)); }
    }catch(err){ console.error("[sealife]",err); }
  });

  let lastT=0, announced=false;
  addActor({el:gW, dur,
    done(){ whaleActive=false; clip.remove(); },
    tick(u,t){
      const visOK=lastT>0 && (t-lastT)<400; lastT=t; // suppress fx after long throttled gaps
      const px=A.x+(B.x-A.x)*u, py=A.y+(B.y-A.y)*u;
      shadow.setAttribute("cx",px.toFixed(1)); shadow.setAttribute("cy",(py+4).toFixed(1));
      shadow.setAttribute("opacity",(.11*edge(u,10)).toFixed(3));
      gSurf.setAttribute("transform",`translate(${px.toFixed(1)} ${py.toFixed(1)}) scale(${dir} 1)`);
      let surfaced=false, backOn=false, flukeOn=false;
      for(const w of wins){
        const a0=w.c-w.hw, a1=w.c+w.hw;
        if(!w.started && u>=a0){
          w.started=true;
          if(visOK){ splash(px,py,w.kind==="back"?1:.7); ripple(px,py,w.kind==="back"?26:18); }
        }
        if(!w.crested && u>=w.c){
          w.crested=true;
          if(w.first){
            if(!announced){
              announced=true;
              if(visOK) I.toast("クジラです");
              try{ I.emit("sealife:whale"); }catch(err){ console.error("[sealife]",err); }
            }
            if(visOK) spout(px,py-20,dir);
          }
        }
        if(!w.exited && u>=a1){
          w.exited=true;
          if(visOK){ splash(px,py,.6); ripple(px,py,20); }
        }
        if(u>=a0 && u<=a1){
          const p=(u-a0)/(a1-a0), s=Math.sin(Math.PI*p);
          if(w.kind==="back"){
            backOn=true;
            backG.setAttribute("transform",
              `translate(0 ${(26-42*s).toFixed(1)}) rotate(${(9-18*p).toFixed(1)})`);
            if(s>.12) surfaced=true;
          }else{
            flukeOn=true;
            flukeG.setAttribute("transform",
              `translate(-10 ${(30-44*s).toFixed(1)}) rotate(${(-6-22*p).toFixed(1)})`);
          }
        }
      }
      backG.setAttribute("visibility",backOn?"visible":"hidden");
      flukeG.setAttribute("visibility",flukeOn?"visible":"hidden");
      hit.setAttribute("pointer-events",surfaced?"all":"none");
    }});
}

/* ============ SEABIRDS ============ */
function spawnBirds(){
  const W=I.W,H=I.H;
  const n=3+(Math.random()*4|0);
  let P;
  if(I.islands.length){
    const isl=I.pick(I.islands);
    P={x:isl.x, y:Math.max(90,Math.min(H-80,isl.y-isl.size*1.1))};
  }else{
    P={x:W*rnd(.25,.75), y:H*rnd(.25,.65)};
  }
  const dir=Math.random()<.5?1:-1, slope=rnd(-.18,.18), L=W+420;
  const g=mk("g",{"pointer-events":"none",opacity:0});
  const birds=[];
  for(let i=0;i<n;i++){
    const rank=Math.ceil(i/2), side=i%2?1:-1;
    const b={
      bx:-rank*rnd(22,30)*dir+rnd(-4,4),
      by:side*rank*rnd(10,15)+rnd(-3,3),
      ph:Math.random()*TAU, bob:rnd(2,4), bf:rnd(1.2,2), ff:rnd(7,10), sc:rnd(.85,1.2),
      el:mk("path",{d:"M -6 0 Q -3 -4.5 0 -1 Q 3 -4.5 6 0",
        stroke:"#33555f","stroke-width":1.6,fill:"none","stroke-linecap":"round"})
    };
    g.append(b.el); birds.push(b);
  }
  I.gFx.append(g);
  addActor({el:g, dur:12000, tick(u,t){
    g.setAttribute("opacity",edge(u,8).toFixed(2));
    const hx=P.x+(u-.5)*dir*L, hy=P.y+(u-.5)*dir*L*slope, ts=t/1000;
    for(const b of birds){
      const y=hy+b.by+Math.sin(ts*b.bf+b.ph)*b.bob;
      const flap=.45+.55*Math.abs(Math.sin(ts*b.ff+b.ph));
      b.el.setAttribute("transform",
        `translate(${(hx+b.bx).toFixed(1)} ${y.toFixed(1)}) scale(${b.sc.toFixed(2)} ${(b.sc*flap).toFixed(2)})`);
    }
  }});
}

/* ============ FISH SHADOWS ============ */
function spawnFish(){
  if(!I.islands.length) return;
  const isl=I.pick(I.islands);
  const cx=isl.x, cy=isl.y, islandId=isl.id;
  const n=8+(Math.random()*7|0);
  const a0=Math.random()*TAU;
  const sweep=(Math.random()<.5?-1:1)*rnd(1.1,1.8);
  const r0=isl.size*rnd(1.05,1.3);
  const g=mk("g",{"pointer-events":"none",opacity:0});
  const fish=[];
  for(let i=0;i<n;i++){
    const fz={lag:i*.05+rnd(0,.03), roff:rnd(-7,7), ph:Math.random()*TAU,
      wf:rnd(2.5,5), amp:rnd(1.5,3.5),
      el:mk("ellipse",{rx:rnd(3.4,4.8).toFixed(1),ry:rnd(1.2,1.8).toFixed(1),fill:"#1d3a45"})};
    g.append(fz.el); fish.push(fz);
  }
  I.gFx.append(g);
  addActor({el:g, dur:10000, islandId, tick(u,t){
    g.setAttribute("opacity",(.18*edge(u,6)).toFixed(3));
    const ts=t/1000;
    for(const fz of fish){
      const th=a0+sweep*u-Math.sign(sweep)*fz.lag;
      const r=r0+fz.roff+Math.sin(ts*fz.wf+fz.ph)*fz.amp;
      const x=cx+Math.cos(th)*r, y=cy+Math.sin(th)*r;
      const deg=(th+(sweep>0?1:-1)*Math.PI/2)*180/Math.PI;
      fz.el.setAttribute("transform",`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${deg.toFixed(1)})`);
    }
  }});
}

/* fish schools dissolve if their island vanishes */
I.on("island-removed",isl=>{ for(const a of actors) if(a.islandId===isl.id) a.dead=true; });
I.on("cleared",()=>{ for(const a of actors) if(a.islandId!=null) a.dead=true; });

/* ============ scheduling ============ */
function later(fn,ms){ setTimeout(()=>{ try{ fn(); }catch(err){ console.error("[sealife]",err); } },ms); }

(function whaleLoop(delay){
  later(()=>{
    if(document.hidden||whaleActive){ whaleLoop(rnd(8000,15000)); return; }
    const lane=findLane();
    if(!lane){ whaleLoop(rnd(25000,45000)); return; }  // sea too crowded — try later
    startWhale(lane);
    whaleLoop(rnd(120000,240000));
  },delay);
})(rnd(50000,95000));

(function birdLoop(delay){
  later(()=>{
    if(!document.hidden) spawnBirds();
    birdLoop(rnd(60000,100000));
  },delay);
})(rnd(15000,40000));

(function fishLoop(delay){
  later(()=>{
    if(!document.hidden && Math.random()<.5) spawnFish();
    fishLoop(rnd(40000,52000));
  },delay);
})(rnd(20000,45000));
})();
