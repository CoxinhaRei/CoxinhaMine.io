(function(root){
 'use strict';
 const combat=typeof module!=='undefined'&&module.exports?require('./game-catalog'):root.GAME_CATALOG;
 const arcana=typeof module!=='undefined'&&module.exports?require('./arcana-catalog'):root.ARCANA;
 const magnets=typeof module!=='undefined'&&module.exports?require('./magnet-catalog'):root.MAGNET_CATALOG;
 const atlas=typeof module!=='undefined'&&module.exports?require('./map-atlas'):root.MAP_ATLAS;
 const RARITIES=['Comum','Incomum','Raro','Épico','Lendário','Mítico','ULTRA','SUPER','ABSOLUT','QUANTIUM','ALEPH','CHOSEN'];
 const SCALE=[1,1.25,1.6,2.1,2.8,3.8,5.3,7.3,10,14,20,30],CHANCES=[.8,.65,.5,.35,.25,.15,.1,.08,.05,.001,1];
 const BIOMES=[
  {id:'garden',name:'Jardim',color:'#21b966',texture:'#117d4638',x:30000,y:25000,w:40000,h:45000,spawn:{x:50000,y:50000},mobs:['ladybug','bee','ant','spider','beetle','centipede']},
  {id:'beach',name:'Praia',color:'#e9d29a',texture:'#907a4238',x:0,y:25000,w:30000,h:45000,spawn:{x:18000,y:50000},mobs:['crab','hermit','turtle']},
  {id:'jungle',name:'Jungle',color:'#247350',texture:'#123e394f',x:0,y:70000,w:70000,h:30000,spawn:{x:50000,y:85000},mobs:['mantis','dragonfly','frog','spider']},
  {id:'ice',name:'Floresta de Gelo',color:'#bcdfe7',texture:'#537eac38',x:0,y:0,w:70000,h:25000,spawn:{x:45000,y:14000},mobs:['icebeetle','snowmoth','iceTornado']},
  {id:'desert',name:'Deserto',color:'#dcb271',texture:'#946b3638',x:70000,y:0,w:30000,h:100000,spawn:{x:85000,y:50000},mobs:['scorpion','scarab','sandTornado']}
 ].map(b=>({...b,x:0,y:0,w:atlas.SIZE,h:atlas.SIZE,spawn:atlas.spawn(b.id)}));
 const MAPS=[...BIOMES,{id:'cave',name:'Caverna',color:'#343640',texture:'#a6a1b238',w:atlas.SIZE*2,h:atlas.SIZE,spawn:{x:750,y:750},mobs:['guardian']}];
 const mapFor=id=>MAPS.find(m=>m.id===id)||MAPS[0];
 const LANDMARKS={
  garden:[{id:'city',name:'Praça central',x:50000,y:50000,model:'city',radius:1100},{id:'bridge',name:'Ponte das Flores',x:50000,y:52800,model:'bridge',radius:700},{id:'glade',name:'Clareira das Joaninhas',x:53600,y:50600,model:'flowers',radius:720}],
  beach:[{id:'landing',name:'Refúgio das Marés',x:50000,y:50000,model:'landing',radius:1100},{id:'coral',name:'Costa de Coral',x:54000,y:51200,model:'coast',radius:1000},{id:'shells',name:'Baía das Conchas',x:57800,y:54800,model:'shells',radius:850}],
  jungle:[{id:'landing',name:'Refúgio Verde',x:50000,y:50000,model:'landing',radius:1100},{id:'ruins',name:'Ruínas do Dossel',x:53700,y:51700,model:'ruins',radius:900},{id:'dew',name:'Lagoa do Orvalho',x:57500,y:55100,model:'pond',radius:850}],
  ice:[{id:'landing',name:'Refúgio da Aurora',x:50000,y:50000,model:'landing',radius:1100},{id:'lake',name:'Lago Espelhado',x:53500,y:51800,model:'frozenLake',radius:900},{id:'crystals',name:'Bosque de Cristal',x:57600,y:55300,model:'iceForest',radius:900}],
  desert:[{id:'landing',name:'Refúgio das Dunas',x:50000,y:50000,model:'landing',radius:1100},{id:'forge',name:'Coxinha Forjadora',x:52500,y:50000,model:'forge',radius:1000},{id:'oasis',name:'Oásis dos Viajantes',x:57000,y:54000,model:'oasis',radius:900}],
  cave:[{id:'entrance',name:'Entrada do Labirinto',x:1000,y:1000,model:'entrance',radius:850},{id:'gallery',name:'Galeria de Cristais',x:8750,y:5750,model:'caveCrystals',radius:700},{id:'depths',name:'Salão das Profundezas',x:15750,y:11750,model:'caveRuins',radius:800}]
 };
 function portalsFor(realm){
  if(realm==='cave')return [{id:'cave-return',to:'garden',x:8750,y:5750,r:110}];
  const destinations=MAPS.filter(m=>m.id!==realm);
  const portals=destinations.map((m,n)=>{const angle=-Math.PI/2+n*Math.PI*2/destinations.length;return {id:realm+'-to-'+m.id,to:m.id,x:atlas.SIZE/2+Math.cos(angle)*atlas.SIZE*.34,y:atlas.SIZE/2+Math.sin(angle)*atlas.SIZE*.34,r:100};});
  if(realm==='garden')portals.push({id:'garden-cave-entrance',to:'cave',x:atlas.SIZE-2000,y:2000,r:150});
  return portals;
 }
 for(const [realm,places] of Object.entries(LANDMARKS))if(realm!=='cave')for(const p of places){p.x+=atlas.SIZE/2-50000;p.y+=atlas.SIZE/2-50000;}
 const districtModels={garden:['flowers','bridge','ruins','pond','flowers','ruins','flowers'],beach:['shells','coast','shells','coast','shells','coast','shells'],jungle:['pond','ruins','pond','ruins','pond','ruins','pond'],ice:['iceForest','frozenLake','iceForest','frozenLake','iceForest','frozenLake','iceForest'],desert:['oasis','ruins','oasis','ruins','oasis','ruins','oasis'],cave:['caveCrystals','caveRuins','caveCrystals','caveRuins','caveCrystals','caveRuins','caveCrystals']};
 for(const map of MAPS)for(let tier=1;tier<=7;tier++){const p=atlas.LAYOUTS[map.id].points[tier];LANDMARKS[map.id].push({id:'territory-'+tier,name:atlas.LAYOUTS[map.id].names[tier],x:p[0]*map.w,y:p[1]*map.h,model:districtModels[map.id][tier-1],radius:850});}
 const MOBS=[
  ['crab','Caranguejo','neutral',55,8,76,'#dd7958','Pinça de Coral','beach'],['hermit','Ermitão','neutral',75,7,55,'#c59b75','Concha Espiral','beach'],['turtle','Tartaruga','neutral',110,7,48,'#60a98b','Escama Marinha','beach'],
  ['mantis','Louva-a-deus','hostile',70,10,135,'#8cc65d','Lâmina de Louva-a-deus','jungle'],['dragonfly','Libélula','neutral',38,6,165,'#70d6cc','Asa Prismática','jungle'],['frog','Sapo','neutral',90,9,90,'#61b485','Gota de Orvalho','jungle'],
  ['icebeetle','Besouro Glacial','neutral',105,10,65,'#70bcd9','Carapaça Glacial','ice'],['snowmoth','Mariposa da Neve','neutral',42,6,115,'#e0efff','Pó Lunar','ice'],['iceTornado','Tornado de Gelo','hostile',80,8,84,'#a9edff','Núcleo Glacial','ice'],
  ['scorpion','Escorpião','hostile',85,11,110,'#a88762','Aguilhão do Deserto','desert'],['scarab','Escaravelho','neutral',100,9,74,'#cfad54','Élitro Dourado','desert'],['sandTornado','Tornado de Areia','hostile',65,7,100,'#ebc885','Essência de Areia','desert']
 ].map(([kind,name,temperament,hp,damage,speed,color,drop,biome])=>({kind,name,temperament,hp,damage,speed,color,drop,biome}));
 MOBS.push({kind:'invertedBeetle',name:'Besouro Invertido',temperament:'neutral',hp:140,damage:10,speed:74,color:'#ad7292',drop:'Semente de Retorno',biome:'garden',variantOf:'beetle'});
 const ACCESSORIES=[
  ['sting','Pingente do Ferrão','bee','sting',{damage:.06}],['carapace','Broche Rubro','ladybug','shell',{defense:.015}],['mandible','Mandíbula de Ferro','ant','fang',{mining:.09}],['silk','Manto de Seda','spider','web',{defense:.012,regen:.1}],
  ['shell','Escudo de Quitina','beetle','shell',{health:800,defense:.015}],['venom','Frasco de Veneno','centipede','vial',{damage:.04,vampirism:.0015}],['core','Coração do Guardião','guardian','core',{mining:.06,range:6}],
  ['coral','Garra de Coral','crab','fang',{damage:.04,mining:.04}],['spiral','Concha das Marés','hermit','shell',{regen:.2}],['tide','Escama das Marés','turtle','shell',{defense:.02,health:600}],
  ['mantis','Lâmina Verde','mantis','fang',{haste:.012}],['wings','Asas de Libélula','dragonfly','wings',{speed:.035,zoom:.02}],['dew','Orvalho Vivo','frog','vial',{regen:12,health:400}],
  ['frost','Carapaça do Inverno','icebeetle','shell',{defense:.012,slowResist:.025}],['moth','Asas da Aurora','snowmoth','wings',{vision:20,speed:.02}],['glacier','Coração Glacial','iceTornado','core',{slowResist:.05,health:900}],
  ['scorpion','Talismã do Escorpião','scorpion','sting',{damage:.05,vampirism:.0015}],['sun','Élitro Solar','scarab','wings',{speed:.025,xp:.025}],['storm','Olho da Tempestade','sandTornado','eye',{range:10,slowResist:.03}],['magnet','Magneto Normal','guardian','magnet',{vision:12,mining:.04}]
 ].map(([id,name,kind,model,bonuses])=>({id,name,kind,model,bonuses,materials:8,components:3}));
 ACCESSORIES.push({id:'revival',name:'Relicário do Retorno',kind:'invertedBeetle',model:'revive',bonuses:{health:300},materials:8,components:3,revive:true});
 ACCESSORIES.push({id:'orb',name:'Orbe Mágica',kind:'frog',model:'orb',bonuses:{},materials:12,components:5},...arcana.EGGS.map(e=>({...e,model:'egg',bonuses:{},materials:10,components:5})));
 ACCESSORIES.push(...[
  ['luckyWing','Élitro da Esquiva','ladybug','wings',{dodge:.008,speed:.02}],
  ['silkStep','Passo de Seda','spider','web',{dodge:.01,haste:.01}],
  ['dragonEye','Olho Prismático','dragonfly','eye',{dodge:.012,zoom:.025}],
  ['snowVeil','Véu de Neve','snowmoth','wings',{dodge:.01,vision:25}],
  ['titanHeart','Coração Titânico','turtle','core',{health:1200,regen:10}],
  ['frostHeart','Coração da Geada','icebeetle','core',{health:1000,defense:.02}],
  ['sandFang','Presa das Dunas','scorpion','fang',{damage:.1,haste:.015}],
  ['coralCrown','Coroa de Coral','crab','shell',{health:700,mining:.08}]
 ].map(([id,name,kind,model,bonuses])=>({id,name,kind,model,bonuses,materials:8,components:3})));
 ACCESSORIES.push(...[
  ['broodFang','Presa da Ninhada','mantis','fang',{summonDamage:.15}],
  ['swarmSting','Ferrão do Enxame','bee','sting',{summonDamage:.10,summonHaste:.04}],
  ['broodHeart','Coração da Ninhada','frog','core',{summonHealth:.25}],
  ['broodWings','Asas do Enxame','dragonfly','wings',{summonSpeed:.14}],
  ['silkDrum','Tambor de Seda','spider','web',{summonHaste:.10}],
  ['giantShell','Carapaça Colossal','beetle','shell',{size:.12,health:2500,defense:.02,speedPenalty:.025}],
  ['titanCarapace','Couraça do Titã','turtle','shell',{size:.20,health:4000,defense:.025,speedPenalty:.04}]
 ].map(([id,name,kind,model,bonuses])=>({id,name,kind,model,bonuses,materials:8,components:3})));
 for(const def of ACCESSORIES){if(def.bonuses.speed)def.bonuses.speed*=3;if(def.bonuses.vision)def.bonuses.vision*=4;if(def.bonuses.zoom)def.bonuses.zoom*=4;}
 for(const def of ACCESSORIES)for(const name of Object.keys(def.bonuses))if(name!=='speedPenalty'&&def.bonuses[name]>0)def.bonuses[name]*=combat.ACCESSORY_BUFF;
 const LEGACY={'Lanterna':['moth','Raro'],'Lente de Libélula':['wings','Épico'],'Botas de Gafanhoto':['wings','Lendário'],'Núcleo de Escavação':['mandible','Mítico'],'Observatório Astral':['moth','ULTRA'],'Asas de Fóton':['wings','SUPER'],'Magneto Cósmico':['magnet','ABSOLUT'],'Reator Quantium':['core','QUANTIUM'],'Olho de Aleph':['storm','ALEPH']};
 const num=(v,max=Number.MAX_SAFE_INTEGER)=>Math.min(max,Math.max(0,Math.floor(Number(v)||0)));
 const tier=name=>RARITIES.findIndex(r=>r===name),key=item=>item.type+':'+(item.accessoryId || item.kind || '')+':'+(item.oreRarity || item.rarity || item.name);
 const magnetSpec=rarity=>magnets.spec(tier(rarity));
 const slots=level=>Math.min(20,1+Math.floor(num(level,99999)/25));
 function accessory(id,rarity='Comum',amount=1){const def=ACCESSORIES.find(a=>a.id===id);return def && tier(rarity)>=0 ? {id:'accessory_'+id+'_'+rarity,accessoryId:id,name:id==='magnet'?magnetSpec(rarity).name:def.name,type:'accessory',rarity,amount:num(amount,1e12)} : null;}
 function add(state,item){const old=state.inventory.find(i=>key(i)===key(item));if(old)old.amount=Math.min(1e12,(old.amount||1)+(item.amount||1));else state.inventory.push({...item});}
 function normalize(state){
  state.inventory ||= [];for(const i of state.inventory)if(i.type==='accessory'&&i.accessoryId==='magnet'&&magnetSpec(i.rarity))i.name=magnetSpec(i.rarity).name;state.equipment ||= {};state.journal ||= {};
  if(state.accessoryVersion!==1){const old=state.equipment.utility;for(const item of state.inventory.filter(i=>i.type==='utility')){const mapped=LEGACY[item.name];if(mapped)add(state,accessory(...mapped));}if(old && !state.inventory.some(i=>i.type==='utility' && i.name===old.name)){const mapped=LEGACY[old.name];if(mapped)add(state,accessory(...mapped));}state.inventory=state.inventory.filter(i=>i.type!=='utility');state.accessoryVersion=1;if(old && LEGACY[old.name]){const [id,rarity]=LEGACY[old.name];state.accessories=[{accessoryId:id,rarity}];}}
  state.equipment.utility=null;state.accessories=Array.isArray(state.accessories) ? state.accessories.slice(0,20) : [];
  const used=new Map();state.accessories=Array.from({length:20},(_,index)=>{const ref=state.accessories[index];if(index>=slots(state.level) || !ref)return null;const item=accessory(ref.accessoryId,ref.rarity);if(!item)return null;const k=key(item),count=(used.get(k)||0)+1,owned=state.inventory.filter(i=>key(i)===k).reduce((n,i)=>n+num(i.amount),0);if(count>owned)return null;used.set(k,count);return {accessoryId:item.accessoryId,rarity:item.rarity};});
  for(const name of ['killTiers','oreTiers','biomeKills'])state.journal[name]=state.journal[name] && typeof state.journal[name]==='object' ? state.journal[name] : {};
  for(const name of ['craftAttempts','craftsDestroyed','materialsCollected','stonesCollected','experienceEarned'])state.journal[name]=num(state.journal[name]);
  state.joinedAt=num(state.joinedAt)||Date.now();return state;
 }
 function bonuses(state){const out={summonDamage:0,summonHealth:0,summonSpeed:0,summonHaste:0,size:0,speedPenalty:0,speed:0,mining:0,damage:0,vision:0,zoom:0,haste:0,defense:0,health:0,regen:0,vampirism:0,xp:0,range:0,pickup:0,magnetRadius:0,slowResist:0,dodge:0};for(const ref of (state.accessories||[]).slice(0,slots(state.level))){if(!ref)continue;const def=ACCESSORIES.find(a=>a.id===ref.accessoryId),scale=SCALE[tier(ref.rarity)]||0;if(def?.id==='magnet')out.magnetRadius=Math.max(out.magnetRadius,magnetSpec(ref.rarity)?.radius||0);if(def)for(const [k,v] of Object.entries(def.bonuses))out[k]+=v*scale;}const caps={summonDamage:6,summonHealth:6,summonSpeed:3,summonHaste:2,size:2,speedPenalty:.75,speed:6,mining:6,damage:4,vision:6000,zoom:.88,haste:.65,defense:.65,health:300000,regen:3000,vampirism:.12,xp:2,range:900,pickup:1000,magnetRadius:magnets.MAX_RADIUS,slowResist:1,dodge:.6};for(const k of Object.keys(out))out[k]=Math.min(out[k],caps[k]);out.zoom=Math.max(.12,1-out.zoom);for(const [name,value] of Object.entries(combat.armorBonuses(state.equipment?.armor?.name)))out[name]=(out[name]||0)+value;return out;}
 function equip(state,index,ref){normalize(state);if(!Number.isInteger(index)||index<0||index>=slots(state.level))return false;if(!ref){state.accessories[index]=null;return true;}const item=accessory(ref.accessoryId,ref.rarity);if(!item)return false;const k=key(item),owned=state.inventory.filter(i=>key(i)===k).reduce((n,i)=>n+num(i.amount),0),used=state.accessories.filter((r,n)=>n!==index && r && key({type:'accessory',...r})===k).length;if(used>=owned)return false;state.accessories[index]={accessoryId:item.accessoryId,rarity:item.rarity};return true;}
 function componentCount(state,kind){return state.inventory.filter(i=>i.type==='component'&&i.kind===kind&&i.rarity!=='CHOSEN').reduce((n,i)=>n+num(i.amount),0);}
 const MAX_CRAFT_BATCH=10000,TORNADO_PULL_SCALE=.3;
 function craftDuration(chance,count=1){const p=Math.max(.001,Math.min(1,Number(chance)||.001));return Math.round((700+4500*Math.pow(1-p,.65)+900*Math.log10(1/p))*(1+Math.min(.5,Math.log2(Math.max(1,count))*.06)));}
 const craftCount=value=>value===undefined?1:Number.isSafeInteger(value)&&value>=1&&value<=MAX_CRAFT_BATCH?value:0;
 function craftDurationOf(craft){return Number.isFinite(craft?.durationMs)?Math.max(700,Math.min(18000,craft.durationMs)):2400;}
 function fusionItems(state,request){return (state.inventory||[]).filter(i=>i.type===request.type&&(i.oreRarity||i.rarity||i.name)===request.rarity&&(request.type==='accessory'?i.accessoryId===request.accessoryId:request.type==='component'?i.kind===request.kind:true));}
 function fusionLimit(state,request){const index=tier(request.rarity);if(index<0||index>=RARITIES.length-1||!['material','component','accessory'].includes(request.type))return 0;const used=request.type==='accessory'?(state.accessories||[]).slice(0,slots(state.level)).filter(r=>r&&r.accessoryId===request.accessoryId&&r.rarity===request.rarity).length:0;return Math.min(MAX_CRAFT_BATCH,Math.max(0,Math.floor((fusionItems(state,request).reduce((n,i)=>n+num(i.amount),0)-used)/5)));}
 function makeLimit(state,id){const def=ACCESSORIES.find(a=>a.id===id);if(!def)return 0;const minerals=(state.inventory||[]).filter(i=>i.type==='material'&&(i.oreRarity||i.name)==='Comum').reduce((n,i)=>n+num(i.amount),0);return Math.min(MAX_CRAFT_BATCH,Math.floor(minerals/def.materials),Math.floor(componentCount(state,def.kind)/def.components));}
 function consumeStacks(items,amount){let left=amount;for(const i of items){const take=Math.min(left,num(i.amount));i.amount-=take;left-=take;if(!left)break;}}
 function make(state,id,now=Date.now(),quantity=1){
  normalize(state);const count=craftCount(quantity);if(state.pendingCraft||!count||makeLimit(state,id)<count)return false;const def=ACCESSORIES.find(a=>a.id===id);
  consumeStacks(state.inventory.filter(i=>i.type==='material'&&(i.oreRarity||i.name)==='Comum'),def.materials*count);
  consumeStacks(state.inventory.filter(i=>i.type==='component'&&i.kind===def.kind&&i.rarity!=='CHOSEN').sort((a,b)=>tier(a.rarity)-tier(b.rarity)),def.components*count);
  state.inventory=state.inventory.filter(i=>(i.amount??1)>0);add(state,accessory(id,'Comum',count));state.journal.crafted=(state.journal.crafted||0)+count;state.journal.craftAttempts+=count;
  state.pendingCraft={id:'make:'+now,from:'Comum',to:'Comum',type:'accessory',accessoryId:id,name:def.name,chance:1,success:true,count,successes:count,failures:0,lost:0,consumed:count*(def.materials+def.components),startedAt:now,durationMs:craftDuration(1,count)};return true;
 }
 function fuse(state,request,random=Math.random,now=Date.now()){
  normalize(state);const count=craftCount(request.count);if(state.pendingCraft||!count||fusionLimit(state,request)<count)return false;
  const index=tier(request.rarity),type=request.type,items=fusionItems(state,request),item={...items[0]},chance=CHANCES[index],next=RARITIES[index+1];let successes=0,consumed=0,destroyed=0;
  for(let n=0;n<count;n++){const success=random()<chance,lost=success?5:1+Math.floor(random()*4);consumed+=lost;if(success)successes++;else destroyed+=lost;}
  consumeStacks(items,consumed);state.inventory=state.inventory.filter(i=>(i.amount??1)>0);
  if(successes){const result=type==='accessory'?accessory(item.accessoryId,next,successes):{...item,rarity:next,oreRarity:type==='material'?next:undefined,name:type==='material'?next:item.name,amount:successes};add(state,result);state.journal.crafted=(state.journal.crafted||0)+successes;}
  state.journal.craftsDestroyed+=destroyed;state.journal.craftAttempts+=count;
  state.pendingCraft={id:'fusion:'+now,from:request.rarity,to:next,type,accessoryId:item.accessoryId,kind:item.kind,name:type==='material'?'Minério':type==='accessory'?accessory(item.accessoryId,next).name:item.name,chance,success:successes>0,count,successes,failures:count-successes,lost:consumed,destroyed,consumed,startedAt:now,durationMs:craftDuration(chance,count)};return true;
 }
 function mobRarityTier(distance,random=Math.random){if(distance<=14000)return Math.min(6,Math.max(0,Math.floor(distance/3500)));const base=3+Math.floor(random()*4),roll=random();return roll<.000001?10:roll<.0002?9:roll<.02?8:roll<.22?7:Math.min(6,base);}
 function biomeAt(x,y,realm='garden'){return mapFor(realm);}
 function inventoryTotals(state){const totals={},gear=['Madeira','Pedra','Ferro','Ouro','Matéria Vermelha','Diamante','Void','Solar'];for(const i of state.inventory||[]){if(i.type==='utility')continue;const rarity=i.oreRarity||i.rarity||RARITIES[gear.indexOf(i.name)];if(tier(rarity)>=0)totals[rarity]=Math.min(Number.MAX_SAFE_INTEGER,(totals[rarity]||0)+num(i.amount||1));}return totals;}
 function reviveSpec(state){const refs=(state.accessories||[]).slice(0,slots(state.level)).filter(ref=>ref?.accessoryId==='revival');if(!refs.length)return null;const t=Math.max(...refs.map(ref=>tier(ref.rarity)));return {tier:t,duration:Math.max(3500,12000-t*700),cooldown:Math.max(30000,120000-t*7000),health:Math.min(.65,.25+t*.035)};}
 const api={MAGNET_EVOLUTIONS:magnets.EVOLUTIONS,magnetSpec,MAX_CRAFT_BATCH,TORNADO_PULL_SCALE,craftCount,craftDuration,craftDurationOf,fusionLimit,makeLimit,mobRarityTier,reviveSpec,RARITIES,SCALE,CHANCES,BIOMES,MAPS,LANDMARKS,mapFor,portalsFor,MOBS,ACCESSORIES,LEGACY,num,tier,key,slots,accessory,add,normalize,bonuses,equip,make,fuse,biomeAt,inventoryTotals,componentCount};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.EXPANSION=api;
})(typeof globalThis!=='undefined'?globalThis:this);
