/* 동현주 예제. 동현랭이 출력한 정수 둘이 차례로 시작 단계(1~20)와 쌍안경 횟수(0~9)다. 기본은 1단계, 쌍안경 3. */
function expression(n){
  if(n===0)return '도옹ㅠ';
  if(n<0)return 'ㅠ '+expression(-n);
  if(n<=10)return '도'+'오'.repeat(n-1)+'옹';
  for(let a=10;a>=2;a--)if(n%a===0)return expression(a)+' '+expression(n/a);
  return '도'+'오'.repeat(n-1)+'옹';
}
const output=(...ns)=>ns.map(n=>'뿡뿡 '+expression(n)+'~뿡뿡뿡').join('~');
const wrap=a=>['나는 동현이냐?',...a,'동현이구나'].join('\n');
const pair=(label,level,hints)=>wrap(['ㅋㅋ '+label,'ㅋㅋ 시작 단계 '+level,output(level),'ㅋㅋ 쌍안경 '+hints,output(hints)]);
const examples=[
 {id:'basic',title:'01 · 기본 (1단계 · 쌍안경 3)',note:'1단계부터, 쌍안경 3개. 동현주의 기본값이다. 1~3단계는 얼굴마다 세 번씩 잡으면 다음 단계다.',code:pair('기본 · 1단계 · 쌍안경 3',1,3)},
 {id:'mid',title:'02 · 중간부터 (8단계 · 쌍안경 5)',note:'8단계부터 시작한다. 얼굴마다 여덟 번씩 잡아야 하고 시간 막대가 빨리 준다. 대신 쌍안경을 다섯 개 들고 간다.',code:pair('중간부터 · 8단계 · 쌍안경 5',8,5)},
 {id:'bare',title:'03 · 맨눈 (1단계 · 쌍안경 0)',note:'쌍안경 없이 1단계부터. 길이 보이지 않아도 스스로 찾아야 한다. 0은 도옹ㅠ로 쓴다.',code:pair('맨눈 · 1단계 · 쌍안경 0',1,0)},
 {id:'last',title:'04 · 마지막 단계 (20단계 · 쌍안경 9)',note:'마지막 20단계만 해 본다. 얼굴마다 열두 번씩, 막대는 12초 만에 빈다. 쌍안경은 최대 9개. 20은 10×2로 적었다.',code:pair('마지막 단계 · 20단계 · 쌍안경 9',20,9)}
];
if(typeof module!=='undefined')module.exports={examples,expression};
