const CREATURES=[
  {kind:'guardian',name:'Guardião',temperament:'hostile',hp:45,damage:6,speed:80,color:'#55595d'},
  {kind:'ladybug',name:'Joaninha',temperament:'neutral',hp:34,damage:5,speed:72,color:'#ed4f46'},
  {kind:'bee',name:'Abelha',temperament:'neutral',hp:25,damage:8,speed:125,color:'#f5cb4e'},
  {kind:'ant',name:'Formiga',temperament:'neutral',hp:22,damage:5,speed:110,color:'#835735'},
  {kind:'spider',name:'Aranha',temperament:'hostile',hp:40,damage:9,speed:140,color:'#65465f'},
  {kind:'beetle',name:'Besouro',temperament:'neutral',hp:85,damage:12,speed:65,color:'#528d6d'},
  {kind:'centipede',name:'Centopeia',temperament:'neutral',hp:60,damage:7,speed:90,color:'#91b84e'}
];
const LANTERN={id:'utility_lantern',name:'Lanterna',type:'utility',rarity:'Raro',color:'#3498db',amount:1,coins:500,materials:[['Comum',20],['Raro',8]],img:loadImg('sprites/lantern.png')};
const UTILITIES=[LANTERN];
TALENTS.push(
  {id:'vision',name:'Visão noturna',symbol:'◉',description:'+100 de iluminação na caverna por nível.',parent:'range'},
  {id:'resonance',name:'Ressonância',symbol:'✧',description:'Reduz a recarga das habilidades em 3% por nível.',parent:'haste'},
  {id:'regeneration',name:'Regeneração',symbol:'♥',description:'Por nível: regenera 35 de vida + 0,1% da vida máxima por segundo. Disponível diretamente, de I a XI.',parent:null},
  {id:'spelunker',name:'Espeleólogo',symbol:'⌂',description:'+12% de XP na caverna por nível.',parent:'vision'},
  {id:'scavenger',name:'Coletor',symbol:'✦',description:'+3% de chance de minério extra por nível.',parent:'fortune'},
  {id:'sprint',name:'Passo subterrâneo',symbol:'➜',description:'+4% de velocidade na caverna por nível.',parent:'spelunker'}
);
let abilityEffects=[];
let damageNumbers=[];
let nextCreatureSpawn=0;
const itemPreviewCache=new Map();
function xpForLevel(level){return GAME_CATALOG.xpForLevel(level,player.ascensions||0);}
function normalizeAdventure(){
  if(player.progressionVersion!==3){
    const fraction=Math.max(0,Math.min(1,player.xp/(player.xpToNext || 100)));
    player.xpToNext=xpForLevel(player.level);player.xp=Math.min(.999,fraction)*player.xpToNext;player.progressionVersion=3;
  }else player.xpToNext=xpForLevel(player.level);
  player.abilityReadyAt=player.abilityReadyAt || {};player.dead=false;player.deathCause='';player.lanternOn=false;
  player.journal.species=player.journal.species || {};
  restoreUtility();restoreArmor();saveGame();
}
function itemRarityIndex(item){
  if(!item)return 0;
  const explicit=typeof item.rarity==='object' ? item.rarity.name : item.rarity;
  const name=materialRarity(item) || explicit || item.name;
  const index=rarities.findIndex(r=>r.name.toUpperCase()===String(name).toUpperCase());
  if(index>=0)return index;
  return Math.max(0,PICKAXE_RECIPES.findIndex(r=>r.name===item.name));
}
function highestOwnedRarity(){return [...player.inventory.filter(i=>(i.amount ?? 1)>0),...Object.values(player.equipment)].reduce((max,item)=>Math.max(max,itemRarityIndex(item)),0);}
function restoreUtility(){const definition=UTILITIES.find(u=>u.name===player.equipment.utility?.name);if(definition)player.equipment.utility={...definition};}
function ownsLantern(){return player.equipment.utility?.id===LANTERN.id || player.inventory.some(i=>i.id===LANTERN.id);}
function utilityStatus(recipe){return gearStatus(recipe);}
function craftUtility(name='Lanterna'){return craftGear(UTILITIES.find(u=>u.name===name));}
function toggleLantern(){if(player.dead || !ownsLantern())return;player.lanternOn=!player.lanternOn;}
function isBossRarity(rarity){return rarities.findIndex(r=>r.name===rarity?.name)>6;}
function createCreature(kind,rarity,x,y){
  const definition=CREATURES.find(c=>c.kind===kind) || CREATURES[0],index=Math.max(0,rarities.findIndex(r=>r.name===rarity.name));
  const hp=GAME_CATALOG.mobHealth(definition.hp,index),size=GAME_CATALOG.mobRadius(index,currentRealm==='cave');
  return {...definition,id:kind+'_'+Date.now()+'_'+Math.random().toString(36).slice(2),x,y,rarity,hp,maxHp:hp,size,speed:definition.stationary?0:GAME_CATALOG.mobSpeed(definition.speed,index),damage:GAME_CATALOG.mobDamage(definition.damage,index),cooldown:0,angle:0,isBoss:index>6,pathTimer:0};
}
function noteCreature(creature){
  if(!player.journal?.species || creature.summoned)return;
  const key=creature.kind+':'+creature.rarity.name;player.journal.species[key]=(player.journal.species[key] || 0)+1;
}
function updateAdventure(dt){
  if(isServerWorld()){updateSharedPresentation(dt);return;}
  if(player.dead)return;
  player.hp=Math.min(player.maxHp,player.hp+GAME_CATALOG.regeneration(player,utilityBonus('regen'))*dt);
  if(currentRealm==='garden' && performance.now()>nextCreatureSpawn){
    nextCreatureSpawn=performance.now()+2200;
    const target=22;
    for(let attempt=0;attempt<40 && mobs.length<target;attempt++){
      const angle=Math.random()*Math.PI*2,distance=400+Math.random()*800,x=player.x+Math.cos(angle)*distance,y=player.y+Math.sin(angle)*distance;
      if(x<100 || y<100 || x>WORLD_SIZE-100 || y>WORLD_SIZE-100 || getZone(x,y)==='P')continue;
      let rarity=getRandomRarityFromZone(getZone(x,y));
      if(getZone(x,y)==='U'){
        const roll=Math.random();if(roll<.000001)rarity=rarities[10];else if(roll<.0002)rarity=rarities[9];else if(roll<.005)rarity=rarities[8];else if(roll<.04)rarity=rarities[7];
      }
      const definition=CREATURES[1+Math.floor(Math.random()*(CREATURES.length-1))];
      const mob=createCreature(definition.kind,rarity,x,y);mobs.push(mob);noteCreature(mob);
    }
  }
  const nearby=mobs.filter(m=>m.hp>0 && Math.hypot(m.x-player.x,m.y-player.y)<(currentRealm==='cave' ? 7000 : 4000) && (!m.summoned || performance.now()<m.expiresAt));
  const parents=new Set(nearby.filter(m=>!m.summoned).map(m=>m.id));
  mobs=nearby.filter(m=>!m.summoned || parents.has(m.summonerId));
  for(const number of damageNumbers){number.life-=dt;number.y-=30*dt;}damageNumbers=damageNumbers.filter(n=>n.life>0);
  for(const effect of abilityEffects)effect.life-=dt;abilityEffects=abilityEffects.filter(e=>e.life>0);
}
function creatureAggressive(mob){
  const temperament=mob.temperament || CREATURES.find(c=>c.kind===mob.kind)?.temperament || 'hostile';
  return temperament==='hostile' || performance.now()<(mob.aggroUntil || 0);
}
function updateCreatureMovement(dt){
  const safe=currentRealm!=='cave' && getZone(player.x,player.y)==='P';
  for(const mob of mobs){
    if(mob.stationary){mob.moving=false;continue;}
    mob.kind=mob.kind || 'guardian';mob.name=mob.name || 'Guardião';
    const travelled=Math.hypot(mob.x-(mob.lastWalkX ?? mob.x),mob.y-(mob.lastWalkY ?? mob.y));
    mob.walkPhase=(mob.walkPhase || 0)+travelled/Math.max(12,mob.size*.22);mob.moving=travelled>.05;mob.lastWalkX=mob.x;mob.lastWalkY=mob.y;
    const dx=player.x-mob.x,dy=player.y-mob.y,distance=Math.hypot(dx,dy);
    const aggressive=creatureAggressive(mob) && !player.dead && !safe;
    mob.wanderTimer=(mob.wanderTimer || 0)-dt;
    if(mob.wanderAngle===undefined || mob.wanderTimer<=0){mob.wanderAngle=Math.random()*Math.PI*2;mob.wanderTimer=2+Math.random()*4;}
    const targetAngle=aggressive ? Math.atan2(dy,dx) : mob.wanderAngle;
    const difference=Math.atan2(Math.sin(targetAngle-(mob.angle || 0)),Math.cos(targetAngle-(mob.angle || 0)));
    mob.angle=(mob.angle || 0)+difference*(1-Math.exp(-10*dt));
    mob.cooldown=Math.max(0,(mob.cooldown || 0)-dt);
    if(player.dead || safe)continue;
    if(!aggressive){
      if(distance<1800){
        const oldX=mob.x,oldY=mob.y,nx=mob.x+Math.cos(mob.wanderAngle)*mob.speed*dt*.22,ny=mob.y+Math.sin(mob.wanderAngle)*mob.speed*dt*.22;
        if(currentRealm==='cave' || getZone(nx,ny)!=='P')moveWithWalls(mob,nx,ny,mob.size*.65);
        if(Math.hypot(mob.x-oldX,mob.y-oldY)<.01){mob.wanderAngle+=Math.PI*.6;mob.wanderTimer=1;}
      }
      continue;
    }
    if(mob.bossAction || mob.dash)continue;
    if(distance<1600 && distance>player.size+mob.size*.7+4){
      let target={x:player.x,y:player.y};
      if(currentRealm==='cave' && !caveLineClear(mob.x,mob.y,player.x,player.y)){
        mob.pathTimer-=dt;if(mob.pathTimer<=0){mob.pathTarget=nextCaveStep(mob);mob.pathTimer=.65;}target=mob.pathTarget || {x:mob.x,y:mob.y};
      }
      const mx=target.x-mob.x,my=target.y-mob.y,length=Math.hypot(mx,my)||1;
      const nx=mob.x+mx/length*mob.speed*dt,ny=mob.y+my/length*mob.speed*dt;
      if(currentRealm==='cave' || getZone(nx,ny)!=='P')moveWithWalls(mob,nx,ny,mob.size*.65);
    }
    if(distance<player.size+mob.size*.8 && mob.cooldown===0){takePlayerDamage(mob.damage,dx,dy,mob.name+' '+mob.rarity.name);mob.cooldown=1;}
  }
  if(safe && !player.dead)player.hp=Math.min(player.maxHp,player.hp+player.maxHp*.04*dt);
}
function drawCreatureModel(kind,c,x,y,r,angle=0,phase=0,moving=false){
  c.save();c.translate(x,y);c.rotate(angle);
  const disc=(px,py,radius,color)=>{c.beginPath();c.arc(px,py,radius,0,Math.PI*2);c.fillStyle=color;c.fill();};
  const oval=(px,py,rx,ry,color)=>{c.beginPath();c.ellipse(px,py,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();};
  if(moving)c.translate(0,Math.sin(phase*2)*r*.025);
  if(['ladybug','beetle','guardian'].includes(kind)){
    c.strokeStyle=kind==='guardian' ? '#40464a' : '#34483a';c.lineWidth=Math.max(2,r*.1);
    for(let leg=0;leg<3;leg++)for(const side of [-1,1]){const stride=moving ? Math.sin(phase+leg*1.9+(side>0 ? Math.PI : 0))*r*.18 : 0;c.beginPath();c.moveTo((leg-1)*r*.48,side*r*.45);c.lineTo((leg-1)*r*.6+stride,side*r*.97);c.stroke();}
  }
  if(kind==='guardian'){
    if(guardianImage.complete && guardianImage.naturalWidth)c.drawImage(guardianImage,-r,-r,r*2,r*2);else disc(0,0,r,'#55595d');
  }else if(kind==='ladybug'){
    disc(0,0,r,'#343130');oval(-r*.1,0,r*.88,r*.85,'#e65344');c.strokeStyle='#49312c';c.lineWidth=r*.1;c.beginPath();c.moveTo(-r,0);c.lineTo(r*.6,0);c.stroke();
    for(const [sx,sy] of [[-.5,-.4],[-.5,.4],[.2,-.5],[.2,.5]])disc(sx*r,sy*r,r*.16,'#3b302b');disc(r*.8,0,r*.35,'#3b302b');
  }else if(kind==='bee'){
    const flutter=.22+Math.abs(Math.sin(performance.now()/65))* .18;
    oval(-r*.1,-r*.63,r*.65,r*flutter,'#d9f5ec');oval(-r*.1,r*.63,r*.65,r*flutter,'#d9f5ec');oval(0,0,r,r*.65,'#f0ca47');
    c.strokeStyle='#493d30';c.lineWidth=r*.2;for(const xx of [-.45,.1]){c.beginPath();c.moveTo(xx*r,-r*.55);c.lineTo(xx*r,r*.55);c.stroke();}disc(r*.72,0,r*.32,'#e0b637');
  }else if(kind==='ant' || kind==='spider'){
    c.strokeStyle=kind==='spider' ? '#64435d' : '#704b31';c.lineWidth=Math.max(2,r*.11);
    for(let n=0;n<(kind==='spider' ? 4 : 3);n++)for(const side of [-1,1]){const step=moving ? Math.sin(phase+n*1.7+side*Math.PI/2)*r*.22 : 0;c.beginPath();c.moveTo((n-1.5)*r*.3,0);c.lineTo((n-1.5)*r*.55+step*.5,side*r*.8);c.lineTo((n-1)*r*.65+step,side*r);c.stroke();}
    oval(-r*.4,0,r*.65,r*.58,kind==='spider' ? '#50384d' : '#805735');disc(r*.4,0,r*.4,kind==='spider' ? '#795c71' : '#93663e');
  }else if(kind==='centipede'){
    c.strokeStyle='#536d3a';c.lineWidth=r*.06;
    for(let n=-2;n<=2;n++){const wave=moving ? Math.sin(phase+n*.9)*r*.12 : 0;for(const side of [-1,1]){c.beginPath();c.moveTo(n*r*.45,wave);c.lineTo(n*r*.5+wave,side*r*.55+wave);c.stroke();}disc(n*r*.45,wave,r*.35,n===2 ? '#b5d567' : '#91b54e');}
  }else{
    oval(0,0,r,r*.8,'#325a47');oval(-r*.15,0,r*.78,r*.72,'#5a9975');c.strokeStyle='#284d3b';c.lineWidth=r*.08;c.beginPath();c.moveTo(-r,0);c.lineTo(r*.6,0);c.stroke();disc(r*.7,0,r*.36,'#385e45');
  }
  if(kind!=='guardian'){disc(r*.6,-r*.13,r*.09,'#fff6d7');disc(r*.6,r*.13,r*.09,'#fff6d7');disc(r*.65,-r*.13,r*.045,'#26342a');disc(r*.65,r*.13,r*.045,'#26342a');}
  c.restore();
}
function drawCreatures(){
  ctx.save();
  for(const mob of mobs){
    if(Math.abs(mob.x-player.x)>worldViewWidth()/2+mob.size*2 || Math.abs(mob.y-player.y)>worldViewHeight()/2+mob.size*2)continue;
    if(isBossRarity(mob.rarity)){ctx.beginPath();ctx.arc(mob.x,mob.y,mob.size*1.15,0,Math.PI*2);ctx.strokeStyle=rarityPaint(mob.rarity,mob.x-mob.size,mob.y-mob.size,mob.size*2);ctx.lineWidth=3;ctx.stroke();}
    drawCreatureModel(mob.kind || 'guardian',ctx,mob.x,mob.y,mob.size,mob.angle || 0,mob.walkPhase || 0,mob.moving);
    if(typeof drawEntityHealth==='function')drawEntityHealth(mob,mob.x,mob.y+mob.size+(mob.summoned ? 44 : 31),Math.min(190,Math.max(42,mob.size*1.8)),mob.rarity.color);
    ctx.fillStyle=mob.rarity.color;
    if(settings.names){ctx.font='bold 12px "Ubuntu"';ctx.textAlign='center';const label=(isBossRarity(mob.rarity) && !mob.summoned ? '♛ ' : '')+(mob.name || 'Guardião')+' '+mob.rarity.name;ctx.strokeStyle='#1b382a';ctx.lineWidth=3;ctx.strokeText(label,mob.x,mob.y+mob.size+19);ctx.fillText(label,mob.x,mob.y+mob.size+19);if(mob.summoned){ctx.font='bold 10px "Ubuntu"';ctx.fillStyle='#ece2fa';ctx.fillText('Invocada · sem XP / drops',mob.x,mob.y+mob.size+33);}}
  }
  ctx.restore();
}
function enterDeath(cause){
  if(player.dead)return;player.dead=true;player.hp=0;player.deathCause=cause || 'uma criatura desconhecida';player.vx=0;player.vy=0;heldKeys.clear();movementAimActive=false;
  inventoryOpen=false;shopOpen=false;craftOpen=false;talentsOpen=false;extraPanel=null;cavePromptOpen=false;saveGame();
  clearBossMobEffects();
}
function returnFromDeath(){
  if(isServerWorld()){socket.emit('respawn');return;}
  if(currentRealm==='cave')switchRealm('garden');
  player.dead=false;player.hp=player.maxHp;player.deathCause='';player.x=PLAZA_SPAWN.x;player.y=PLAZA_SPAWN.y;player.hurtUntil=performance.now()+2000;player.vx=0;player.vy=0;movementAimActive=false;
  socket.emit('move',{x:player.x,y:player.y,realm:'garden',dead:false});saveGame();
}
function drawDeadPlayer(x,y,entity=player){
  const size=(entity.size || player.size)*3;ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/2);
  if(playerBodyImg.complete && playerBodyImg.naturalWidth)ctx.drawImage(playerBodyImg,-size/2,-size/2,size,size);
  ctx.scale(size/60,size/60);ctx.strokeStyle='#322e2c';ctx.lineWidth=3;
  for(const px of [-7,7]){ctx.beginPath();ctx.moveTo(px-4,-6);ctx.lineTo(px+4,2);ctx.moveTo(px+4,-6);ctx.lineTo(px-4,2);ctx.stroke();}
  ctx.restore();
}
function drawLevelNameplate(x,y,level,index){
  ctx.save();ctx.font='900 13px "Ubuntu"';ctx.textAlign='center';ctx.strokeStyle='#263b2d';ctx.lineWidth=3;
  const text='Lv. '+level;ctx.strokeText(text,x,y+43);ctx.fillStyle=rarities[Math.min(index,rarities.length-1)]?.color || '#fff';ctx.fillText(text,x,y+43);ctx.restore();
}
function miningBurst(x,y,color,count=14){
  if(!settings.particles)return;
  for(let n=0;n<count;n++){const angle=Math.random()*Math.PI*2,speed=55+Math.random()*150;particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:.3+Math.random()*.5,color});}
}
function damageEntity(target,damage,isMob){
  if(isServerWorld())return;
  if(player.dead || target.hp<=0)return;
  if(isMob)target.aggroUntil=performance.now()+12000;
  if(isMob && target.shieldTime>0)damage*=.25;
  const surface=targetSurface(target);
  damage=Math.min(target.hp,Math.max(0,damage));player.hp=Math.min(player.maxHp,player.hp+damage*GAME_CATALOG.vampirismRate(player,utilityBonus('vampirism')));
  target.hp-=damage;target.hit=6;miningBurst(surface.x,surface.y,target.rarity.color,isMob ? 9 : 16);damageNumbers.push({x:surface.x,y:surface.y-20,text:Math.round(damage),life:.65});
  if(target.hp>0)return;
  if(isMob && (target.noRewards || target.summoned)){removeMobAndSummons(target);return;}
  const index=Math.max(0,rarities.findIndex(r=>r.name===target.rarity.name));
  player.xp+=(GAME_CATALOG.experienceReward(target.rarity.name,isMob))*(1+talentRank('xp')*.1)*(currentRealm==='cave' ? 1.8+talentRank('spelunker')*.12 : 1);
  player.coins+=Math.max(5,Math.round(5*Math.pow(1.8,index)));
  addOreMaterial(target.rarity,Math.random()<talentRank('fortune')*.02+talentRank('scavenger')*.03 ? 2 : 1);
  if(isMob){removeMobAndSummons(target);recordJournal('kills');}
  else{ores=ores.filter(o=>o.id!==target.id);recordJournal('mined');if(target.rarity.name==='ABSOLUT')recordJournal('bossKills');if(Math.random()<Math.min(.45,.22+index*.025))spawnOreGuardian(target);}
  checkLevelUp();saveGame();
}
function equipmentAbility(item){
  if(!item || !['weapon','pickaxe'].includes(item.type))return null;
  if(item.name==='Solar'&&item.type==='weapon')return {...GAME_CATALOG.ability('Solar'),name:'Sol da Aurora',kind:'solarSun',radius:650,mult:8,duration:4.5,speed:360};
  if(item.name==='Solar'&&item.type==='pickaxe')return {...GAME_CATALOG.ability('Solar'),name:'Sistema Solar',kind:'solarSystem',radius:1400,mult:12,duration:6,speed:0};
  if(item.name==='Void'&&item.type==='weapon')return {...GAME_CATALOG.ability('Void'),name:'Tridente do Vazio',kind:'voidTrident',radius:650,mult:14,duration:1.8,speed:3200};
  if(item.name==='Void'&&item.type==='pickaxe')return {...GAME_CATALOG.ability('Void'),name:'Domínio das Trevas',kind:'darkZone',radius:1600,mult:10,duration:6,speed:0};
  return GAME_CATALOG.ability(item?.name);
}
function useEquipmentAbility(type){
  if(isServerWorld())return requestSharedAbility(type);
  const item=player.equipment[type],ability=equipmentAbility(item),now=Date.now();
  if(player.dead || isUiBlocking() || !ability || now<(player.abilityReadyAt?.[type] || 0))return false;
  player.abilityReadyAt=player.abilityReadyAt || {};player.abilityReadyAt[type]=now+ability.cooldown*1000*(1-talentRank('resonance')*.03);
  abilityEffects.push({x:player.x,y:player.y,life:1.1,maxLife:1.1,...ability});
  const damage=((type==='weapon' ? item.damage : item.power)+player.damage)*ability.mult*(1+talentRank('damage')*.12+player.level*.02);
  const targets=(type==='weapon' ? mobs.map(target=>({target,isMob:true})) : ores.map(target=>({target,isMob:false}))).filter(({target})=>{const surface=targetSurface(target);return Math.hypot(surface.x-player.x,surface.y-player.y)<=ability.radius && caveLineClear(player.x,player.y,surface.x,surface.y);}).slice(0,35);
  for(const {target,isMob} of targets){damageEntity(target,damage,isMob);if(item.name==='Void' && isMob)moveWithWalls(target,target.x+(player.x-target.x)*.2,target.y+(player.y-target.y)*.2,target.size*.65);}
  if(item.name==='Solar')player.hp=Math.min(player.maxHp,player.hp+player.maxHp*.12);
  miningBurst(player.x,player.y,ability.color,35);player.swingUntil=performance.now()+180;saveGame();return true;
}
function drawAbilityEffects(){
  ctx.save();
  for(const effect of abilityEffects){
    if(drawEnhancedAbility(effect))continue;
    const progress=1-effect.life/effect.maxLife;ctx.globalAlpha=1-progress;ctx.strokeStyle=effect.color;ctx.lineWidth=5;
    ctx.beginPath();ctx.arc(effect.x,effect.y,effect.radius*progress,0,Math.PI*2);ctx.stroke();
    for(let n=0;n<10;n++){const angle=n*Math.PI/5+progress;ctx.beginPath();ctx.moveTo(effect.x+Math.cos(angle)*25,effect.y+Math.sin(angle)*25);ctx.lineTo(effect.x+Math.cos(angle)*effect.radius*progress,effect.y+Math.sin(angle)*effect.radius*progress);ctx.stroke();}
  }
  for(const number of damageNumbers){ctx.globalAlpha=Math.min(1,number.life*2);ctx.font='bold 14px "Ubuntu"';ctx.fillStyle='#fff4bc';ctx.textAlign='center';ctx.fillText(number.text,number.x,number.y);}
  ctx.restore();
}
window.addEventListener('keydown',event=>{
  if(typeof event.key!=='string')return;
  if(event.repeat || event.target.closest?.('input,textarea,select,[role="dialog"]'))return;
  const key=event.key.toLowerCase();
  if(key==='q')useEquipmentAbility('weapon');if(key==='r')useEquipmentAbility('pickaxe');if(key==='f')toggleLantern();if(key==='e')interactPortal();if(key==='4')player.selectedSlot=3;
});
