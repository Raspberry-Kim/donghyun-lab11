/* 동현주: 동현랭으로 시작 단계·쌍안경 횟수를 정하고, 8×8 얼굴 판에서 같은 얼굴 셋을 나란히 맞춰 잡는다. */
(function(){
const $=s=>document.querySelector(s);
const {Game,N,KINDS,WILD,MAX_LEVEL,quotaOf}=window.Zooo;
const DEF_LEVEL=1, DEF_HINT=3, HINT_MAX=9;
const NAMES=['포동이','슈슈','라이언','초파리','둠가이','기사','꼬리콥터','보병'];
const FACES=Sprites.FACES;

/* ---------- 화면 전환과 탭 ---------- */
$('#theme').onclick=()=>{const dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'light';$('#theme').setAttribute('aria-pressed',String(dark));};
const SND=DHSFX('donghyunzooo:sound');
function sndUI(){ const b=$('#sound'); b.setAttribute('aria-pressed',String(SND.on)); b.classList.toggle('muted',!SND.on); b.title=SND.on?'효과음 켬 (M)':'효과음 끔 (M)'; }
$('#sound').onclick=()=>{ SND.set(!SND.on); sndUI(); }; sndUI();
let tab='play';
function showTab(name){
  tab=name;
  document.querySelectorAll('.tabs button').forEach(b=>{const on=b.dataset.tab===name;b.classList.toggle('active',on);on?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current');});
  document.querySelectorAll('.tab-panel').forEach(p=>p.hidden=p.id!=='tab-'+name);
}
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
$('.brand').onclick=e=>{e.preventDefault();showTab('play');scrollTo({top:0,behavior:'smooth'});};

/* ---------- 동현랭 편집기(동현랭 시리즈와 같은 모양) ---------- */
for(const ex of examples){const o=document.createElement('option');o.value=ex.id;o.textContent=ex.title;$('#example').append(o);}
const DH_TOKEN=/(ㅋㅋ.*$)|(나는 동현이냐\?|동현이구나)|(오겡끼데스까)|(신중동역|신중동|뭉치)|(뿡뿡뿡|뿡뿡|포동이)|(꽥꽥)|(동+현아)|(동+현)|(도오*옹)|(ㅠ+)|(뚱띠|또치)/g;
const DH_CLS=[null,'t-cmt','t-frame','t-halt','t-ctl','t-out','t-in','t-assign','t-var','t-num','t-minus','t-op'];
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function dhLine(line){let html='',last=0;line.replace(DH_TOKEN,(m,...gr)=>{const idx=gr[gr.length-2];html+=esc(line.slice(last,idx));const k=gr.slice(0,11).findIndex(x=>x!==undefined)+1;html+=`<span class="${DH_CLS[k]}">${esc(m)}</span>`;last=idx+m.length;return m;});return html+esc(line.slice(last));}
const code=$('#code'), area=document.createElement('div'), hl=document.createElement('div');
area.className='code-area'; hl.id='hl'; hl.setAttribute('aria-hidden','true'); code.parentNode.insertBefore(area,code); area.append(hl,code);
function hlSync(){hl.scrollTop=code.scrollTop;hl.scrollLeft=code.scrollLeft;}
function hlMetrics(){const cs=getComputedStyle(code);for(const p of ['paddingTop','paddingRight','paddingBottom','paddingLeft','fontFamily','fontSize','lineHeight','tabSize','letterSpacing'])hl.style[p]=cs[p];}
function highlight(){hlMetrics();hl.innerHTML=code.value.split('\n').map(l=>`<span class="ln">${dhLine(l)||' '}</span>`).join('')+'<span class="ln"> </span>';hlSync();}
code.addEventListener('scroll',()=>{hlSync();$('#lines').scrollTop=code.scrollTop;});addEventListener('resize',highlight);
function codeChanged(e){if(!e?.isComposing)indent();const n=code.value.split('\n').length;$('#line-count').textContent=n+'줄';$('#lines').textContent=Array.from({length:n},(_,i)=>i+1).join('\n');highlight();}
// 동현랭 시리즈 들여쓰기: ㅋㅋ 주석 세 칸, 명령 두 칸, '나는 동현이냐?'·'동현이구나'는 들여 쓰지 않는다
function indent(){
  const text=code.value,lines=text.split('\n'),lead=l=>l.length-l.replace(/^[ \t]+/,'').length;
  const next=lines.map(l=>{const b=l.slice(lead(l));if(!b)return '';if(b.startsWith('ㅋㅋ'))return '   '+b;const s=b.split('~')[0].replace(/ㅋㅋ.*$/,'').trim();return (s==='나는 동현이냐?'||s==='동현이구나'?'':'  ')+b;});
  const {selectionStart:a,selectionEnd:b,selectionDirection:dir,scrollTop:y,scrollLeft:x}=code;
  const moved=p=>{let o=0,n=0;for(let i=0;i<lines.length;i++){const L=lines[i].length;if(p<=o+L){const c=p-o,ol=lead(lines[i]),nl=lead(next[i]);return n+Math.min(next[i].length,c<ol?nl:c-ol+nl);}o+=L+1;n+=next[i].length+1;}return n;};
  const value=next.join('\n'),na=moved(a),nb=moved(b);if(value===text&&na===a&&nb===b)return;if(value!==text)code.value=value;code.setSelectionRange(na,nb,dir);code.scrollTop=y;code.scrollLeft=x;
}
code.addEventListener('compositionend',()=>codeChanged());
function codeLead(){const a=code.selectionStart,v=code.value,ls=v.lastIndexOf('\n',a-1)+1,le=v.indexOf('\n',ls);return {a,ls,lead:/^[ \t]*/.exec(v.slice(ls,le<0?v.length:le))[0].length};}
document.addEventListener('selectionchange',()=>{if(document.activeElement!==code||code.selectionStart!==code.selectionEnd)return;const {a,ls,lead}=codeLead();if(a-ls<lead)code.setSelectionRange(ls+lead,ls+lead);});
code.addEventListener('beforeinput',e=>{
  const {a,ls,lead}=codeLead();
  if(a!==code.selectionEnd)return;
  if(e.inputType==='deleteContentBackward'&&ls>0&&a>ls&&a-ls<=lead){e.preventDefault();code.setRangeText('',ls-1,a,'end');codeChanged();}
});
code.oninput=codeChanged;
code.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){e.preventDefault();start();}});
function selectExample(){const ex=examples.find(e=>e.id===$('#example').value);code.value=ex.code;$('#example-note').textContent=ex.note;codeChanged();}
$('#example').onchange=selectExample; selectExample();
$('#save').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([code.value+'\n'],{type:'text/plain;charset=utf-8'}));a.download='zooo.dh';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
$('#open').onchange=async e=>{const f=e.target.files[0];if(!f)return;code.value=(await f.text()).replace(/\r/g,'').replace(/\n$/,'');codeChanged();e.target.value='';};
$('#run').onclick=()=>start();

