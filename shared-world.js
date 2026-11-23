const createRuntime=require('./game-runtime');
const catalog=require('./public/game-catalog');
const expansion=require('./public/expansion');
const atlas=require('./public/map-atlas'),checkpoints=require('./checkpoints'),checkpointCatalog=require('./public/checkpoint-catalog');
const {resolveWorldCollisions,segmentHitsCircle,segmentCircleEntry,SpatialIndex,oreIndex,syncPlayerBody}=require('./world-physics');

const gRarity=(game,tier)=>tier>=0?game.rarities[tier]:null;
const strongestSquadContributor=credits=>{let damage=0;for(const value of credits.values())damage=Math.max(damage,value);return damage;};
const RARE_DENSITY=Object.freeze({7:Object.freeze({mobs:8,ores:3,radius:8000,delay:10000,mobDelay:1000}),8:Object.freeze({mobs:6,ores:2,radius:10000,delay:20000,mobDelay:1500}),9:Object.freeze({mobs:64,ores:2,radius:14000,delay:30000,mobDelay:0,oreChance:.12,wave:16,attempts:520})});
class SharedWorld{
  static densityFor(tier){return RARE_DENSITY[tier]||null;}
  shouldSpawnOre(state,random=Math.random){return atlas.at(this.realm,state.x,state.y).tier!==9||random()<RARE_DENSITY[9].oreChance;}
  naturalCount(type,x,y,tier,limit=Infinity){
    const policy=RARE_DENSITY[tier];if(!policy)return 0;let count=0;
    const counts=e=>e.hp>0&&!e.summoned&&!e.noRewards&&(tier===9?(e.regionTier===9||atlas.at(this.realm,e.x,e.y).tier===9):(Math.hypot(e.x-x,e.y-y)<policy.radius+e.size&&atlas.at(this.realm,e.x,e.y).tier===tier));
    for(const e of (type==='mob'?this.game.mobs:this.game.ores))if(counts(e)&&++count>=limit)return count;
    for(const entry of (type==='mob'?this.dormantMobs:this.dormantOres).values())if(counts(entry.mob||entry.ore)&&++count>=limit)return count;
    return count;
  }
  densityKey(type,x,y,tier){return type+':'+tier+':'+Math.floor(x/8000)+':'+Math.floor(y/8000);}
  canSpawnNatural(type,x,y,now=Date.now()){
    if(!checkpointCatalog.clear(this.realm,x,y,450))return false;
    const tier=atlas.at(this.realm,x,y).tier,policy=RARE_DENSITY[tier];if(!policy)return true;
    if((this.spawnCooldowns.get(this.densityKey(type,x,y,tier))||0)>now)return false;
    const cap=type==='mob'?policy.mobs:policy.ores;
    return this.naturalCount(type,x,y,tier,cap)<cap;
  }
  noteNaturalSpawn(type,entity,now=Date.now()){
    const tier=atlas.at(this.realm,entity.x,entity.y).tier,policy=RARE_DENSITY[tier];entity.regionTier??=tier;if(!policy)return;
    this.spawnCooldowns.set(this.densityKey(type,entity.x,entity.y,tier),now+(type==='mob'?(policy.mobDelay??policy.delay):policy.delay));
    if(this.spawnCooldowns.size>512){for(const [key,until] of this.spawnCooldowns)if(until<=now)this.spawnCooldowns.delete(key);while(this.spawnCooldowns.size>512)this.spawnCooldowns.delete(this.spawnCooldowns.keys().next().value);}
  }
  populateSparseCave(state){
    // A sheltered player still activates the surrounding cave. Each generated
    // entity is checked below, so the camp stays clear without hiding the world.
    if(!checkpointCatalog.near(this.realm,state.x,state.y)&&!this.canSpawnNatural('ore',state.x,state.y)&&!this.canSpawnNatural('mob',state.x,state.y))return;
    const g=this.game,oldOres=new Set(g.ores),oldMobs=new Set(g.mobs),allowOres=this.shouldSpawnOre(state);g.populateCave(state);
    const ores=g.ores.filter(e=>!oldOres.has(e)),mobs=g.mobs.filter(e=>!oldMobs.has(e));g.ores=g.ores.filter(e=>oldOres.has(e));g.mobs=g.mobs.filter(e=>oldMobs.has(e));
    for(const [type,list] of [['ore',ores],['mob',mobs]])for(const entity of list){if((type!=='ore'||allowOres)&&this.canSpawnNatural(type,entity.x,entity.y)){(type==='ore'?g.ores:g.mobs).push(entity);this.noteNaturalSpawn(type,entity);}else{if(type==='ore'){g.forgetDormantOre(entity);const deposit=g.cave.deposits?.find(d=>d.id===entity.id);if(deposit)deposit.spawned=false;}else g.cave.populated.delete(Math.floor(entity.y/500)*g.cave.columns+Math.floor(entity.x/500));}}
  }
  constructor(realm,actors,store,io){
    this.realm=realm;this.actors=actors;this.store=store;this.io=io;this.contributions=new Map();this.squadCredits=new Map();this.drops=[];this.revision=0;this.nextSpawn=0;this.lootRandom=()=>Math.random();this.accessoryRandom=()=>Math.random();this.combatRandom=()=>Math.random();this.solarSuns=[];this.spawnCooldowns=new Map();this.dormantOres=new Map();this.dormantMobs=new Map();this.nextMaintenance=0;this.oreRevision=0;
    this.game=createRuntime(realm,(state,amount,dx,dy,cause)=>this.hurt(state,amount,dx,dy,cause));
    const home=expansion.LANDMARKS.desert.find(p=>p.id==='forge');this.forge=realm==='desert'?{id:'chosen-forge',name:'Coxinha Forjadora',x:home.x,y:home.y,homeX:home.x,homeY:home.y,size:340,roam:1200,speed:42,targetX:home.x,targetY:home.y,angle:0,timer:0}:null;
    this.arcana=new (require('./arcana'))(this);this.equipmentEffects=new (require('./equipment-effects'))(this);
    this.baseMaze=realm==='cave' ? this.game.cave.maze.slice() : null;this.mapVersion=-1;this.mapDelta=[];
  }
  announceSpawn(entity,isMob){
    if(!entity || entity.spawnAnnounced || entity.summoned || entity.noRewards || this.game.rarities.findIndex(r=>r.name===entity.rarity?.name)<10)return;
    entity.spawnAnnounced=true;this.io.emit('rareSpawn',{entity:isMob?entity.name||'Criatura':'Minério',type:isMob?'mob':'minério',rarity:entity.rarity.name,realm:this.realm,biome:this.realm==='cave'?'Caverna':expansion.mapFor(this.realm).name});
  }
  tickForge(dt){const f=this.forge;if(!f)return;const nearby=(this.tickLive||this.live()).find(a=>Math.hypot(a.state.x-f.x,a.state.y-f.y)<f.size+300);if(nearby){f.angle=Math.atan2(nearby.state.y-f.y,nearby.state.x-f.x);return;}f.timer-=dt;const distance=Math.hypot(f.targetX-f.x,f.targetY-f.y);if(f.timer<=0||distance<10){const angle=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*f.roam;f.targetX=f.homeX+Math.cos(angle)*r;f.targetY=f.homeY+Math.sin(angle)*r;f.timer=4+Math.random()*5;}const dx=f.targetX-f.x,dy=f.targetY-f.y,d=Math.hypot(dx,dy)||1,step=Math.min(d,f.speed*dt);f.x+=dx/d*step;f.y+=dy/d*step;f.angle=Math.atan2(dy,dx);}
  canForge(actor){return !!this.forge&&!actor.inLobby&&!actor.state.dead&&actor.state.realm===this.realm&&Math.hypot(actor.state.x-this.forge.x,actor.state.y-this.forge.y)<=this.forge.size+240;}
  active(){return Object.values(this.actors).filter(a=>!a.inLobby && a.state.realm===this.realm);}
  emit(event,data){for(const actor of this.active())if(!Number.isFinite(data?.x) || Math.hypot(data.x-actor.state.x,data.y-actor.state.y)<(actor.viewRadius || 3000)+(data.radius || 0)+400)actor.socket.emit(event,data);}
  live(){return this.active().filter(a=>!a.state.dead);}
  nearest(entity){
    const all=(this.tickLive || this.live()).filter(a=>!this.safe(a.state)),provoked=all.find(a=>a.profile.id===entity.aggroPlayerId);
    if(provoked && Math.hypot(provoked.state.x-entity.x,provoked.state.y-entity.y)<2500+entity.size)return provoked;
    let closest,best=Infinity;for(const actor of all){const d=(actor.state.x-entity.x)**2+(actor.state.y-entity.y)**2;if(d<best){best=d;closest=actor;}}return closest;
  }
  safe(state){return (this.realm!=='cave' && this.game.zone(state.x,state.y)==='P')||checkpointCatalog.near(this.realm,state.x,state.y);}
  hurt(state,amount,dx=0,dy=0,cause='uma criatura'){
    if(state.dead || this.safe(state) || !Number.isFinite(amount) || amount<=0)return false;
    const actor=this.active().find(a=>a.state===state),dodge=this.game.utility(state).dodge||0;
    if(dodge>0&&this.combatRandom()<dodge){if(actor)actor.lastDodge={id:require('crypto').randomUUID(),x:state.x,y:state.y};return false;}
    const damage=Math.max(0,amount*(1-(state.talentRanks?.defense || 0)*.04)*(1-this.game.armor(state)));
    state.hp=Math.max(0,state.hp-damage);state.lastDamageAt=Date.now();
    if(state.hp<=0){state.dead=true;state.deathCause=cause;const result=checkpoints.death(state);if(result.retreated)actor?.socket.emit('checkpointRetreat',{...result.place,message:'Três mortes em cinco minutos: você voltará ao checkpoint anterior.'});}

    if(actor){actor.lastHit={id:require('crypto').randomUUID(),cause,dx,dy};if(state.dead)this.store.save(actor.profile);}
    return true;
  }
  attack(actor,data={}){
    if(!data || typeof data!=='object')return false;
    const state=actor.state,g=this.game,now=Date.now();
    if(actor.inLobby || state.dead || state.realm!==this.realm || this.safe(state) || now<(actor.nextAttack || 0))return false;
    const type=data.type;if(!['weapon','pickaxe'].includes(type) || state.selectedSlot!==(type==='weapon' ? 0 : 2))return false;
    const isMob=type==='weapon',entity=(isMob ? g.mobs : g.ores).find(e=>e.id===data.targetId),tool=state.equipment[type];
    if(!entity || !tool)return false;
    const utility=g.utility(state),surface=g.surface(entity,state),range=175+(state.talentRanks?.range || 0)*18+(utility.range || 0);
    if(Math.hypot(state.x-surface.x,state.y-surface.y)>range+5 || !g.lineClear(state.x,state.y,surface.x,surface.y))return false;
    actor.nextAttack=now+Math.max(70,350*(1-(state.talentRanks?.haste || 0)*.05)*(1-(utility.haste || 0)));
    state.attackUntil=now+180;
    let damage=(10+(isMob ? tool.damage : tool.power))*(1+(state.talentRanks?.damage || 0)*.12)*(isMob ? 1+(utility.damage||0) : 1+(utility.mining || 0));
    if(Math.random()<(state.talentRanks?.crit || 0)*.03)damage*=2;
    this.damage(actor,entity,damage,isMob);

    return true;
  }
  launchSolarSun(actor,ability,damage){
    const angle=actor.state.aimAngle||0,sun={id:require('crypto').randomUUID(),actor,x:actor.state.x,y:actor.state.y,vx:Math.cos(angle)*ability.speed,vy:Math.sin(angle)*ability.speed,radius:ability.radius,life:ability.duration,maxLife:ability.duration,age:0,damage};this.solarSuns.push(sun);
    this.emit('abilityEffect',{id:sun.id,kind:'solarSun',name:ability.name,x:sun.x,y:sun.y,vx:sun.vx,vy:sun.vy,radius:sun.radius,life:sun.life,maxLife:sun.life,color:ability.color,owner:actor.socket.id});
  }
  tickSolarSuns(dt,live){
    for(const sun of this.solarSuns){if(!live.includes(sun.actor)||sun.actor.state.dead){sun.life=0;}else{const used=Math.min(dt,sun.life),x=sun.x+sun.vx*used,y=sun.y+sun.vy*used;if(this.game.lineClear(sun.x,sun.y,x,y)){sun.x=x;sun.y=y;}else if(sun.vx||sun.vy){sun.vx=sun.vy=0;this.emit('abilityEffect',{...sun,actor:undefined,kind:'solarStop',maxLife:sun.life,owner:sun.actor.socket.id});}for(const mob of [...this.game.mobs]){const p=this.game.surface(mob,sun);if(Math.hypot(p.x-sun.x,p.y-sun.y)<=sun.radius&&this.game.lineClear(sun.x,sun.y,p.x,p.y))this.arcana.hit(sun.actor,mob,sun.damage*used,true,sun,'#ffe580');}sun.life-=used;sun.age+=used;}if(sun.life<=0)this.emit('abilityEffect',{id:sun.id,kind:'solarEnd',x:sun.x,y:sun.y});}
    this.solarSuns=this.solarSuns.filter(sun=>sun.life>0);
  }
  ability(actor,type){
    const state=actor.state,g=this.game,now=Date.now(),utility=g.utility(state);
    if(actor.inLobby || state.dead || state.realm!==this.realm || this.safe(state) || !['weapon','pickaxe','utility'].includes(type))return false;
    const item=state.equipment[type],ability=type==='utility' ? utility.active ? utility : null : g.ability(item);
    if(!ability || now<(state.abilityReadyAt[type] || 0))return false;
    state.abilityReadyAt[type]=now+ability.cooldown*1000*(1-(state.talentRanks?.resonance || 0)*.03);state.attackUntil=now+180;
    const power=type==='utility' ? state.equipment.pickaxe?.power || 30 : type==='weapon' ? item.damage : item.power;
    const damage=(power+10)*ability.mult*(1+(state.talentRanks?.damage || 0)*.12+state.level*.02)*(1+(utility.damage||0));
    if(type==='weapon'&&ability.kind==='solarSun'){this.launchSolarSun(actor,ability,damage);this.store.save(actor.profile);actor.socket.emit('playerState',this.store.clientState(actor.profile));return true;}
    if(['solarSystem','voidTrident','darkZone'].includes(ability.kind)){this.equipmentEffects.launch(actor,ability,damage);this.store.save(actor.profile);actor.socket.emit('playerState',this.store.clientState(actor.profile));return true;}
    const targets=type==='weapon' ? g.mobs.map(e=>[e,true]) : type==='pickaxe' ? g.ores.map(e=>[e,false]) : [...g.mobs.map(e=>[e,true]),...g.ores.map(e=>[e,false])];
    for(const [entity,isMob] of targets){
      const surface=g.surface(entity,state);
      if(Math.hypot(surface.x-state.x,surface.y-state.y)>ability.radius || !g.lineClear(state.x,state.y,surface.x,surface.y))continue;
      if(isMob && (item?.name==='Void' || utility.active==='magnet'))g.moveEntity(entity,entity.x+(state.x-entity.x)*.2,entity.y+(state.y-entity.y)*.2,entity.size*.65);
      this.damage(actor,entity,damage,isMob);
    }
    if(item?.name==='Solar')state.hp=Math.min(state.maxHp,state.hp+state.maxHp*.12);
    this.emit('abilityEffect',{...ability,x:state.x,y:state.y,life:1.2,maxLife:1.2,type,owner:actor.socket.id});
    this.store.save(actor.profile);actor.socket.emit('playerState',this.store.clientState(actor.profile));return true;
  }
  damage(actor,entity,amount,isMob,options={}){
    if(entity.hp<=0)return;
    const actual=Math.min(entity.hp,Math.max(0,amount)*catalog.ascensionPower(actor.state)*(isMob && entity.shieldTime>0 ? .25 : 1));
    entity.hp-=actual;
    if(actual>0&&!actor.state.dead){const rate=catalog.vampirismRate(actor.state,this.game.utility(actor.state).vampirism);actor.state.hp=Math.min(actor.state.maxHp,actor.state.hp+actual*rate);}
    if(!isMob)this.oreRevision++;
    if(isMob){entity.aggroUntil=Date.now()+12000;entity.aggroPlayerId=actor.profile.id;}
    if(!this.contributions.has(entity.id))this.contributions.set(entity.id,new Map());
    const ledger=this.contributions.get(entity.id);ledger.set(actor.profile.id,(ledger.get(actor.profile.id)||0)+actual);
    const squad=this.squads?.groupFor(actor.profile.id);
    if(squad&&!actor.profile.developerTest){
      if(!this.squadCredits.has(entity.id))this.squadCredits.set(entity.id,new Map());
      const groups=this.squadCredits.get(entity.id);if(!groups.has(squad.id))groups.set(squad.id,new Map());
      const credit=groups.get(squad.id);for(const id of squad.members){if(!credit.has(id))credit.set(id,new Map());const sources=credit.get(id);sources.set(actor.profile.id,(sources.get(actor.profile.id)||0)+actual);}
    }
    const surface=this.game.surface(entity,actor.state);
    if(!options.silentHit)this.emit('entityHit',{id:entity.id,x:surface.x,y:surface.y,color:entity.rarity.color,damage:actual,hp:entity.hp,isMob});
    if(entity.hp>0)return;
    if(isMob)this.game.removeMobAndSummons(entity);else this.game.ores=this.game.ores.filter(e=>e.id!==entity.id);
    if(!entity.noRewards && !entity.summoned){
      const tier=Math.max(0,this.game.rarities.findIndex(r=>r.name===entity.rarity.name)),lootTier=isMob?catalog.lootTier(tier,this.lootRandom):tier;
      const awards=new Map();
      for(const [id,damage] of ledger)if(damage/entity.maxHp>=.05-1e-12)awards.set(id,{share:damage/entity.maxHp,shared:false,squadShare:0});
      for(const [groupId,credits] of this.squadCredits.get(entity.id) || [])for(const [id,sources] of credits){
        const damage=strongestSquadContributor(sources);
        const member=this.live().find(a=>a.profile.id===id),current=this.squads?.groupFor(id);
        if(damage/entity.maxHp>=.05-1e-12 && member && current?.id===groupId && Math.hypot(member.state.x-entity.x,member.state.y-entity.y)<=entity.size+2500)awards.set(id,{share:(ledger.get(id)||0)/entity.maxHp,shared:true,squadShare:damage/entity.maxHp});
      }
      if(isMob&&!actor.profile.developerTest&&!entity.summoned&&!entity.noRewards&&tier>=7)this.io.emit('bossDefeated',{name:actor.name,entity:entity.name,rarity:entity.rarity.name,percent:(ledger.get(actor.profile.id)||0)/entity.maxHp*100,realm:this.realm});
      for(const [id,participation] of awards){
        const profile=this.store.find(id);if(!profile)continue;
        {
          const state=profile.state;const reward=catalog.experienceReward(entity.rarity.name,isMob)*(1+this.game.utility(state).xp)*(1+catalog.ascensions(state)*.1);state.journal.experienceEarned=(state.journal.experienceEarned||0)+reward;state.xp+=reward*(1+(state.talentRanks?.xp || 0)*.1)*(this.realm==='cave' ? 1.8+(state.talentRanks?.spelunker || 0)*.12 : 1);
          state.coins+=Math.round(5*Math.pow(1.8,tier));
          const tiers=isMob?'killTiers':'oreTiers';state.journal[tiers] ||= {};const galleryKey=isMob?entity.kind+':'+entity.rarity.name:entity.rarity.name;state.journal[tiers][galleryKey]=(state.journal[tiers][galleryKey]||0)+1;if(isMob){state.journal.biomeKills ||= {};const biome=this.realm;state.journal.biomeKills[biome]=(state.journal.biomeKills[biome]||0)+1;}
          const key=isMob ? 'kills' : 'mined';state.journal[key]=(state.journal[key] || 0)+1;
          if(!isMob && tier>=8)state.journal.bossKills=(state.journal.bossKills || 0)+1;
          this.game.levelUp(state);this.game.achievements(state);this.store.save(profile);
          for(const same of Object.values(this.actors).filter(a=>a.profile.id===id))same.socket.emit('playerState',this.store.clientState(profile));
        }
        const record=Object.values(this.actors).find(a=>a.profile.id===id);
        record?.socket.emit('lootResult',{entity:entity.name || 'Pedra',rarity:entity.rarity.name,qualified:true,itemDropped:lootTier>=0,dropRarity:gRarity(this.game,lootTier)?.name||null,...participation});
      }
      for(const [id,damage] of ledger)if(!awards.has(id))Object.values(this.actors).find(a=>a.profile.id===id)?.socket.emit('lootResult',{entity:entity.name || 'Pedra',rarity:entity.rarity.name,qualified:false,share:damage/entity.maxHp});
      if(awards.size){
        const rarity=gRarity(this.game,lootTier);
        if(rarity){const point=isMob?entity:this.game.surface(entity,actor.state),items=[];
          if(isMob){items.push({type:'component',kind:entity.kind,name:this.game.lootName(entity.kind),rarity:rarity.name,color:rarity.color,amount:1});const pool=expansion.ACCESSORIES.filter(a=>a.kind===entity.kind),definition=pool[Math.min(pool.length-1,Math.floor(this.accessoryRandom()*pool.length))];if(definition){const accessory=expansion.accessory(definition.id,rarity.name);if(accessory)items.push(accessory);}if(entity.kind==='invertedBeetle'&&definition?.id!=='revival')items.push(expansion.accessory('revival',rarity.name));}
          else items.push({type:'material',name:rarity.name,oreRarity:rarity.name,rarity:rarity.name,color:rarity.color,amount:1});
          items.forEach((item,index)=>this.drops.push({id:'drop-'+require('crypto').randomUUID(),x:point.x+index*32,y:point.y,item,createdAt:Date.now(),expiresAt:Date.now()+180000,claims:new Set(awards.keys())}));
        }
      }
    }
    this.contributions.delete(entity.id);
    this.squadCredits.delete(entity.id);
    if(!isMob && Math.random()<.28 && this.game.mobs.length<180){
      if(this.canSpawnNatural('mob',entity.x,entity.y)){const mob=this.game.createCreature('guardian',entity.rarity,entity.x,entity.y);this.game.mobs.push(mob);this.noteNaturalSpawn('mob',mob);this.announceSpawn(mob,true);}
    }
  }
  spawnAround(actor){
    const g=this.game,state=actor.state;g.bind(state);
    if(this.realm==='cave'){this.populateSparseCave(state);g.ores=g.ores.filter(o=>this.portalClear(o));for(const ore of g.ores)this.announceSpawn(ore,false);for(const mob of g.mobs)this.announceSpawn(mob,true);this.spawnTerritoryMobs(actor);return;}
    this.spawnTerritoryMobs(actor);
    if(atlas.at(this.realm,state.x,state.y).tier===8)this.addBoss('ABSOLUT',actor);
    if(!this.shouldSpawnOre(state))return;
    const index=oreIndex(this);
    for(let x=state.x-2000;x<state.x+2000;x+=600)for(let y=state.y-2000;y<state.y+2000;y+=600){
      const cx=Math.floor(x/600),cy=Math.floor(y/600),key=cx+','+cy;
      if((this.oreCellCounts.get(key) || 0)>=4||!this.canSpawnNatural('ore',cx*600+300,cy*600+300))continue;
      const nearby=[...index.query(cx*600+300,cy*600+300,2400)],ore=g.spawnGardenCell(cx,cy,nearby);
      if(ore && (!this.canSpawnNatural('ore',ore.x,ore.y)||!this.portalClear(ore)||this.live().some(a=>Math.hypot(a.state.x-ore.x,a.state.y-ore.y)<ore.size+350)||(this.forge && Math.hypot(ore.x-this.forge.homeX,ore.y-this.forge.homeY)<ore.size+this.forge.roam+800))){g.ores=g.ores.filter(o=>o!==ore);continue;}
      if(ore){this.noteNaturalSpawn('ore',ore);this.announceSpawn(ore,false);index.insert({id:ore.id,x:ore.x,y:ore.y,radius:ore.size,rarity:ore.rarity,state:ore});this.oreCellCounts.set(key,(this.oreCellCounts.get(key) || 0)+1);this.physicsOreCount=g.ores.length;}
    }
    if(atlas.at(this.realm,state.x,state.y).tier===8 && Math.random()<.01)this.addBoss('QUANTIUM',actor);
    if(atlas.at(this.realm,state.x,state.y).tier===9)this.addBoss(g.rarities[atlas.rollTier(9)].name,actor);
  }
  spawnTerritoryMobs(actor){
    const g=this.game,s=actor.state,region=atlas.at(this.realm,s.x,s.y),target=RARE_DENSITY[region.tier]?.mobs||12;
    const swarm=region.tier===9,rare=region.tier===7||region.tier===8,policy=RARE_DENSITY[region.tier],areaRadius=swarm?11000:rare?6500:4000,random=this.spawnRandom||Math.random;
    if((swarm||rare)&&this.naturalCount('mob',s.x,s.y,region.tier,target)>=target)return;
    let nearby=g.mobs.filter(m=>m.hp>0&&!m.summoned&&Math.hypot(m.x-s.x,m.y-s.y)<areaRadius+m.size).length,spawned=0;
    for(let attempt=0;attempt<(swarm?policy.attempts:rare?160:90)&&nearby<target&&spawned<(swarm?policy.wave:rare?3:Infinity)&&g.mobs.length<180;attempt++){
      const angle=random()*Math.PI*2,distance=swarm?1800+random()**2*8200:rare?900+random()**.65*(region.tier===7?3000:4000):(region.safe?1600:500)+random()*1500,x=s.x+Math.cos(angle)*distance,y=s.y+Math.sin(angle)*distance,area=atlas.at(this.realm,x,y),tier=area.tier===9?catalog.mobSpawnTier(9,random):atlas.roll(this.realm,x,y,random);
      if((swarm||rare)&&area.tier!==region.tier)continue;
      if(tier<0||!area.open||!this.canSpawnNatural('mob',x,y))continue;
      const pool=atlas.pool(this.realm,area.tier),definition=pool[Math.floor(random()*pool.length)],kind=definition==='beetle'&&random()<.00025?'invertedBeetle':definition,mob=g.createCreature(kind,g.rarities[tier],x,y);
      if(!checkpointCatalog.clear(this.realm,x,y,mob.size+450)||Math.hypot(x-s.x,y-s.y)<mob.size+500||g.ores.some(o=>Math.hypot(o.x-x,o.y-y)<o.size+mob.size*.75)||g.mobs.some(o=>Math.hypot(o.x-x,o.y-y)<(o.size+mob.size)*.75))continue;
      if(this.realm==='cave'){
        if(x<mob.size+600||y<mob.size+600||x>g.cave.width-mob.size-600||y>g.cave.height-mob.size-600)continue;
        if(!g.tileOpen(Math.floor(x/500),Math.floor(y/500)))continue;
        if(g.wall(x,y,mob.size*.75))g.carveChamber(x,y,mob.size+550);
        if(g.wall(x,y,mob.size*.75))continue;
      }else if(!catalog.gardenOrePositionValid(x,y,mob.size,atlas.SIZE)||atlas.blocked(this.realm,x,y,mob.size*.75))continue;
      mob.regionTier=area.tier;g.mobs.push(mob);this.noteNaturalSpawn('mob',mob);this.announceSpawn(mob,true);nearby++;spawned++;
    }
  }
  addBoss(name,actor){
    const g=this.game,rarity=g.rarities.find(r=>r.name===name),spacing=name==='ABSOLUT'?7500:22000;if(!rarity||g.ores.filter(o=>o.isBoss).length>=96||g.ores.some(o=>o.rarity.name===name&&(!actor||Math.hypot(o.x-actor.state.x,o.y-actor.state.y)<spacing+o.size)))return;
    const size=catalog.oreRadius(name),desired=name==='SUPER'?7:['QUANTIUM','ALEPH'].includes(name)?9:8;
    for(let n=0;n<36;n++){
      const a=Math.random()*Math.PI*2,d=size+2000+Math.random()*3000,x=actor?actor.state.x+Math.cos(a)*d:size+500+Math.random()*(atlas.SIZE-size*2-1000),y=actor?actor.state.y+Math.sin(a)*d:size+500+Math.random()*(atlas.SIZE-size*2-1000);
      if(atlas.at(this.realm,x,y).tier!==desired||!this.canSpawnNatural('ore',x,y)||atlas.blocked(this.realm,x,y,size)||!catalog.gardenOrePositionValid(x,y,size,atlas.SIZE)||!this.portalClear({x,y,size})||g.ores.some(o=>Math.hypot(o.x-x,o.y-y)<o.size+size+150)||g.mobs.some(m=>Math.hypot(m.x-x,m.y-y)<m.size+size+150)||this.live().some(a=>Math.hypot(a.state.x-x,a.state.y-y)<size+500))continue;
      if(this.forge&&Math.hypot(x-this.forge.homeX,y-this.forge.homeY)<size+this.forge.roam+800)continue;
      const ore={id:'ore-'+require('crypto').randomUUID(),x,y,size,hp:rarity.hp,maxHp:rarity.hp,rarity,isBoss:true};g.ores.push(ore);this.noteNaturalSpawn('ore',ore);this.announceSpawn(ore,false);return ore;
    }
  }
  portalClear(entity){return checkpointCatalog.clear(this.realm,entity.x,entity.y,entity.size+100)&&expansion.portalsFor(this.realm).every(p=>Math.hypot(entity.x-p.x,entity.y-p.y)>entity.size+p.r+220);}
  maintainActiveAreas(live,now=Date.now()){
    if(now<this.nextMaintenance)return;this.nextMaintenance=now+1000;
    const g=this.game,near=ore=>live.some(a=>Math.hypot(ore.x-a.state.x,ore.y-a.state.y)<Math.max(5000,(a.viewRadius || 3000)+1200)+ore.size),important=ore=>ore.isBoss || g.rarities.findIndex(r=>r.name===ore.rarity?.name)>=7;
    let changed=false,keptBosses=0;const kept=[];
    for(const ore of g.ores){if(near(ore)||(important(ore)&&keptBosses++<12))kept.push(ore);else{this.dormantOres.set(ore.id,{ore,since:now});changed=true;}}
    for(const [id,entry] of this.dormantOres){
      if(entry.ore.hp<=0 || now-entry.since>600000){g.forgetDormantOre(entry.ore);this.dormantOres.delete(id);continue;}
      if(near(entry.ore)){kept.push(entry.ore);this.dormantOres.delete(id);changed=true;}
    }
    while(this.dormantOres.size>4000){const id=this.dormantOres.keys().next().value;g.forgetDormantOre(this.dormantOres.get(id).ore);this.dormantOres.delete(id);}
    if(changed)g.ores=kept;
    const mobNear=mob=>live.some(a=>Math.hypot(a.state.x-mob.x,a.state.y-mob.y)<Math.max(7000,(a.viewRadius||3000)+1000)+mob.size),awake=[];
    for(const mob of g.mobs){if(mobNear(mob)||mob.summoned)awake.push(mob);else this.dormantMobs.set(mob.id,{mob,since:now});}
    for(const [id,entry] of this.dormantMobs){if(now-entry.since>600000||entry.mob.hp<=0){this.dormantMobs.delete(id);continue;}if(mobNear(entry.mob)){awake.push(entry.mob);this.dormantMobs.delete(id);}}
    while(this.dormantMobs.size>256)this.dormantMobs.delete(this.dormantMobs.keys().next().value);g.mobs=awake;
    const existing=new Set([...g.ores,...g.mobs,...[...this.dormantMobs.values()].map(entry=>entry.mob),...[...this.dormantOres.values()].map(entry=>entry.ore)].map(e=>e.id)),mobs=new Set(g.mobs.map(m=>m.id));
    for(const ledger of [this.contributions,this.squadCredits])for(const id of ledger.keys())if(!existing.has(id))ledger.delete(id);
    for(const actor of this.active()){
      if(actor.seenCreatures)for(const id of actor.seenCreatures)if(!mobs.has(id))actor.seenCreatures.delete(id);
      for(const key of Object.keys(actor.contacts || {}))if(actor.contacts[key]<=now)delete actor.contacts[key];
    }
  }
  tick(dt=.05){
    const g=this.game,live=this.live(),now=Date.now();for(const a of live)syncPlayerBody(this,a.state);
    this.tickLive=live;this.tickForge(dt);this.tickSolarSuns(dt,live);this.equipmentEffects.tick(dt,live);
    if(!live.length){this.arcana.tick(dt);this.drops=this.drops.filter(d=>d.expiresAt>now && d.claims.size);this.tickLive=null;return;}
    this.maintainActiveAreas(live,now);
    if(now>this.nextSpawn){this.nextSpawn=now+1000;for(const actor of live)this.spawnAround(actor);if(this.realm!=='cave'){if(Math.random()<.005)this.addBoss('SUPER');if(Math.random()<.0025)this.addBoss('ABSOLUT');if(Math.random()<.000075)this.addBoss('QUANTIUM');if(Math.random()<.0000005)this.addBoss('ALEPH');}}
    const parents=new Set(g.mobs.filter(m=>!m.summoned && m.hp>0).map(m=>m.id));
    g.mobs=g.mobs.filter(m=>m.hp>0 && (m.isBoss || live.some(a=>Math.hypot(a.state.x-m.x,a.state.y-m.y)<Math.max(7000,(a.viewRadius||3000)+1000)+m.size)) && (!m.summoned || (parents.has(m.summonerId) && now<m.expiresAt)));
    for(const mob of [...g.mobs]){
      const actor=this.nearest(mob);if(!actor)continue;
      if(Math.hypot(actor.state.x-mob.x,actor.state.y-mob.y)>4500+mob.size)continue;
      g.moveMob(mob,actor.state,dt);if(mob.kind==='sandTornado'||mob.kind==='iceTornado'){for(const target of live){const dx=mob.x-target.state.x,dy=mob.y-target.state.y,d=Math.hypot(dx,dy);if(d<mob.size+180&&!this.safe(target.state)){const force=(1-expansion.bonuses(target.state).slowResist)*Math.min(190,d)*dt*expansion.TORNADO_PULL_SCALE;g.moveEntity(target.state,target.state.x+dx/(d||1)*force,target.state.y+dy/(d||1)*force,target.state.size||20);if(mob.kind==='iceTornado')target.state.slowUntil=now+800;this.hurt(target.state,mob.damage*.6*dt,-dx,-dy,mob.name+' '+mob.rarity.name);}}}
      const before=g.effects.length;g.bossStep(mob,actor.state,dt);
      for(const effect of g.effects.slice(before))if(effect.kind==='pulse')for(const target of live)if(Math.hypot(target.state.x-effect.x,target.state.y-effect.y)<effect.radius+(target.state.size||20) && g.lineClear(mob.x,mob.y,target.state.x,target.state.y))this.hurt(target.state,mob.damage*.85,target.state.x-mob.x,target.state.y-mob.y,mob.name+' '+mob.rarity.name+' · impacto');
    }
    g.tickEffects(dt);
    if(this.realm!=='cave')for(const ore of g.ores){
      if(!g.rarities.slice(7).some(r=>r.name===ore.rarity.name))continue;
      const near=this.nearest(ore);if(!near || Math.hypot(near.state.x-ore.x,near.state.y-ore.y)>ore.size+1800 || this.safe(near.state))continue;
      ore.shotTimer=(ore.shotTimer ?? 1.7)-dt;
      if(ore.shotTimer<=0){ore.shotTimer=1.5;const tier=g.rarities.findIndex(r=>r.name===ore.rarity.name)-7,count=Math.min(600-g.projectiles.length,20+tier*8),aim=Math.atan2(near.state.y-ore.y,near.state.x-ore.x),spread=Math.min(1.5,1400/ore.size);for(let n=0;n<count;n++){const angle=aim+(n/Math.max(1,count-1)-.5)*spread,heading=aim+(n/Math.max(1,count-1)-.5)*1.8;g.projectiles.push({owner:ore.id,cause:'Pedra '+ore.rarity.name,x:ore.x+Math.cos(angle)*(ore.size+18),y:ore.y+Math.sin(angle)*(ore.size+18),vx:Math.cos(heading)*700,vy:Math.sin(heading)*700,r:12,life:4,damage:catalog.ORE_PROJECTILE_DAMAGE,rotation:heading,kind:'stone'});}}
    }
    const owners=new Set([...g.ores,...g.mobs].map(e=>e.id));
    const projectileBodies=new SpatialIndex();
    for(const m of this.arcana.projectileTargets())projectileBodies.insert({state:m,x:m.x,y:m.y,radius:m.size,ally:true});
    for(const a of live)projectileBodies.insert({state:a.state,actor:a,x:a.state.x,y:a.state.y,radius:a.state.size||20});
    for(const projectile of g.projectiles){
      if(!projectile.id){this.projectileSeq=(this.projectileSeq || 0)+1;projectile.id=this.realm+':'+this.projectileSeq;}
      const previousX=projectile.x,previousY=projectile.y;
      projectile.x+=projectile.vx*dt;projectile.y+=projectile.vy*dt;projectile.life-=dt;
      if(this.realm==='cave' && !g.tileOpen(Math.floor(projectile.x/500),Math.floor(projectile.y/500)))projectile.life=0;
      if(this.realm!=='cave' && atlas.blocked(this.realm,projectile.x,projectile.y,projectile.r))projectile.life=0;
      if(projectile.life>0){let first=null,best=Infinity;const radius=Math.hypot(projectile.x-previousX,projectile.y-previousY)/2+projectile.r+1;
       for(const body of projectileBodies.query((previousX+projectile.x)/2,(previousY+projectile.y)/2,radius)){if(body.state.hp<=0||body.state.dead)continue;const at=segmentCircleEntry(previousX,previousY,projectile.x,projectile.y,body.state.x,body.state.y,projectile.r+body.radius);if(at!==null&&at<best){best=at;first=body;}}
       if(first){projectile.x=previousX+(projectile.x-previousX)*best;projectile.y=previousY+(projectile.y-previousY)*best;if(first.ally)this.arcana.hurtSummon(first.state,projectile.damage);else this.hurt(first.state,projectile.damage,projectile.vx,projectile.vy,'projétil de '+projectile.cause);projectile.life=0;}
      }
    }
    g.projectiles=g.projectiles.filter(p=>p.life>0 && owners.has(p.owner)).slice(-600);
    for(const actor of live){
      const s=actor.state;actor.contacts=actor.contacts || {};
      g.tickPlayer(s);checkpoints.visit(actor,this,now);
      for(const mob of g.mobs)if(Math.hypot(mob.x-s.x,mob.y-s.y)<mob.size*.8+(s.size||20) && now>(actor.contacts[mob.id] || 0)){this.hurt(s,mob.damage,s.x-mob.x,s.y-mob.y,mob.name+' '+mob.rarity.name);actor.contacts[mob.id]=now+1000;}
      for(const ore of g.ores)if(Math.hypot(ore.x-s.x,ore.y-s.y)<=ore.size+24)this.hurt(s,catalog.oreContactDamage(g.rarities.findIndex(r=>r.name===ore.rarity.name))*dt,s.x-ore.x,s.y-ore.y,'Pedra '+ore.rarity.name);
      for(const hazard of g.hazards){const key='acid:'+hazard.owner+':'+hazard.x+':'+hazard.y;
        if(now>(actor.contacts[key] || 0) && Math.hypot(hazard.x-s.x,hazard.y-s.y)<hazard.radius+(s.size||20) && g.lineClear(hazard.x,hazard.y,s.x,s.y)){this.hurt(s,hazard.damage,s.x-hazard.x,s.y-hazard.y,hazard.cause);actor.contacts[key]=now+800;}
      }
      if(this.safe(s))s.hp=Math.min(s.maxHp,s.hp+s.maxHp*.04*dt);else s.hp=Math.min(s.maxHp,s.hp+catalog.regeneration(s,g.utility(s).regen)*dt);
    }
    this.arcana.tick(dt);resolveWorldCollisions(this,this.live());this.arcana.syncMounts();
    for(const actor of live)this.collectDrops(actor,now);
    this.drops=this.drops.filter(d=>d.expiresAt>now && d.claims.size).slice(-512);
    this.tickLive=null;this.revision++;
  }
  collectDrops(actor,now=Date.now()){
    if(actor.inLobby || actor.state.dead)return;const state=actor.state,utility=this.game.utility(state),normalRadius=75+Math.min(1000,(utility.pickup || 0)+(utility.range || 0)*.9),radius=Math.max(normalRadius,utility.magnetRadius||0),magnetic=utility.magnetRadius>0,collected=[];let changed=false;
    for(const drop of this.drops){if(!drop.claims.has(actor.profile.id) || now-drop.createdAt<450 || drop.expiresAt<=now || Math.hypot(state.x-drop.x,state.y-drop.y)>radius || (!magnetic&&!this.game.lineClear(state.x,state.y,drop.x,drop.y)))continue;
      drop.claims.delete(actor.profile.id);const item={...drop.item};if((item.rarity||item.oreRarity)==='CHOSEN')item.chosenDropId=require('node:crypto').randomUUID();
      if(item.type==='material')this.game.giveMaterial(state,this.game.rarities.find(r=>r.name===item.oreRarity),item.amount);
      else if(item.type==='accessory')expansion.add(state,item);
      else expansion.add(state,{...item,id:item.kind+'_'+item.rarity});
      state.journal.materialsCollected=(state.journal.materialsCollected||0)+item.amount;if(item.type==='material')state.journal.stonesCollected=(state.journal.stonesCollected||0)+item.amount;
      collected.push({id:drop.id,item,x:drop.x,y:drop.y});changed=true;
    }
    if(changed){if(magnetic&&collected.length>1)actor.socket.emit('dropsCollected',{drops:collected.slice(-24),count:collected.length});else for(const drop of collected)actor.socket.emit('dropCollected',drop);this.store.save(actor.profile);actor.socket.emit('playerState',this.store.clientState(actor.profile));}
  }
  orePacket(actor,clean){
    const g=this.game,s=actor.state;
    if(this.oreSource!==g.ores || this.oreCount!==g.ores.length){this.oreSource=g.ores;this.oreCount=g.ores.length;this.oreRevision++;}
    if(!actor.oreCacheEnabled)return {ores:g.ores.filter(e=>e.isBoss || Math.hypot(e.x-s.x,e.y-s.y)<(actor.viewRadius || 3000)+e.size).map(clean)};
    const x=Math.floor(s.x/400)*400+200,y=Math.floor(s.y/400)*400+200,radius=Math.ceil((actor.viewRadius || 3000)/200)*200+500,key=x+':'+y+':'+radius+':'+this.oreRevision;
    if(actor.oreCacheKey!==key){actor.oreCacheKey=key;actor.oreSeq=(actor.oreSeq || 0)+1;actor.orePending={seq:actor.oreSeq,ores:g.ores.filter(e=>e.isBoss || Math.hypot(e.x-x,e.y-y)<radius+e.size).map(clean)};}
    return {oreSeq:actor.orePending.seq,ores:actor.oreAck===actor.orePending.seq ? undefined : actor.orePending.ores};
  }
  snapshot(actor){
    const s=actor.state,near=e=>Math.hypot(e.x-s.x,e.y-s.y)<(actor.viewRadius || 3000)+(e.size || e.radius || 0),g=this.game;
    const clean=e=>({id:e.id,x:e.x,y:e.y,size:e.size,hp:e.hp,maxHp:e.maxHp,rarity:e.rarity,isBoss:e.isBoss,kind:e.kind,name:e.name,angle:e.angle,walkPhase:e.walkPhase,moving:e.moving,summoned:e.summoned,shieldTime:e.shieldTime,bossAction:e.bossAction});
    actor.seenCreatures=actor.seenCreatures || new Set();
    for(const mob of g.mobs.filter(near))if(!mob.summoned && !actor.seenCreatures.has(mob.id)){
      actor.seenCreatures.add(mob.id);const key=mob.kind+':'+mob.rarity.name;actor.state.journal.species[key]=(actor.state.journal.species[key] || 0)+1;
    }
    const entities=new Map([...g.ores,...g.mobs].map(e=>[e.id,e]));
    const contribution={};for(const [id,ledger] of this.contributions){const entity=entities.get(id);if(entity && ledger.has(actor.profile.id))contribution[id]=ledger.get(actor.profile.id)/entity.maxHp;}
    const squadContribution={},team=this.squads?.groupFor(actor.profile.id);
    if(team)for(const [id,groups] of this.squadCredits){const entity=entities.get(id),credit=groups.get(team.id)?.get(actor.profile.id);if(entity && credit)squadContribution[id]=strongestSquadContributor(credit)/entity.maxHp;}
    if(this.baseMaze && this.mapVersion!==(g.cave.revision || 0)){this.mapVersion=g.cave.revision || 0;this.mapDelta=[];for(let i=0;i<this.baseMaze.length;i++)if(g.cave.maze[i] && !this.baseMaze[i])this.mapDelta.push(i);}
    return {size:s.size,checkpoint:checkpoints.summary(s),playerHit:actor.lastHit,playerDodge:actor.lastDodge,equipmentEffects:this.equipmentEffects.snapshot(actor),solarSuns:this.solarSuns.filter(near).map(({actor,...sun})=>({...sun,owner:actor.socket.id,kind:'solarSun',maxLife:sun.life})),...this.arcana.snapshot(actor),forge:this.forge&&near(this.forge)?{id:this.forge.id,name:this.forge.name,x:this.forge.x,y:this.forge.y,size:this.forge.size,angle:this.forge.angle}:null,slowUntil:s.slowUntil||0,realm:this.realm,revision:this.revision,serverTime:Date.now(),self:{x:s.x,y:s.y,vx:s.vx || 0,vy:s.vy || 0,seq:actor.moveSeq || 0,epoch:actor.movementEpoch || 1},mapVersion:this.mapVersion,mapDelta:actor.mapAckRealm===this.realm && actor.mapAckVersion===this.mapVersion ? undefined : this.mapDelta,...this.orePacket(actor,clean),mobs:g.mobs.filter(near).map(clean),projectiles:g.projectiles.filter(near).map(p=>({id:p.id,owner:p.owner,x:p.x,y:p.y,vx:p.vx,vy:p.vy,r:p.r,life:p.life,rotation:p.rotation,kind:p.kind})),hazards:g.hazards.filter(near),effects:g.effects.filter(near),drops:this.drops.filter(near).map(d=>({id:d.id,x:d.x,y:d.y,item:d.item,createdAt:d.createdAt,expiresAt:d.expiresAt,eligible:d.claims.has(actor.profile.id)})),contribution,squadContribution,hp:s.hp,maxHp:s.maxHp,dead:s.dead,deathCause:s.deathCause};
  }
}
module.exports=SharedWorld;
