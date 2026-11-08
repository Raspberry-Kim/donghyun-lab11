#!/usr/bin/env node
/* 동현주 무작위 놀이 검사 · node qa/fuzz-play.cjs [seeds=30] [rate=0.08]
   매 프레임(1/60초) 확률 rate로 '맞는 길' 하나를 골라 바꾸고, 가끔 아무 칸이나 바꾸거나 쌍안경을 쓰며,
   반짝 판은 멎어 있으면 눌러 본다. 끝(over/end)까지 돌리면서 아래를 매 프레임 확인한다.
   - 바꾸는 중인 열이 아니면 구멍이 없다 · 얼굴 번호는 0..7 · y는 음수가 아니다
   - 시간은 0..1 · 점수는 수 · 할당량은 음수가 아니다 · 상태는 다섯 가지 중 하나 */
const {Game,N,WILD}=require('../src/engine.js');
const seeds=+process.argv[2]||30, rate=+process.argv[3]||0.08;
const STATUS=new Set(['play','clearing','clear','over','end']);
let fails=0, stats={match:0,level:0,shuffle:0,over:0,special:0,wild:0,end:0,swapfail:0,hint:0}, maxLevel=0, totalT=0;
const rnd=(()=>{ let a=20261108; return ()=>{ a=(a*1103515245+12345)&0x7fffffff; return a/0x7fffffff; }; })();
for(let seed=1;seed<=seeds;seed++){
  const g=new Game({seed,level:1,hints:3}); let t=0, ok=true;
  for(let step=0;step<300000&&g.status!=='over'&&g.status!=='end'&&ok;step++){
    g.tick(1/60); t+=1/60;
    if(!STATUS.has(g.status)){ fails++; ok=false; console.log('bad status',seed,step,g.status); }
    for(let c=0;c<N&&ok;c++){ let busy=false; for(let r=0;r<N;r++){ const x=g.grid[r][c]; if(x&&x.busy) busy=true; }
      for(let r=0;r<N;r++){ const x=g.grid[r][c];
        if(!x){ if(!busy){ fails++; ok=false; console.log('hole without busy',seed,step,r,c); } continue; }
        if(!(x.y>=0)||!(x.k>=0&&x.k<=WILD)){ fails++; ok=false; console.log('bad tile',seed,step,r,c,x); } } }
    if(!(g.time>=0&&g.time<=1)||!Number.isFinite(g.score)){ fails++; ok=false; console.log('bad time/score',seed,step,g.time,g.score); }
    for(let k=0;k<g.quota.length;k++) if(g.quota[k]<0){ fails++; ok=false; console.log('negative quota',seed,step,k); }
    if(g.status==='play'&&rnd()<rate){ const mv=g.moves(); if(mv.length){ const m=mv[Math.floor(rnd()*mv.length)]; g.swap(m.a,m.b); }
      for(let r=0;r<N;r++) for(let c=0;c<N;c++){ const x=g.grid[r][c]; if(x&&x.special&&g.settled(x)&&rnd()<0.3) g.press(r,c); } }
    if(rnd()<0.004){ const r=Math.floor(rnd()*N), c=Math.floor(rnd()*(N-1)); g.swap({r,c},{r,c:c+1}); }
    if(rnd()<0.001) g.hint();
    for(const e of g.takeEvents()){ if(stats[e.t]!==undefined) stats[e.t]++; if(e.t==='match'&&e.wild) stats.wild++; }
  }
  if(ok&&g.status!=='over'&&g.status!=='end'){ fails++; console.log('did not finish',seed,g.status); }
  maxLevel=Math.max(maxLevel,g.level); totalT+=t;
}
console.log(JSON.stringify(stats),'fails',fails,'maxLevel',maxLevel,'avg sec',(totalT/seeds).toFixed(1));
if(fails){ console.log('실패',fails); process.exit(1); }
console.log(`모두 통과 · ${seeds}판 · 매 프레임 ${rate}`);
