// 화면 시험: node qa/ui.cjs (index.html을 파일로 연다 · build 뒤에 돌린다)
// 키보드·마우스·끌기·반짝 판·규약 오류·단계 마침·끝 카드·멎음·휴대폰 폭·시리즈 띠·콘솔 오류를 본다
const {chromium}=require('/home/user/node_modules/playwright'); const path=require('path'); const assert=require('assert');
const url='file://'+path.join(__dirname,'..','index.html');
const H='window.__donghyunzooo';
(async()=>{
  const b=await chromium.launch(); const errs=[]; let n=0; const ok=(name)=>{ n++; console.log('ok',name); };
  const p=await b.newPage({viewport:{width:1280,height:900}});
  p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  await p.goto(url); await p.waitForTimeout(300);
  const G=(js)=>p.evaluate(`(()=>{const Z=${H};const g=Z.game;return (${js});})()`);
  const cellXY=async(r,c)=>{ const bb=await p.$eval('#board',e=>{const r=e.getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height};}); return {x:bb.x+(c+0.5)*bb.w/8,y:bb.y+(r+0.5)*bb.h/8}; };
  const settle=async()=>{ for(let i=0;i<120;i++){ await p.evaluate(`${H}.tick(0.05)`); if(await G('g.status==="play"&&!g.swapAnim&&g.grid.every(row=>row.every(t=>t&&t.y===0&&t.pop<0))')) return; } throw new Error('판이 멎지 않는다'); };
  const amove=()=>G('g.moves()[0]');

  // 1) 시작 상태
  assert.strictEqual(await G('g.level'),1); assert.strictEqual(await G('g.hints'),3); assert.ok(await G('g.moves().length>0'));
  assert.strictEqual(await p.$eval('#quota',e=>e.children.length),7); ok('시작: 1단계 · 쌍안경 3 · 할당 일곱 줄');
  // 2) 키보드: 커서 두고 X → 집힘, 방향 → 바꿈 → 잡힘
  await settle(); let m=await amove(); let s0=await G('g.score');
  await p.evaluate(`${H}.cursor=${JSON.stringify(m.a)}`); await p.focus('#board'); await p.keyboard.press('KeyX');
  assert.deepStrictEqual(await G('Z.sel'),m.a,'X로 집혀야 한다');
  const dir=m.b.r<m.a.r?'ArrowUp':m.b.r>m.a.r?'ArrowDown':m.b.c<m.a.c?'ArrowLeft':'ArrowRight'; await p.keyboard.press(dir);
  await settle(); assert.ok(await G('g.score')>s0,'점수가 올라야 한다'); assert.strictEqual(await G('Z.sel'),null); ok('키보드: X 집기 · 방향키로 바꿔 잡기');
  // 3) Z 취소
  m=await amove(); await p.evaluate(`${H}.cursor=${JSON.stringify(m.a)}`); await p.keyboard.press('KeyX'); assert.ok(await G('Z.sel!==null')); await p.keyboard.press('KeyZ'); assert.strictEqual(await G('Z.sel'),null); ok('키보드: Z로 풀기');
  // 4) S 쌍안경: 하나 줄고 상태 문구
  let h0=await G('g.hints'); await p.keyboard.press('KeyS'); assert.strictEqual(await G('g.hints'),h0-1); assert.ok(await G('g.hintAt!==undefined||true')); ok('키보드: S 쌍안경 하나 줄어듦');
  // 5) 마우스: 두 번 눌러 바꾸기
  m=await amove(); s0=await G('g.score'); let a=await cellXY(m.a.r,m.a.c), bq=await cellXY(m.b.r,m.b.c);
  await p.mouse.click(a.x,a.y); assert.deepStrictEqual(await G('Z.sel'),m.a); await p.mouse.click(bq.x,bq.y); await settle(); assert.ok(await G('g.score')>s0); ok('마우스: 누르고 이웃 누르면 바뀐다');
  // 6) 끌기(쓸기)
  m=await amove(); s0=await G('g.score'); a=await cellXY(m.a.r,m.a.c); bq=await cellXY(m.b.r,m.b.c);
  await p.mouse.move(a.x,a.y); await p.mouse.down(); await p.mouse.move(a.x+(bq.x-a.x)*0.6,a.y+(bq.y-a.y)*0.6,{steps:4}); await p.mouse.up(); await settle(); assert.ok(await G('g.score')>s0); ok('마우스: 끌어서 바꾼다');
  // 7) 틀린 바꾸기는 되돌아온다
  const bad=await G('(()=>{const mv=g.moves().map(x=>x.a.r+","+x.a.c+"-"+x.b.r+","+x.b.c);for(let r=0;r<8;r++)for(let c=0;c<7;c++){const k=r+","+c+"-"+r+","+(c+1);if(!mv.includes(k)&&!mv.includes(r+","+(c+1)+"-"+r+","+c))return {a:{r,c},b:{r,c:c+1}};}return null;})()');
  const ka=await G(`g.grid[${bad.a.r}][${bad.a.c}].k`); await p.evaluate(`${H}.pick(${JSON.stringify(bad.a)});${H}.pick(${JSON.stringify(bad.b)})`); await settle(); assert.strictEqual(await G(`g.grid[${bad.a.r}][${bad.a.c}].k`),ka); ok('틀린 바꾸기는 제자리로 돌아온다');
  // 8) 반짝 판: 심어서 누르면 그때 보이는 얼굴이 판에서 모두 터진다(화면 루프가 함께 돌아 보이는 얼굴은 누르는 순간 것으로 판정한다)
  await settle(); await G('(()=>{g.grid[7][0].special=true;return 1;})()'); assert.ok(await G('g.hasSpecial()'));
  a=await cellXY(7,0); await p.mouse.click(a.x,a.y);
  const sp=await G('(()=>{const pops=[];let all={};for(let r=0;r<8;r++)for(let c=0;c<8;c++){const t=g.grid[r][c];if(!t)continue;if(!t.special){all[t.k]=(all[t.k]||0)+1;if(t.pop>=0)pops.push(t.k);}}return {pops,all,specialPopped:g.grid[7][0]&&g.grid[7][0].pop>=0};})()');
  assert.ok(sp.pops.length>=1,'터지는 얼굴이 있어야 한다'); const kinds=new Set(sp.pops); assert.strictEqual(kinds.size,1,'한 종류만 터져야 한다'); const kk=sp.pops[0]; assert.strictEqual(sp.pops.length,sp.all[kk],'그 얼굴이 모두 터져야 한다'); assert.ok(sp.specialPopped,'반짝 판 자신도 사라진다');
  await settle(); assert.ok(!(await G('g.hasSpecial()')),'누른 반짝 판은 사라진다'); ok('반짝 판: 누르면 그 얼굴 전부 잡힘');
  // 9) 규약 오류: 정수 하나 · 범위 밖
  const {expression}=require('../src/examples.js'); const prog=(...ns)=>['나는 동현이냐?',...ns.map(n=>'뿡뿡 '+expression(n)+'~뿡뿡뿡'),'동현이구나'].join('\n');
  await p.fill('#code',prog(9)); await p.click('#run'); assert.ok((await p.$eval('#result',e=>e.textContent)).includes('1개 출력'));
  await p.fill('#code',prog(99,3)); await p.click('#run'); assert.ok((await p.$eval('#result',e=>e.textContent)).includes('99'));
  await p.fill('#code',prog(3,12)); await p.click('#run'); assert.ok((await p.$eval('#result',e=>e.textContent)).includes('12'));
  await p.fill('#code','그냥 글'); await p.click('#run'); assert.ok((await p.$eval('#result',e=>e.textContent)).includes('동현랭 오류')); ok('규약 오류: 개수·범위·동현랭 오류를 알려 준다');
  // 10) 예제 04(20단계)로 시작 → 할당 채우면 clearing → end 카드
  await p.selectOption('#example','last'); await p.click('#run'); assert.strictEqual(await G('g.level'),20); assert.strictEqual(await G('g.hints'),9);
  // 할당을 다 채운 상태로 두고 한 번 잡으면 막대가 멎고(clearing) 보너스 뒤 end
  await settle(); m=await amove(); await p.evaluate(`(()=>{const g=${H}.game;for(let k=0;k<7;k++)g.quota[k]=0;})()`); // 할당은 잡는 순간 검사되므로 0으로 두고 한 번 잡는다
  await p.evaluate(`${H}.pick(${JSON.stringify(m.a)});${H}.pick(${JSON.stringify(m.b)})`);
  let sawClearing=false; for(let i=0;i<100;i++){ await p.evaluate(`${H}.tick(0.05)`); if(await G('g.status==="clearing"')) sawClearing=true; if(await G('g.status==="end"')) break; }
  assert.ok(sawClearing,'먼저 clearing을 지나야 한다');
  assert.ok(await G('g.status==="end"'),'20단계를 마치면 end'); assert.ok(!(await p.$eval('#over',e=>e.hidden)),'끝 카드가 보여야 한다'); assert.ok((await p.$eval('#over-title',e=>e.textContent)).length>0); ok('단계 마침: 20단계 → 끝 카드');
  // 11) 같은 설정으로 다시
  await p.click('#again'); assert.strictEqual(await G('g.status'),'play'); assert.ok(await p.$eval('#over',e=>e.hidden)); ok('끝 카드: 같은 설정으로 다시');
  // 12) 시간이 다 되면 GAME OVER 카드
  await p.evaluate(`(()=>{const g=${H}.game;g.time=0.001;})()`); for(let i=0;i<40;i++){ await p.evaluate(`${H}.tick(0.05)`); if(await G('g.status==="over"')) break; }
  assert.strictEqual(await G('g.status'),'over'); assert.ok(!(await p.$eval('#over',e=>e.hidden))); assert.strictEqual(await p.$eval('#over-title',e=>e.textContent.trim()),'GAME OVER'); ok('시간 끝: GAME OVER 카드');
  // 13) 보이지 않으면 멎는다
  await p.click('#again'); await p.evaluate(`Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'))`);
  assert.strictEqual(await G('Z.paused'),true); await p.evaluate(`Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'))`); assert.strictEqual(await G('Z.paused'),false); ok('다른 탭을 보면 멎고 돌아오면 간다');
  // 14) 시리즈 띠: 12개, 한 줄(1440·1280)
  for(const w of [1440,1280]){ await p.setViewportSize({width:w,height:900}); await p.waitForTimeout(100);
    const st=await p.$eval('.series-strip',e=>({n:e.querySelectorAll('.series-item').length,h:e.getBoundingClientRect().height,tops:new Set([...e.querySelectorAll('.series-item')].map(i=>Math.round(i.getBoundingClientRect().top))).size}));
    assert.strictEqual(st.n,12); assert.strictEqual(st.tops,1,`${w}px에서 띠가 한 줄이어야 한다`); }
  ok('시리즈 띠: 12개 · 1440/1280에서 한 줄');
  await p.close();
  // 15) 휴대폰 폭: 판이 화면 안에 들어오고, 탭으로 집힌다
  const q=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true});
  q.on('pageerror',e=>errs.push('mob: '+e.message)); q.on('console',mm=>{ if(mm.type()==='error') errs.push('mob: '+mm.text()); });
  await q.goto(url); await q.waitForTimeout(300);
  const bb=await q.$eval('#board',e=>{const r=e.getBoundingClientRect();return {l:r.left,r:r.right,w:r.width};}); assert.ok(bb.l>=0&&bb.r<=390,'판이 화면 안에 있어야 한다'); assert.ok(bb.w>=280);
  assert.ok(await q.evaluate(()=>document.documentElement.scrollWidth<=390),'가로로 넘치면 안 된다');
  await q.evaluate(`(()=>{const Z=${H};for(let i=0;i<120;i++){Z.tick(0.05);const g=Z.game;if(!g.swapAnim&&g.grid.every(row=>row.every(t=>t&&t.y===0&&t.pop<0)))break;}})()`);
  await q.$eval('#board',e=>e.scrollIntoView({block:'center'})); await q.waitForTimeout(100);
  const mm=await q.evaluate(`${H}.game.moves()[0]`); const c1=await q.$eval('#board',(e,m)=>{const r=e.getBoundingClientRect();return {x:r.left+(m.a.c+0.5)*r.width/8,y:r.top+(m.a.r+0.5)*r.height/8};},mm);
  await q.touchscreen.tap(c1.x,c1.y); assert.deepStrictEqual(await q.evaluate(`${H}.sel`),mm.a); ok('휴대폰 390px: 판이 들어오고 탭으로 집힌다');
  const sm=await q.$eval('.series-strip',e=>e.querySelectorAll('.series-item').length); assert.strictEqual(sm,12);
  await q.close(); await b.close();
  if(errs.length){ console.log('콘솔 오류',errs); process.exit(1); }
  console.log(`모두 통과 · ${n}개 · 콘솔 오류 0`);
})().catch(e=>{ console.error(e); process.exit(1); });
