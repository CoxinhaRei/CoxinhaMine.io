(function(root){
 'use strict';
 const SIZE=150000,TILE=1000,VERSION=1;
 const TIERS=['Comum','Incomum','Raro','Épico','Lendário','Mítico','ULTRA','SUPER','ABSOLUT'];
 const COLORS=['#99dc83','#f4e38d','#85a9ed','#b492e1','#ed9692','#97d8d3','#e7a4cf','#7ce3ee','#f4f3ed'];
 const LAYOUTS={
  garden:{seed:117,points:[[.50,.50],[.40,.42],[.28,.45],[.22,.28],[.39,.21],[.55,.28],[.32,.65],[.48,.75]],absolute:[[.76,.27,.20],[.77,.72,.23],[.21,.81,.14]],names:['Clareira do Trevo','Canteiros de Mel','Prado das Joaninhas','Bosque da Seda','Jardim das Ruínas','Lagoa de Jade','Vale das Asas','Santuário das Pétalas','Terras de Marfim']},
  beach:{seed:233,points:[[.50,.50],[.39,.58],[.24,.58],[.20,.38],[.35,.25],[.52,.25],[.50,.77],[.69,.48]],absolute:[[.78,.23,.19],[.80,.78,.19],[.20,.81,.16]],names:['Refúgio das Marés','Dunas de Conchas','Baía dos Ermitões','Piscinas de Coral','Arcos da Tartaruga','Costa das Pérolas','Falésias Rosadas','Enseada do Relâmpago','Costa do Alabastro']},
  jungle:{seed:359,points:[[.50,.50],[.48,.39],[.34,.30],[.19,.23],[.20,.48],[.24,.69],[.43,.80],[.63,.70]],absolute:[[.77,.23,.20],[.82,.60,.17],[.70,.87,.13]],names:['Refúgio Verde','Trilha do Orvalho','Terra das Libélulas','Ruínas Enraizadas','Pântano das Mandíbulas','Bosque do Crepúsculo','Vale das Orquídeas','Templo das Tormentas','Dossel de Marfim']},
  ice:{seed:487,points:[[.50,.50],[.39,.47],[.26,.56],[.18,.77],[.40,.81],[.57,.72],[.40,.27],[.22,.20]],absolute:[[.75,.22,.20],[.80,.65,.22],[.70,.86,.13]],names:['Refúgio da Aurora','Trilha da Geada','Lago dos Besouros','Bosque Violeta','Geleira do Poente','Salão das Auroras','Cristais de Inverno','Fenda da Nevasca','Planície do Infinito']},
  desert:{seed:619,points:[[.50,.50],[.41,.57],[.27,.65],[.19,.44],[.25,.22],[.47,.22],[.63,.34],[.47,.80]],absolute:[[.80,.20,.16],[.81,.69,.22],[.23,.85,.13]],names:['Refúgio das Dunas','Trilha dos Escaravelhos','Oásis Esquecido','Ruínas de Ametista','Cânion do Escorpião','Dunas de Turquesa','Vale das Miragens','Olho da Tempestade','Deserto de Sal Branco']},
  cave:{seed:751,points:[[.025,.045],[.09,.10],[.17,.14],[.25,.25],[.14,.42],[.30,.49],[.24,.73],[.43,.70]],absolute:[],names:['Entrada do Labirinto','Galeria de Âmbar','Túneis de Cobalto','Abismo Violeta','Salão Rubro','Galeria Submersa','Fenda dos Ecos','Câmara da Ressonância','Profundezas de Marfim']}
 };
 const cache=new Map(),dimensions=realm=>({width:realm==='cave'?SIZE*2:SIZE,height:SIZE});
 const spawn=realm=>realm==='cave'?{x:750,y:750}:{x:SIZE/2,y:SIZE/2};
 function random(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
 function build(realm='garden'){
  if(cache.has(realm))return cache.get(realm);
  const layout=LAYOUTS[realm]||LAYOUTS.garden,d=dimensions(realm),cols=d.width/TILE,rows=d.height/TILE,open=new Uint8Array(cols*rows),tiers=new Uint8Array(cols*rows),rng=random(layout.seed);
  const points=layout.points.map(([x,y],tier)=>({x:x*d.width,y:y*d.height,tier,radius:(realm==='cave'?.075+tier*.01:.048+tier*.005)*SIZE}));
  function disk(x,y,r){for(let gy=Math.max(1,Math.floor((y-r)/TILE));gy<=Math.min(rows-2,Math.ceil((y+r)/TILE));gy++)for(let gx=Math.max(1,Math.floor((x-r)/TILE));gx<=Math.min(cols-2,Math.ceil((x+r)/TILE));gx++)if(Math.hypot((gx+.5)*TILE-x,(gy+.5)*TILE-y)<r)open[gy*cols+gx]=1;}
  function path(a,b,width=3300){const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)||1,bend=(rng()-.5)*length*.65,n=Math.ceil(length/500);for(let i=0;i<=n;i++){const t=i/n,offset=Math.sin(t*Math.PI)*bend;disk(a.x+dx*t-dy/length*offset,a.y+dy*t+dx/length*offset,width);}}
  if(realm!=='cave'){
   for(const p of points){for(let n=0;n<12;n++){const a=n*Math.PI/6,r=p.radius*(.78+.14*Math.sin(n*1.7+layout.seed));disk(p.x+Math.cos(a)*p.radius*.25,p.y+Math.sin(a)*p.radius*.25,r);}}
   for(let n=1;n<points.length;n++)path(points[n-1],points[n],2600+n*80);
   path(points[2],points[6]);path(points[5],points[0]);
   const absolutes=layout.absolute.map(([x,y,r])=>({x:x*d.width,y:y*d.height,r:r*SIZE}));
   for(const p of absolutes)for(let n=0;n<12;n++){const a=n*Math.PI/6;disk(p.x+Math.cos(a)*p.r*.26,p.y+Math.sin(a)*p.r*.26,p.r*(.74+.12*Math.sin(n*1.7+layout.seed)));}
   path(points[5],absolutes[0],4500);path(absolutes[0],absolutes[1],5200);path(points[7],absolutes[1],4200);path(points[6],absolutes[2]||absolutes[1],4000);
   // Every distant portal has an actual route, not an isolated minimap marker.
   for(let n=0;n<5;n++){const a=-Math.PI/2+n*Math.PI*2/5,p={x:SIZE/2+Math.cos(a)*SIZE*.34,y:SIZE/2+Math.sin(a)*SIZE*.34};const nearest=[...points,...absolutes].sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];path(nearest,p,3000);disk(p.x,p.y,3200);}
   if(realm==='garden')path(absolutes[0],{x:SIZE-2000,y:2000},3300);
   // Keep the city, introductory scenery and the desert forger accessible.
   disk(SIZE/2,SIZE/2,8500);
   // Thickets, reefs, glaciers and sandstone islands make the great territories
   // navigable networks with multiple routes, rather than empty circular arenas.
   for(const p of absolutes)for(let n=0;n<13;n++){
    const a=rng()*Math.PI*2,d=p.r*(.12+rng()*.61),x=p.x+Math.cos(a)*d,y=p.y+Math.sin(a)*d,r=1800+rng()*2000;
    for(let gy=Math.max(1,Math.floor((y-r)/TILE));gy<=Math.min(rows-2,Math.ceil((y+r)/TILE));gy++)for(let gx=Math.max(1,Math.floor((x-r)/TILE));gx<=Math.min(cols-2,Math.ceil((x+r)/TILE));gx++)if(Math.hypot((gx+.5)*TILE-x,(gy+.5)*TILE-y)<r)open[gy*cols+gx]=0;
   }
   for(let n=0;n<5;n++){const a=-Math.PI/2+n*Math.PI*2/5;disk(SIZE/2+Math.cos(a)*SIZE*.34,SIZE/2+Math.sin(a)*SIZE*.34,3200);}
   const start=Math.floor(SIZE/2/TILE)*cols+Math.floor(SIZE/2/TILE),seen=new Uint8Array(open.length),queue=[start];seen[start]=1;
   for(let n=0;n<queue.length;n++){const i=queue[n],x=i%cols,y=Math.floor(i/cols);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,j=yy*cols+xx;if(xx>=0&&yy>=0&&xx<cols&&yy<rows&&open[j]&&!seen[j]){seen[j]=1;queue.push(j);}}}
   for(let n=0;n<open.length;n++)if(!seen[n])open[n]=0;
  }else open.fill(1); // Cave walls come from the shared deterministic maze.
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
   const px=(x+.5)*TILE,py=(y+.5)*TILE;let best=Infinity,tier=8;
   for(const p of points){const warp=1+.09*Math.sin(px/4100+layout.seed)+.07*Math.sin(py/5300-layout.seed),score=Math.hypot(px-p.x,py-p.y)/(p.radius*warp);if(score<1.15&&score<best){best=score;tier=p.tier;}}
   tiers[y*cols+x]=tier;
  }
  const result={realm,version:VERSION,...d,cols,rows,tile:TILE,open,tiers,points,names:layout.names};cache.set(realm,result);return result;
 }
 function at(realm,x,y){const map=build(realm),gx=Math.floor(x/TILE),gy=Math.floor(y/TILE),index=gy*map.cols+gx,tier=gx<0||gy<0||gx>=map.cols||gy>=map.rows?8:map.tiers[index],s=spawn(realm),safe=realm==='cave'?x<2000&&y<2000:Math.hypot(x-s.x,y-s.y)<1200;return {tier,rarity:TIERS[tier],name:safe?(realm==='garden'?'Praça central':realm==='cave'?'Entrada do Labirinto':'Refúgio · '+({beach:'Praia',jungle:'Jungle',ice:'Floresta de Gelo',desert:'Deserto'}[realm]||'Jardim')):map.names[tier],color:COLORS[tier],safe,open:gx>=0&&gy>=0&&gx<map.cols&&gy<map.rows&&!!map.open[index]};}
 function blocked(realm,x,y,radius=0){if(realm==='cave')return false;const m=build(realm);for(let gy=Math.floor((y-radius)/TILE);gy<=Math.floor((y+radius)/TILE);gy++)for(let gx=Math.floor((x-radius)/TILE);gx<=Math.floor((x+radius)/TILE);gx++){if(gx>=0&&gy>=0&&gx<m.cols&&gy<m.rows&&m.open[gy*m.cols+gx])continue;const nx=Math.max(gx*TILE,Math.min((gx+1)*TILE,x)),ny=Math.max(gy*TILE,Math.min((gy+1)*TILE,y));if(Math.hypot(nx-x,ny-y)<=radius)return true;}return false;}
 function roll(realm,x,y,random=Math.random){const r=at(realm,x,y);if(r.safe)return -1;return rollTier(r.tier,random);}
 function rollTier(tier,random=Math.random){const n=random();if(tier===8)return n<.01?9:n<.21?7:8;if(tier===7)return n<.84?7:6;return n<.84?tier:Math.max(0,tier-1);}
 function pool(realm,tier){const base={garden:[['ladybug','ant'],['bee','ladybug'],['beetle','bee'],['spider','ant'],['centipede','beetle'],['bee','spider'],['centipede','spider'],['beetle','bee'],['ladybug','beetle','centipede']],beach:[['hermit'],['crab'],['turtle'],['hermit','crab'],['turtle','crab'],['hermit','turtle'],['crab','turtle'],['turtle','hermit'],['crab','hermit','turtle']],jungle:[['frog'],['dragonfly'],['mantis'],['spider'],['mantis','frog'],['dragonfly','spider'],['mantis','spider'],['frog','mantis'],['mantis','dragonfly','frog','spider']],ice:[['icebeetle'],['snowmoth'],['icebeetle'],['snowmoth'],['icebeetle','snowmoth'],['iceTornado'],['snowmoth','iceTornado'],['icebeetle','iceTornado'],['icebeetle','snowmoth','iceTornado']],desert:[['scarab'],['scorpion'],['scarab'],['scorpion'],['sandTornado'],['scarab','sandTornado'],['scorpion','sandTornado'],['scarab','scorpion'],['scarab','scorpion','sandTornado']]};return realm==='cave'?['guardian']:(base[realm]||base.garden)[Math.max(0,Math.min(8,tier))];}
 const api={SIZE,TILE,VERSION,TIERS,COLORS,LAYOUTS,dimensions,spawn,build,at,blocked,roll,rollTier,pool};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MAP_ATLAS=api;
})(typeof globalThis!=='undefined'?globalThis:this);
