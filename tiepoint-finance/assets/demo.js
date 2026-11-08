/* TiePoint Finance demo dashboard. Illustration only: all figures are simulated in the browser for a fictional company. */
(function(){
"use strict";
/* ============ deterministic sample data (fictional) ============ */
var N=24; // Nov 2024 .. Oct 2026
function nz(seed,i){var x=Math.sin(seed*127.1+i*311.7)*43758.5453;return x-Math.floor(x);}
var MONTH_NAMES=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var LABELS=[];(function(){var m=10,y=2024;for(var i=0;i<N;i++){LABELS.push(MONTH_NAMES[m]+" '"+String(y).slice(2));m++;if(m>11){m=0;y++;}}})();

var REGIONS=[
  {key:'NA',name:'North America',color:'var(--s1)',hex:'var(--data-1)',base:2550000,g:0.011,seed:1},
  {key:'EMEA',name:'EMEA',color:'var(--s2)',hex:'var(--data-2)',base:1620000,g:0.008,seed:2},
  {key:'APAC',name:'APAC',color:'var(--s3)',hex:'var(--data-3)',base:920000,g:0.016,seed:3}
];
var OPEX_FN=[
  {key:'sm',name:'Sales & Marketing',share:0.122},
  {key:'rd',name:'R&D',share:0.094},
  {key:'ga',name:'G&A',share:0.071},
  {key:'ops',name:'Operations',share:0.058},
  {key:'it',name:'IT',share:0.036}
];
function buildEntity(r){
  var e={revA:[],revB:[],cogsA:[],cogsB:[],opexA:{},opexB:{}};
  OPEX_FN.forEach(function(f){e.opexA[f.key]=[];e.opexB[f.key]=[];});
  for(var i=0;i<N;i++){
    var seas=1+0.07*Math.sin((i+2)/12*2*Math.PI);
    var rb=r.base*Math.pow(1+r.g,i)*seas;
    var ra=rb*(0.962+0.075*nz(r.seed,i));
    e.revB.push(rb);e.revA.push(ra);
    e.cogsB.push(rb*0.46);
    e.cogsA.push(ra*(0.44+0.03*nz(r.seed+5,i)));
    OPEX_FN.forEach(function(f,k){
      var ob=rb*f.share;
      e.opexB[f.key].push(ob);
      e.opexA[f.key].push(ob*(0.93+0.11*nz(r.seed+10+k,i)));
    });
  }
  return e;
}
var DATA={};REGIONS.forEach(function(r){DATA[r.key]=buildEntity(r);});
(function(){ // consolidated
  var c={revA:[],revB:[],cogsA:[],cogsB:[],opexA:{},opexB:{}};
  OPEX_FN.forEach(function(f){c.opexA[f.key]=[];c.opexB[f.key]=[];});
  for(var i=0;i<N;i++){
    var sum=function(fn){var s=0;REGIONS.forEach(function(r){s+=fn(DATA[r.key]);});return s;};
    c.revA.push(sum(function(e){return e.revA[i];}));
    c.revB.push(sum(function(e){return e.revB[i];}));
    c.cogsA.push(sum(function(e){return e.cogsA[i];}));
    c.cogsB.push(sum(function(e){return e.cogsB[i];}));
    OPEX_FN.forEach(function(f){
      c.opexA[f.key].push(sum(function(e){return e.opexA[f.key][i];}));
      c.opexB[f.key].push(sum(function(e){return e.opexB[f.key][i];}));
    });
  }
  DATA.CONS=c;
})();
var ENTITY_NAMES={CONS:'Consolidated',NA:'North America',EMEA:'EMEA',APAC:'APAC'};

/* ============ helpers ============ */
var SVGNS='http://www.w3.org/2000/svg';
function E(t,a,p){var n=document.createElementNS(SVGNS,t);for(var k in a){var v=a[k];if(typeof v==='string'&&v.indexOf('var(')===0&&(k==='fill'||k==='stroke'))n.style[k]=v;else n.setAttribute(k,v);}if(p)p.appendChild(n);return n;}
function H(t,cls,p){var n=document.createElement(t);if(cls)n.className=cls;if(p)p.appendChild(n);return n;}
function txt(n,s){n.textContent=s;return n;}
function fM(v){var a=Math.abs(v),s=v<0?'-':'';
  if(a>=1e9)return s+'$'+(a/1e9).toFixed(2)+'B';
  if(a>=1e6)return s+'$'+(a/1e6).toFixed(a>=2e7?1:2)+'M';
  if(a>=1e3)return s+'$'+Math.round(a/1e3)+'K';
  return s+'$'+Math.round(a);}
function fMsign(v){return (v>=0?'+':'−')+fM(Math.abs(v)).replace('-','');}
function fPct(v){return (v*100).toFixed(1)+'%';}
function fPctSign(v){return (v>=0?'+':'−')+Math.abs(v*100).toFixed(1)+'%';}
function fPP(v){return (v>=0?'+':'−')+Math.abs(v*100).toFixed(1)+' pp';}
function sumSlice(arr,from){var s=0;for(var i=from;i<N;i++)s+=arr[i];return s;}
function niceCeil(m){var raw=m/4,p=Math.pow(10,Math.floor(Math.log(raw)/Math.LN10)),c=raw/p;
  var s=c<=1?1:c<=2?2:c<=2.5?2.5:c<=5?5:10;return s*p*4;}
function axisLabel(v){if(v===0)return '$0';
  if(v>=1e6)return (v/1e6)%1===0?'$'+(v/1e6)+'M':'$'+(v/1e6).toFixed(1)+'M';
  if(v>=1e3)return '$'+Math.round(v/1e3)+'K';return '$'+Math.round(v);}

/* tooltip */
var tip=document.getElementById('viz-tip');
function tipShow(x,y,title,rows){
  tip.innerHTML='';
  txt(H('div','tm',tip),title);
  rows.forEach(function(r){
    var tr=H('div','tr',tip);
    var lk=H('span','lk',tr);lk.style.borderTopColor=r.color||'transparent';
    if(!r.color)lk.style.width='0';
    txt(H('span','tn',tr),r.name);
    txt(H('b',null,tr),r.value);
  });
  tip.style.display='block';tip.setAttribute('aria-hidden','false');
  var w=tip.offsetWidth,h=tip.offsetHeight;
  var px=x+14,py=y+14;
  if(px+w>window.innerWidth-8)px=x-w-14;
  if(py+h>window.innerHeight-8)py=y-h-14;
  tip.style.left=px+'px';tip.style.top=py+'px';
}
function tipHide(){tip.style.display='none';tip.setAttribute('aria-hidden','true');}

/* ============ motion ============ */
var REDUCE=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var animIn=!REDUCE; /* draw-in on user changes; off for live syncs */
var kpiPrev={};
function tween(el,from,to,fmt,ms){
  if(REDUCE||from===undefined||from===to){el.textContent=fmt(to);return;}
  var t0=performance.now();
  (function f(now){var k=Math.min(1,(now-t0)/ms),e=1-Math.pow(1-k,3);el.textContent=fmt(from+(to-from)*e);if(k<1)requestAnimationFrame(f);})(t0);
}
function strokeReveal(path,delay){
  if(!animIn)return;
  var len=path.getTotalLength();path.style.strokeDasharray=len;path.style.strokeDashoffset=len;
  path.getBoundingClientRect();
  path.style.transition='stroke-dashoffset 1.1s cubic-bezier(.16,1,.3,1) '+(delay||0)+'s';path.style.strokeDashoffset='0';
}
function barReveal(node,i,origin){
  if(!animIn)return;
  node.classList.add('bar-in');node.style.transformOrigin=origin||'left';node.style.animationDelay=(i*0.05)+'s';
}

/* ============ state ============ */
var state={period:12,cmp:'budget',entity:'CONS'};
function slice(){return {from:N-state.period,count:state.period};}
function ent(){return DATA[state.entity];}
function opexTotA(e,i){var s=0;OPEX_FN.forEach(function(f){s+=e.opexA[f.key][i];});return s;}
function opexTotB(e,i){var s=0;OPEX_FN.forEach(function(f){s+=e.opexB[f.key][i];});return s;}
/* comparison value at index i for a metric fn over actuals */
function cmpRevAt(e,i){return state.cmp==='budget'?e.revB[i]:e.revA[i-12];}
function cmpCogsAt(e,i){return state.cmp==='budget'?e.cogsB[i]:e.cogsA[i-12];}
function cmpOpexFnAt(e,f,i){return state.cmp==='budget'?e.opexB[f][i]:e.opexA[f][i-12];}
function cmpOpexTotAt(e,i){var s=0;OPEX_FN.forEach(function(f){s+=cmpOpexFnAt(e,f.key,i);});return s;}
function cmpWord(){return state.cmp==='budget'?'Budget':'Prior year';}

/* ============ KPI tiles ============ */
function sparkline(values,w,h){
  var svg=E('svg',{viewBox:'0 0 '+w+' '+h,width:w,height:h,'aria-hidden':'true',class:'spark'});
  var mn=Math.min.apply(null,values),mx=Math.max.apply(null,values);
  if(mx===mn)mx=mn+1;
  var pts=values.map(function(v,i){
    var x=2+(w-8)*(values.length===1?0:i/(values.length-1));
    var y=h-4-(h-8)*((v-mn)/(mx-mn));
    return [x,y];
  });
  E('polyline',{points:pts.map(function(p){return p[0].toFixed(1)+','+p[1].toFixed(1);}).join(' '),
    fill:'none',stroke:'var(--muted)','stroke-width':'1.5','stroke-linejoin':'round','stroke-linecap':'round'},svg);
  var last=pts[pts.length-1];
  E('circle',{cx:last[0].toFixed(1),cy:last[1].toFixed(1),r:'3.4',fill:'var(--data-1)',stroke:'var(--surface)','stroke-width':'2'},svg);
  return svg;
}
function kpiTile(parent,label,value,delta,deltaTxt,upIsGood,sparkVals,num,fmt){
  var k=H('div','kpi',parent);
  txt(H('div','kl',k),label);
  var kv=H('div','kv',k);
  if(num!==undefined){tween(kv,kpiPrev[label],num,fmt,700);kpiPrev[label]=num;}else txt(kv,value);
  var d=H('div','kd',k);
  var good=(delta>=0)===upIsGood;
  d.classList.add(good?'kd-up':'kd-down');
  var arrow=delta>=0?'▲ ':'▼ ';
  txt(H('span',null,d),arrow+deltaTxt+' ');
  txt(H('span','vs',d),'vs '+cmpWord().toLowerCase());
  k.appendChild(sparkline(sparkVals,220,30));
  return k;
}
function renderKPIs(){
  var box=document.getElementById('kpis');box.innerHTML='';
  var e=ent(),s=slice();
  var revA=0,revC=0,cogsA=0,cogsC=0,opxA=0,opxC=0;
  var sparkRev=[],sparkGM=[],sparkEB=[],sparkOp=[];
  for(var i=s.from;i<N;i++){
    var ra=e.revA[i],rc=cmpRevAt(e,i),ca=e.cogsA[i],cc=cmpCogsAt(e,i),oa=opexTotA(e,i),oc=cmpOpexTotAt(e,i);
    revA+=ra;revC+=rc;cogsA+=ca;cogsC+=cc;opxA+=oa;opxC+=oc;
    sparkRev.push(ra);sparkGM.push((ra-ca)/ra);sparkEB.push(ra-ca-oa);sparkOp.push(oa);
  }
  var gmA=(revA-cogsA)/revA, gmC=(revC-cogsC)/revC;
  var ebA=revA-cogsA-opxA, ebC=revC-cogsC-opxC;
  kpiTile(box,'Revenue',fM(revA),revA-revC,fPctSign((revA-revC)/revC),true,sparkRev,revA,fM);
  kpiTile(box,'Gross margin',fPct(gmA),gmA-gmC,fPP(gmA-gmC),true,sparkGM,gmA,fPct);
  kpiTile(box,'EBITDA',fM(ebA),ebA-ebC,fPctSign((ebA-ebC)/Math.abs(ebC)),true,sparkEB,ebA,fM);
  kpiTile(box,'Operating expenses',fM(opxA),opxA-opxC,fPctSign((opxA-opxC)/opxC),false,sparkOp,opxA,fM);
}

/* ============ revenue line chart ============ */
function renderRevChart(){
  var box=document.getElementById('rev-chart');box.innerHTML='';
  var e=ent(),s=slice();
  var labels=[],act=[],cmp=[];
  for(var i=s.from;i<N;i++){labels.push(LABELS[i]);act.push(e.revA[i]);cmp.push(cmpRevAt(e,i));}
  var series=[{name:'Actual',hex:'var(--data-1)',values:act},{name:cmpWord(),hex:'var(--muted)',values:cmp,dash:'5 4'}];
  // legend
  var lg=document.getElementById('rev-legend');lg.innerHTML='';
  series.forEach(function(sr){
    var it=H('span',null,lg);
    var lk=H('span','lk',it);lk.style.borderTopColor=sr.hex;if(sr.dash)lk.style.borderTopStyle='dashed';
    txt(H('span',null,it),sr.name);
  });
  var w=Math.max(box.clientWidth||600,320),hPlot=250,padL=52,padR=64,padT=14,padB=30,h=hPlot+padT+padB;
  var svg=E('svg',{viewBox:'0 0 '+w+' '+h,role:'img','aria-label':'Line chart of monthly revenue, actual versus '+cmpWord().toLowerCase()},box);
  var maxV=0;series.forEach(function(sr){sr.values.forEach(function(v){if(v>maxV)maxV=v;});});
  var yMax=niceCeil(maxV);
  var X=function(i){return labels.length===1?padL:(padL+(w-padL-padR)*i/(labels.length-1));};
  var Y=function(v){return padT+hPlot-(hPlot*v/yMax);};
  // gridlines + y ticks
  for(var t=0;t<=4;t++){
    var v=yMax*t/4,y=Y(v);
    E('line',{x1:padL,x2:w-padR,y1:y,y2:y,stroke:t===0?'var(--line)':'var(--line-2)','stroke-width':'1'},svg);
    txt(E('text',{x:padL-8,y:y+4,'text-anchor':'end','font-size':'11','font-family':'IBM Plex Mono, monospace',fill:'var(--muted)'},svg),axisLabel(v));
  }
  // x labels (subset)
  var maxLbls=Math.max(2,Math.floor((w-padL-padR)/60)+1);
  var stepLbl=Math.max(1,Math.ceil((labels.length-1)/Math.max(1,maxLbls-1)));
  labels.forEach(function(lb,i){
    var isLast=i===labels.length-1;
    if(!isLast&&(i%stepLbl!==0||labels.length-1-i<stepLbl*0.8))return;
    txt(E('text',{x:X(i),y:h-8,'text-anchor':'middle','font-size':'11','font-family':'IBM Plex Mono, monospace',fill:'var(--muted)'},svg),lb);
  });
  // lines
  series.forEach(function(sr){
    var d=sr.values.map(function(v,i){return (i?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1);}).join(' ');
    var pa={d:d,fill:'none',stroke:sr.hex,'stroke-width':'2','stroke-linejoin':'round','stroke-linecap':'round'};var pth=E('path',pa,svg);if(!sr.dash)strokeReveal(pth,0);else if(animIn){pth.style.opacity='0';pth.getBoundingClientRect();pth.style.transition='opacity .8s ease .3s';pth.style.opacity='1';pth.setAttribute('stroke-dasharray',sr.dash);}else pth.setAttribute('stroke-dasharray',sr.dash);
  });
  // endpoint label: actual only (selective)
  var li=act.length-1;
  txt(E('text',{x:X(li)+10,y:Y(act[li])+4,'font-size':'12','font-weight':'600','font-family':'Inter, sans-serif',fill:'var(--text)'},svg),fM(act[li]));
  // hover layer: crosshair + dots + tooltip
  var hoverG=E('g',{},svg);
  var overlay=E('rect',{x:padL,y:padT,width:w-padL-padR,height:hPlot,fill:'transparent'},svg);
  function showAt(idx,cx,cy){
    hoverG.innerHTML='';
    var x=X(idx);
    E('line',{x1:x,x2:x,y1:padT,y2:padT+hPlot,stroke:'var(--line)','stroke-width':'1'},hoverG);
    series.forEach(function(sr){
      E('circle',{cx:x,cy:Y(sr.values[idx]),r:'4.5',fill:sr.hex,stroke:'var(--surface)','stroke-width':'2'},hoverG);
    });
    tipShow(cx,cy,labels[idx],series.map(function(sr){
      return {color:sr.hex,name:sr.name,value:fM(sr.values[idx])};
    }));
  }
  overlay.addEventListener('pointermove',function(ev){
    var r=svg.getBoundingClientRect();
    var sx=(ev.clientX-r.left)*(w/r.width);
    var frac=(sx-padL)/(w-padL-padR);
    var idx=Math.round(frac*(labels.length-1));
    idx=Math.max(0,Math.min(labels.length-1,idx));
    showAt(idx,ev.clientX,ev.clientY);
  });
  overlay.addEventListener('pointerleave',function(){hoverG.innerHTML='';tipHide();});
}

/* ============ revenue mix segmented bar ============ */
function renderMix(){
  var bar=document.getElementById('mix-bar');bar.innerHTML='';
  var lg=document.getElementById('mix-legend');lg.innerHTML='';
  var s=slice();
  var parts=REGIONS.map(function(r){
    var v=0;for(var i=s.from;i<N;i++)v+=DATA[r.key].revA[i];
    return {key:r.key,name:r.name,hex:r.hex,value:v};
  });
  var tot=parts.reduce(function(a,p){return a+p.value;},0);
  var ariaParts=[];
  parts.forEach(function(p,ix){
    var share=p.value/tot;
    var blk=H('div','blk',bar);
    var dim=state.entity!=='CONS'&&state.entity!==p.key;
    blk.style.background=dim?'var(--line)':p.hex;
    blk.style.flexGrow=String(Math.max(share*1000,1));
    blk.style.flexBasis='0';
    blk.setAttribute('tabindex','0');
    var lbl=H('span',null,blk);txt(lbl,fPct(share));
    if(dim)lbl.style.color='var(--text)';
    ariaParts.push(p.name+' '+fPct(share)+' ('+fM(p.value)+')');
    function show(ev){
      var x=ev.clientX!=null?ev.clientX:blk.getBoundingClientRect().left+10;
      var y=ev.clientY!=null?ev.clientY:blk.getBoundingClientRect().top;
      tipShow(x,y,p.name,[
        {color:p.hex,name:'Revenue',value:fM(p.value)},
        {color:null,name:'Share',value:fPct(share)}
      ]);
    }
    blk.addEventListener('pointermove',show);
    blk.addEventListener('pointerleave',tipHide);
    blk.addEventListener('focus',show);
    blk.addEventListener('blur',tipHide);
  });
  bar.setAttribute('aria-label','Revenue mix by region: '+ariaParts.join('; '));
  // hide labels that don't fit
  requestAnimationFrame(function(){
    Array.prototype.forEach.call(bar.children,function(blk){
      var lbl=blk.querySelector('span');
      if(lbl&&lbl.scrollWidth+14>blk.clientWidth)lbl.style.display='none';
    });
  });
  parts.forEach(function(p){
    var it=H('span',null,lg);
    var sw=H('span','swd',it);sw.style.background=(state.entity!=='CONS'&&state.entity!==p.key)?'var(--line)':p.hex;
    txt(H('span',null,it),p.name);
  });
  var note=document.getElementById('mix-note');
  note.textContent=state.entity==='CONS'
    ? 'Every region is shown in full colour. Choose a single entity above to pick out its portion.'
    : ENTITY_NAMES[state.entity]+' is picked out; the rest stay greyed for context. Shares are always of group revenue.';
}

/* ============ opex ranked bars ============ */
function barPathRight(x,y,wd,ht,r){
  if(wd<=r)r=Math.max(wd/2,1);
  return 'M'+x+' '+y+' h'+(wd-r)+' a'+r+' '+r+' 0 0 1 '+r+' '+r+' v'+(ht-2*r)+' a'+r+' '+r+' 0 0 1 -'+r+' '+r+' h-'+(wd-r)+' z';
}
function barPathLeft(x,y,wd,ht,r){ // bar extending left from x
  if(wd<=r)r=Math.max(wd/2,1);
  return 'M'+x+' '+y+' h-'+(wd-r)+' a'+r+' '+r+' 0 0 0 -'+r+' '+r+' v'+(ht-2*r)+' a'+r+' '+r+' 0 0 0 '+r+' '+r+' h'+(wd-r)+' z';
}
function renderOpex(){
  var box=document.getElementById('opex-chart');box.innerHTML='';
  var e=ent(),s=slice();
  var items=OPEX_FN.map(function(f){
    var a=0,b=0;for(var i=s.from;i<N;i++){a+=e.opexA[f.key][i];b+=cmpOpexFnAt(e,f.key,i);}
    return {name:f.name,a:a,b:b};
  }).sort(function(p,q){return q.a-p.a;});
  var tot=items.reduce(function(acc,it){return acc+it.a;},0);
  var w=Math.max(box.clientWidth||500,300),rowH=36,narrow=w<430,labW=narrow?100:Math.min(150,w*0.34),valW=64,padT=6;
  var h=items.length*rowH+padT;
  var svg=E('svg',{viewBox:'0 0 '+w+' '+h,role:'img','aria-label':'Ranked bar chart of operating expenses by function'},box);
  var maxV=items[0].a;
  items.forEach(function(it,ix){
    var y=padT+ix*rowH, bh=18, by=y+(rowH-bh)/2;
    var bw=Math.max((w-labW-valW-10)*(it.a/maxV),3);
    var lbName=narrow&&it.name==='Sales & Marketing'?'Sales & Mktg':it.name;
    txt(E('text',{x:labW-10,y:by+bh/2+4,'text-anchor':'end','font-size':'12','font-family':'Inter, sans-serif',fill:'var(--text)'},svg),lbName);
    barReveal(E('path',{d:barPathRight(labW,by,bw,bh,4),fill:'var(--data-1)'},svg),ix,'left');
    txt(E('text',{x:labW+bw+8,y:by+bh/2+4,'font-size':'12','font-weight':'600','font-family':'Inter, sans-serif',fill:'var(--text)'},svg),fM(it.a));
    // hit row
    var hit=E('rect',{x:0,y:y,width:w,height:rowH,fill:'transparent',tabindex:'0'},svg);
    var bar=svg.querySelectorAll('path')[ix];
    function show(ev){
      bar.setAttribute('opacity','.78');
      var d=(it.a-it.b)/it.b;
      var r=ev.clientX!=null?{x:ev.clientX,y:ev.clientY}:(function(){var rc=hit.getBoundingClientRect();return {x:rc.left+labW,y:rc.top};})();
      tipShow(r.x,r.y,it.name,[
        {color:'var(--data-1)',name:'Actual',value:fM(it.a)},
        {color:null,name:'Share of opex',value:fPct(it.a/tot)},
        {color:null,name:'vs '+cmpWord().toLowerCase(),value:fPctSign(d)}
      ]);
    }
    function hide(){bar.removeAttribute('opacity');tipHide();}
    hit.addEventListener('pointermove',show);
    hit.addEventListener('pointerleave',hide);
    hit.addEventListener('focus',show);
    hit.addEventListener('blur',hide);
  });
}

/* ============ variance diverging bars ============ */
function renderVar(){
  var box=document.getElementById('var-chart');box.innerHTML='';
  var e=ent(),s=slice();
  var revA=0,revC=0,cogsA=0,cogsC=0;var fnA={},fnC={};
  OPEX_FN.forEach(function(f){fnA[f.key]=0;fnC[f.key]=0;});
  for(var i=s.from;i<N;i++){
    revA+=e.revA[i];revC+=cmpRevAt(e,i);
    cogsA+=e.cogsA[i];cogsC+=cmpCogsAt(e,i);
    OPEX_FN.forEach(function(f){fnA[f.key]+=e.opexA[f.key][i];fnC[f.key]+=cmpOpexFnAt(e,f.key,i);});
  }
  var opxA=0,opxC=0;OPEX_FN.forEach(function(f){opxA+=fnA[f.key];opxC+=fnC[f.key];});
  var rows=[
    {name:'Revenue',fav:revA-revC},
    {name:'COGS',fav:cogsC-cogsA},
    {name:'Gross profit',fav:(revA-cogsA)-(revC-cogsC)}
  ];
  OPEX_FN.forEach(function(f){rows.push({name:f.name,fav:fnC[f.key]-fnA[f.key]});});
  rows.push({name:'EBITDA',fav:(revA-cogsA-opxA)-(revC-cogsC-opxC)});
  // legend
  var lg=document.getElementById('var-legend');lg.innerHTML='';
  [{n:'Favorable',c:'var(--data-1)'},{n:'Unfavorable',c:'var(--warning)'}].forEach(function(o){
    var it=H('span',null,lg);
    var sw=H('span','swd',it);sw.style.background=o.c;
    txt(H('span',null,it),o.n);
  });
  var w=Math.max(box.clientWidth||500,300),rowH=34,labW=Math.min(136,w*0.3),padT=6;
  var h=rows.length*rowH+padT+4;
  var svg=E('svg',{viewBox:'0 0 '+w+' '+h,role:'img','aria-label':'Diverging bar chart of variance versus '+cmpWord().toLowerCase()+' by P&L line'},box);
  var maxV=0;rows.forEach(function(r){if(Math.abs(r.fav)>maxV)maxV=Math.abs(r.fav);});
  if(maxV===0)maxV=1;
  var cx=labW+(w-labW)/2, halfW=(w-labW)/2-70;
  E('line',{x1:cx,x2:cx,y1:padT,y2:h-4,stroke:'var(--line)','stroke-width':'1'},svg);
  rows.forEach(function(r,ix){
    var y=padT+ix*rowH,bh=16,by=y+(rowH-bh)/2;
    var bw=Math.max(halfW*Math.abs(r.fav)/maxV,2);
    var fav=r.fav>=0;
    txt(E('text',{x:labW-10,y:by+bh/2+4,'text-anchor':'end','font-size':'12','font-family':'Inter, sans-serif',fill:'var(--text)'},svg),r.name);
    var path=fav?barPathRight(cx+1,by,bw,bh,4):barPathLeft(cx-1,by,bw,bh,4);
    var bar=E('path',{d:path,fill:fav?'var(--data-1)':'var(--warning)'},svg);barReveal(bar,ix,fav?'left':'right');
    txt(E('text',{x:fav?cx+bw+8:cx-bw-8,y:by+bh/2+4,'text-anchor':fav?'start':'end','font-size':'11.5','font-weight':'600','font-family':'Inter, sans-serif',fill:'var(--text)'},svg),fMsign(r.fav));
    var hit=E('rect',{x:0,y:y,width:w,height:rowH,fill:'transparent',tabindex:'0'},svg);
    function show(ev){
      bar.setAttribute('opacity','.78');
      var p=ev.clientX!=null?{x:ev.clientX,y:ev.clientY}:(function(){var rc=hit.getBoundingClientRect();return {x:rc.left+labW,y:rc.top};})();
      tipShow(p.x,p.y,r.name,[
        {color:fav?'var(--data-1)':'var(--warning)',name:fav?'Favorable':'Unfavorable',value:fMsign(r.fav)},
        {color:null,name:'vs '+cmpWord().toLowerCase(),value:''}
      ]);
    }
    function hide(){bar.removeAttribute('opacity');tipHide();}
    hit.addEventListener('pointermove',show);
    hit.addEventListener('pointerleave',hide);
    hit.addEventListener('focus',show);
    hit.addEventListener('blur',hide);
  });
}

/* ============ table ============ */
function renderTable(){
  var table=document.getElementById('dtable');table.innerHTML='';
  var e=ent(),s=slice();
  var thead=document.createElement('thead');var trh=document.createElement('tr');
  ['Month','Revenue',cmpWord(),'Var %','GM %','Opex','EBITDA'].forEach(function(c){
    var th=document.createElement('th');th.textContent=c;trh.appendChild(th);
  });
  thead.appendChild(trh);table.appendChild(thead);
  var tbody=document.createElement('tbody');
  var tRa=0,tRc=0,tCa=0,tCc=0,tOa=0;
  for(var i=s.from;i<N;i++){
    var ra=e.revA[i],rc=cmpRevAt(e,i),ca=e.cogsA[i],oa=opexTotA(e,i);
    tRa+=ra;tRc+=rc;tCa+=ca;tCc+=cmpCogsAt(e,i);tOa+=oa;
    var tr=document.createElement('tr');
    var cells=[LABELS[i],fM(ra),fM(rc),fPctSign((ra-rc)/rc),fPct((ra-ca)/ra),fM(oa),fM(ra-ca-oa)];
    cells.forEach(function(c,ci){
      var td=document.createElement('td');td.textContent=c;
      if(ci===3)td.className=(ra-rc)>=0?'pos':'neg';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }
  var trt=document.createElement('tr');trt.className='tot';
  [ 'Total',fM(tRa),fM(tRc),fPctSign((tRa-tRc)/tRc),fPct((tRa-tCa)/tRa),fM(tOa),fM(tRa-tCa-tOa)].forEach(function(c,ci){
    var td=document.createElement('td');td.textContent=c;
    if(ci===3)td.className=(tRa-tRc)>=0?'pos':'neg';
    trt.appendChild(td);
  });
  tbody.appendChild(trt);
  table.appendChild(tbody);
}


/* ============ tie-out panel (simulated) ============ */
function renderTie(){
  var box=document.getElementById('tie-list');if(!box)return;box.innerHTML='';
  var e=ent(),s=slice();
  var ents=state.entity==='CONS'?3:1;
  var moves=0;
  for(var i=Math.max(s.from,1);i<N;i++){
    OPEX_FN.forEach(function(f){var a=e.opexA[f.key][i],b=e.opexA[f.key][i-1];if(Math.abs(a-b)/b>0.08)moves++;});
  }
  var rows=[
    ['GL accounts mapped exactly once','186 of 186'],
    ['Totals tie to trial balance','$0.00 variance · '+ents+(ents>1?' entities':' entity')+' × '+s.count+' months'],
    ['Intercompany after eliminations',state.entity==='CONS'?'Nets to $0.00':'Eliminated at group level'],
    ['FX rates and periods','Period-end + average · '+s.count+' months'],
    ['Large month-over-month movements',moves+' of '+moves+' explained']
  ];
  rows.forEach(function(r){
    var li=H('li',null,box);
    var ic=H('span','tick',li);ic.setAttribute('aria-hidden','true');ic.textContent='\u2713';
    txt(H('span','tl',li),r[0]);
    txt(H('b',null,li),r[1]);
  });
}

/* ============ labels + render all ============ */
function renderWords(){
  ['rev-cmp-word','var-cmp-word'].forEach(function(id){document.getElementById(id).textContent=cmpWord();});
  document.getElementById('tbl-cmp-word').textContent=cmpWord().toLowerCase();
  ['rev-ent-word','opex-ent-word','tbl-ent-word'].forEach(function(id){document.getElementById(id).textContent=ENTITY_NAMES[state.entity];});
}
function renderAll(){
  renderWords();renderKPIs();renderRevChart();renderMix();renderOpex();renderVar();renderTable();renderTie();
}

/* ============ wiring ============ */
document.querySelectorAll('.seg button[data-period]').forEach(function(b){
  b.addEventListener('click',function(){
    state.period=parseInt(b.getAttribute('data-period'),10);
    document.querySelectorAll('.seg button[data-period]').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});
    renderAll();
  });
});
document.querySelectorAll('.seg button[data-cmp]').forEach(function(b){
  b.addEventListener('click',function(){
    state.cmp=b.getAttribute('data-cmp');
    document.querySelectorAll('.seg button[data-cmp]').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});
    renderAll();
  });
});
document.getElementById('f-entity').addEventListener('change',function(){
  state.entity=this.value;renderAll();
});
var rsz;
window.addEventListener('resize',function(){
  cancelAnimationFrame(rsz);
  rsz=requestAnimationFrame(function(){renderRevChart();renderOpex();renderVar();renderMix();});
});
renderAll();

