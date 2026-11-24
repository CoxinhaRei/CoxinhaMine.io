(function(root){
 const E=typeof module!=='undefined'&&module.exports?require('./expansion'):root.EXPANSION;
 function equipmentSlots(state){
  const gear=['weapon','armor','pickaxe','ranged'].map((type,n)=>({type,item:state.equipment?.[type]||null,label:['Espada','Armadura','Picareta','Arma à distância'][n],symbol:['⚔','⛨','⚒','➶'][n],shortcut:String(n+1),selectedSlot:n}));
  for(let n=0;n<E.slots(state.level);n++){const ref=state.accessories?.[n];gear.push({type:'accessory',accessorySlot:n,item:ref?E.accessory(ref.accessoryId,ref.rarity):null,label:'Acessório '+(n+1),symbol:'✦',shortcut:n===0?'5':'A'+(n+1)});}return gear;
 }
 if(typeof module!=='undefined'&&module.exports)module.exports=equipmentSlots;else root.equipmentSlots=equipmentSlots;
})(typeof globalThis!=='undefined'?globalThis:this);
