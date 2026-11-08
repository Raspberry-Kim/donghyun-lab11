/* 합성 효과음: 소리 파일 없이 Web Audio로 그 자리에서 만든다(동현텐의 짧은 소리 묶음을 동현주에 맞게 추렸다).
   고르기·바꾸기·잡기·연쇄·틀림·쌍안경·섞기·반짝 판·단계 끝·끝. 브라우저 규칙에 따라 첫 클릭·터치·키 입력 뒤에 소리 장치를 연다. */
var DHSFX=function(storeKey){
  'use strict';
  var AC=window.AudioContext||window.webkitAudioContext, ctx=null, master=null, noiseBuf=null;
  var on=true; try{ on=localStorage.getItem(storeKey)!=='off'; }catch(e){}
  function unlock(){
    if(!AC) return;
    if(!ctx){ try{ ctx=new AC(); }catch(e){ return; }
      master=ctx.createGain(); master.gain.value=0.3;
      var comp=ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
      var n=ctx.sampleRate, b=ctx.createBuffer(1,n,n), d=b.getChannelData(0);
      for(var i=0;i<n;i++) d[i]=Math.random()*2-1; noiseBuf=b; }
    if(ctx.state!=='running'){
      try{ var r=ctx.resume(); if(r&&r.catch) r.catch(function(){}); }catch(e){}
      /* 옛 iOS Safari: 손짓 안에서 빈 소리를 한 번 틀어야 소리 장치가 열린다 */
      try{ var sb=ctx.createBufferSource(); sb.buffer=ctx.createBuffer(1,1,22050); sb.connect(ctx.destination); sb.start(0); }catch(e){}
    }
  }
  /* 휴대폰은 손가락을 뗄 때(touchend·click)만 소리를 허락하므로 그 이벤트도 함께 듣는다 */
  ['touchend','click','pointerup','mousedown','keydown','touchstart','pointerdown'].forEach(function(ev){ document.addEventListener(ev,unlock,{capture:true,passive:true}); });
  function ready(){ return on&&ctx&&ctx.state!=='closed'; }
  function env(g,t,a,peak,dec){ g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(peak,t+a); g.gain.exponentialRampToValueAtTime(0.0001,t+a+dec); }
  function noise(t,dur,type,freq,q,peak,a){
    var s=ctx.createBufferSource(); s.buffer=noiseBuf; s.loop=true;
    var f=ctx.createBiquadFilter(); f.type=type; f.frequency.setValueAtTime(freq,t); if(q) f.Q.value=q;
    var g=ctx.createGain(); env(g,t,a||0.005,peak,dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t,Math.random()*0.5); s.stop(t+(a||0.005)+dur+0.05); return f;
  }
  function tone(t,type,freq,dur,peak,a){
    var o=ctx.createOscillator(); o.type=type; o.frequency.setValueAtTime(freq,t);
    var g=ctx.createGain(); env(g,t,a||0.01,peak,dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t+(a||0.01)+dur+0.05); return o;
  }
  var S={
    bell:function(t,f,dur,peak){ tone(t,'sine',f,dur,peak,0.005); tone(t,'sine',f*2,dur*0.5,peak*0.3,0.005); tone(t,'sine',f*3.01,dur*0.25,peak*0.12,0.005); },
    tick:function(t){ tone(t,'triangle',880,0.05,0.25,0.003); },                                   // 고르기
    swap:function(t){ var f=noise(t,0.1,'bandpass',900,2,0.3,0.01); f.frequency.linearRampToValueAtTime(1600,t+0.1); },  // 바꾸기
    pop:function(t,n){ var o=tone(t,'sine',520,0.12,0.45,0.004); o.frequency.exponentialRampToValueAtTime(1040,t+0.08);
      if(n>3){ var o2=tone(t+0.06,'sine',780,0.14,0.35,0.004); o2.frequency.exponentialRampToValueAtTime(1560,t+0.14); } }, // 잡기
    chain:function(t,k){ var base=659.25*Math.pow(1.122,Math.min(k,8)); S.bell(t,base,0.22,0.3); S.bell(t+0.07,base*1.5,0.3,0.3); }, // 연쇄
    buzz:function(t){ var o=tone(t,'square',140,0.16,0.12,0.005); o.frequency.linearRampToValueAtTime(110,t+0.16); },         // 틀림
    sparkle:function(t){ [1318.5,1568,2093].forEach(function(f,i){ S.bell(t+i*0.06,f,0.25,0.18); }); },                      // 쌍안경·보병
    swish:function(t){ var f=noise(t,0.32,'bandpass',500,1.5,0.45,0.04); f.frequency.linearRampToValueAtTime(2400,t+0.3); }, // 섞기
    special:function(t){ for(var i=0;i<5;i++){ S.bell(t+i*0.05,880+i*180,0.18,0.22); } noise(t,0.3,'highpass',3000,0,0.25,0.02); }, // 반짝 판
    level:function(t){ S.bell(t,523.25,0.4,0.45); S.bell(t+0.22,659.25,0.4,0.45); S.bell(t+0.44,783.99,0.5,0.45); S.bell(t+0.66,1046.5,1.1,0.5); }, // 단계 끝
    win:function(t){ [523.25,659.25,783.99,1046.5,1318.5].forEach(function(f,i){ S.bell(t+i*0.16,f,0.9,0.45); }); },         // 모두 끝
    alarm:function(t){ tone(t,'triangle',330,0.1,0.2); tone(t+0.14,'triangle',330,0.1,0.2); },                               // 시간 얼마 없음
    over:function(t){ S.bell(t,523.25,0.4,0.4); S.bell(t+0.22,392,0.4,0.4); S.bell(t+0.44,261.63,0.9,0.45); }
  };
  return {
    get on(){ return on; },
    set:function(v){ on=!!v; try{ localStorage.setItem(storeKey,on?'on':'off'); }catch(e){} if(on) unlock(); },
    play:function(k,arg){ if(!ready()||!S[k]) return; S[k](ctx.currentTime+0.01,arg); }
  };
};
