# 동현주 도트 그림 생성기. 실행하면 src/sprites.js를 다시 쓴다. 원작 게임의 그림은 한 점도 쓰지 않는다.
# 동현몬과 같은 글자 팔레트·같은 윤곽색(K #2e2a38)으로, 동현랭 세계관 인물의 얼굴만 16×16으로 그린다.
# python3 tools/paint.py            → src/sprites.js 갱신
# python3 tools/paint.py preview    → /tmp/zooo_faces.png 미리보기(PIL 필요)
import os, sys
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAL={
 'K':'#2e2a38','E':'#ffffff','W':'#f6ecd6','G':'#c9aa78','R':'#d6403a','M':'#e5483a','d':'#9a2620',
 'B':'#3b63b5','b':'#24417a','I':'#8d919c','i':'#c7c9d1','h':'#6b4a2e','c':'#8c7a63','a':'#9a978c','A':'#5d5b53',
 's':'#efc7a6','S':'#d9a785','p':'#f0a3a3','P':'#d97b86','w':'#f6f2e8','Y':'#f2b705','g':'#6fb04a','5':'#3f8a3a',
 'C':'#2bb0c8','8':'#b5dcf2','7':'#5fa8e0','e':'#49392f','L':'#ff9f86','O':'#d98a3c','k':'#231d18','t':'#7a4a22',
}
def blank(w=16,h=16): return [['.']*w for _ in range(h)]
def put(g,x,y,c):
    if 0<=y<len(g) and 0<=x<len(g[0]): g[y][x]=c
def rect(g,x,y,w,h,c):
    for yy in range(y,y+h):
        for xx in range(x,x+w): put(g,xx,yy,c)
def blob(g,rows,x0,y0):
    for dy,r in enumerate(rows):
        for dx,ch in enumerate(r):
            if ch!=' ': put(g,x0+dx,y0+dy,ch)
def disc(g,cx,cy,r,c):
    for y in range(len(g)):
        for x in range(len(g[0])):
            if (x-cx+0.5)**2+(y-cy+0.5)**2<=r*r: g[y][x]=c
def rounded(g,x,y,w,h,c,cut=2):
    rect(g,x,y,w,h,c)
    for k in range(cut):
        for j in range(cut-k):
            put(g,x+j,y+k,'.'); put(g,x+w-1-j,y+k,'.'); put(g,x+j,y+h-1-k,'.'); put(g,x+w-1-j,y+h-1-k,'.')
def outline(g,c='K'):
    h=len(g); w=len(g[0]); o=[r[:] for r in g]
    for y in range(h):
        for x in range(w):
            if g[y][x]=='.':
                for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
                    xx,yy=x+dx,y+dy
                    if 0<=xx<w and 0<=yy<h and g[yy][xx]!='.': o[y][x]=c; break
    return o
def S(g): return [''.join(r) for r in g]
SPR={}
def add(k,g): SPR[k]=S(g)
def eyes(g,y,x1=4,x2=10,c='K'):  # 2×2 눈 두 개
    rect(g,x1,y,2,2,c); rect(g,x2,y,2,2,c)

# ---------- 얼굴 여덟 ----------
# 포동이: 흰 강아지. 늘어진 귀, 검은 코, 빨간 혀(반점은 없다)
g=blank(); rounded(g,2,2,12,12,'w',2)
blob(g,['ww','ww','ww','ww','ww',' w'],0,3); blob(g,['ww','ww','ww','ww','ww','w '],14,3)   # 귀
eyes(g,6); rect(g,7,9,2,2,'K'); rect(g,7,11,2,2,'R'); put(g,7,12,'d')                        # 눈·코·혀
g=outline(g); add('podong',g)

# 슈슈: 복싱 소녀. 동그란 살색 얼굴, 짙은 갈색 머리에 작고 동글한 뿌까머리(양쪽 머리방울), 볼 홍조, 웃는 입
g=blank(); disc(g,8,8.7,6.3,'s')                                                             # 동그란 얼굴
for y in range(2,6):
    for x in range(16):
        if g[y][x]=='s': g[y][x]='h'                                                          # 머리(윗부분)
blob(g,[' hh ','hhhh',' hh '],0,0); blob(g,[' hh ','hhhh',' hh '],12,0)                        # 동글한 머리방울 둘
eyes(g,8,5,9); put(g,3,10,'p'); put(g,12,10,'p')                                             # 눈·볼 홍조
rect(g,6,12,4,1,'K'); put(g,5,11,'K'); put(g,10,11,'K')                                      # 웃는 입
g=outline(g); add('shushu',g)

# 라이언: 분홍 선충. 마디 줄무늬, 작은 눈, 미소
g=blank(); disc(g,8,8,6.6,'p')
for y in (4,8,12): 
    for x in range(16):
        if g[y][x]=='p': g[y][x]='P'
eyes(g,6,5,9); rect(g,6,10,4,1,'K'); put(g,5,9,'K'); put(g,10,9,'K')
g=outline(g); add('lion',g)

# 초파리: 갈색 머리, 큰 빨간 겹눈, 더듬이, 모서리의 옅은 날개
g=blank(); rounded(g,3,3,10,11,'h',2)
blob(g,['888','888','88'],0,4); blob(g,['888','888',' 88'],13,4)                              # 날개
blob(g,['RRR','RRRR','RRRR','RRR'],2,5); blob(g,[' RRR','RRRR','RRRR',' RRR'],10,5)         # 겹눈
put(g,3,6,'M'); put(g,11,6,'M')                                                              # 눈 반짝
put(g,5,2,'K'); put(g,4,1,'K'); put(g,10,2,'K'); put(g,11,1,'K')                             # 더듬이
rect(g,7,11,2,1,'K')
g=outline(g); add('fly',g)

