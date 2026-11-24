(function(root){
  const MOBS=[
    {kind:'sporecap',name:'Cogumelo Venenoso',biome:'jungle',hp:95,damage:9,speed:0,color:'#ab73c3',drop:'Esporo Violeta',poison:true},
    {kind:'livingDune',name:'Duna Viva',biome:'desert',hp:150,damage:12,speed:0,color:'#d7a45d',drop:'Núcleo de Arenito'},
    {kind:'coralSentry',name:'Coral Sentinela',biome:'beach',hp:110,damage:8,speed:0,color:'#ed9f97',drop:'Ramo de Coral Vivo'},
    {kind:'frostCrystal',name:'Cristal da Geada',biome:'ice',hp:125,damage:10,speed:0,color:'#8cd8ed',drop:'Fragmento da Geada'}
  ].map(m=>({...m,stationary:true,temperament:'hostile'}));
  const EGGS=MOBS.map((m,n)=>({id:['eggSporecap','eggDune','eggCoral','eggFrostCrystal'][n],kind:m.kind,name:'Ovo de '+m.name,count:n===0||n===2?2:1,cooldown:24+n*2,stationary:true}));
  const api={MOBS,EGGS,kindFor:realm=>MOBS.find(m=>m.biome===realm)?.kind};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ROOTED_CATALOG=api;
})(typeof globalThis!=='undefined'?globalThis:this);
