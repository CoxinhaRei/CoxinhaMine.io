(function(root){
 'use strict';
 const SIZE=150000,TILE=1000,VERSION=6;
 const TIERS=['Comum','Incomum','Raro','Épico','Lendário','Mítico','ULTRA','SUPER','ABSOLUT','QUANTIUM'];
 const COLORS=['#99dc83','#f4e38d','#85a9ed','#b492e1','#ed9692','#97d8d3','#e7a4cf','#7ce3ee','#f4f3ed','#75d5ed'];
 const LAYOUTS={
  garden:{seed:117,points:[[0.5,0.5],[0.28,0.67],[0.15,0.35],[0.35,0.15],[0.62,0.18],[0.43,0.86],[0.73,0.84],[0.72,0.51]],absolute:[[0.94,0.48,0.048]],names:['Clareira do Trevo','Canteiros de Mel','Prado das Joaninhas','Bosque da Seda','Jardim das Ruínas','Lagoa de Jade','Vale das Asas','Santuário das Pétalas','Terras de Marfim']},
  beach:{seed:233,points:[[0.5,0.5],[0.3,0.59],[0.15,0.25],[0.37,0.12],[0.63,0.17],[0.18,0.85],[0.48,0.86],[0.73,0.74]],absolute:[[0.94,0.42,0.045]],names:['Refúgio das Marés','Dunas de Conchas','Baía dos Ermitões','Piscinas de Coral','Arcos da Tartaruga','Costa das Pérolas','Falésias Rosadas','Enseada do Relâmpago','Costa do Alabastro']},
  jungle:{seed:359,points:[[0.5,0.5],[0.34,0.35],[0.13,0.18],[0.15,0.52],[0.16,0.85],[0.44,0.84],[0.73,0.84],[0.68,0.22]],absolute:[[0.93,0.49,0.042]],names:['Refúgio Verde','Trilha do Orvalho','Terra das Libélulas','Ruínas Enraizadas','Pântano das Mandíbulas','Bosque do Crepúsculo','Vale das Orquídeas','Templo das Tormentas','Dossel de Marfim']},
  ice:{seed:487,points:[[0.5,0.5],[0.32,0.55],[0.13,0.35],[0.16,0.79],[0.44,0.87],[0.72,0.82],[0.38,0.15],[0.68,0.2]],absolute:[[0.94,0.49,0.048]],names:['Refúgio da Aurora','Trilha da Geada','Lago dos Besouros','Bosque Violeta','Geleira do Poente','Salão das Auroras','Cristais de Inverno','Fenda da Nevasca','Planície do Infinito']},
  desert:{seed:619,points:[[0.5,0.5],[0.3,0.64],[0.13,0.83],[0.14,0.43],[0.25,0.13],[0.55,0.14],[0.48,0.87],[0.73,0.72]],absolute:[[0.93,0.36,0.042]],names:['Refúgio das Dunas','Trilha dos Escaravelhos','Oásis Esquecido','Ruínas de Ametista','Cânion do Escorpião','Dunas de Turquesa','Vale das Miragens','Olho da Tempestade','Deserto de Sal Branco']},
  cave:{seed:751,points:[[0.025,0.045],[0.28,0.15],[0.5,0.14],[0.15,0.44],[0.43,0.42],[0.17,0.8],[0.47,0.83],[0.7,0.75]],absolute:[[0.92,0.36,0.045]],names:['Entrada do Labirinto','Galeria de Âmbar','Túneis de Cobalto','Abismo Violeta','Salão Rubro','Galeria Submersa','Fenda dos Ecos','Câmara da Ressonância','Profundezas de Marfim']}
 };
 for(const layout of Object.values(LAYOUTS))layout.names.push('Núcleo Quantium');
 for(const layout of Object.values(LAYOUTS))layout.names.push('Núcleo Quantium');
 const STYLES={garden:{name:'Clareiras floridas',shape:'petal',sx:1,sy:1,path:1800,diagonal:true},beach:{name:'Enseadas e bancos de areia',shape:'shore',sx:1.35,sy:.72,path:2100,diagonal:false},jungle:{name:'Raízes e trilhas do dossel',shape:'roots',sx:1.05,sy:.96,path:1750,diagonal:true},ice:{name:'Salões e fendas de gelo',shape:'hex',sx:1.12,sy:.92,path:2000,diagonal:false},desert:{name:'Cânions e dunas curvas',shape:'crescent',sx:1.26,sy:.86,path:1900,diagonal:true},cave:{name:'Labirinto das profundezas',shape:'maze'}};
 const cache=new Map(),dimensions=realm=>({width:realm==='cave'?SIZE*2:SIZE,height:SIZE});
 const spawn=realm=>realm==='cave'?{x:750,y:750}:{x:SIZE/2,y:SIZE/2};
 function random(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
 function build(realm='garden'){
  if(cache.has(realm))return cache.get(realm);
  const layout=LAYOUTS[realm]||LAYOUTS.garden,d=dimensions(realm),cols=d.width/TILE,rows=d.height/TILE,open=new Uint8Array(cols*rows),tiers=new Uint8Array(cols*rows),rng=random(layout.seed);
  const points=layout.points.map(([x,y],tier)=>({x:x*d.width,y:y*d.height,tier,radius:(realm==='cave'?.075+tier*.01:.048+tier*.005)*SIZE}));
  const [ax,ay,weight]=layout.absolute[0],sites=[...points.map(p=>({x:p.x/d.width,y:p.y/d.height,tier:p.tier,weight:0})),{x:ax,y:ay,tier:8,weight}];
  // Every tile belongs to its nearest territory. There is no fallback rarity.
  // A shared gentle horizontal shear bends the borders without making islands.
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
   const px=(x+.5)/cols,py=(y+.5)/rows,warpedX=px+.012*Math.sin(py*7+layout.seed);let best=Infinity,tier=0;
   for(const site of sites){const sx=site.x+.012*Math.sin(site.y*7+layout.seed),score=(warpedX-sx)**2+(py-site.y)**2-site.weight;if(score<best){best=score;tier=site.tier;}}
   tiers[y*cols+x]=tier;open[y*cols+x]=realm==='cave'||(x>0&&y>0&&x<cols-1&&y<rows-1)?1:0;
  }
  // An inset of the existing Absolut territory, never a new global layer.
  const quantum={x:(ax-.065)*d.width,y:ay*d.height,tier:9,radius:12500};
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const i=y*cols+x;if(tiers[i]===8&&Math.hypot((x+.5)*TILE-quantum.x,(y+.5)*TILE-quantum.y)<=quantum.radius)tiers[i]=9;}
  points.push(quantum);
  if(realm!=='cave'){
   // Small rocks live inside colored territories; no dark moat separates them.
   const portals=Array.from({length:5},(_,n)=>{const a=-Math.PI/2+n*Math.PI*2/5;return {x:SIZE/2+Math.cos(a)*SIZE*.34,y:SIZE/2+Math.sin(a)*SIZE*.34};});
   const protectedPlaces=[...points,...portals,{x:SIZE-2000,y:2000}];
   for(let n=0;n<30;n++){
    const x=4000+rng()*(SIZE-8000),y=4000+rng()*(SIZE-8000),r=700+rng()*900;
    if(Math.hypot(x-quantum.x,y-quantum.y)<quantum.radius+r+1000||Math.hypot(x-SIZE/2,y-SIZE/2)<12000||protectedPlaces.some(p=>Math.hypot(x-p.x,y-p.y)<r+5000))continue;
    for(let gy=Math.max(1,Math.floor((y-r)/TILE));gy<=Math.min(rows-2,Math.ceil((y+r)/TILE));gy++)for(let gx=Math.max(1,Math.floor((x-r)/TILE));gx<=Math.min(cols-2,Math.ceil((x+r)/TILE));gx++){const i=gy*cols+gx;if(Math.hypot((gx+.5)*TILE-x,(gy+.5)*TILE-y)<r&&[i-1,i+1,i-cols,i+cols].every(j=>tiers[j]===tiers[i]))open[i]=0;}
   }
  }
  // Regional walls follow the actual shared borders. One or more wide gates
  // connect every adjacent pair; grass and rarity ownership do not change.
  const borders=new Map();
  for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++){
   const i=y*cols+x;for(const [dx,dy] of [[1,0],[0,1]]){const j=i+dy*cols+dx;if(tiers[i]===tiers[j])continue;const a=Math.min(tiers[i],tiers[j]),b=Math.max(tiers[i],tiers[j]),key=a+':'+b;if(!borders.has(key))borders.set(key,[]);borders.get(key).push({a,b,x:(x+.5+dx*.5)*TILE,y:(y+.5+dy*.5)*TILE,nx:dx,ny:dy});open[i]=0;open[j]=0;}
  }
  const gates=[];
  function clearCircle(x,y,r){for(let gy=Math.max(1,Math.floor((y-r)/TILE));gy<=Math.min(rows-2,Math.ceil((y+r)/TILE));gy++)for(let gx=Math.max(1,Math.floor((x-r)/TILE));gx<=Math.min(cols-2,Math.ceil((x+r)/TILE));gx++)if(Math.hypot((gx+.5)*TILE-x,(gy+.5)*TILE-y)<=r)open[gy*cols+gx]=1;}
  for(const [pair,edges] of borders){
   const inner=edges.filter(e=>{if(e.x<4000||e.y<4000||e.x>d.width-4000||e.y>d.height-4000)return false;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const tier=tiers[(Math.floor(e.y/TILE)+dy)*cols+Math.floor(e.x/TILE)+dx];if(tier!==e.a&&tier!==e.b)return false;}return true;});
   const candidates=inner.length?inner:edges,count=edges.length>32?2:1;
   for(let n=0;n<count;n++){const e=candidates[Math.min(candidates.length-1,Math.floor(candidates.length*(n+1)/(count+1)))],gate={...e,id:'gate-'+pair.replace(':','-')+'-'+n,radius:2400};if(gates.some(g=>g.a===e.a&&g.b===e.b&&Math.hypot(g.x-e.x,g.y-e.y)<4500))continue;clearCircle(gate.x,gate.y,gate.radius);gates.push(gate);}
  }
  const arrival=spawn(realm);clearCircle(arrival.x,arrival.y,1800);
  for(const p of points)if(!open[Math.floor(p.y/TILE)*cols+Math.floor(p.x/TILE)]){let nearest;for(const edges of borders.values())for(const e of edges)if((e.a===p.tier||e.b===p.tier)&&(!nearest||Math.hypot(e.x-p.x,e.y-p.y)<Math.hypot(nearest.x-p.x,nearest.y-p.y)))nearest=e;if(nearest){const gate={...nearest,id:'gate-landmark-'+p.tier,radius:2400};clearCircle(gate.x,gate.y,gate.radius);gates.push(gate);}}
  if(realm!=='cave')for(let n=0;n<5;n++){const a=-Math.PI/2+n*Math.PI*2/5;clearCircle(SIZE/2+Math.cos(a)*SIZE*.34,SIZE/2+Math.sin(a)*SIZE*.34,1600);}
  if(realm==='garden')clearCircle(SIZE-2000,2000,1200);
  if(realm!=='cave'){
   // Clearings are cut inside the existing territories. Unused land stays wall,
   // never an implicit white region; corridors preserve the shared border gates.
   const style=STYLES[realm],old=open.slice(),floor=new Uint8Array(open.length),home=Math.floor(arrival.y/TILE)*cols+Math.floor(arrival.x/TILE),parents=new Int32Array(open.length).fill(-1),q=[home];parents[home]=home;
   const directions=style.diagonal?[[1,1],[-1,-1],[1,-1],[-1,1],[1,0],[-1,0],[0,1],[0,-1]]:realm==='ice'?[[0,1],[0,-1],[1,0],[-1,0]]:[[1,0],[-1,0],[0,1],[0,-1]];
   for(let n=0;n<q.length;n++){const i=q[n],x=i%cols,y=Math.floor(i/cols);for(const [dx,dy] of directions){if(dx&&dy&&(!old[i+dx]||!old[i+dy*cols]))continue;const xx=x+dx,yy=y+dy,j=yy*cols+xx;if(xx>=0&&yy>=0&&xx<cols&&yy<rows&&old[j]&&parents[j]<0){parents[j]=i;q.push(j);}}}
   function paint(x,y,r,tier){for(let gy=Math.max(1,Math.floor((y-r)/TILE));gy<=Math.min(rows-2,Math.ceil((y+r)/TILE));gy++)for(let gx=Math.max(1,Math.floor((x-r)/TILE));gx<=Math.min(cols-2,Math.ceil((x+r)/TILE));gx++){const i=gy*cols+gx;if(old[i]&&(tier===undefined||tiers[i]===tier)&&Math.hypot((gx+.5)*TILE-x,(gy+.5)*TILE-y)<=r)floor[i]=1;}}
   const chambers=[...points.map(p=>({...p,r:p.tier===0?14500:10500+p.tier*650})),{x:ax*d.width,y:ay*d.height,tier:8,r:36000}];
   for(const p of chambers){const sx=p.tier===8?1:style.sx,sy=p.tier===8?1:style.sy,angle=p.tier===8?0:Math.sin(p.tier+layout.seed)*.3,ca=Math.cos(angle),sa=Math.sin(angle),extent=p.r*1.8;
    for(let gy=Math.max(1,Math.floor((p.y-extent)/TILE));gy<=Math.min(rows-2,Math.ceil((p.y+extent)/TILE));gy++)for(let gx=Math.max(1,Math.floor((p.x-extent)/TILE));gx<=Math.min(cols-2,Math.ceil((p.x+extent)/TILE));gx++){const i=gy*cols+gx;if(!old[i]||tiers[i]!==p.tier)continue;const dx=((gx+.5)*TILE-p.x)/p.r,dy=((gy+.5)*TILE-p.y)/p.r,x=(dx*ca+dy*sa)/sx,y=(-dx*sa+dy*ca)/sy,a=Math.atan2(y,x),d=Math.hypot(x,y);let inside;
     if(style.shape==='hex')inside=Math.max(Math.abs(x)*.866+Math.abs(y)*.5,Math.abs(y))<1;
     else if(style.shape==='crescent')inside=d<1+.12*Math.sin(a*2+p.tier)&&Math.hypot(x-.78,y+.12)>.3;
     else inside=d<1+(style.shape==='roots'?.23:style.shape==='shore'?.17:.13)*Math.sin(a*(style.shape==='roots'?4:style.shape==='shore'?3:5)+p.tier);
     if(inside)floor[i]=1;
    }
    paint(p.x,p.y,3600,p.tier);
    if(style.shape==='roots')for(let n=0;n<4;n++){const a=n*Math.PI/2+p.tier*.6;paint(p.x+Math.cos(a)*p.r*.8,p.y+Math.sin(a)*p.r*.8,p.r*.33,p.tier);}
   }
   const places=[...chambers,...gates,...Array.from({length:5},(_,n)=>{const a=-Math.PI/2+n*Math.PI*2/5;return {x:SIZE/2+Math.cos(a)*SIZE*.34,y:SIZE/2+Math.sin(a)*SIZE*.34};})];if(realm==='garden')places.push({x:SIZE-2000,y:2000});
   for(const p of places){let i=Math.floor(p.y/TILE)*cols+Math.floor(p.x/TILE);if(parents[i]<0){let best=Infinity;for(const j of q){const d=((j%cols+.5)*TILE-p.x)**2+((Math.floor(j/cols)+.5)*TILE-p.y)**2;if(d<best){best=d;i=j;}}}for(let n=0;n<old.length&&i!==home&&parents[i]>=0;n++){paint((i%cols+.5)*TILE,(Math.floor(i/cols)+.5)*TILE,style.path);i=parents[i];}paint(p.x,p.y,1900);}
   paint(quantum.x,quantum.y,quantum.radius-1000,9);paint(arrival.x,arrival.y,2500);open.set(floor);
  }
  // Remove only tiny floor fragments clipped off at wall junctions.
  const start=Math.floor(arrival.y/TILE)*cols+Math.floor(arrival.x/TILE),seen=new Uint8Array(open.length),queue=[start];seen[start]=1;
  for(let n=0;n<queue.length;n++){const i=queue[n],x=i%cols,y=Math.floor(i/cols);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,j=yy*cols+xx;if(xx>=0&&yy>=0&&xx<cols&&yy<rows&&open[j]&&!seen[j]){seen[j]=1;queue.push(j);}}}
  for(let n=0;n<open.length;n++)if(!seen[n])open[n]=0;
  const result={realm,version:VERSION,style:STYLES[realm].name,...d,cols,rows,tile:TILE,open,tiers,points,gates,names:layout.names,quantum};cache.set(realm,result);return result;
 }
 function at(realm,x,y){const map=build(realm),gx=Math.floor(x/TILE),gy=Math.floor(y/TILE),index=gy*map.cols+gx,tier=gx<0||gy<0||gx>=map.cols||gy>=map.rows?0:map.tiers[index],s=spawn(realm),safe=realm==='cave'?x<2000&&y<2000:Math.hypot(x-s.x,y-s.y)<1200;return {tier,rarity:TIERS[tier],name:safe?(realm==='garden'?'Praça central':realm==='cave'?'Entrada do Labirinto':'Refúgio · '+({beach:'Praia',jungle:'Jungle',ice:'Floresta de Gelo',desert:'Deserto'}[realm]||'Jardim')):map.names[tier],color:COLORS[tier],safe,open:gx>=0&&gy>=0&&gx<map.cols&&gy<map.rows&&!!map.open[index]};}
 function blocked(realm,x,y,radius=0){const m=build(realm);for(let gy=Math.floor((y-radius)/TILE);gy<=Math.floor((y+radius)/TILE);gy++)for(let gx=Math.floor((x-radius)/TILE);gx<=Math.floor((x+radius)/TILE);gx++){if(gx>=0&&gy>=0&&gx<m.cols&&gy<m.rows&&m.open[gy*m.cols+gx])continue;const nx=Math.max(gx*TILE,Math.min((gx+1)*TILE,x)),ny=Math.max(gy*TILE,Math.min((gy+1)*TILE,y));if(Math.hypot(nx-x,ny-y)<=radius)return true;}return false;}
 function roll(realm,x,y,random=Math.random){const r=at(realm,x,y);if(r.safe||!r.open)return -1;return rollTier(r.tier,random);}
 function rollTier(tier,random=Math.random){const n=random();if(tier===9)return n<.03?10:n<.63?9:8;if(tier===8)return n<.01?9:n<.21?7:8;if(tier===7)return n<.84?7:6;return n<.84?tier:Math.max(0,tier-1);}
 function pool(realm,tier){const base={garden:[['ladybug','ant','caterpillar'],['bee','ladybug'],['beetle','bee'],['spider','ant'],['centipede','beetle','caterpillar'],['bee','spider','caterpillar'],['centipede','spider'],['beetle','bee'],['ladybug','beetle','centipede']],beach:[['hermit'],['crab'],['turtle'],['hermit','crab'],['turtle','crab'],['hermit','turtle'],['crab','turtle'],['turtle','hermit'],['crab','hermit','turtle']],jungle:[['frog'],['dragonfly'],['mantis'],['spider'],['mantis','frog'],['dragonfly','spider'],['mantis','spider'],['frog','mantis'],['mantis','dragonfly','frog','spider']],ice:[['icebeetle'],['snowmoth'],['icebeetle'],['snowmoth'],['icebeetle','snowmoth'],['iceTornado'],['snowmoth','iceTornado'],['icebeetle','iceTornado'],['icebeetle','snowmoth','iceTornado']],desert:[['scarab'],['scorpion'],['scarab'],['scorpion'],['sandTornado'],['scarab','sandTornado'],['scorpion','sandTornado'],['scarab','scorpion'],['scarab','scorpion','sandTornado']]};const pool=realm==='cave'?['guardian']:(base[realm]||base.garden)[Math.max(0,Math.min(8,tier))],kind=(typeof module!=='undefined'&&module.exports?require('./rooted-catalog'):root.ROOTED_CATALOG).kindFor(realm);return kind?[...pool,...pool,...pool,kind]:pool;}
 const api={STYLES,SIZE,TILE,VERSION,TIERS,COLORS,LAYOUTS,dimensions,spawn,build,at,blocked,roll,rollTier,pool};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MAP_ATLAS=api;
})(typeof globalThis!=='undefined'?globalThis:this);