# 둠가이: 초록 철모, 살색 얼굴, 성난 눈썹
g=blank(); rounded(g,2,2,12,12,'s',2)
rect(g,2,2,12,4,'g'); rect(g,1,5,14,1,'5'); put(g,2,2,'.'); put(g,13,2,'.')                  # 철모·챙
rect(g,6,2,4,1,'5')                                                                          # 철모 이음
eyes(g,8); put(g,3,7,'K'); put(g,4,7,'K'); put(g,11,7,'K'); put(g,12,7,'K')                 # 눈·눈썹
rect(g,6,12,4,1,'K')
g=outline(g); add('doom',g)

# 기사: 은회색 투구, 어두운 면갑 틈 안의 눈빛, 파란 깃
g=blank(); rounded(g,2,2,12,13,'I',2)
rect(g,3,3,2,10,'i'); rect(g,2,7,12,3,'K'); rect(g,4,8,2,1,'E'); rect(g,10,8,2,1,'E')        # 광택·면갑 틈·눈빛
rect(g,7,10,2,4,'K'); rect(g,7,0,2,3,'B'); put(g,7,0,'7'); rect(g,6,2,4,1,'b')              # 코가리개·깃
g=outline(g); add('knight',g)

# 꼬리콥터: 청록 몸통, 둥근 유리창, 위의 회전날, 아래 발
g=blank(); disc(g,8,9,5.6,'C')
rect(g,1,2,14,1,'K'); rect(g,7,3,2,1,'K'); rect(g,6,3,4,1,'K')                               # 회전날
blob(g,['888','8E8','888'],4,6); put(g,5,7,'E')                                              # 창
rect(g,10,8,3,2,'7'); rect(g,4,14,8,1,'K'); put(g,6,13,'K'); put(g,9,13,'K')                 # 옆 창·발
g=outline(g); add('copter',g)

# 보병(귀한 손님): 카키 철모에 붉은 별, 살색 얼굴
g=blank(); rounded(g,2,2,12,12,'s',2)
rect(g,2,2,12,4,'c'); rect(g,1,5,14,1,'A'); put(g,2,2,'.'); put(g,13,2,'.')
put(g,7,3,'R'); put(g,8,3,'R'); put(g,7,4,'R'); put(g,8,4,'R')                               # 별
eyes(g,8); rect(g,6,12,4,1,'K')
g=outline(g); add('inf',g)

# 반짝 판 테두리(별 모양 반짝이), 얼굴 위에 겹쳐 그린다
g=blank()
for x,y in ((1,1),(14,1),(1,14),(14,14),(7,0),(8,0),(0,7),(0,8),(15,7),(15,8),(7,15),(8,15)): put(g,x,y,'Y')
add('spark',g)

ORDER=['podong','shushu','lion','fly','doom','knight','copter','inf']
def write_js():
    out=['/* 동현주 그림: 모든 도트는 tools/paint.py가 글자 격자로 새로 그린다. 원작 게임의 그림은 한 점도 쓰지 않는다.',
         '   동현몬과 같은 글자 팔레트·같은 윤곽색으로 동현랭 세계관 인물의 얼굴만 16×16으로 그렸다. */',
         '(function(root){','\'use strict\';',
         'const PAL='+__import__('json').dumps(dict([('.',None)]+list(PAL.items())),ensure_ascii=False)+';',
         'const FACES='+__import__('json').dumps(ORDER)+';',
         'const SPR={']
    for k,rows in SPR.items(): out.append('"%s":`\n%s`,'%(k,'\n'.join(rows)))
    out+=['};',
          'const cache={};',
          'function make(key,scale){',
          '  scale=scale||1; const id=key+"@"+scale; if(cache[id]) return cache[id];',
          '  const rs=SPR[key].trim().split("\\n"), h=rs.length, w=rs[0].length;',
          '  const c=document.createElement("canvas"); c.width=w*scale; c.height=h*scale; const g=c.getContext("2d");',
          '  for(let y=0;y<h;y++) for(let x=0;x<rs[y].length;x++){ const col=PAL[rs[y][x]]; if(!col) continue; g.fillStyle=col; g.fillRect(x*scale,y*scale,scale,scale); }',
          '  cache[id]=c; return c;',
          '}',
          'root.Sprites={make,PAL,SPR,FACES};',
          '})(typeof window!=="undefined"?window:(typeof module!=="undefined"?module.exports:this));']
    open(os.path.join(ROOT,'src','sprites.js'),'w').write('\n'.join(out)+'\n')
def preview(path='/tmp/zooo_faces.png',S=10):
    from PIL import Image
    keys=ORDER+['spark']
    img=Image.new('RGB',(len(keys)*(16*S+6),16*S),(246,236,214))
    for i,k in enumerate(keys):
        for y,r in enumerate(SPR[k]):
            for x,ch in enumerate(r):
                c=PAL.get(ch)
                if not c: continue
                col=tuple(int(c[j:j+2],16) for j in (1,3,5))
                for dy in range(S):
                    for dx in range(S): img.putpixel((i*(16*S+6)+x*S+dx,y*S+dy),col)
    img.save(path)
if __name__=='__main__':
    write_js()
    if 'preview' in sys.argv: preview()
    print('faces',len(ORDER),'sprites',len(SPR))
