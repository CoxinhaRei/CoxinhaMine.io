(function(root){
 'use strict';
 const SIZE=150000,TILE=1000,VERSION=2;
 const TIERS=['Comum','Incomum','Raro','Épico','Lendário','Mítico','ULTRA','SUPER','ABSOLUT'];
 const COLORS=['#99dc83','#f4e38d','#85a9ed','#b492e1','#ed9692','#97d8d3','#e7a4cf','#7ce3ee','#f4f3ed'];
 const LAYOUTS={
  garden:{seed:117,points:[[0.5,0.5],[0.28,0.67],[0.15,0.35],[0.35,0.15],[0.62,0.18],[0.43,0.86],[0.73,0.84],[0.72,0.51]],absolute:[[0.94,0.48,0.048]],names:['Clareira do Trevo','Canteiros de Mel','Prado das Joaninhas','Bosque da Seda','Jardim das Ruínas','Lagoa de Jade','Vale das Asas','Santuário das Pétalas','Terras de Marfim']},
  beach:{seed:233,points:[[0.5,0.5],[0.3,0.59],[0.15,0.25],[0.37,0.12],[0.63,0.17],[0.18,0.85],[0.48,0.86],[0.73,0.74]],absolute:[[0.94,0.42,0.045]],names:['Refúgio das Marés','Dunas de Conchas','Baía dos Ermitões','Piscinas de Coral','Arcos da Tartaruga','Costa das Pérolas','Falésias Rosadas','Enseada do Relâmpago','Costa do Alabastro']},
  jungle:{seed:359,points:[[0.5,0.5],[0.34,0.35],[0.13,0.18],[0.15,0.52],[0.16,0.85],[0.44,0.84],[0.73,0.84],[0.68,0.22]],absolute:[[0.93,0.49,0.042]],names:['Refúgio Verde','Trilha do Orvalho','Terra das Libélulas','Ruínas Enraizadas','Pântano das Mandíbulas','Bosque do Crepúsculo','Vale das Orquídeas','Templo das Tormentas','Dossel de Marfim']},
  ice:{seed:487,points:[[0.5,0.5],[0.32,0.55],[0.13,0.35],[0.16,0.79],[0.44,0.87],[0.72,0.82],[0.38,0.15],[0.68,0.2]],absolute:[[0.94,0.49,0.048]],names:['Refúgio da Aurora','Trilha da Geada','Lago dos Besouros','Bosque Violeta','Geleira do Poente','Salão das Auroras','Cristais de Inverno','Fenda da Nevasca','Planície do Infinito']},
  desert:{seed:619,points:[[0.5,0.5],[0.3,0.64],[0.13,0.83],[0.14,0.43],[0.25,0.13],[0.55,0.14],[0.48,0.87],[0.73,0.72]],absolute:[[0.93,0.36,0.042]],names:['Refúgio das Dunas','Trilha dos Escaravelhos','Oásis Esquecido','Ruínas de Ametista','Cânion do Escorpião','Dunas de Turquesa','Vale das Miragens','Olho da Tempestade','Deserto de Sal Branco']},
  cave:{seed:751,points:[[0.025,0.045],[0.28,0.15],[0.5,0.14],[0.15,0.44],[0.43,0.42],[0.17,0.8],[0.47,0.83],[0.7,0.75]],absolute:[[0.92,0.36,0.045]],names:['Entrada do Labirinto','Galeria de Âmbar','Túneis de Cobalto','Abismo Violeta','Salão Rubro','Galeria Submersa','Fenda dos Ecos','Câmara da Ressonância','Profundezas de Marfim']}
 };
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
  if(realm!=='cave'){
   // Small rocks live inside colored territories; no dark moat separates them.
   const portals=Array.from({length:5},(_,n)=>{const a=-Math.PI/2+n*Math.PI*2/5;return {x:SIZE/2+Math.cos(a)*SIZE*.34,y:SIZE/2+Math.sin(a)*SIZE*.34};});
   const protectedPlaces=[...points,...portals,{x:SIZE-2000,y:2000}];
   for(let n=0;n<30;n++){
    const x=4000+rng()*(SIZE-8000),y=4000+rng()*(SIZE-8000),r=700+rng()*900;
    if(Math.hypot(x-SIZE/2,y-SIZE/2)<12000||protectedPlaces.some(p=>Math.hypot(x-p.x,y-p.y)<r+5000))continue;
    for(let gy=Math.max(1,Math.floor((y-r)/TILE));gy<=Math.min(rows-2,Math.ceil((y+r)/TILE));gy++)for(let gx=Math.max(1,Math.floor((x-r)/TILE));gx<=Math.min(cols-2,Math.ceil((x+r)/TILE));gx++){const i=gy*cols+gx;if(Math.hypot((gx+.5)*TILE-x,(gy+.5)*TILE-y)<r&&[i-1,i+1,i-cols,i+cols].every(j=>tiers[j]===tiers[i]))open[i]=0;}
   }
  }
  const result={realm,version:VERSION,...d,cols,rows,tile:TILE,open,tiers,points,names:layout.names};cache.set(realm,result);return result;
 }
 function at(realm,x,y){const map=build(realm),gx=Math.floor(x/TILE),gy=Math.floor(y/TILE),index=gy*map.cols+gx,tier=gx<0||gy<0||gx>=map.cols||gy>=map.rows?0:map.tiers[index],s=spawn(realm),safe=realm==='cave'?x<2000&&y<2000:Math.hypot(x-s.x,y-s.y)<1200;return {tier,rarity:TIERS[tier],name:safe?(realm==='garden'?'Praça central':realm==='cave'?'Entrada do Labirinto':'Refúgio · '+({beach:'Praia',jungle:'Jungle',ice:'Floresta de Gelo',desert:'Deserto'}[realm]||'Jardim')):map.names[tier],color:COLORS[tier],safe,open:gx>=0&&gy>=0&&gx<map.cols&&gy<map.rows&&!!map.open[index]};}
 function blocked(realm,x,y,radius=0){if(realm==='cave')return false;const m=build(realm);for(let gy=Math.floor((y-radius)/TILE);gy<=Math.floor((y+radius)/TILE);gy++)for(let gx=Math.floor((x-radius)/TILE);gx<=Math.floor((x+radius)/TILE);gx++){if(gx>=0&&gy>=0&&gx<m.cols&&gy<m.rows&&m.open[gy*m.cols+gx])continue;const nx=Math.max(gx*TILE,Math.min((gx+1)*TILE,x)),ny=Math.max(gy*TILE,Math.min((gy+1)*TILE,y));if(Math.hypot(nx-x,ny-y)<=radius)return true;}return false;}
 function roll(realm,x,y,random=Math.random){const r=at(realm,x,y);if(r.safe||!r.open)return -1;return rollTier(r.tier,random);}
 function rollTier(tier,random=Math.random){const n=random();if(tier===8)return n<.01?9:n<.21?7:8;if(tier===7)return n<.84?7:6;return n<.84?tier:Math.max(0,tier-1);}
 function pool(realm,tier){const base={garden:[['ladybug','ant'],['bee','ladybug'],['beetle','bee'],['spider','ant'],['centipede','beetle'],['bee','spider'],['centipede','spider'],['beetle','bee'],['ladybug','beetle','centipede']],beach:[['hermit'],['crab'],['turtle'],['hermit','crab'],['turtle','crab'],['hermit','turtle'],['crab','turtle'],['turtle','hermit'],['crab','hermit','turtle']],jungle:[['frog'],['dragonfly'],['mantis'],['spider'],['mantis','frog'],['dragonfly','spider'],['mantis','spider'],['frog','mantis'],['mantis','dragonfly','frog','spider']],ice:[['icebeetle'],['snowmoth'],['icebeetle'],['snowmoth'],['icebeetle','snowmoth'],['iceTornado'],['snowmoth','iceTornado'],['icebeetle','iceTornado'],['icebeetle','snowmoth','iceTornado']],desert:[['scarab'],['scorpion'],['scarab'],['scorpion'],['sandTornado'],['scarab','sandTornado'],['scorpion','sandTornado'],['scarab','scorpion'],['scarab','scorpion','sandTornado']]};return realm==='cave'?['guardian']:(base[realm]||base.garden)[Math.max(0,Math.min(8,tier))];}
 const api={SIZE,TILE,VERSION,TIERS,COLORS,LAYOUTS,dimensions,spawn,build,at,blocked,roll,rollTier,pool};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MAP_ATLAS=api;
})(typeof globalThis!=='undefined'?globalThis:this);
