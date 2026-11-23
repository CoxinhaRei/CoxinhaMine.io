(function(root){
  // Radius in world units. PRIMORDIAL's diameter is half the garden's width.
  const ORE_RADII=[18,24,32,44,58,76,110,320,1500,4500,10000,14000,25000];
  const NAMES=['Comum','Incomum','Raro','Épico','Lendário','Mítico','ULTRA','SUPER','ABSOLUT','QUANTIUM','ALEPH','CHOSEN','PRIMORDIAL'];
  const PRIMORDIAL={name:'PRIMORDIAL',color:'#ffc5f7',hp:4e12,mult:160000,adminOnly:true};
  const catalog={
    ORE_RADII,NAMES,PRIMORDIAL,ACCESSORY_BUFF:1.5,
    PICKAXE_POWER:[30,100,400,1600,10000,45000,120000,280000],
    SWORD_DAMAGE:[135,450,1800,7200,54000,180000,510000,1080000],
    ORE_HP:[150,350,900,2500,7500,24000,120000,18000000,90000000,3600000000,18000000000,72000000000,4e12],
    XP_REWARDS:[20,60,220,1000,6000,30000,250000,2000000,12000000,80000000,500000000,1000000000,5000000000],
    mobXpMultiplier(rarity){return ({SUPER:6,ABSOLUT:8,QUANTIUM:10,ALEPH:12})[rarity]||3;},
    oreXpMultiplier(rarity){return ({SUPER:4,ABSOLUT:6,QUANTIUM:8,ALEPH:10})[rarity]||2;},
    experienceReward(rarity,isMob=false){const base=this.XP_REWARDS[this.NAMES.indexOf(rarity)]||1000000000;return base*(isMob?this.mobXpMultiplier(rarity):this.oreXpMultiplier(rarity));},
    MOB_LOOT:{guardian:'Fragmento do Guardião',ladybug:'Élitro Rubro',bee:'Ferrão',ant:'Mandíbula',spider:'Seda de Aranha',beetle:'Carapaça',centipede:'Glândula de Veneno'},
    totalXpForLevel(level){const n=Math.max(0,Number(level)-1);return Math.round(100*n+(100000000000-29900)*Math.pow(n/299,4));},
    xpForLevel(level,ascensions=0){return Math.round(Math.max(100,this.totalXpForLevel(level+1)-this.totalXpForLevel(level))*(1+Math.max(0,Math.min(1000,ascensions))*.25));},
    GRADIENTS:{SUPER:['#34e8fa','#f1ffff','#7972ff'],ABSOLUT:['#ffffff','#a4eaff','#ffa6df'],QUANTIUM:['#52a5ff','#7affdc','#d18aff'],ALEPH:['#ffcf51','#fffbd1','#ff93d8'],CHOSEN:['#7b818d','#ffffff','#bbc0ca'],PRIMORDIAL:['#ffa1f2','#fff5a1','#9eeeff']},
    CHOSEN:{name:'CHOSEN',color:'#a8adb7',hp:72000000000,mult:240000},
    ascensions(state){return Math.max(0,Math.min(1000,Math.floor(Number(state?.ascensions)||0)));},
    ascensionRequirement(state){return 1000+250*this.ascensions(state);},
    ascensionPower(state){return 1+this.ascensions(state)*.25;},
    itemLevel(item){if(!item||item.type!=='accessory'&&!item.accessoryId)return 1;const tier=this.NAMES.indexOf(typeof item.rarity==='object'?item.rarity.name:item.rarity);return [1,10,25,50,90,150,225,325,450,600,800,1000][tier]||1;},
    canUse(state,item){return !this.ascensions(state)||(state.level||1)>=this.itemLevel(item);},
    gearComponents(item,type=item?.type||'pickaxe'){const names=['Madeira','Pedra','Ferro','Ouro','Matéria Vermelha','Diamante','Void','Solar'],rows=[[],[['guardian',3]],[['ant',8],['ladybug',5]],[['bee',12],['beetle',8]],[['spider',20],['scorpion',12]],[['iceTornado',25],['icebeetle',18]],[['centipede',35],['mantis',25],['guardian',40]],[['sandTornado',45],['scarab',35],['dragonfly',30]]];return (rows[names.indexOf(item?.name)]||[]).map(([kind,count])=>[kind,Math.ceil(count*(type==='armor'?1.5:type==='weapon'?1.2:1))]);},
    componentCount(state,kind){return (state.inventory||[]).filter(i=>i.type==='component'&&i.kind===kind&&i.rarity!=='CHOSEN').reduce((n,i)=>n+Math.max(0,Math.floor(i.amount||0)),0);},
    gearComponentsReady(state,item,type){return this.gearComponents(item,type).every(([kind,n])=>this.componentCount(state,kind)>=n);},
    consumeGearComponents(state,item,type){if(!this.gearComponentsReady(state,item,type))return false;for(const [kind,count] of this.gearComponents(item,type)){let left=count;for(const i of state.inventory){if(i.type!=='component'||i.kind!==kind||i.rarity==='CHOSEN')continue;const take=Math.min(left,i.amount);i.amount-=take;left-=take;if(!left)break;}}state.inventory=state.inventory.filter(i=>(i.amount??1)>0);return true;},
    enforceEquipment(state,swords,pickaxes){for(const type of ['weapon','pickaxe','armor'])if(state.equipment?.[type]&&!this.canUse(state,state.equipment[type]))state.equipment[type]=type==='armor'?null:{...(type==='weapon'?swords:pickaxes)[0],type};},
    mobSpawnTier(region,random=Math.random){if(region!==9)return null;const n=random();return n<.01?11:n<.04?10:n<.64?9:8;},
    mobRadius(tier,cave=false){const old=i=>Math.min(cave?205:360,25*Math.pow(1.32,i))*(i>=7?3:1),quantium=old(9)*1.25;return tier===9?quantium:tier===10?quantium*4:tier===11?quantium*5:old(tier);},
    mobHealth(base,tier){if(tier===10)return 10e12;if(tier===11)return 150e12;if(tier===9)return 40*Math.ceil(Math.max(3000000,base/25*3000000)*Math.pow(4.5,2)*12*12);return tier>=7 ? Math.ceil(Math.max(3000000,base/25*3000000)*Math.pow(4.5,tier-7)*(tier===7?2:12)*(tier>=9?12:1)) : Math.ceil(base*Math.pow(2.2,tier)*(10+tier*6));},
    mobDamage(base,tier){return Math.ceil(tier>=7?Math.max(20000,base/5*20000)*Math.pow(1.5,tier-7):base*80*Math.pow(1.6,tier));},
    playerHealth(state,accessoryHealth=0){const rank=Math.max(0,Math.min(11,Math.floor(Number(state.talentRanks?.vitality)||0)));return Math.min(400000,(1000+1000*rank*rank+Math.max(0,Number(accessoryHealth)||0))*this.ascensionPower(state));},
    vampirismRate(state,accessory=0){return Math.max(0,Math.min(11,Number(state.talentRanks?.drain)||0))*.015+Math.max(0,Math.min(.12,Number(accessory)||0));},
    regeneration(state,accessory=0){const rank=Math.max(0,Math.min(11,Number(state.talentRanks?.regeneration)||0));return state.dead?0:rank*(35+Math.max(0,Number(state.maxHp)||1000)*.001)+Math.max(0,Number(accessory)||0);},
    oreContactDamage(tier){return Math.min(12,Math.pow(1.4,Math.max(0,Math.min(12,Number(tier)||0))));},
    ORE_PROJECTILE_DAMAGE:8,
    armorBonuses(name){return ({'Matéria Vermelha':{damage:.35,speed:.15,haste:.05},Diamante:{damage:.5,speed:.2,haste:.07},Void:{damage:.8,speed:.3,haste:.1},Solar:{damage:1,speed:.4,haste:.15}})[name]||{};},
    cameraBounds(state,equipmentZoom=1){const rank=Math.max(0,Math.min(11,Math.floor(Number(state.talentRanks?.fov)||0)));return {min:Math.max(.08,equipmentZoom/(1+rank*.30)),max:1.4};},
    playerRadius(sizeBonus=0){return 20*(1+Math.max(0,Math.min(2,Number(sizeBonus)||0)));},
    movementSpeed(state,utility={},realm=state.realm){if(state.mount?.speed>0)return Math.min(6000,state.mount.speed);return 240*(1+Math.max(0,Math.min(11,state.talentRanks?.speed||0))*.08+(realm==='cave'?Math.max(0,Math.min(11,state.talentRanks?.sprint||0))*.04:0))*(1+(utility.speed||0))*(1-Math.max(0,Math.min(.75,utility.speedPenalty||0)));},
    summonBoosts(state,utility={}){const rank=id=>Math.max(0,Math.min(11,Number(state.talentRanks?.[id])||0));return {damage:1+rank('broodpower')*.15+(utility.summonDamage||0),health:1+rank('broodvitality')*.20+(utility.summonHealth||0),speed:1+rank('broodspeed')*.12+(utility.summonSpeed||0),haste:1+rank('broodhaste')*.10+(utility.summonHaste||0)};},
    lootChances(tier){if(tier===11)return {quantium:.5,absolut:.2,aleph:.01,same:.000001,none:.289999};return tier>=7&&tier<=10?{twoBelow:.6,oneBelow:.05,same:tier===10?.0003:.01,none:tier===10?.3497:.34}:{twoBelow:0,oneBelow:0,same:1,none:0};},
    lootTier(tier,random=Math.random){if(tier===11){const n=random();return n<.5?9:n<.7?8:n<.71?10:n<.710001?11:-1;}if(tier<7||tier>10)return tier;const n=random(),odds=this.lootChances(tier),lower=odds.twoBelow+odds.oneBelow;return n<odds.twoBelow?tier-2:n<lower?tier-1:n<lower+odds.same?tier:-1;},
    ability(name){return {
      'Matéria Vermelha':{name:'Ruptura rubra',color:'#ff6868',radius:380,mult:2.5,cooldown:10},
      Diamante:{name:'Prisma',color:'#8df4fa',radius:560,mult:3,cooldown:12},
      Void:{name:'Colapso',color:'#a47aff',radius:900,mult:3.5,cooldown:18},
      Solar:{name:'Explosão solar',color:'#ffe07c',radius:1250,mult:4,cooldown:16}
    }[name] || null;},
    oreRadius(name){return ORE_RADII[Math.max(0,NAMES.findIndex(n=>n.toUpperCase()===String(name).toUpperCase()))];},
    gardenOrePositionValid(x,y,radius,worldSize=100000){
      if(!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(radius) || radius<=0)return false;
      const margin=radius+100;
      return x>=margin && y>=margin && x<=worldSize-margin && y<=worldSize-margin && Math.hypot(x-worldSize/2,y-worldSize/2)>=radius+1500;
    },
    orePositionsOverlap(x,y,radius,other){
      return !!other?.rarity && Math.hypot(x-other.x,y-other.y)<radius+this.oreRadius(other.rarity.name)+70;
    }
  };
  if(typeof module!=='undefined' && module.exports)module.exports=catalog;
  else root.GAME_CATALOG=catalog;
})(typeof globalThis!=='undefined' ? globalThis : this);