/* ---------- 단계·쌍안경 규약 ---------- */
function parseSet(out){
  const tok=out.split(/\s+/).filter(Boolean).map(Number);
  if(!tok.length) return {level:DEF_LEVEL,hints:DEF_HINT,note:`출력이 없어 기본값 ${DEF_LEVEL}단계 · 쌍안경 ${DEF_HINT}으로 시작한다.`};
  if(tok.length!==2) return {err:`정수를 ${tok.length}개 출력했다. 시작 단계와 쌍안경 횟수, 두 개를 차례로 출력하자.`};
  const [L,H]=tok;
  if(!Number.isInteger(L)||L<1||L>MAX_LEVEL) return {err:`시작 단계 ${L}은 쓸 수 없다. 1부터 ${MAX_LEVEL}까지만 된다.`};
  if(!Number.isInteger(H)||H<0||H>HINT_MAX) return {err:`쌍안경 ${H}은 쓸 수 없다. 0부터 ${HINT_MAX}까지만 된다.`};
  return {level:L,hints:H};
}
function setCard(s){
  $('#set-card').innerHTML=[['시작 단계',s.level+'단계'],['쌍안경',s.hints+'개'],['할당량',quotaOf(s.level)+'마리씩']].map(([a,b])=>`<div><span>${a}</span><strong>${b}</strong></div>`).join('');
  $('#stamp-level').innerHTML=`${s.level} <span>단계</span>`;$('#stamp-hint').innerHTML=`${s.hints} <span>쌍안경</span>`;
}
const result=(t,kind)=>{const r=$('#result');r.textContent=t;r.dataset.kind=kind||'';};
const status=(t,kind)=>{const s=$('#status');s.textContent=t;s.dataset.kind=kind||'';};

