(function(root){
 'use strict';
 const atlas=typeof module!=='undefined'&&module.exports?require('./map-atlas'):root.MAP_ATLAS;
 let cached;
 function location(){
  if(cached)return cached;
  const realm='jungle',m=atlas.build(realm),home=atlas.spawn(realm);
  const gates=m.gates.filter(g=>g.a===7&&g.b===8).sort((a,b)=>Math.hypot(a.x-home.x,a.y-home.y)-Math.hypot(b.x-home.x,b.y-home.y));
  const gate=gates[0];let chosen,score=Infinity;
  for(let i=0;i<m.open.length;i++){
   if(!m.open[i]||m.tiers[i]!==7)continue;
   const x=(i%m.cols+.5)*m.tile,y=(Math.floor(i/m.cols)+.5)*m.tile,d=Math.hypot(x-gate.x,y-gate.y);
   if(d>4500||d<1200||atlas.blocked(realm,x,y,650))continue;
   const value=d+.03*Math.hypot(x-home.x,y-home.y);
   if(value<score){score=value;chosen={x,y};}
  }
  if(!chosen)throw Error('A oficina precisa de um ponto aberto perto da passagem Absolut.');
  cached=Object.freeze({id:'jungle-workshop',realm,name:'Mestra das Raízes',title:'Oficina do Dossel',...chosen,size:76,reach:340,safeRadius:520,gateX:gate.x,gateY:gate.y});return cached;
 }
 function nearby(realm,x,y,radius=location().reach){const p=location();return realm===p.realm&&Number.isFinite(x)&&Number.isFinite(y)&&Math.hypot(x-p.x,y-p.y)<=radius;}
 function canUpgrade(actor,world){const p=location(),s=actor?.state;return !!s&&!actor.inLobby&&!s.dead&&world.realm===p.realm&&s.realm===p.realm&&nearby(s.realm,s.x,s.y)&&world.game.lineClear(s.x,s.y,p.x,p.y);}
 const api={location,nearby,canUpgrade};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.WORKSHOP_CATALOG=api;
})(typeof globalThis!=='undefined'?globalThis:this);
