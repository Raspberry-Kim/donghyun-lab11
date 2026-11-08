// 동현주 규칙 엔진 검사: node qa/core-tests.cjs
// 맞춤 판정(가로·세로·ㄱ자·보병), 되돌아오기, 중력과 연쇄, 목표와 단계 넘기기, 시간, 쌍안경, 섞기, 반짝 판, 규약 예제를 본다.
const assert=require('assert');
const Z=require('../src/engine.js'); const {Game,N,KINDS,WILD,quotaOf,barSeconds,baseOf,gainOf}=Z;
const D=require('../src/donghyun.js'); const {examples,expression}=require('../src/examples.js');
let n=0; const ok=(name,f)=>{ f(); n++; console.log('ok',name); };
const T=(k,extra)=>Object.assign({k,y:0,pop:-1,special:false},extra||{});
function gridOf(rows){ return rows.map(r=>[...r].map(ch=>ch==='*'?T(WILD):ch==='!'?T(0,{special:true}):T(+ch))); }
/* 맞춰진 줄이 없는 8×8 바탕(가로 ABABABAB / CDCDCDCD … 2줄마다 바꿔 세로도 셋이 안 된다) */
function baseRows(){ const out=[]; for(let r=0;r<N;r++){ const a=((r>>1)*2)%KINDS, b=((r>>1)*2+1)%KINDS; out.push([...Array(N)].map((_,c)=>(c%2?b:a)).join('')); } return out; }
function withGrid(rows,opts){ const g=new Game(Object.assign({seed:1},opts||{})); g.grid=gridOf(rows); g.hintMoves=null; return g; }
function run(g,sec){ for(let i=0;i<Math.round(sec*60);i++) g.tick(1/60); }
function drain(g){ const ev=g.takeEvents(); return ev; }