/* ============ live sync (simulated) ============ */
var BASE_LAST={};REGIONS.forEach(function(r){BASE_LAST[r.key]={rev:DATA[r.key].revA[N-1],cogs:DATA[r.key].cogsA[N-1]};});
var drift=0,lastSync=Date.now();
function recomputeLast(){
  var i=N-1,c=DATA.CONS;c.revA[i]=0;c.cogsA[i]=0;
  REGIONS.forEach(function(r){c.revA[i]+=DATA[r.key].revA[i];c.cogsA[i]+=DATA[r.key].cogsA[i];});
}
function sync(){
  drift=Math.max(-0.015,Math.min(0.015,drift+(Math.random()-0.45)*0.006));
  REGIONS.forEach(function(r,k){var f=1+drift*(1+k*0.2);DATA[r.key].revA[N-1]=BASE_LAST[r.key].rev*f;DATA[r.key].cogsA[N-1]=BASE_LAST[r.key].cogs*f;});
  recomputeLast();lastSync=Date.now();
  animIn=false;renderKPIs();renderRevChart();renderMix();renderTable();renderVar();animIn=!REDUCE;
  var rows=document.querySelectorAll('#dtable tbody tr');var lr=rows[rows.length-2];if(lr){lr.classList.add('flash');}
  var pill=document.getElementById('live-pill');if(pill){pill.classList.remove('beat');void pill.offsetWidth;pill.classList.add('beat');}
}
(function(){
  var el=document.getElementById('live-ago'),dash=document.getElementById('dashboard'),vis=true,iv=null;
  if(!el)return;
  setInterval(function(){el.textContent=Math.round((Date.now()-lastSync)/1000)+'s ago';},1000);
  if(REDUCE)return;
  if('IntersectionObserver' in window)new IntersectionObserver(function(es){vis=es[0].isIntersecting;},{threshold:0.05}).observe(dash);
  iv=setInterval(function(){if(vis&&!document.hidden)sync();},6000);
})();
})();
