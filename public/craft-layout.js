(function(root){
  'use strict';
  function rows(state,type,E,lootNames={},search=''){
    const kind=type==='recipes'?'accessory':type,owned=(state.inventory||[]).filter(i=>i.type===kind&&(i.amount||0)>0),families=new Map();
    const addFamily=item=>{const id=kind==='material'?'ore':kind==='accessory'?item.accessoryId:item.kind;if(!id)return;families.set(id,{id,name:kind==='material'?'Minério':kind==='accessory'?E.ACCESSORIES.find(a=>a.id===id)?.name||item.name:lootNames[id]||item.name,kind:item.kind});};
    if(type==='recipes')E.ACCESSORIES.forEach(a=>addFamily({accessoryId:a.id,name:a.name,kind:a.kind}));else owned.forEach(addFamily);
    return [...families.values()].filter(f=>f.name.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'))).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).map(f=>({...f,cells:E.RARITIES.map(rarity=>{
      const matches=owned.filter(i=>(i.oreRarity||i.rarity||i.name)===rarity&&(kind==='material'||(kind==='accessory'?i.accessoryId===f.id:i.kind===f.id))),amount=matches.reduce((n,i)=>n+E.num(i.amount),0);
      const item=kind==='accessory'?E.accessory(f.id,rarity,amount):{type:kind,kind:kind==='component'?f.id:undefined,name:kind==='material'?rarity:f.name,rarity,oreRarity:kind==='material'?rarity:undefined,amount};
      const mode=type==='recipes'&&rarity==='Comum'?'make':'fusion',limit=mode==='make'?E.makeLimit(state,f.id):rarity==='ALEPH'||rarity==='CHOSEN'?0:E.fusionLimit(state,item);
      return {item,amount,mode,limit};
    })}));
  }
  function quantity(current,direction,maximum){const max=Math.max(1,Math.floor(maximum)||1),value=Math.max(1,Math.min(max,Math.floor(current)||1));return direction>0?Math.min(max,value*2):Math.max(1,Math.floor(value/2));}
  const api={rows,quantity};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CraftLayout=api;
})(typeof globalThis!=='undefined'?globalThis:this);
