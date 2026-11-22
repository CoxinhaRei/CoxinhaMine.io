(function(root){
 'use strict';
 const atlas=typeof module!=='undefined'&&module.exports?require('./map-atlas'):root.MAP_ATLAS,cache=new Map(),RADIUS=280;
 function places(realm='garden'){
  if(cache.has(realm))return cache.get(realm);const m=atlas.build(realm),home=atlas.spawn(realm),best=Array(10).fill(Infinity),out=Array(10);out[0]={id:realm+':0',realm,tier:0,...home,radius:1200,name:atlas.at(realm,home.x,home.y).name};
  const gates=Array.from({length:10},(_,tier)=>m.gates.filter(g=>g.a===tier||g.b===tier));
  for(let i=0;i<m.open.length;i++){const tier=m.tiers[i];if(!m.open[i]||tier===0)continue;const x=(i%m.cols+.5)*m.tile,y=(Math.floor(i/m.cols)+.5)*m.tile;if(atlas.blocked(realm,x,y,450))continue;const distance=gates[tier].length?Math.min(...gates[tier].map(g=>Math.hypot(x-g.x,y-g.y))):Math.hypot(x-home.x,y-home.y),score=distance+.04*Math.hypot(x-home.x,y-home.y);if(score<best[tier]){best[tier]=score;out[tier]={id:realm+':'+tier,realm,tier,x,y,radius:RADIUS,name:'Acampamento · '+m.names[tier]};}}
  const result=out.filter(Boolean);cache.set(realm,result);return result;
 }
 function place(realm,tier){return places(realm).find(p=>p.tier===tier)||places(realm)[0];}
 function near(realm,x,y){return places(realm).some(p=>Math.hypot(p.x-x,p.y-y)<=p.radius);}
 function clear(realm,x,y,radius=0){return places(realm).every(p=>Math.hypot(p.x-x,p.y-y)>p.radius+radius+100);}
 const api={places,place,near,clear,RADIUS};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CHECKPOINT_CATALOG=api;
})(typeof globalThis!=='undefined'?globalThis:this);
