const SPECIAL_MOB_ABILITIES={
  guardian:{name:'Coroa de pedras',description:'Lança uma rajada de fragmentos na direção marcada.',windup:1,cooldown:7,color:'#d1dadd',kind:'stones'},
  ladybug:{name:'Investida rubra',description:'Marca uma direção e avança com força. Saia da linha vermelha.',windup:1.1,cooldown:8,color:'#ff8275',kind:'dash'},
  bee:{name:'Chuva de ferrões',description:'Dispara um leque de ferrões na direção marcada.',windup:.9,cooldown:6,color:'#ffe58c',kind:'stings'},
  ant:{name:'Chamado da colônia',description:'Invoca 8 ou mais formigas duas raridades abaixo e dispara anéis de projéteis. Invocações não dão recompensas.',windup:1.3,cooldown:11,color:'#e4b786',kind:'ants'},
  spider:{name:'Ninhada sombria',description:'Invoca 8 ou mais aranhas duas raridades abaixo e dispara rajadas em espiral. Invocações não dão recompensas.',windup:1.3,cooldown:12,color:'#d7a8ef',kind:'spiders'},
  beetle:{name:'Carapaça sísmica',description:'Reduz o dano recebido em 75% por 4 segundos e libera uma onda de impacto.',windup:1.2,cooldown:10,color:'#9af0bd',kind:'shield'},
  centipede:{name:'Rastro corrosivo',description:'Deixa três poças de ácido na posição marcada por 4 segundos.',windup:1.2,cooldown:9,color:'#caf278',kind:'acid'}
};
let bossMobEffects=[],bossMobHazards=[];
function bossMobAbility(mob){return mob && !mob.summoned && !mob.noBossAbilities && isBossRarity(mob.rarity) ? SPECIAL_MOB_ABILITIES[mob.kind] || SPECIAL_MOB_ABILITIES.guardian : null;}
function removeMobAndSummons(mob){mobs=mobs.filter(other=>other.id!==mob.id && other.summonerId!==mob.id);}
function clearBossMobEffects(){
  bossMobEffects=[];bossMobHazards=[];
  for(const mob of mobs){mob.bossAction=null;mob.dash=null;mob.shieldTime=0;}
}
function summonBossHelpers(boss,kind,count){
  const tier=rarities.findIndex(r=>r.name===boss.rarity.name),rarity=rarities[Math.max(0,tier-2)];
  const active=mobs.filter(m=>m.summoned),owned=active.filter(m=>m.summonerId===boss.id);
  const limit=Math.min(count,24-owned.length,96-active.length);
  const dimensions=realmDimensions();let spawned=0;
  for(let attempt=0;attempt<100 && spawned<limit;attempt++){
    const helper=createCreature(kind,rarity,0,0),angle=(attempt*.61803398875)*Math.PI*2;helper.size*=.55;
    const distance=boss.size+helper.size+100+Math.floor(attempt/8)*100;
    const x=boss.x+Math.cos(angle)*distance,y=boss.y+Math.sin(angle)*distance;
    if(x<helper.size || y<helper.size || x>dimensions.width-helper.size || y>dimensions.height-helper.size)continue;
    if(currentRealm!=='cave' && getZone(x,y)==='P')continue;
    if(currentRealm!=='cave'&&MAP_ATLAS.blocked(currentRealm,x,y,helper.size*.65))continue;
    if(currentRealm==='cave' && (circleHitsCaveWall(x,y,helper.size*.65) || !caveLineClear(boss.x,boss.y,x,y)))continue;
    if(ores.some(o=>Math.hypot(o.x-x,o.y-y)<o.size+helper.size))continue;
    if(mobs.some(m=>Math.hypot(m.x-x,m.y-y)<m.size*.7+helper.size*.7+20))continue;
    Object.assign(helper,{x,y,summoned:true,noRewards:true,noBossAbilities:true,summonerId:boss.id,temperament:'hostile',aggroUntil:performance.now()+60000,expiresAt:performance.now()+60000,angle:Math.atan2(player.y-y,player.x-x)});
    mobs.push(helper);spawned++;miningBurst(x,y,boss.rarity.color,12);
    bossMobEffects.push({kind:'summon',x,y,radius:helper.size+35,color:'#d7b9ed',life:.8,maxLife:.8});
  }
  return spawned;
}
function addBossProjectiles(mob,action,stings){
  const tier=rarities.findIndex(r=>r.name===mob.rarity.name),count=Math.min(600-projectiles.length,(stings ? 22 : 28)+Math.max(0,tier-7)*6);
  const spread=stings ? .85 : 1.5,speed=(stings ? 640 : 450)+Math.max(0,tier-7)*35;
  for(let i=0;i<count;i++){
    const angle=action.angle+(i/(count-1)-.5)*spread;
    projectiles.push({owner:mob.id,cause:mob.name+' '+mob.rarity.name+' · '+action.ability.name,x:mob.x+Math.cos(angle)*(mob.size+20),y:mob.y+Math.sin(angle)*(mob.size+20),vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:stings ? 9 : 14,life:3,damage:mob.damage*(stings ? .65 : .8),rotation:angle,kind:stings ? 'sting' : 'stone'});
  }
}
function addBulletHellRing(mob,phase=0){
  const tier=Math.max(0,rarities.findIndex(r=>r.name===mob.rarity.name)-7),count=Math.min(600-projectiles.length,24+tier*8),speed=310+tier*45;
  for(let i=0;i<count;i++){const angle=i/count*Math.PI*2+phase;projectiles.push({owner:mob.id,cause:mob.name+' '+mob.rarity.name+' · tempestade',x:mob.x+Math.cos(angle)*(mob.size+18),y:mob.y+Math.sin(angle)*(mob.size+18),vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:7,life:5,damage:mob.damage*.55,rotation:angle,kind:mob.kind==='bee' ? 'sting' : 'orb'});}
}
function resolveBossMobAbility(mob,action){
  const ability=action.ability,tier=Math.max(0,rarities.findIndex(r=>r.name===mob.rarity.name)-7);
  addBulletHellRing(mob,action.angle);mob.burstShots=2+Math.floor(tier/2);mob.burstTimer=.4;mob.burstAngle=action.angle;
  if(ability.kind==='spiders' || ability.kind==='ants')summonBossHelpers(mob,ability.kind==='spiders' ? 'spider' : 'ant',8+tier*3);
  if(ability.kind==='stones' || ability.kind==='stings')addBossProjectiles(mob,action,ability.kind==='stings');
  if(ability.kind==='dash')mob.dash={angle:action.angle,time:.65,speed:700+tier*50};
  if(ability.kind==='shield'){
    mob.shieldTime=4;
    const radius=mob.size+240+tier*30;
    bossMobEffects.push({kind:'pulse',x:mob.x,y:mob.y,radius,color:ability.color,life:.8,maxLife:.8});
    if(Math.hypot(player.x-mob.x,player.y-mob.y)<radius+player.size && caveLineClear(mob.x,mob.y,player.x,player.y))takePlayerDamage(mob.damage*.85,player.x-mob.x,player.y-mob.y,mob.name+' '+mob.rarity.name+' · '+ability.name);
  }
  if(ability.kind==='acid'){
    for(let n=-1;n<=1;n++){
      const radius=110+tier*10,x=action.x+Math.cos(action.angle+Math.PI/2)*n*170,y=action.y+Math.sin(action.angle+Math.PI/2)*n*170;
      const dimensions=realmDimensions();
      if(x<radius || y<radius || x>dimensions.width-radius || y>dimensions.height-radius)continue;
      if(currentRealm==='cave' && (circleHitsCaveWall(x,y,radius) || !caveLineClear(mob.x,mob.y,x,y)))continue;
      if(currentRealm!=='cave' && getZone(x,y)==='P')continue;
      bossMobHazards.push({owner:mob.id,x,y,radius,life:4,tick:0,color:ability.color,damage:mob.damage*.3,cause:mob.name+' '+mob.rarity.name+' · ácido'});
    }
  }
  miningBurst(mob.x,mob.y,ability.color,20);
}
function updateBossMobAbilities(dt,activeMobs=mobs,skipEffects=false){
  const safe=currentRealm!=='cave' && getZone(player.x,player.y)==='P';
  for(const mob of [...activeMobs]){
    mob.shieldTime=Math.max(0,(mob.shieldTime || 0)-dt);
    const ability=bossMobAbility(mob);
    if(!ability)continue;
    const distance=Math.hypot(mob.x-player.x,mob.y-player.y);
    if(player.dead || safe || !creatureAggressive(mob) || distance>1800+mob.size || !caveLineClear(mob.x,mob.y,player.x,player.y)){
      mob.bossAction=null;mob.dash=null;mob.burstShots=0;continue;
    }
    if(mob.burstShots>0){mob.burstTimer-=dt;if(mob.burstTimer<=0){mob.burstShots--;mob.burstTimer=.45;mob.burstAngle+=.13;addBulletHellRing(mob,mob.burstAngle);}}
    if(mob.dash){
      const dash=mob.dash,oldX=mob.x,oldY=mob.y;
      const nx=mob.x+Math.cos(dash.angle)*dash.speed*dt,ny=mob.y+Math.sin(dash.angle)*dash.speed*dt;
      if(currentRealm!=='garden' || getZone(nx,ny)!=='P')moveWithWalls(mob,nx,ny,mob.size*.65);
      mob.angle=dash.angle;dash.time-=dt;
      if(Math.hypot(player.x-mob.x,player.y-mob.y)<mob.size*.8+player.size)takePlayerDamage(mob.damage*1.4,player.x-mob.x,player.y-mob.y,mob.name+' '+mob.rarity.name+' · investida');
      if(dash.time<=0 || Math.hypot(mob.x-oldX,mob.y-oldY)<1)mob.dash=null;
      continue;
    }
    if(mob.bossAction){
      mob.bossAction.remaining-=dt;
      if(mob.bossAction.remaining<=0){const action=mob.bossAction;mob.bossAction=null;resolveBossMobAbility(mob,action);}
      continue;
    }
    mob.specialCooldown=(mob.specialCooldown ?? 2.5)-dt;
    if(mob.specialCooldown<=0){
      mob.bossAction={ability,remaining:ability.windup,total:ability.windup,x:player.x,y:player.y,angle:Math.atan2(player.y-mob.y,player.x-mob.x)};
      const tier=Math.max(0,rarities.findIndex(r=>r.name===mob.rarity.name)-7);
      mob.specialCooldown=Math.max(2.2,ability.cooldown*.43*(1-tier*.07));
    }
  }
  if(!skipEffects)updateBossMobHazards(dt);
}
function updateBossMobHazards(dt){
  const safe=currentRealm!=='cave' && getZone(player.x,player.y)==='P';
  const owners=new Set(mobs.map(m=>m.id));
  for(const hazard of bossMobHazards){
    hazard.life-=dt;hazard.tick-=dt;
    if(!player.dead && !safe && owners.has(hazard.owner) && hazard.tick<=0 && Math.hypot(player.x-hazard.x,player.y-hazard.y)<hazard.radius+player.size && caveLineClear(hazard.x,hazard.y,player.x,player.y)){
      takePlayerDamage(hazard.damage,player.x-hazard.x,player.y-hazard.y,hazard.cause);hazard.tick=.8;
    }
  }
  bossMobHazards=bossMobHazards.filter(h=>h.life>0 && owners.has(h.owner)).slice(-64);
  for(const effect of bossMobEffects)effect.life-=dt;
  bossMobEffects=bossMobEffects.filter(e=>e.life>0).slice(-60);
}
function drawBossMobEffects(){
  ctx.save();
  for(const hazard of bossMobHazards){
    ctx.globalAlpha=.28;ctx.fillStyle=hazard.color;ctx.beginPath();ctx.arc(hazard.x,hazard.y,hazard.radius,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=.85;ctx.strokeStyle=hazard.color;ctx.lineWidth=3;ctx.stroke();
    for(let i=0;i<6;i++){const angle=i*Math.PI/3+performance.now()/1400;ctx.beginPath();ctx.arc(hazard.x+Math.cos(angle)*hazard.radius*.5,hazard.y+Math.sin(angle)*hazard.radius*.5,5,0,Math.PI*2);ctx.stroke();}
  }
  for(const effect of bossMobEffects){
    const progress=1-effect.life/effect.maxLife;ctx.globalAlpha=1-progress;ctx.strokeStyle=effect.color;ctx.lineWidth=6;ctx.beginPath();ctx.arc(effect.x,effect.y,effect.radius*(.2+progress*.8),0,Math.PI*2);ctx.stroke();
  }
  for(const mob of mobs){
    if(mob.shieldTime>0){ctx.globalAlpha=.7;ctx.strokeStyle='#9af0bd';ctx.lineWidth=7;ctx.beginPath();ctx.arc(mob.x,mob.y,mob.size*1.2,0,Math.PI*2);ctx.stroke();}
    const action=mob.bossAction;if(!action)continue;
    const ability=action.ability;ctx.globalAlpha=.85;ctx.strokeStyle=ability.color;ctx.fillStyle=ability.color;ctx.lineWidth=3;ctx.setLineDash([12,8]);
    if(['dash','stones','stings'].includes(ability.kind)){
      const length=ability.kind==='dash' ? 530 : 850;
      ctx.beginPath();ctx.moveTo(mob.x,mob.y);ctx.lineTo(mob.x+Math.cos(action.angle)*length,mob.y+Math.sin(action.angle)*length);ctx.stroke();
    }else{
      const x=ability.kind==='acid' ? action.x : mob.x,y=ability.kind==='acid' ? action.y : mob.y,radius=ability.kind==='shield' ? mob.size+240 : ability.kind==='acid' ? 180 : mob.size+160;
      ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.stroke();
    }
    ctx.setLineDash([]);ctx.font='bold 13px "Ubuntu"';ctx.textAlign='center';ctx.strokeStyle='#28342e';ctx.lineWidth=4;
    const label=ability.name+' · '+action.remaining.toFixed(1)+'s';ctx.strokeText(label,mob.x,mob.y-mob.size-32);ctx.fillText(label,mob.x,mob.y-mob.size-32);
  }
  ctx.restore();
}
