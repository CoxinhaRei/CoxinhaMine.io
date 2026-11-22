(function(root){
 'use strict';
 const combat=typeof module!=='undefined'&&module.exports?require('./game-catalog'):root.GAME_CATALOG;
 const EVOLUTIONS=[
  ['Magneto Normal',500,'#df6c64','horseshoe'],['Magneto de Ferro',900,'#a8b3bb','horseshoe'],['Magneto de Cobre',1600,'#ca8b5e','horseshoe'],['Magneto de Aço',2800,'#d0e6eb','coil'],['Magneto de Ouro',4800,'#edc960','coil'],['Magneto de Cristal',7600,'#8fdcd6','crystal'],['Magneto Eletromagnético',11000,'#73d5ec','coil'],['Magneto de Plasma',15000,'#bb8deb','plasma'],['Magneto Gravitacional',20000,'#a4a1ed','rings'],['Magneto Estelar',25000,'#9bdcf0','star'],['Magneto Galáctico',30000,'#bc9ae4','galaxy'],['Magneto Cósmico',35000,'#b8a6f1','cosmic']
 ].map(([name,radius,color,model],tier)=>({name,radius:Math.round(radius*combat.ACCESSORY_BUFF),color,model,tier}));
 function spec(tier){return EVOLUTIONS[tier]||null;}
 const api={EVOLUTIONS,spec,MAX_RADIUS:EVOLUTIONS.at(-1).radius};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MAGNET_CATALOG=api;
})(typeof globalThis!=='undefined'?globalThis:this);
