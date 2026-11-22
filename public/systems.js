const SWORD_FILES=['madeira','pedra','ferro','ouro','red','diamond','void','solar'];
const SWORDS=PICKAXE_RECIPES.map((recipe,index)=>({
  id:'sword_'+SWORD_FILES[index],name:recipe.name,type:'weapon',amount:1,
  damage:GAME_CATALOG.SWORD_DAMAGE[index],color:TALENT_COLORS[index],
  img:loadImg('sprites/sword_'+SWORD_FILES[index]+'.png'),
  coins:index ? Math.round(recipe.coins*1.25) : 40,
  materials:index ? recipe.materials.map(([name,count])=>[name,Math.ceil(count*.8)]) : [['Comum',5]]
}));
// Initial menu preview and the shared runtime start with the real wooden sword.
if(!player.equipment.weapon)player.equipment.weapon={...SWORDS[0]};
rarities.push({name:'QUANTIUM',color:'#77e9ed',hp:GAME_CATALOG.ORE_HP[9],mult:40000},{name:'ALEPH',color:'#ffe68b',hp:GAME_CATALOG.ORE_HP[10],mult:80000});
rarities.push({...GAME_CATALOG.PRIMORDIAL});
ORE_VALUES.QUANTIUM=50000;ORE_VALUES.ALEPH=150000;
ORE_VALUES.PRIMORDIAL=500000;
craftRecipes.ABSOLUT={next:'QUANTIUM',chance:.05};
craftRecipes.QUANTIUM={next:'ALEPH',chance:.001};
const SETTINGS_KEY='coxinha_miner_settings_v1';
const DEFAULT_SETTINGS={controls:'hybrid',particles:true,minimap:true,names:true};
let settings={...DEFAULT_SETTINGS};
try {settings={...DEFAULT_SETTINGS,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')};}catch{}
let extraPanel=null;
const heldKeys=new Set();
let projectiles=[];
let particles=[];
let nearestBoss=null;
let contactCooldown=0;
let lastParticleTime=0;
let guildState={guildId:null,directory:[],connected:false};
let craftResult=null;
let lastAchievementNotice='';
const ACHIEVEMENTS=[
  {id:'first_ore',name:'Primeira descoberta',description:'Minere uma pedra.',stat:'mined',goal:1},
  {id:'miner',name:'Mãos de pedra',description:'Minere 100 pedras.',stat:'mined',goal:100},
  {id:'guardian',name:'Olho no guardião',description:'Derrote um guardião.',stat:'kills',goal:1},
  {id:'hunter',name:'Sentinela do jardim',description:'Derrote 25 guardiões.',stat:'kills',goal:25},
  {id:'crafter',name:'Alquimia mineral',description:'Faça uma fusão bem-sucedida.',stat:'crafted',goal:1},
  {id:'boss',name:'Além do Absolut',description:'Destrua uma pedra ABSOLUT.',stat:'bossKills',goal:1},
  {id:'level',name:'Explorador experiente',description:'Alcance o nível 10.',stat:'level',goal:10}
];
function normalizeSystems() {
  const previous=player.journal || {};
  player.journal={mined:0,kills:0,crafted:0,bossKills:0,...previous,seen:previous.seen || {},unlocked:previous.unlocked || []};
  player.vx=0;player.vy=0;player.hurtUntil=0;
  restoreSword();
  if(player.pendingCraft && Date.now()-player.pendingCraft.startedAt>=EXPANSION.craftDurationOf(player.pendingCraft)) {
    craftResult=player.pendingCraft;player.pendingCraft=null;saveGame();
  }
}
function restoreSword() {
  const current=player.equipment.weapon;
  const name=typeof current==='string' ? current : current?.name;
  const sword=SWORDS.find(s=>s.name===name);
  if(sword)player.equipment.weapon={...sword};
  for(const item of player.inventory)if(item.type==='weapon'){
    const definition=SWORDS.find(s=>s.name===item.name);
    if(definition){item.img=definition.img;item.damage=definition.damage;}
  }
}
function ownedSword(name) {return player.equipment.weapon?.name===name || player.inventory.some(i=>i.type==='weapon' && i.name===name);}
function swordRecipeStatus(recipe) {
  const index=SWORDS.indexOf(recipe);
  return {owned:ownedSword(recipe.name),previousReady:!index || ownedSword(SWORDS[index-1].name),coinsReady:player.coins>=recipe.coins,materialsReady:recipe.materials.every(([name,amount])=>materialCount(name)>=amount)};
}
function consumeMaterials(requirements) {
  if(!requirements.every(([name,amount])=>materialCount(name)>=amount))return false;
  for(const [name,amount] of requirements){
    let remaining=amount;
    for(const item of player.inventory){
      if(materialRarity(item)!==name)continue;
      const used=Math.min(remaining,item.amount ?? 1);
      item.amount=(item.amount ?? 1)-used;remaining-=used;
    }
  }
  player.inventory=player.inventory.filter(i=>i.type!=='material' || i.amount>0);
  return true;
}
function craftSword(name) {
  if(isServerWorld())return requestPlayerAction('weapon',{name});
  const recipe=SWORDS.find(s=>s.name===name);if(!recipe)return false;
  const status=swordRecipeStatus(recipe);
  if(!status.owned){
    if(!status.previousReady || !status.coinsReady || !status.materialsReady)return false;
    consumeMaterials(recipe.materials);player.coins-=recipe.coins;
    player.inventory.push({...recipe});
  }
  player.equipment.weapon={...recipe};player.selectedSlot=0;
  saveGame();return true;
}
function startOreCraft(name,now=Date.now()) {
  if(isServerWorld())return requestPlayerAction('fusion',{name});
  if(player.pendingCraft && now-player.pendingCraft.startedAt<EXPANSION.craftDurationOf(player.pendingCraft))return false;
  const recipe=craftRecipes[name];
  if(!recipe || !consumeMaterials([[name,5]]))return false;
  const success=Math.random()<recipe.chance;
  const lost=success ? 5 : 1+Math.floor(Math.random()*4);
  if(!success)addOreMaterial(rarities.find(r=>r.name===name),5-lost);
  player.pendingCraft={id:'fusion_'+now,from:name,to:recipe.next,success,lost,startedAt:now};
  craftResult=null;
  if(success){addOreMaterial(rarities.find(r=>r.name===recipe.next));recordJournal('crafted');}
  // Resolve and save once before the visual animation, including across reloads.
  saveGame();return true;
}
function tickOreCraft(now=Date.now()) {
  if(player.pendingCraft && now-player.pendingCraft.startedAt>=EXPANSION.craftDurationOf(player.pendingCraft)){
    craftResult=player.pendingCraft;player.pendingCraft=null;saveGame();
  }
}
function recordJournal(stat,rarity) {
  if(!player.journal)normalizeSystems();
  player.journal[stat]=(player.journal[stat] || 0)+1;
  if(rarity)player.journal.seen[rarity]=(player.journal.seen[rarity] || 0)+1;
  checkAchievements();
}
function checkAchievements() {
  if(!player.journal)return;
  for(const achievement of ACHIEVEMENTS){
    const progress=achievement.stat==='level' ? player.level : player.journal[achievement.stat] || 0;
    if(progress>=achievement.goal && !player.journal.unlocked.includes(achievement.id)){
      player.journal.unlocked.push(achievement.id);
      lastAchievementNotice=achievement.name;
      addChat('Conquista desbloqueada: '+achievement.name);
    }
  }
}
function focusGameChat() {document.getElementById('game-chat-input')?.focus();}
function isUiBlocking() {return !!window.worldTransitioning || (isServerWorld() && (!multiplayer.ready || !socket.connected)) || (typeof modalUiBlocking==='function' && modalUiBlocking()) || player.dead || cavePromptOpen || typing || inventoryOpen || shopOpen || craftOpen || talentsOpen || !!extraPanel;}
function movePlayerPhysics(dt) {
  let dx=0,dy=0;
  if(!isUiBlocking()){
    const mobile=typeof mobileState!=='undefined' && mobileState.enabled;
    if(mobile){dx=mobileState.dx;dy=mobileState.dy;}
    if(!mobile && settings.controls!=='mouse'){
      dx=Number(heldKeys.has('d')||heldKeys.has('arrowright'))-Number(heldKeys.has('a')||heldKeys.has('arrowleft'));
      dy=Number(heldKeys.has('s')||heldKeys.has('arrowdown'))-Number(heldKeys.has('w')||heldKeys.has('arrowup'));
    }
    if(!mobile && !dx && !dy && settings.controls!=='wasd' && (movementAimActive || touch.active)){
      dx=(touch.active ? touch.x : mouse.x)-canvas.width/2;
      dy=(touch.active ? touch.y : mouse.y)-canvas.height/2;
      const length=Math.hypot(dx,dy);
      const strength=Math.min(1,length/110);
      dx=length>10 ? dx/length*strength : 0;dy=length>10 ? dy/length*strength : 0;
    }
  }
  const length=Math.hypot(dx,dy);if(length>1){dx/=length;dy/=length;}
  const speed=240*(1+talentRank('speed')*.08+(currentRealm==='cave' ? talentRank('sprint')*.04 : 0))*(1+utilityBonus('speed'));
  if(isServerWorld() && multiplayer.protocol>=5){if(!player.dead && multiplayer.ready && socket.connected)networkMovement.input(player,dx,dy,dt,speed,movePredictedPlayer);return;}
  const blend=1-Math.exp(-9*dt);
  player.vx=(player.vx || 0)+(dx*speed-(player.vx || 0))*blend;
  player.vy=(player.vy || 0)+(dy*speed-(player.vy || 0))*blend;
  if(player.dead)return;
  moveWithWalls(player,player.x+player.vx*dt,player.y+player.vy*dt,player.size);
}
function takePlayerDamage(amount,dx=0,dy=0,cause='uma pedra') {
  if(isServerWorld())return false;
  const now=performance.now();
  if(player.dead || (currentRealm==='garden' && getZone(player.x,player.y)==='P'))return false;
  if(Math.random()<utilityBonus('dodge')){damageNumbers.push({x:player.x,y:player.y-35,text:'ESQUIVA',life:.7});return false;}
  player.hp-=Math.max(1,amount*(1-talentRank('defense')*.04)*(1-armorReduction())-(player.defense || 0));

  player.lastDamageSource=cause;
  const length=Math.hypot(dx,dy)||1;
  player.vx=(player.vx || 0)+dx/length*180;player.vy=(player.vy || 0)+dy/length*180;
  if(player.hp<=0)enterDeath(cause);
  return true;
}
function updateCombatWorld(dt) {
  if(isServerWorld()){updateSharedCombatPresentation(dt);return;}
  if(player.dead){nearestBoss=null;return;}
  updateGuardians(dt);
  updateBossMobAbilities(dt);
  if(player.dead){nearestBoss=null;return;}
  nearestBoss=null;
  let nearest=Infinity;
  for(const ore of ores){
    if(!ore?.rarity)continue;
    normalizeOreScale(ore);
    const dx=player.x-ore.x,dy=player.y-ore.y,distance=Math.hypot(dx,dy);
    const index=Math.max(0,rarities.findIndex(r=>r.name===ore.rarity.name));
    if(distance<ore.size+player.size){
      const penetration=ore.size+player.size-distance;
      moveWithWalls(player,player.x+(dx || 1)/(distance || 1)*penetration,player.y+dy/(distance || 1)*penetration,player.size);
      takePlayerDamage(4*Math.pow(1.4,index),dx || 1,dy,'Pedra '+ore.rarity.name);
    }
  }
  for(const entity of [...ores,...mobs]){
    if(!isBossRarity(entity.rarity))continue;
    if(entity.summoned)continue;
    const distance=Math.hypot(entity.x-player.x,entity.y-player.y),size=entity.size;
    if(distance<Math.max(950,size+650) && distance<nearest){nearestBoss=entity;nearest=distance;}
    if(mobs.includes(entity) || distance-size>1800)continue;
    entity.shotTimer=(entity.shotTimer ?? 1.7)-dt;
    if(entity.shotTimer<=0){
      entity.shotTimer=2.5;
      for(let n=0;n<5;n++){
        const angle=Math.random()*Math.PI*2,index=Math.max(0,rarities.findIndex(r=>r.name===entity.rarity.name)),speed=640+index*35;
        projectiles.push({owner:entity.id,cause:(entity.name || 'Pedra')+' '+entity.rarity.name,x:entity.x+Math.cos(angle)*(size+18),y:entity.y+Math.sin(angle)*(size+18),vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:9+Math.random()*6,life:3,damage:14+index*3,rotation:angle});
      }
    }
  }
  for(const rock of projectiles){
    if(Math.abs(rock.x-player.x)>worldViewWidth()/2+30 || Math.abs(rock.y-player.y)>worldViewHeight()/2+30)continue;
    if(player.dead)break;
    rock.x+=rock.vx*dt;rock.y+=rock.vy*dt;rock.life-=dt;
    if(currentRealm==='cave' && !caveTileOpen(Math.floor(rock.x/CAVE.tile),Math.floor(rock.y/CAVE.tile)))rock.life=0;
    if(rock.life>0 && Math.hypot(rock.x-player.x,rock.y-player.y)<rock.r+player.size){
      takePlayerDamage(rock.damage,rock.vx,rock.vy,'projétil de '+rock.cause);rock.life=0;
    }
  }
  const owners=new Set([...ores,...mobs].map(entity=>entity.id));
  projectiles=projectiles.filter(p=>p.life>0 && owners.has(p.owner));
  for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}
  particles=particles.filter(p=>p.life>0).slice(-250);
}

function equipmentParticleColor(item) {
  return {'Diamante':'#76ffff','Matéria Vermelha':'#ff6868','Solar':'#ffdf62','Void':'#ad77ff'}[item?.name];
}
function getRemoteEquipment(remote) {
  if(remote.selectedSlot===3)return UTILITIES.find(u=>u.name===remote.utility);
  return remote.selectedSlot===0 ? SWORDS.find(s=>s.name===remote.weapon) : {...pickaxes.find(p=>p.name===remote.pickaxe),img:pickaxeSprites[remote.pickaxe]};
}
function drawHeldEquipment(item,x,y,angle,local,entity=player) {
  if(!item?.img?.complete || !item.img.naturalWidth)return;
  const remaining=local ? (player.swingUntil || 0)-performance.now() : (entity.attackUntil || 0)-Date.now();
  const swing=remaining>0 ? Math.sin(Math.min(1,remaining/180)*Math.PI)*.85 : 0;
  ctx.save();ctx.translate(x,y);ctx.rotate(angle+swing);
  const sword=item.type==='weapon';ctx.drawImage(item.img,20,sword ? -25 : -15,sword ? 50 : 36,sword ? 50 : 36);ctx.restore();
  const color=equipmentParticleColor(item),now=performance.now();
  if(local && color && settings.particles && now-lastParticleTime>45){
    lastParticleTime=now;
    const radius=35+Math.random()*25;
    particles.push({x:x+Math.cos(angle+swing)*radius,y:y+Math.sin(angle+swing)*radius,vx:(Math.random()-.5)*35,vy:(Math.random()-.5)*35,life:.4+Math.random()*.4,color});
  }
}
function drawCombatEffects() {
  drawBossMobEffects();
  ctx.save();
  for(const rock of projectiles){
    ctx.save();ctx.translate(rock.x,rock.y);ctx.rotate(rock.rotation);
    if(rock.kind==='sting'){
      ctx.fillStyle='#292b2c';ctx.strokeStyle='#ffe58c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(rock.r*2,0);ctx.lineTo(-rock.r,-rock.r*.6);ctx.lineTo(-rock.r,rock.r*.6);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();continue;
    }
    if(rock.kind==='orb'){ctx.fillStyle='#ed79c6';ctx.strokeStyle='#fff0a8';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,rock.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();continue;}
    ctx.fillStyle='#7d8585';ctx.strokeStyle='#d9d5b6';ctx.lineWidth=2;
    ctx.beginPath();for(let n=0;n<6;n++){const a=n*Math.PI/3;ctx.lineTo(Math.cos(a)*rock.r,Math.sin(a)*rock.r);}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  }
  if(settings.particles)for(const p of particles){
    ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle=p.color;
    ctx.fillRect(p.x-2,p.y-2,4,4);
  }
  ctx.restore();
}
window.addEventListener('keydown',event=>{
  if(typeof event.key!=='string')return;
  if(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)return;
  if(event.target.closest?.('select,[role="dialog"]'))return;
  const key=event.key.toLowerCase();
  if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)){heldKeys.add(key);event.preventDefault();}
});
window.addEventListener('keyup',event=>{if(typeof event.key==='string')heldKeys.delete(event.key.toLowerCase());});
window.addEventListener('blur',()=>{heldKeys.clear();movementAimActive=false;touch.active=false;});
document.addEventListener('visibilitychange',()=>{if(document.hidden){heldKeys.clear();movementAimActive=false;touch.active=false;}});
canvas.addEventListener('pointermove',event=>{if(event.pointerType==='touch'){touch={active:true,x:event.clientX,y:event.clientY};}});
canvas.addEventListener('pointerdown',event=>{if(event.pointerType==='touch'){touch={active:true,x:event.clientX,y:event.clientY};}});
canvas.addEventListener('pointerup',()=>{touch.active=false;});
canvas.addEventListener('pointercancel',()=>{touch.active=false;});
socket.on('connect',()=>{guildState.connected=true;socket.emit('guildList');});
socket.on('disconnect',()=>{guildState.connected=false;});
socket.on('guildState',state=>{guildState={...state,connected:true};});
socket.on('guildDirectory',directory=>{guildState.directory=directory;});
socket.on('guildResult',result=>{document.getElementById('guild-message').textContent=result.message;});