/* ---------- 최고 점수(이 브라우저에만) ---------- */
const KEY='donghyunzooo.best';
const pad=n=>String(n).padStart(2,'0');
function dayKey(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function weekKey(d){const t=new Date(d.getFullYear(),d.getMonth(),d.getDate());const wd=(t.getDay()+6)%7;t.setDate(t.getDate()-wd);return dayKey(t);} // 그 주 월요일
function loadBest(){let b={};try{b=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(e){}const now=new Date();
  if(b.day!==dayKey(now)){b.day=dayKey(now);b.dayBest=0;} if(b.week!==weekKey(now)){b.week=weekKey(now);b.weekBest=0;} b.all=b.all||0;return b;}
function saveBest(score){const b=loadBest();b.dayBest=Math.max(b.dayBest||0,score);b.weekBest=Math.max(b.weekBest||0,score);b.all=Math.max(b.all,score);try{localStorage.setItem(KEY,JSON.stringify(b));}catch(e){}return b;}

/* ---------- 판 그리기 ---------- */
const board=$('#board'), ctx=board.getContext('2d');
const CELL=56, FACE=48, SIZE=CELL*N;
let dpr=1;
function fitCanvas(){ const d=Math.min(3,Math.max(1,window.devicePixelRatio||1)); if(d===dpr&&board.width===SIZE*d) return; dpr=d; board.width=SIZE*d; board.height=SIZE*d; }
let game=null, settings={level:DEF_LEVEL,hints:DEF_HINT}, sel=null, cursor={r:3,c:3}, cursorOn=false, finished=false, paused=false, pauseWhy='', now=0, lowWarned=false;
const face=k=>Sprites.make(FACES[k],3);
const spark=()=>Sprites.make('spark',3);
let colA='',colB='',colCursor='',colTheme='';
function palette(){ const th=document.documentElement.dataset.theme; if(th===colTheme) return; colTheme=th; const cs=getComputedStyle(document.documentElement); colA=cs.getPropertyValue('--zoo-cell-a').trim(); colB=cs.getPropertyValue('--zoo-cell-b').trim(); colCursor=cs.getPropertyValue('--zoo-cursor').trim(); }
function draw(){
  fitCanvas(); palette();
  ctx.setTransform(dpr,0,0,dpr,0,0); ctx.imageSmoothingEnabled=false;
  for(let r=0;r<N;r++) for(let c=0;c<N;c++){ ctx.fillStyle=(r+c)%2?colB:colA; ctx.fillRect(c*CELL,r*CELL,CELL,CELL); }
  if(!game) return;
  const shift=game.swapShift();
  const pulse=0.5+0.5*Math.sin(now/120);
  /* 쌍안경·끝났을 때의 길 */
  if(game.hintMoves){ ctx.lineWidth=4; ctx.strokeStyle=`rgba(43,176,200,${0.55+0.45*pulse})`;
    for(const m of game.hintMoves) for(const p of [m.a,m.b]) ctx.strokeRect(p.c*CELL+3,p.r*CELL+3,CELL-6,CELL-6); }
  /* 얼굴 */
  const pad=(CELL-FACE)/2;
  for(let r=0;r<N;r++) for(let c=0;c<N;c++){ const t=game.grid[r][c]; if(!t) continue;
    let x=c*CELL, y=(r-t.y)*CELL;
    if(shift){ const o=(shift.a.r===r&&shift.a.c===c)?shift.b:(shift.b.r===r&&shift.b.c===c)?shift.a:null; if(o){ x+=(o.c-c)*CELL*shift.f; y+=(o.r-r)*CELL*shift.f; } }
    if(y<-CELL) continue;
    const img=face(t.k);
    if(t.pop>=0){ const s=Math.max(0,1-t.pop), w=FACE*s; ctx.globalAlpha=Math.max(0,1-t.pop*0.8); ctx.drawImage(img,x+CELL/2-w/2,y+CELL/2-w/2,w,w); ctx.globalAlpha=1; continue; }
    if(t.special){ ctx.fillStyle=`rgba(242,183,5,${0.25+0.35*pulse})`; ctx.fillRect(x+2,y+2,CELL-4,CELL-4); }
    ctx.drawImage(img,x+pad,y+pad,FACE,FACE);
    if(t.special) ctx.drawImage(spark(),x+pad,y+pad,FACE,FACE);
    if(t.k===WILD&&!t.special){ ctx.lineWidth=2; ctx.strokeStyle='rgba(242,183,5,.9)'; ctx.strokeRect(x+2,y+2,CELL-4,CELL-4); }
  }
  /* 고른 칸·커서 */
  if(sel){ ctx.lineWidth=4; ctx.strokeStyle='#f2b705'; ctx.strokeRect(sel.c*CELL+2,sel.r*CELL+2,CELL-4,CELL-4); }
  if(cursorOn&&!finished){ ctx.lineWidth=3; ctx.strokeStyle=colCursor; ctx.setLineDash([6,4]); ctx.strokeRect(cursor.c*CELL+4,cursor.r*CELL+4,CELL-8,CELL-8); ctx.setLineDash([]); }
  /* 단계 끝·멈춤 안내 */
  const banner=(big,small,bg)=>{ ctx.fillStyle=bg; ctx.fillRect(0,SIZE/2-52,SIZE,104); ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font='400 34px "Black Han Sans","Pretendard",sans-serif'; ctx.fillText(big,SIZE/2,SIZE/2-(small?12:0)); if(small){ ctx.font='600 15px "Pretendard",sans-serif'; ctx.fillText(small,SIZE/2,SIZE/2+24); } };
  if(game.status==='clear') banner(`LEVEL ${game.level} CLEAR`,`+${lastBonus.toLocaleString()} · 다음은 LEVEL ${Math.min(MAX_LEVEL,game.level+1)}`,'rgba(63,90,58,.88)');
  else if(game.status==='clearing') banner('할당량 끝!','연쇄가 멎으면 다음 단계','rgba(63,90,58,.7)');
  else if(paused&&!finished) banner('멈춤',pauseWhy,'rgba(46,42,56,.8)');
}
let lastBonus=0;
/* 할당량 표 */
let quotaHtmlKey='';
function renderQuota(){
  if(!game) return;
  const key=game.quota.join(',')+'|'+game.level;
  if(key===quotaHtmlKey) return; quotaHtmlKey=key;
  const ul=$('#quota');
  if(ul.children.length!==KINDS){ ul.innerHTML=''; for(let k=0;k<KINDS;k++){ const li=document.createElement('li'); li.append(Sprites.make(FACES[k],2)); const sm=document.createElement('small'); sm.textContent=NAMES[k]; const b=document.createElement('b'); li.append(sm,b); ul.append(li); } }
  for(let k=0;k<KINDS;k++){ const li=ul.children[k], q=game.quota[k]; li.classList.toggle('done',q===0); li.classList.toggle('last',q===1); li.querySelector('b').textContent=q; li.setAttribute('aria-label',`${NAMES[k]} ${q===0?'다 잡았다':q+'마리 남음'}`); }
}
function renderHud(){
  if(!game) return;
  $('#score').textContent=game.score.toLocaleString();
  $('#level-label').textContent='LEVEL '+game.level;
  $('#hint-n').textContent=game.hints; $('#hint').disabled=finished||ready||game.hints<=0||game.status!=='play';
  $('#week-best').textContent=Math.max(loadBest().weekBest||0,game.score).toLocaleString();
  const tb=$('#timebar'), pct=Math.round(game.time*100); tb.firstElementChild.style.setProperty('--h',pct+'%'); tb.firstElementChild.style.setProperty('--w',pct+'%'); tb.setAttribute('aria-valuenow',pct);
  tb.classList.toggle('low',game.time<0.25&&!game.frozen&&game.status==='play'); tb.classList.toggle('frozen',game.frozen&&game.status!=='over');
  renderQuota();
}
let flashT=0;
function flash(t){const f=$('#flash');f.textContent=t;f.classList.remove('on');void f.offsetWidth;f.classList.add('on');clearTimeout(flashT);flashT=setTimeout(()=>f.classList.remove('on'),1400);}

/* ---------- 사건 처리 ---------- */
function handle(e){
  switch(e.t){
    case 'swap': SND.play('swap'); break;
    case 'swapfail': SND.play('buzz'); status(`LEVEL ${game.level} · 셋이 되지 않아 되돌아왔다`); break;
    case 'match': if(e.chain>1){ SND.play('chain',e.chain); flash(`${e.chain}연쇄 +${e.points.toLocaleString()}`); } else { SND.play('pop',e.n); flash(`+${e.points.toLocaleString()}`); }
      if(e.wild) SND.play('sparkle'); status(`LEVEL ${game.level} · ${e.wild?'보병과 함께 ':''}${e.n}마리 잡았다${e.chain>1?` · ${e.chain}연쇄`:''}`); break;
    case 'special': SND.play('special'); flash(`반짝! ${NAMES[e.k]} ${e.n}마리 +${e.points.toLocaleString()}`); status(`LEVEL ${game.level} · 반짝 판으로 ${NAMES[e.k]} ${e.n}마리를 한꺼번에 잡았다`); break;
    case 'quota': status(`LEVEL ${game.level} · 할당량을 다 채웠다 · 연쇄가 멎으면 다음 단계`); sel=null; break;
    case 'level': lastBonus=e.bonus; SND.play('level'); flash(`LEVEL ${e.level} 끝 +${e.bonus.toLocaleString()}`); break;
    case 'newlevel': lowWarned=false; sel=null; status(`LEVEL ${e.level} · 얼굴마다 ${quotaOf(e.level)}마리씩 · 막대는 ${Math.round(window.Zooo.barSeconds(e.level))}초`); break;
    case 'shuffle': SND.play('swish'); flash('길이 없어 새로 섞었다'); status(`LEVEL ${game.level} · 바꿀 자리가 없어 판을 새로 섞었다`); sel=null; break;
    case 'hint': SND.play('sparkle'); status(`바꿀 수 있는 자리 ${e.n}곳을 파랗게 보였다 · 쌍안경 ${game.hints}개 남음`); break;
    case 'hintplus': flash('쌍안경 +1'); break;
    case 'over': finish(false,e.moves); break;
    case 'end': finish(true,0); break;
  }
}
function finish(allClear,movesLeft){
  finished=true; sel=null;
  const b=saveBest(game.score), card=$('#over-card');
  card.classList.toggle('end',allClear);
  $('#over-title').textContent=allClear?'ALL CLEAR':'GAME OVER';
  $('#over-score').textContent=game.score.toLocaleString();
  $('#best-day').textContent=b.dayBest.toLocaleString();$('#best-week').textContent=b.weekBest.toLocaleString();$('#best-all').textContent=b.all.toLocaleString();
  $('#over-note').textContent=allClear?`20단계를 모두 마쳤다 · 잡은 얼굴 ${game.captured}마리 · 최고 ${game.bestChain}연쇄 · ${settings.level}단계부터 · 쌍안경 ${settings.hints}`:`LEVEL ${game.level}에서 시간이 다했다 · 잡은 얼굴 ${game.captured}마리 · 최고 ${game.bestChain}연쇄${movesLeft?` · 남아 있던 길 ${movesLeft}곳을 파랗게 보였다`:''}`;
  $('#over').hidden=false; $('#again').focus({preventScroll:true}); SND.play(allClear?'win':'over');
  status(allClear?'모든 단계를 마쳤다':`끝 · LEVEL ${game.level}에서 시간이 다했다`);
  renderHud(); draw();
}
/* 첫 화면: 판은 보이지만 시작을 누르기 전에는 시간이 흐르지 않는다 */
let ready=false;
function newGame(opts){
  game=new Game({level:settings.level,hints:settings.hints}); sel=null; finished=false; lowWarned=false; quotaHtmlKey='';
  ready=!!(opts&&opts.ready); $('#over').hidden=true; $('#ready').hidden=!ready;
  if(ready){ $('#ready-note').textContent=`LEVEL ${game.level}부터 · 쌍안경 ${game.hints}개`; $('#ready-hint').textContent=`얼굴마다 ${quotaOf(game.level)}마리씩 · 시작하면 시간이 흐른다`; }
  renderHud(); draw();
  status(ready?`시작을 누르면 LEVEL ${game.level}부터 · 쌍안경 ${game.hints}개`:`LEVEL ${game.level} · 얼굴마다 ${quotaOf(game.level)}마리씩 · 쌍안경 ${game.hints}개`);
}
function begin(){
  if(!ready||!game) return; ready=false; $('#ready').hidden=true; last=0; resume();
  status(`LEVEL ${game.level} · 얼굴마다 ${quotaOf(game.level)}마리씩 · 쌍안경 ${game.hints}개`); board.focus({preventScroll:true});
}
$('#begin').onclick=()=>begin();
$('#ready').addEventListener('click',e=>{ if(e.target===e.currentTarget) begin(); });

/* ---------- 입력: 공통 ---------- */
function cellAt(ev){ const r=board.getBoundingClientRect(); const c=Math.floor((ev.clientX-r.left)/r.width*N), rr=Math.floor((ev.clientY-r.top)/r.height*N); if(c<0||rr<0||c>=N||rr>=N) return null; return {r:rr,c}; }
const same=(a,b)=>a&&b&&a.r===b.r&&a.c===b.c;
const adjacent=(a,b)=>a&&b&&Math.abs(a.r-b.r)+Math.abs(a.c-b.c)===1;
function trySwap(a,b){ const r=game.swap(a,b); if(!r.ok){ if(r.why==='unsettled') SND.play('buzz'); return false; } sel=null; return true; }
/* 한 칸을 '집는다': 반짝 판은 바로 터지고, 고른 칸을 다시 집으면 풀리고, 이웃을 집으면 바꾼다 */
function pick(p){
  if(!game||finished||ready||game.status!=='play') return;
  const t=game.grid[p.r][p.c];
  if(t&&t.special&&game.settled(t)){ game.press(p.r,p.c); sel=null; return; }
  if(sel&&same(sel,p)){ sel=null; return; }
  if(sel&&adjacent(sel,p)){ if(trySwap(sel,p)) return; }
  if(game.canSelect(p.r,p.c)){ sel=p; SND.play('tick'); } else SND.play('buzz');
}
/* 마우스·터치: 누르기, 끌기(쓸기) */
let drag=null;
board.addEventListener('pointerdown',e=>{ if(e.button!==undefined&&e.button!==0) return; e.preventDefault(); board.focus({preventScroll:true}); cursorOn=false; resume();
  const p=cellAt(e); if(!p) return; drag={start:p,x:e.clientX,y:e.clientY,done:false}; try{ board.setPointerCapture(e.pointerId); }catch(err){}
  pick(p); if(sel&&same(sel,p)) drag.sel=true; });
board.addEventListener('pointermove',e=>{ if(!drag||drag.done||!game||finished) return; const dx=e.clientX-drag.x, dy=e.clientY-drag.y, th=board.getBoundingClientRect().width/N*0.4;
  if(Math.abs(dx)<th&&Math.abs(dy)<th) return; drag.done=true; const s=drag.start; const nb=Math.abs(dx)>Math.abs(dy)?{r:s.r,c:s.c+(dx>0?1:-1)}:{r:s.r+(dy>0?1:-1),c:s.c};
  if(nb.r<0||nb.c<0||nb.r>=N||nb.c>=N) return; if(!game.canSelect(s.r,s.c)) return; sel=s; trySwap(s,nb); });
const endDrag=()=>{ drag=null; };
board.addEventListener('pointerup',endDrag); board.addEventListener('pointercancel',endDrag);
board.addEventListener('contextmenu',e=>e.preventDefault());
/* 키보드·게임패드: 같은 이름의 키로 들어온다(x·z·s·up·down·left·right·enter) */
const DIRS={up:[-1,0],down:[1,0],left:[0,-1],right:[0,1]};
function key(k){
  if(!game) return false; resume();
  if(ready){ if(k==='x'||k==='enter'){ begin(); return true; } return false; }
  if(k in DIRS){ cursorOn=true; const [dr,dc]=DIRS[k];
    if(sel&&!finished&&game.status==='play'){ const nb={r:sel.r+dr,c:sel.c+dc}; if(nb.r>=0&&nb.c>=0&&nb.r<N&&nb.c<N){ cursor=nb; if(trySwap(sel,nb)) return true; } sel=null; return true; }
    cursor={r:Math.max(0,Math.min(N-1,cursor.r+dr)),c:Math.max(0,Math.min(N-1,cursor.c+dc))}; return true; }
  if(k==='x'||k==='enter'){ cursorOn=true; if(finished){ newGame(); return true; } pick(cursor); return true; }
  if(k==='z'){ sel=null; return true; }
  if(k==='s'){ hint(); return true; }
  return false;
}
const KEYS={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',KeyX:'x',Enter:'enter',Space:'x',KeyZ:'z',KeyS:'s'};
document.addEventListener('keydown',e=>{
  if(e.metaKey||e.ctrlKey||e.altKey) return;
  const el=document.activeElement; if(el&&(el.tagName==='TEXTAREA'||el.tagName==='SELECT'||el.tagName==='INPUT')) return;
  if(e.code==='KeyM'){ SND.set(!SND.on); sndUI(); status(SND.on?'효과음 켬':'효과음 끔'); return; }
  if(tab!=='play') return;
  const k=KEYS[e.code]; if(!k) return;
  if(el&&el.tagName==='BUTTON'&&(k==='enter'||k==='x'&&e.code==='Space')) return; // 단추 위의 Enter·Space는 단추가 받는다
  if(key(k)) e.preventDefault();
});
if(window.GP) GP.start({down:k=>{ if(tab==='play') key(k); },up:()=>{},status:t=>status(t),hint:'A 집기 · B 취소 · X 쌍안경',repeat:true});
function hint(){ if(!game||finished) return; const h=game.hint(); if(!h.ok){ if(h.why==='none') status('쌍안경이 없다 · 5,000점마다 하나 는다'); else if(h.why==='nomove') status('지금은 보일 길이 없다 · 곧 판이 섞인다'); } }
$('#hint').onclick=hint;
$('#restart').onclick=()=>newGame();
$('#again').onclick=()=>newGame();

/* ---------- 시간: 보이지 않으면 멎는다 ---------- */
function pause(why){ if(!paused){ paused=true; pauseWhy=why; } }
function resume(){ if(paused){ paused=false; last=0; } }
document.addEventListener('visibilitychange',()=>{ if(document.hidden) pause('다른 탭을 보는 동안 시간이 멎었다'); else resume(); });
window.addEventListener('blur',()=>pause('창을 벗어나 시간이 멎었다 · 판을 누르면 계속'));
window.addEventListener('focus',()=>resume());
let last=0;
function loop(ts){
  requestAnimationFrame(loop); now=ts;
  if(!game) return;
  const dt=last?Math.min(0.1,(ts-last)/1000):0; last=ts;
  if(!paused&&tab==='play'&&!finished&&!ready){
    game.tick(dt);
    for(const e of game.takeEvents()) handle(e);
    if(game.time<0.2&&!game.frozen&&game.status==='play'&&!lowWarned){ lowWarned=true; SND.play('alarm'); }
    if(game.time>0.4) lowWarned=false;
  }
  if(tab==='play'){ renderHud(); draw(); }
}
requestAnimationFrame(loop);

function start(){
  let out;
  try{ out=Donghyun.run(code.value,{maxSteps:300000}).output; }
  catch(e){ result(`동현랭 오류${e.line?` (${e.line}줄)`:''}: ${e.message}`,'error'); status('동현랭 오류','error'); return; }
  const p=parseSet(out);
  if(p.err){ result('동현주 규약 오류: '+p.err,'error'); status('규약 오류','error'); return; }
  settings={level:p.level,hints:p.hints}; setCard(settings);
  result((p.note?p.note+' ':'')+`${p.level}단계부터 쌍안경 ${p.hints}개로 새 판을 시작했다. 이웃한 두 얼굴을 바꿔 같은 얼굴 셋을 나란히 놓아 보자.`);
  newGame();
}
setCard(settings); newGame({ready:true});
/* 시험용 손잡이(qa/): 판 상태·입력을 밖에서 다룬다 */
window.__donghyunzooo={get game(){return game;},get ready(){return ready;},begin,get sel(){return sel;},get paused(){return paused;},get cursor(){return cursor;},set cursor(p){cursor=p;cursorOn=true;},key,pick,start,newGame,parseSet,tick:dt=>{ if(game){ game.tick(dt); for(const e of game.takeEvents()) handle(e); renderHud(); draw(); } }};
})();
