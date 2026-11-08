/* 동현주 규칙 엔진: 8×8 판에서 같은 얼굴 셋을 나란히 맞춰 잡는다. 중력·연쇄·할당량·시간·쌍안경·반짝 판·보병(만능 얼굴).
   DOM 없이 돌아가므로 qa/에서 Node로 그대로 시험한다. 시간은 tick(dt, 초)으로만 흐른다. */
(function(root){
'use strict';
const N=8, KINDS=7, WILD=7, MAX_LEVEL=20;
const FALL=13, POP_TIME=0.22, SWAP_TIME=0.14, HINT_TIME=2.2, CLEAR_TIME=1.5;
function rng(seed){ let a=seed>>>0; return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
/* 단계별 수치 */
function quotaOf(level){ return Math.min(3+Math.max(0,level-3),12); }          // 1~3단계 3마리, 그 뒤 하나씩, 최대 12
function barSeconds(level){ return Math.max(12,32-(level-1)*1.1); }             // 가득 찬 시간 막대가 비는 데 걸리는 초
function gainOf(n){ return n>=5?0.22:n===4?0.14:0.08; }                         // 한 묶음이 채우는 시간(막대 비율)
function baseOf(n){ return n*10+(n>3?(n-3)*20:0); }                              // 셋 30 · 넷 60 · 다섯 90 …
const HINT_STEP=5000, HINT_MAX=9, CHAIN_CAP=8;                                   // 연쇄 배수는 8배까지

class Game{
  constructor(o){
    o=o||{};
    this.random=rng(o.seed==null?(Date.now()^(Math.random()*1e9))>>>0:o.seed);
    this.level=Math.max(1,Math.min(MAX_LEVEL,o.level|0||1));
    this.hints=Math.max(0,Math.min(HINT_MAX,o.hints==null?3:o.hints|0));
    this.score=0; this.captured=0; this.chain=0; this.bestChain=0; this.levelsCleared=0;
    this.nextHintAt=HINT_STEP; this.events=[]; this.status='play';
    this.swapAnim=null; this.hintMoves=null; this.hintT=0; this.clearT=0; this.frozen=false; this.idle=0;
    this.newLevel();
  }
  /* ---------- 판 만들기 ---------- */
  newLevel(){
    this.quota=[]; for(let k=0;k<KINDS;k++) this.quota.push(quotaOf(this.level));
    this.time=1; this.frozen=false; this.chain=0; this.swapAnim=null; this.hintMoves=null; this.hintT=0;
    this.grid=this.freshGrid();
  }
  freshGrid(){
    for(let tries=0;tries<200;tries++){
      const g=[]; for(let r=0;r<N;r++){ g.push([]); for(let c=0;c<N;c++){
        let k; do{ k=Math.floor(this.random()*KINDS); }while((c>=2&&g[r][c-1].k===k&&g[r][c-2].k===k)||(r>=2&&g[r-1][c].k===k&&g[r-2][c].k===k));
        g[r].push({k,y:0,pop:-1,special:false}); } }
      if(this.movesIn(g).length) return g;
    }
    throw new Error('판을 만들지 못했다');
  }
  spawn(){
    let k=Math.floor(this.random()*KINDS), special=false;
    if(this.level>=3&&this.random()<1/36) k=WILD;
    else if(this.level>=2&&!this.hasSpecial()&&this.random()<1/45) special=true;
    return {k,y:0,pop:-1,special};
  }
  hasSpecial(){ for(let r=0;r<N;r++) for(let c=0;c<N;c++){ const t=this.grid[r][c]; if(t&&t.special) return true; } return false; }
  /* ---------- 판정 ---------- */
  settled(t){ return !!t&&t.y===0&&t.pop<0&&!t.busy; }
  static same(a,b){ return a.k===WILD||b.k===WILD||a.k===b.k; }
  /* 맞춘 칸 집합(정착한 칸만). 보병(WILD)은 어느 얼굴과도 줄을 이룬다 */
  findMatches(g){
    g=g||this.grid; const hit=[]; for(let r=0;r<N;r++) hit.push(new Array(N).fill(false));
    const ok=t=>!!t&&t.y===0&&t.pop<0&&!t.busy&&!t.special;
    const scan=(cells)=>{ for(let i=0;i<cells.length;i++){ const t0=cells[i].t; if(!ok(t0)) continue; let kind=t0.k===WILD?-1:t0.k, j=i+1;
      while(j<cells.length){ const t=cells[j].t; if(!ok(t)) break; if(t.k===WILD){ j++; continue; } if(kind<0){ kind=t.k; j++; continue; } if(t.k===kind){ j++; continue; } break; }
      if(j-i>=3) for(let q=i;q<j;q++) hit[cells[q].r][cells[q].c]=true; } };
    for(let r=0;r<N;r++){ const row=[]; for(let c=0;c<N;c++) row.push({r,c,t:g[r][c]}); scan(row); }
    for(let c=0;c<N;c++){ const col=[]; for(let r=0;r<N;r++) col.push({r,c,t:g[r][c]}); scan(col); }
    return hit;
  }
  anyHit(hit){ for(let r=0;r<N;r++) for(let c=0;c<N;c++) if(hit[r][c]) return true; return false; }
  /* 맞춘 칸을 이어진 묶음으로 나눈다(ㄱ·ㅜ 모양은 한 묶음, 다른 얼굴이 붙어 있으면 따로) */
  groups(hit){
    const seen=[]; for(let r=0;r<N;r++) seen.push(new Array(N).fill(false)); const out=[];
    for(let r=0;r<N;r++) for(let c=0;c<N;c++){ if(!hit[r][c]||seen[r][c]) continue; const g=[], st=[[r,c]]; seen[r][c]=true;
      while(st.length){ const [a,b]=st.pop(); g.push([a,b]); for(const [da,db] of [[1,0],[-1,0],[0,1],[0,-1]]){ const x=a+da,y=b+db; if(x<0||y<0||x>=N||y>=N||!hit[x][y]||seen[x][y]||!Game.same(this.grid[a][b],this.grid[x][y])) continue; seen[x][y]=true; st.push([x,y]); } }
      out.push(g); }
    return out;
  }
  /* 둘을 바꿨을 때 맞춰지는가. a·b는 {r,c} */
  wouldMatch(g,a,b){
    const ta=g[a.r][a.c], tb=g[b.r][b.c]; g[a.r][a.c]=tb; g[b.r][b.c]=ta;
    const hit=this.findMatches(g); g[a.r][a.c]=ta; g[b.r][b.c]=tb;
    return hit[a.r][a.c]||hit[b.r][b.c];
  }
  movesIn(g){
    const out=[], ok=t=>!!t&&t.y===0&&t.pop<0&&!t.busy&&!t.special;
    for(let r=0;r<N;r++) for(let c=0;c<N;c++){ if(!ok(g[r][c])) continue;
      if(c+1<N&&ok(g[r][c+1])&&this.wouldMatch(g,{r,c},{r,c:c+1})) out.push({a:{r,c},b:{r,c:c+1}});
      if(r+1<N&&ok(g[r+1][c])&&this.wouldMatch(g,{r,c},{r:r+1,c})) out.push({a:{r,c},b:{r:r+1,c}}); }
    return out;
  }
  moves(){ return this.movesIn(this.grid); }
  allSettled(){ if(this.swapAnim) return false; for(let r=0;r<N;r++) for(let c=0;c<N;c++){ const t=this.grid[r][c]; if(!t||t.y>0||t.pop>=0) return false; } return true; }
  /* ---------- 입력 ---------- */
  canSelect(r,c){ const t=this.grid[r]&&this.grid[r][c]; return this.status==='play'&&this.settled(t)&&!t.special; }
  /* 이웃한 둘을 바꾼다. 맞춰지지 않으면 되돌아온다(그래도 명령은 받아들인 것이다) */
  swap(a,b){
    if(this.status!=='play'||this.swapAnim) return {ok:false,why:'busy'};
    if(Math.abs(a.r-b.r)+Math.abs(a.c-b.c)!==1) return {ok:false,why:'far'};
    const ta=this.grid[a.r]&&this.grid[a.r][a.c], tb=this.grid[b.r]&&this.grid[b.r][b.c];
    if(!this.settled(ta)||!this.settled(tb)||ta.special||tb.special) return {ok:false,why:'unsettled'};
    const match=this.wouldMatch(this.grid,a,b);
    ta.busy=true; tb.busy=true; this.hintMoves=null;
    this.swapAnim={a,b,t:0,match,back:false};
    return {ok:true,match};
  }
  /* 반짝 판을 누르면 그때 보이는 얼굴을 판에서 모두 잡는다 */
  press(r,c){
    const t=this.grid[r]&&this.grid[r][c];
    if(this.status!=='play'||!t||!t.special||!this.settled(t)) return false;
    const k=t.k; let n=0; this.hintMoves=null;
    for(let rr=0;rr<N;rr++) for(let cc=0;cc<N;cc++){ const u=this.grid[rr][cc]; if(u&&u.pop<0&&!u.busy&&(u===t||(u.k===k&&u.y===0))){ u.pop=0; u.special=false; n++; } }
    if(k<KINDS) this.quota[k]=Math.max(0,this.quota[k]-n);
    const pts=Math.round(n*20*this.levelMul()); this.addScore(pts); this.captured+=n;
    this.time=Math.min(1,this.time+0.02*n);
    this.events.push({t:'special',k,n,points:pts}); this.checkClear(); return true;
  }
  hint(){
    if(this.status!=='play') return {ok:false};
    if(this.hints<=0) return {ok:false,why:'none'};
    const mv=this.moves(); if(!mv.length) return {ok:false,why:'nomove'};
    this.hints--; this.hintMoves=mv; this.hintT=HINT_TIME; this.events.push({t:'hint',n:mv.length}); return {ok:true,moves:mv};
  }
  /* ---------- 점수 ---------- */
  levelMul(){ return 1+(this.level-1)*0.1; }
  addScore(p){ this.score+=p; while(this.score>=this.nextHintAt){ this.nextHintAt+=HINT_STEP; if(this.hints<HINT_MAX){ this.hints++; this.events.push({t:'hintplus'}); } } }
  /* 맞춘 묶음을 터뜨리고 점수·할당량·시간에 반영한다 */
  resolve(hit){
    const gs=this.groups(hit); if(!gs.length) return false;
    this.chain++; if(this.chain>this.bestChain) this.bestChain=this.chain;
    for(const g of gs){ const n=g.length; let wild=false, counts={};
      for(const [r,c] of g){ const t=this.grid[r][c]; t.pop=0; if(t.k===WILD) wild=true; else { counts[t.k]=(counts[t.k]||0)+1; this.quota[t.k]=Math.max(0,this.quota[t.k]-1); } }
      let pts=Math.round(baseOf(n)*Math.min(this.chain,CHAIN_CAP)*this.levelMul()*(wild?2:1));
      this.addScore(pts); this.captured+=n;
      this.time=Math.min(1,this.time+gainOf(n)+(wild?0.2:0));
      this.events.push({t:'match',n,chain:this.chain,points:pts,wild,kinds:counts,cells:g}); }
    this.checkClear(); return true;
  }
  checkClear(){ if(this.status!=='play') return; for(let k=0;k<KINDS;k++) if(this.quota[k]>0) return; this.status='clearing'; this.frozen=true; this.events.push({t:'quota'}); }
  /* ---------- 시간 ---------- */
  tick(dt){
    if(!(dt>0)) return; if(dt>0.1) dt=0.1;
    if(this.status==='over'||this.status==='end') return;
    if(this.status==='clear'){ this.clearT-=dt; if(this.clearT<=0) this.nextLevel(); return; }
    if(this.hintT>0){ this.hintT-=dt; if(this.hintT<=0) this.hintMoves=null; }
    if(!this.frozen){ this.time-=dt/barSeconds(this.level); if(this.time<=0){ this.time=0; this.gameOver(); return; } }
    /* 바꾸기 움직임 */
    const s=this.swapAnim;
    if(s){ s.t+=dt/SWAP_TIME; if(s.t>=1){ const ta=this.grid[s.a.r][s.a.c], tb=this.grid[s.b.r][s.b.c];
      if(!s.match&&!s.back){ s.back=true; s.t=0; this.events.push({t:'swapfail'}); }
      else { ta.busy=false; tb.busy=false; this.swapAnim=null;
        if(s.match){ this.grid[s.a.r][s.a.c]=tb; this.grid[s.b.r][s.b.c]=ta; this.events.push({t:'swap'}); this.resolve(this.findMatches()); } } } }
    /* 터지기 */
    let removed=false;
    for(let r=0;r<N;r++) for(let c=0;c<N;c++){ const t=this.grid[r][c]; if(t&&t.pop>=0){ t.pop+=dt/POP_TIME; if(t.pop>=1){ this.grid[r][c]=null; removed=true; } } }
    /* 중력: 비거나 떠 있는 열을 내린다(바꾸는 중인 칸이 있는 열은 그 동작이 끝난 뒤) */
    for(let c=0;c<N;c++){ let busy=false, holes=0; for(let r=0;r<N;r++){ const t=this.grid[r][c]; if(!t) holes++; else if(t.busy) busy=true; }
      if(!holes||busy) continue;
      const col=[]; for(let r=N-1;r>=0;r--){ const t=this.grid[r][c]; if(t){ const nr=N-1-col.length; if(nr!==r) t.y+=nr-r; col.push(t); } }
      const m=N-col.length; for(let i=0;i<m;i++){ const t=this.spawn(); t.y=m; col.push(t); }
      for(let r=0;r<N;r++) this.grid[r][c]=col[N-1-r]; }
    /* 떨어지기 */
    let landed=false, moving=false;
    for(let r=0;r<N;r++) for(let c=0;c<N;c++){ const t=this.grid[r][c]; if(t&&t.y>0){ t.y=Math.max(0,t.y-FALL*dt); if(t.y===0) landed=true; else moving=true; } }
    if(landed) this.resolve(this.findMatches());
    /* 반짝 판은 얼굴이 계속 바뀐다 */
    this.spin=(this.spin||0)+dt; if(this.spin>=0.13){ this.spin-=0.13; for(let r=0;r<N;r++) for(let c=0;c<N;c++){ const t=this.grid[r][c]; if(t&&t.special&&t.pop<0) t.k=(t.k+1+Math.floor(this.random()*(KINDS-1)))%KINDS; } }
    /* 모두 멎었을 때: 연쇄 끝, 단계 끝 또는 길 없음 */
    if(!moving&&!landed&&!removed&&this.allSettled()){
      this.chain=0;
      if(this.status==='clearing'){ const bonus=500*this.level+Math.round(this.time*1000); this.score+=bonus; this.levelsCleared++; this.events.push({t:'level',level:this.level,bonus}); this.status='clear'; this.clearT=CLEAR_TIME; return; }
      if(!this.hasSpecial()&&!this.moves().length){ this.grid=this.freshGrid(); this.hintMoves=null; this.events.push({t:'shuffle'}); }
    }
  }
  nextLevel(){
    if(this.level>=MAX_LEVEL){ this.status='end'; this.events.push({t:'end'}); return; }
    this.level++; this.status='play'; this.newLevel(); this.events.push({t:'newlevel',level:this.level});
  }
  gameOver(){ this.status='over'; this.hintMoves=this.moves(); this.hintT=0; this.events.push({t:'over',moves:this.hintMoves.length}); }
  takeEvents(){ const e=this.events; this.events=[]; return e; }
  /* 화면이 그리는 데 쓰는 보조: 바꾸는 중인 칸의 이동 비율(0~1, 되돌아올 때는 1~0) */
  swapShift(){ const s=this.swapAnim; if(!s) return null; const t=Math.min(1,s.t); return {a:s.a,b:s.b,f:s.back?1-t:t}; }
}
const api={Game,N,KINDS,WILD,MAX_LEVEL,quotaOf,barSeconds,gainOf,baseOf,HINT_STEP,HINT_MAX,CHAIN_CAP,POP_TIME,SWAP_TIME};
root.Zooo=api; if(typeof module!=='undefined') module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