ok('단계 수치: 목표 3·3·3·4…12, 막대 32→12초, 점수·시간 기준',()=>{
  assert.deepStrictEqual([1,2,3,4,10,12,13,20].map(quotaOf),[3,3,3,4,10,12,12,12]);
  assert.strictEqual(barSeconds(1),32); assert.strictEqual(Math.round(barSeconds(20)*10)/10,12);
  assert.deepStrictEqual([3,4,5,6].map(baseOf),[30,60,90,120]); assert.deepStrictEqual([3,4,5,7].map(gainOf),[0.08,0.14,0.22,0.22]);
});
ok('새 판: 맞춰진 줄이 없고 바꿀 자리가 있다(씨앗 100개)',()=>{
  for(let s=1;s<=100;s++){ const g=new Game({seed:s}); assert.ok(!g.anyHit(g.findMatches()),'처음부터 맞춰진 줄'); assert.ok(g.moves().length>0,'바꿀 자리 없음');
    for(let r=0;r<N;r++) for(let c=0;c<N;c++) assert.ok(g.grid[r][c].k<KINDS&&!g.grid[r][c].special); }
});
ok('가로 셋·세로 셋·ㄱ자 다섯을 한 묶음으로 찾는다',()=>{
  const rows=baseRows(); rows[7]='1110000'.padEnd(8,'0').replace(/0/g,'4'); // 아래줄 111 뒤 44444 → 44444도 다섯
  const g=withGrid(rows); const hit=g.findMatches(); const gs=g.groups(hit);
  assert.strictEqual(gs.length,2); assert.deepStrictEqual(gs.map(x=>x.length).sort(),[3,5]);
  const rows2=baseRows(); rows2[5]='5'+rows2[5].slice(1); rows2[6]='5'+rows2[6].slice(1); rows2[7]='555'+rows2[7].slice(3); // ㄱ자 5
  const g2=withGrid(rows2); const gs2=g2.groups(g2.findMatches()); assert.strictEqual(gs2.length,1); assert.strictEqual(gs2[0].length,5);
});
ok('보병(*)은 어느 얼굴과도 줄을 이루고 목표에는 들지 않는다',()=>{
  const rows=baseRows(); rows[7]='2*2'+rows[7].slice(3).replace(/2/g,'3'); rows[6]=rows[6].replace(/2/g,'3').replace(/3/g,'3');
  const g=withGrid(rows); const hit=g.findMatches(); assert.ok(hit[7][0]&&hit[7][1]&&hit[7][2]);
  const q=g.quota.slice(); g.resolve(hit); assert.strictEqual(g.quota[2],q[2]-2); const ev=drain(g); const m=ev.find(e=>e.t==='match'); assert.ok(m.wild); assert.strictEqual(m.points,baseOf(3)*2);
});
ok('반짝 판(!)은 줄 판정에 끼지 않고, 바꿀 수 없다',()=>{
  const rows=baseRows(); rows[7]='!00'+rows[7].slice(3); const g=withGrid(rows); g.grid[7][1].k=0; g.grid[7][2].k=0; g.grid[7][0].k=0;
  assert.ok(!g.findMatches()[7][0]); assert.strictEqual(g.canSelect(7,0),false); assert.strictEqual(g.swap({r:7,c:0},{r:7,c:1}).ok,false);
});
ok('맞지 않는 바꾸기는 되돌아오고(swapfail), 맞는 바꾸기는 잡힌다',()=>{
  const rows=baseRows(); rows[7]='10115656'; const g=withGrid(rows); assert.ok(!g.anyHit(g.findMatches()));
  // 틀린 바꾸기: 첫 줄 0101…의 두 칸
  let r=g.swap({r:0,c:0},{r:0,c:1}); assert.ok(r.ok&&!r.match); run(g,0.5); assert.ok(drain(g).some(e=>e.t==='swapfail'));
  assert.strictEqual(g.grid[0][0].k,0); assert.strictEqual(g.grid[0][1].k,1); assert.ok(!g.grid[0][0].busy&&!g.grid[0][1].busy);
  // 맞는 바꾸기: (7,0)=1 (7,1)=0 → 0111
  const before=g.score; r=g.swap({r:7,c:0},{r:7,c:1}); assert.ok(r.ok&&r.match); run(g,0.3);
  const ev=drain(g); assert.ok(ev.some(e=>e.t==='swap')); const m=ev.find(e=>e.t==='match'); assert.ok(m&&m.n===3&&m.kinds[1]===3); assert.ok(g.score>before);
});
ok('멀거나 떠 있는 칸은 바꿀 수 없다',()=>{
  const g=new Game({seed:3}); assert.strictEqual(g.swap({r:0,c:0},{r:0,c:2}).why,'far');
  g.grid[0][0].y=0.5; assert.strictEqual(g.swap({r:0,c:0},{r:0,c:1}).why,'unsettled'); g.grid[0][0].y=0;
  g.swap({r:0,c:0},{r:0,c:1}); assert.strictEqual(g.swap({r:1,c:0},{r:1,c:1}).why,'busy');
});
ok('터진 자리로 위가 떨어지고 새 얼굴이 내려오며 구멍이 남지 않는다',()=>{
  const rows=baseRows(); const g=withGrid(rows); g.grid[7][0].k=1; g.grid[7][1].k=1; g.grid[7][2].k=1; g.grid[6][1].k=9%KINDS;
  const above=g.grid[6][0]; g.resolve(g.findMatches()); run(g,0.24); // 터짐이 끝난 직후
  assert.strictEqual(g.grid[7][0],above,'위 얼굴이 아래 자리로 오지 않았다'); assert.ok(above.y>0&&above.y<=1,'떨어지는 중이어야 한다'); assert.ok(g.grid[0][0].y>0,'새 얼굴이 위에서 내려와야 한다');
  run(g,1.5);
  for(let r=0;r<N;r++) for(let c=0;c<N;c++){ const t=g.grid[r][c]; assert.ok(t&&t.y===0&&t.pop<0,'구멍 또는 떠 있는 칸'); }
});
ok('연쇄: 떨어진 뒤 또 맞으면 chain 2가 되고 배수가 붙는다',()=>{
  const rows=baseRows(); rows[7]='11122060'; rows[6]='60206060'; // 111이 터지면 (6,2)의 2가 내려와 222
  const g=withGrid(rows); const hit=g.findMatches(); assert.strictEqual(g.groups(hit).length,1,'처음에는 111만 맞아야 한다');
  g.resolve(hit); run(g,1.2); const ev=drain(g).filter(e=>e.t==='match');
  assert.ok(ev.length>=2,'연쇄가 없다'); assert.strictEqual(ev[1].chain,2); assert.ok(ev[1].kinds[2]===3); assert.strictEqual(ev[1].points,baseOf(3)*2);
  run(g,1); assert.strictEqual(g.chain,0,'모두 멎으면 연쇄가 0으로 돌아간다');
});
ok('시간: 막대가 비면 끝(over)이고 남은 길을 보여 준다',()=>{
  const g=new Game({seed:5}); run(g,barSeconds(1)+0.5); assert.strictEqual(g.status,'over'); assert.strictEqual(g.time,0);
  const ev=drain(g); const o=ev.find(e=>e.t==='over'); assert.ok(o&&o.moves===g.hintMoves.length&&o.moves>0);
  assert.strictEqual(g.swap({r:0,c:0},{r:0,c:1}).ok,false); assert.strictEqual(g.hint().ok,false);
});
ok('잡으면 시간이 차고 1을 넘지 않는다',()=>{
  const g=withGrid(baseRows()); g.time=0.5; g.grid[7][0].k=1; g.grid[7][1].k=1; g.grid[7][2].k=1; g.resolve(g.findMatches()); assert.strictEqual(Math.round(g.time*100),58);
  g.time=0.99; g.grid[7][5].k=1; g.grid[7][6].k=1; g.grid[7][7].k=1; g.grid[7][5].pop=-1; g.resolve(g.findMatches()); assert.strictEqual(g.time,1);
});
ok('목표를 달성하면 막대가 멎고(clearing) 멎은 뒤 보너스와 다음 단계',()=>{
  const g=withGrid(baseRows(),{level:1}); for(let k=0;k<KINDS;k++) g.quota[k]=0; g.quota[1]=3;
  g.grid[7][0].k=1; g.grid[7][1].k=1; g.grid[7][2].k=1; g.time=0.6; g.resolve(g.findMatches());
  assert.strictEqual(g.status,'clearing'); assert.ok(g.frozen); const t0=g.time; run(g,1.5); assert.ok(g.time>=t0-1e-9,'멎은 동안 시간이 줄었다');
  const ev=drain(g); const lv=ev.find(e=>e.t==='level'); assert.ok(lv&&lv.level===1&&lv.bonus===500+Math.round(g.time*1000));
  run(g,1.6); const ev2=drain(g); assert.ok(ev2.some(e=>e.t==='newlevel'&&e.level===2)); assert.strictEqual(g.level,2); assert.ok(g.time>0.95,'새 단계는 가득 찬 막대로'); assert.deepStrictEqual(g.quota,Array(KINDS).fill(quotaOf(2)));
});
ok('20단계를 마치면 end',()=>{
  const g=withGrid(baseRows(),{level:20}); for(let k=0;k<KINDS;k++) g.quota[k]=0; g.quota[1]=3; g.grid[7][0].k=1; g.grid[7][1].k=1; g.grid[7][2].k=1;
  g.resolve(g.findMatches()); run(g,4); assert.strictEqual(g.status,'end'); assert.ok(drain(g).some(e=>e.t==='end'));
});
ok('쌍안경: 길을 보여 주고 하나 줄며, 0이면 안 되고, 5,000점마다 하나 는다(최대 9)',()=>{
  const g=new Game({seed:7,hints:2}); const h=g.hint(); assert.ok(h.ok&&h.moves.length>0); assert.strictEqual(g.hints,1); assert.ok(g.hintMoves); run(g,2.5); assert.strictEqual(g.hintMoves,null,'2초 뒤 사라져야 한다');
  g.hint(); assert.strictEqual(g.hints,0); assert.strictEqual(g.hint().why,'none');
  g.addScore(5000); assert.strictEqual(g.hints,1); g.addScore(50000); assert.strictEqual(g.hints,9);
  const g0=new Game({seed:7,hints:0}); assert.strictEqual(g0.hint().why,'none');
});
ok('길이 없으면 판을 새로 섞는다(시간은 간다)',()=>{
  // (r+c) mod 7 대각선 판: 셋이 맞는 곳도, 바꿔서 맞출 길도 없다
  const rows=[]; for(let r=0;r<N;r++) rows.push([...Array(N)].map((_,c)=>((r+c)%KINDS)).join(''));
  const g=withGrid(rows); assert.ok(!g.anyHit(g.findMatches())); assert.strictEqual(g.moves().length,0,'길 없는 판이어야 한다');
  const t0=g.time; run(g,0.2); const ev=drain(g); assert.ok(ev.some(e=>e.t==='shuffle')); assert.ok(g.moves().length>0); assert.ok(g.time<t0);
});
ok('반짝 판을 누르면 그 얼굴을 모두 잡고 목표이 준다',()=>{
  const g=withGrid(baseRows(),{level:2}); g.grid[3][3]=T(0,{special:true}); const cnt=[].concat(...g.grid).filter(t=>t.k===0&&!t.special).length;
  const q=g.quota[0]; assert.ok(g.press(3,3)); const ev=drain(g); const sp=ev.find(e=>e.t==='special'); assert.strictEqual(sp.n,cnt+1); assert.strictEqual(g.quota[0],Math.max(0,q-sp.n));
  run(g,1.5); for(let r=0;r<N;r++) for(let c=0;c<N;c++) assert.ok(g.grid[r][c]&&g.grid[r][c].y===0);
  assert.strictEqual(g.press(0,0),false,'보통 칸은 눌러도 아무 일 없다');
});
ok('바꾸는 중인 열은 그 동작이 끝난 뒤 내려온다(구멍이 영원히 남지 않는다)',()=>{
  const g=withGrid(baseRows()); g.grid[7][0].k=1; g.grid[7][1].k=1; g.grid[7][2].k=1; g.grid[7][3].k=3;
  g.resolve(g.findMatches()); g.tick(0.01); // 터지는 중
  const r=g.swap({r:0,c:0},{r:1,c:0}); assert.ok(r.ok); run(g,0.6); // 틀린 바꾸기로 0열이 바쁜 사이 터짐이 끝난다
  run(g,1.5); for(let rr=0;rr<N;rr++) for(let c=0;c<N;c++) assert.ok(g.grid[rr][c]&&g.grid[rr][c].y===0,'구멍');
});
ok('시작 단계·쌍안경 선택지가 범위 안에 머문다',()=>{
  assert.strictEqual(new Game({seed:1,level:0}).level,1); assert.strictEqual(new Game({seed:1,level:99}).level,20); assert.strictEqual(new Game({seed:1,hints:50}).hints,9); assert.strictEqual(new Game({seed:1,hints:-2}).hints,0);
  assert.strictEqual(new Game({seed:1,level:8}).quota[0],8);
});
ok('규약 예제: 동현랭이 정수 둘을 출력한다',()=>{
  const want={basic:[1,3],mid:[8,5],bare:[1,0],last:[20,9]};
  for(const ex of examples){ const out=D.run(ex.code,{maxSteps:300000}).output.split(/\s+/).filter(Boolean).map(Number); assert.deepStrictEqual(out,want[ex.id],ex.id); }
  assert.strictEqual(expression(0),'도옹ㅠ'); assert.strictEqual(expression(3),'도오오옹'); assert.strictEqual(D.run('나는 동현이냐?\n뿡뿡 '+expression(20)+'~뿡뿡뿡\n동현이구나').output.trim(),'20');
});
console.log(`모두 통과 · ${n}개`);
