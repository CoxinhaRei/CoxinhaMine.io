const createRuntime=require('./game-runtime');
const catalog=require('./public/game-catalog');

class SharedWorld{
  constructor(realm,actors,store,io){
    this.realm=realm;this.actors=actors;this.store=store;this.io=io;this.contributions=new Map();this.squadCredits=new Map();this.revision=0;this.nextSpawn=0;
    this.game=createRuntime(realm,(state,amount,dx,dy,cause)=>this.hurt(state,amount,dx,dy,cause));
    this.baseMaze=realm==='cave' ? this.game.cave.maze.slice() : null;this.mapVersion=-1;this.mapDelta=[];
  }
  active(){return Object.values(this.actors).filter(a=>!a.inLobby && a.state.realm===this.realm);}
  emit(event,data){for(const actor of this.active())actor.socket.emit(event,data);}
  live(){return this.active().filter(a=>!a.state.dead);}
  nearest(entity){
    const all=this.live(),provoked=all.find(a=>a.profile.id===entity.aggroPlayerId);
    if(provoked && Math.hypot(provoked.state.x-entity.x,provoked.state.y-entity.y)<2500+entity.size)return provoked;
    return all.sort((a,b)=>Math.hypot(a.state.x-entity.x,a.state.y-entity.y)-Math.hypot(b.state.x-entity.x,b.state.y-entity.y))[0];
  }
  safe(state){return this.realm==='garden' && this.game.zone(state.x,state.y)==='P';}
  hurt(state,amount,dx=0,dy=0,cause='uma criatura'){
    if(state.dead || this.safe(state) || Date.now()<(state.hurtUntil || 0))return false;
    const damage=Math.max(1,amount*(1-(state.talentRanks?.defense || 0)*.04)*(1-this.game.armor(state)));
    state.hp=Math.max(0,state.hp-damage);state.hurtUntil=Date.now()+600;
    if(state.hp<=0){state.dead=true;state.deathCause=cause;}
    const actor=this.active().find(a=>a.state===state);
    if(actor){actor.socket.emit('playerDamage',{hp:state.hp,maxHp:state.maxHp,dead:state.dead,cause,dx,dy});if(state.dead)this.store.save(actor.profile);}
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
    let damage=(10+(isMob ? tool.damage : tool.power))*(1+(state.talentRanks?.damage || 0)*.12)*(isMob ? 1 : 1+(utility.mining || 0));
    if(Math.random()<(state.talentRanks?.crit || 0)*.03)damage*=2;
    this.damage(actor,entity,damage,isMob);
    state.hp=Math.min(state.maxHp,state.hp+damage*(state.talentRanks?.drain || 0)*.01);
    return true;
  }
  ability(actor,type){
    const state=actor.state,g=this.game,now=Date.now(),utility=g.utility(state);
    if(actor.inLobby || state.dead || state.realm!==this.realm || this.safe(state) || !['weapon','pickaxe','utility'].includes(type))return false;
    const item=state.equipment[type],ability=type==='utility' ? utility.active ? utility : null : g.ability(item);
    if(!ability || now<(state.abilityReadyAt[type] || 0))return false;
    state.abilityReadyAt[type]=now+ability.cooldown*1000*(1-(state.talentRanks?.resonance || 0)*.03);state.attackUntil=now+180;
    const power=type==='utility' ? state.equipment.pickaxe?.power || 30 : type==='weapon' ? item.damage : item.power;
    const damage=(power+10)*ability.mult*(1+(state.talentRanks?.damage || 0)*.12+state.level*.02);
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
  damage(actor,entity,amount,isMob){
    if(entity.hp<=0)return;
    const actual=Math.min(entity.hp,Math.max(0,amount)*(isMob && entity.shieldTime>0 ? .25 : 1));
    entity.hp-=actual;
    if(isMob){entity.aggroUntil=Date.now()+12000;entity.aggroPlayerId=actor.profile.id;}
    if(!this.contributions.has(entity.id))this.contributions.set(entity.id,new Map());
    const ledger=this.contributions.get(entity.id);ledger.set(actor.profile.id,(ledger.get(actor.profile.id)||0)+actual);
    const squad=this.squads?.groupFor(actor.profile.id);
    if(squad){
      if(!this.squadCredits.has(entity.id))this.squadCredits.set(entity.id,new Map());
      const groups=this.squadCredits.get(entity.id);if(!groups.has(squad.id))groups.set(squad.id,new Map());
      const credit=groups.get(squad.id);for(const id of squad.members)credit.set(id,(credit.get(id)||0)+actual);
    }
    const surface=this.game.surface(entity,actor.state);
    this.emit('entityHit',{id:entity.id,x:surface.x,y:surface.y,color:entity.rarity.color,damage:actual,hp:entity.hp,isMob});
    if(entity.hp>0)return;
    if(isMob)this.game.removeMobAndSummons(entity);else this.game.ores=this.game.ores.filter(e=>e.id!==entity.id);
    if(!entity.noRewards && !entity.summoned){
      const tier=Math.max(0,this.game.rarities.findIndex(r=>r.name===entity.rarity.name));
      const awards=new Map();
      for(const [id,damage] of ledger)if(damage/entity.maxHp>=.05-1e-12)awards.set(id,{share:damage/entity.maxHp,shared:false,squadShare:0});
      for(const [groupId,credits] of this.squadCredits.get(entity.id) || [])for(const [id,damage] of credits){
        const member=this.live().find(a=>a.profile.id===id),current=this.squads?.groupFor(id);
        if(damage/entity.maxHp>=.05-1e-12 && member && current?.id===groupId && Math.hypot(member.state.x-entity.x,member.state.y-entity.y)<=entity.size+2500)awards.set(id,{share:(ledger.get(id)||0)/entity.maxHp,shared:true,squadShare:damage/entity.maxHp});
      }
      for(const [id,participation] of awards){
        const profile=this.store.find(id);if(!profile)continue;
        {
          const state=profile.state;state.xp+=160*Math.pow(1.8,tier)*(1+(state.talentRanks?.xp || 0)*.1)*(this.realm==='cave' ? 1.8+(state.talentRanks?.spelunker || 0)*.12 : 1);
          state.coins+=Math.round(5*Math.pow(1.8,tier));this.game.giveMaterial(state,entity.rarity,1);
          const key=isMob ? 'kills' : 'mined';state.journal[key]=(state.journal[key] || 0)+1;
          if(!isMob && tier>=8)state.journal.bossKills=(state.journal.bossKills || 0)+1;
          this.game.levelUp(state);this.game.achievements(state);this.store.save(profile);
          for(const same of Object.values(this.actors).filter(a=>a.profile.id===id))same.socket.emit('playerState',this.store.clientState(profile));
        }
        const record=Object.values(this.actors).find(a=>a.profile.id===id);
        record?.socket.emit('lootResult',{entity:entity.name || 'Pedra',rarity:entity.rarity.name,qualified:true,...participation});
      }
      for(const [id,damage] of ledger)if(!awards.has(id))Object.values(this.actors).find(a=>a.profile.id===id)?.socket.emit('lootResult',{entity:entity.name || 'Pedra',rarity:entity.rarity.name,qualified:false,share:damage/entity.maxHp});
    }
    this.contributions.delete(entity.id);
    this.squadCredits.delete(entity.id);
    if(!isMob && Math.random()<.28 && this.game.mobs.length<180){
      const mob=this.game.createCreature('guardian',entity.rarity,entity.x,entity.y);this.game.mobs.push(mob);
    }
  }
  spawnAround(actor){
    const g=this.game,state=actor.state;g.bind(state);
    if(this.realm==='cave'){g.populateCave(state);return;}
    g.refill(state);
    let nearby=g.mobs.filter(m=>!m.summoned && Math.hypot(m.x-state.x,m.y-state.y)<3000+m.size).length;
    for(let attempt=0;attempt<30 && nearby<12 && g.mobs.length<180;attempt++){
      const outer=g.zone(state.x,state.y)==='U';let index=outer ? 3+Math.floor(Math.random()*4) : Math.max(0,Math.floor(Math.hypot(state.x-50000,state.y-50000)/6500));index=Math.min(6,index);
      if(outer){const chance=Math.random();if(chance<.000001)index=10;else if(chance<.0002)index=9;else if(chance<.005)index=8;else if(chance<.04)index=7;}
      const definition=g.creatures[1+Math.floor(Math.random()*(g.creatures.length-1))],mob=g.createCreature(definition.kind,g.rarities[index],0,0);
      const angle=Math.random()*Math.PI*2,distance=650+mob.size+Math.random()*850;mob.x=state.x+Math.cos(angle)*distance;mob.y=state.y+Math.sin(angle)*distance;
      if(!catalog.gardenOrePositionValid(mob.x,mob.y,mob.size,100000) || g.ores.some(o=>Math.hypot(o.x-mob.x,o.y-mob.y)<o.size+mob.size*.7))continue;
      g.mobs.push(mob);nearby++;
    }
  }
  addBoss(name){
    const g=this.game,rarity=g.rarities.find(r=>r.name===name);if(!rarity || g.ores.some(o=>o.rarity.name===name))return;
    const size=catalog.oreRadius(name),left=Math.random()<.5;
    const x=left ? size+500 : 100000-size-500,y=size+500+Math.random()*(100000-size*2-1000);
    if(catalog.gardenOrePositionValid(x,y,size))g.ores.push({id:'ore-'+require('crypto').randomUUID(),x,y,size,hp:rarity.hp,maxHp:rarity.hp,rarity,isBoss:true});
  }
  tick(dt=.05){
    const g=this.game,live=this.live(),now=Date.now();
    if(now>this.nextSpawn){this.nextSpawn=now+1000;for(const actor of live)this.spawnAround(actor);if(this.realm==='garden'){if(Math.random()<.02)this.addBoss('SUPER');if(Math.random()<.01)this.addBoss('ABSOLUT');if(Math.random()<.0003)this.addBoss('QUANTIUM');if(Math.random()<.000002)this.addBoss('ALEPH');}}
    const parents=new Set(g.mobs.filter(m=>!m.summoned && m.hp>0).map(m=>m.id));
    g.mobs=g.mobs.filter(m=>m.hp>0 && (m.isBoss || live.some(a=>Math.hypot(a.state.x-m.x,a.state.y-m.y)<7000+m.size)) && (!m.summoned || (parents.has(m.summonerId) && now<m.expiresAt)));
    for(const mob of [...g.mobs]){
      const actor=this.nearest(mob);if(!actor)continue;
      if(Math.hypot(actor.state.x-mob.x,actor.state.y-mob.y)>4500+mob.size)continue;
      g.moveMob(mob,actor.state,dt);const before=g.effects.length;g.bossStep(mob,actor.state,dt);
      for(const effect of g.effects.slice(before))if(effect.kind==='pulse')for(const target of live)if(Math.hypot(target.state.x-effect.x,target.state.y-effect.y)<effect.radius+20 && g.lineClear(mob.x,mob.y,target.state.x,target.state.y))this.hurt(target.state,mob.damage*.85,target.state.x-mob.x,target.state.y-mob.y,mob.name+' '+mob.rarity.name+' · impacto');
    }
    g.tickEffects(dt);
    if(this.realm==='garden')for(const ore of g.ores){
      if(!g.rarities.slice(7).some(r=>r.name===ore.rarity.name))continue;
      const near=this.nearest(ore);if(!near || Math.hypot(near.state.x-ore.x,near.state.y-ore.y)>ore.size+1800 || this.safe(near.state))continue;
      ore.shotTimer=(ore.shotTimer ?? 1.7)-dt;
      if(ore.shotTimer<=0){ore.shotTimer=2.5;for(let n=0;n<5;n++){const angle=Math.random()*Math.PI*2;g.projectiles.push({owner:ore.id,cause:'Pedra '+ore.rarity.name,x:ore.x+Math.cos(angle)*(ore.size+18),y:ore.y+Math.sin(angle)*(ore.size+18),vx:Math.cos(angle)*950,vy:Math.sin(angle)*950,r:14,life:3,damage:35,rotation:angle});}}
    }
    const owners=new Set([...g.ores,...g.mobs].map(e=>e.id));
    for(const projectile of g.projectiles){
      projectile.x+=projectile.vx*dt;projectile.y+=projectile.vy*dt;projectile.life-=dt;
      if(this.realm==='cave' && !g.tileOpen(Math.floor(projectile.x/500),Math.floor(projectile.y/500)))projectile.life=0;
      for(const actor of live)if(projectile.life>0 && Math.hypot(projectile.x-actor.state.x,projectile.y-actor.state.y)<projectile.r+20){this.hurt(actor.state,projectile.damage,projectile.vx,projectile.vy,'projétil de '+projectile.cause);projectile.life=0;break;}
    }
    g.projectiles=g.projectiles.filter(p=>p.life>0 && owners.has(p.owner));
    for(const actor of live){
      const s=actor.state;actor.contacts=actor.contacts || {};
      g.tickPlayer(s);
      for(const mob of g.mobs)if(Math.hypot(mob.x-s.x,mob.y-s.y)<mob.size*.8+20 && now>(actor.contacts[mob.id] || 0)){this.hurt(s,mob.damage,s.x-mob.x,s.y-mob.y,mob.name+' '+mob.rarity.name);actor.contacts[mob.id]=now+1000;}
      for(const ore of g.ores)if(Math.hypot(ore.x-s.x,ore.y-s.y)<=ore.size+24)this.hurt(s,4*Math.pow(1.4,g.rarities.findIndex(r=>r.name===ore.rarity.name)),s.x-ore.x,s.y-ore.y,'Pedra '+ore.rarity.name);
      for(const hazard of g.hazards){const key='acid:'+hazard.owner+':'+hazard.x+':'+hazard.y;
        if(now>(actor.contacts[key] || 0) && Math.hypot(hazard.x-s.x,hazard.y-s.y)<hazard.radius+20 && g.lineClear(hazard.x,hazard.y,s.x,s.y)){this.hurt(s,hazard.damage,s.x-hazard.x,s.y-hazard.y,hazard.cause);actor.contacts[key]=now+800;}
      }
      if(this.safe(s))s.hp=Math.min(s.maxHp,s.hp+8*dt);else s.hp=Math.min(s.maxHp,s.hp+(s.talentRanks?.regeneration || 0)*.35*dt);
    }
    this.revision++;
  }
  snapshot(actor){
    const s=actor.state,near=e=>Math.hypot(e.x-s.x,e.y-s.y)<5000+(e.size || 0),g=this.game;
    const clean=e=>{const {_contributions,lastWalkX,lastWalkY,crystalPoints,points,...value}=e;return value;};
    actor.seenCreatures=actor.seenCreatures || new Set();
    for(const mob of g.mobs.filter(near))if(!mob.summoned && !actor.seenCreatures.has(mob.id)){
      actor.seenCreatures.add(mob.id);const key=mob.kind+':'+mob.rarity.name;actor.state.journal.species[key]=(actor.state.journal.species[key] || 0)+1;
    }
    const contribution={};for(const [id,ledger] of this.contributions){const entity=[...g.ores,...g.mobs].find(e=>e.id===id);if(entity && ledger.has(actor.profile.id))contribution[id]=ledger.get(actor.profile.id)/entity.maxHp;}
    const squadContribution={},team=this.squads?.groupFor(actor.profile.id);
    if(team)for(const [id,groups] of this.squadCredits){const entity=[...g.ores,...g.mobs].find(e=>e.id===id),credit=groups.get(team.id)?.get(actor.profile.id);if(entity && credit)squadContribution[id]=credit/entity.maxHp;}
    if(this.baseMaze && this.mapVersion!==(g.cave.revision || 0)){this.mapVersion=g.cave.revision || 0;this.mapDelta=[];for(let i=0;i<this.baseMaze.length;i++)if(g.cave.maze[i] && !this.baseMaze[i])this.mapDelta.push(i);}
    return {realm:this.realm,revision:this.revision,serverTime:Date.now(),mapVersion:this.mapVersion,mapDelta:this.mapDelta,ores:g.ores.filter(e=>e.isBoss || near(e)).map(clean),mobs:g.mobs.filter(near).map(clean),projectiles:g.projectiles.filter(near),hazards:g.hazards.filter(near),effects:g.effects.filter(near),contribution,squadContribution,hp:s.hp,maxHp:s.maxHp,dead:s.dead,deathCause:s.deathCause};
  }
}
module.exports=SharedWorld;
