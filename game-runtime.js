const fs=require('fs');
const path=require('path');
const vm=require('vm');

// The server and browser run the same combat, maze and creature rules.
module.exports=function createGameRuntime(realm,onPlayerDamage){
  const draw=new Proxy({}, {get:()=>()=>{}});
  const element=()=>({style:{},classList:{add(){},remove(){}},value:'',addEventListener(){},getContext:()=>draw,width:1280,height:720});
  const context=vm.createContext({
    console,Image:class {},document:{getElementById:element,createElement:element,addEventListener(){}},
    window:{innerWidth:1280,innerHeight:720,location:{origin:''},addEventListener(){}},
    performance:{now:()=>Date.now()},localStorage:{getItem:()=>null,setItem(){}},io:()=>({on(){},emit(){}}),
    setInterval(){},setTimeout(){},clearTimeout(){},requestAnimationFrame(){},
    isServerWorld:()=>false,onPlayerDamage
  });
  const root=path.join(__dirname,'public');
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
  for(const file of ['game-catalog.js',null,'progression.js','systems.js','adventure.js','gear.js','cave.js','boss-mobs.js'])vm.runInContext(file ? fs.readFileSync(path.join(root,file),'utf8') : inline,context,{filename:file || 'game-inline.js'});
  context.realmName=realm;
  return vm.runInContext(`
    currentRealm=realmName;
    if(currentRealm==='cave')buildCaveMaze();
    takePlayerDamage=(amount,dx,dy,cause)=>onPlayerDamage(player,amount,dx,dy,cause);
    const template=JSON.parse(JSON.stringify(player));
    ({
      get ores(){return ores;},set ores(value){ores=value;},get mobs(){return mobs;},set mobs(value){mobs=value;},
      get projectiles(){return projectiles;},set projectiles(value){projectiles=value;},
      get hazards(){return bossMobHazards;},get effects(){return bossMobEffects;},get rarities(){return rarities;},
      get creatures(){return CREATURES;},get cave(){return CAVE;},get portal(){return CAVE_ENTRANCE;},
      lootName(kind){return GAME_CATALOG.MOB_LOOT[kind] || 'Fragmento';},
      get swords(){return SWORDS;},get pickaxes(){return pickaxes;},get armors(){return ARMORS;},get utilities(){return UTILITIES;},
      fresh(){return JSON.parse(JSON.stringify(template));},
      bind(state){player=state;},
      normalize(state){player=state;normalizeProgression();normalizeSystems();normalizeAdventure();restoreEquipment();return player;},
      refill(state){player=state;nextGardenSpawnAt=0;updateSpawnSystem();},
      spawnGardenCell(cx,cy,nearby){const before=ores.length;spawnOreInCell(cx,cy,nearby);return ores[before] || null;},
      populateCave(state){player=state;populateCave();},
      forgetDormantOre(ore){if(currentRealm==='cave'){const match=/^cave-ore-([0-9]+)$/.exec(ore.id);if(match)CAVE.populated.delete(Number(match[1]));}},
      createCreature,removeMobAndSummons,creatureAggressive,bossMobAbility,
      zone:getZone,lineClear:caveLineClear,wall:circleHitsCaveWall,tileOpen:caveTileOpen,
      surface(entity,state){player=state;return targetSurface(entity);},
      moveMob(mob,state,dt){const all=mobs;player=state;mobs=[mob];try{updateCreatureMovement(dt);}finally{mobs=all;}},
      bossStep(mob,state,dt){player=state;updateBossMobAbilities(dt,[mob],true);},
      tickEffects(dt){player={dead:true,x:0,y:0};updateBossMobHazards(dt);},
      rank(state,id){return state.talentRanks?.[id] || 0;},
      utility(state){return UTILITIES.find(u=>u.name===state.equipment.utility?.name) || {};},
      armor(state){return ARMORS.find(a=>a.name===state.equipment.armor?.name)?.defense || 0;},
      rarityIndex(state){player=state;return highestOwnedRarity();},
      ability:equipmentAbility,
      moveEntity(entity,x,y,radius){moveWithWalls(entity,x,y,radius);},
      giveMaterial(state,rarity,amount){player=state;addOreMaterial(rarity,amount);},
      levelUp(state){player=state;checkLevelUp();},
      achievements(state){player=state;checkAchievements();},xpForLevel
      ,tickPlayer(state){player=state;tickOreCraft();}
      ,command(state,kind,data={}){
        player=state;
        if(kind==='pickaxe')return craftPickaxe(data.name);
        if(kind==='weapon')return craftSword(data.name);
        if(kind==='gear')return craftGear((data.type==='armor' ? ARMORS : UTILITIES).find(r=>r.name===data.name));
        if(kind==='talent')return unlockTalent(data.id);
        if(kind==='fusion')return startOreCraft(data.name);
        if(kind==='equip'){
          const list={weapon:SWORDS,pickaxe:pickaxes,armor:ARMORS,utility:UTILITIES}[data.type],definition=list?.find(r=>r.name===data.name);
          if(!definition || !player.inventory.some(i=>i.type===data.type && i.name===data.name))return false;
          player.equipment[data.type]={...definition,type:data.type};player.selectedSlot={weapon:0,armor:1,pickaxe:2,utility:3}[data.type];return true;
        }
        if(kind==='sellComponent'){
          const item=player.inventory.find(i=>i.type==='component' && i.kind===data.kind && i.rarity===data.rarity),amount=Math.min(item?.amount || 0,Math.max(0,Math.floor(Number(data.amount)||0)));
          if(!item || !amount)return false;item.amount-=amount;player.coins+=amount*Math.round(8*Math.pow(1.8,rarities.findIndex(r=>r.name===item.rarity)));player.inventory=player.inventory.filter(i=>(i.amount ?? 1)>0);return true;
        }
        if(kind==='sell' || kind==='sellAll'){
          const components=kind==='sellAll' ? player.inventory.filter(i=>i.type==='component') : [];
          const requirements=kind==='sellAll' ? [...new Set(player.inventory.filter(i=>i.type==='material').map(materialRarity))].map(name=>[name,materialCount(name)]) : [[data.name,Math.min(materialCount(data.name),Math.max(0,Math.floor(Number(data.amount)||0)))]];
          if((!requirements.length && !components.length) || requirements.some(([name,count])=>!rarities.some(r=>r.name===name) || count<=0) || !consumeMaterials(requirements))return false;
          player.coins+=requirements.reduce((sum,[name,count])=>sum+count*(ORE_VALUES[name]||1)*5,0)+components.reduce((sum,item)=>sum+item.amount*Math.round(8*Math.pow(1.8,rarities.findIndex(r=>r.name===item.rarity))),0);if(components.length)player.inventory=player.inventory.filter(i=>i.type!=='component');return true;
        }
        return false;
      }
    });
  `,context);
};
