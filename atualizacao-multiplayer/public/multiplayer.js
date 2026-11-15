const multiplayer={authority:!!window.sharedWorldAvailable,ready:false,started:false,lastMove:0,lastSave:0,realm:'garden',contribution:{},profileName:'',pendingJoin:false};
const PROFILE_KEYS='coxinha_profiles_v2';
function isServerWorld(){return multiplayer.authority;}
function profileKeys(){try{return JSON.parse(localStorage.getItem(PROFILE_KEYS)||'{}');}catch{return {};}}
function beginSharedSession(){
  multiplayer.started=true;
  if(multiplayer.pendingJoin || socket.connected===false)return;
  const name=multiplayer.profileName || player.name;multiplayer.profileName=name;multiplayer.pendingJoin=true;
  const credentials=profileKeys()[name];let legacySave;
  try{legacySave=JSON.parse(localStorage.getItem('coxinha_backup_'+name) || localStorage.getItem(SAVE_KEY) || '{}');}catch{legacySave={};}
  socket.emit('joinGame',{name,credentials,legacySave},result=>{multiplayer.pendingJoin=false;if(!result?.ok && result?.message)sharedNotice(result.message);});
}
function applyServerPlayer(state){
  if(state.dead && !player.dead)enterDeath(state.deathCause);
  const keys=['level','xp','xpToNext','coins','inventory','equipment','talents','talentRanks','talentPoints','maxHp','hp','abilityReadyAt','journal','pendingCraft','dead','deathCause','saveRevision','selectedSlot'];
  for(const key of keys)if(state[key]!==undefined)player[key]=state[key];
  player.progressionVersion=2;restoreEquipment();restoreArmor();
  if(typeof inventorySignature!=='undefined')inventorySignature='';if(typeof lastShopState!=='undefined')lastShopState='';
  saveGame();
}
function queuePlayerSave(data){
  if(!multiplayer.started)return;
  try{localStorage.setItem('coxinha_backup_'+(multiplayer.profileName || player.name),JSON.stringify(data));}catch{}
  if(multiplayer.ready && socket.connected && performance.now()-multiplayer.lastSave>5000){multiplayer.lastSave=performance.now();socket.emit('savePlayer');}
}
function sendPlayerMovement(){
  if(!multiplayer.ready || !socket.connected || performance.now()-multiplayer.lastMove<50)return;
  multiplayer.lastMove=performance.now();
  socket.emit('move',{x:player.x,y:player.y,selectedSlot:player.selectedSlot,aimAngle:Math.atan2(mouse.y-canvas.height/2,mouse.x-canvas.width/2)});
}
function requestPlayerAction(kind,data={}){
  if(!multiplayer.ready || !socket.connected || player.dead)return false;
  socket.emit('playerAction',{kind,data});return true;
}
function requestSharedAbility(type){
  if(!multiplayer.ready || isUiBlocking() || player.dead || Date.now()<(player.abilityReadyAt?.[type] || 0))return false;
  socket.emit('useAbility',type);return true;
}
function updateSharedPresentation(dt){
  for(const number of damageNumbers){number.life-=dt;number.y-=30*dt;}damageNumbers=damageNumbers.filter(n=>n.life>0);
  for(const effect of abilityEffects)effect.life-=dt;abilityEffects=abilityEffects.filter(e=>e.life>0);
}
function updateSharedCombatPresentation(dt){
  nearestBoss=null;let distance=Infinity;
  for(const ore of ores){
    const dx=player.x-ore.x,dy=player.y-ore.y,d=Math.hypot(dx,dy);
    if(!player.dead && d<ore.size+player.size){const overlap=ore.size+player.size-d;moveWithWalls(player,player.x+(dx || 1)/(d || 1)*overlap,player.y+dy/(d || 1)*overlap,player.size);}
  }
  for(const entity of [...ores,...mobs]){
    const d=Math.hypot(entity.x-player.x,entity.y-player.y)-entity.size;
    if(isBossRarity(entity.rarity) && !entity.summoned && d<900 && d<distance){nearestBoss=entity;distance=d;}
  }
  for(const particle of particles){particle.x+=particle.vx*dt;particle.y+=particle.vy*dt;particle.life-=dt;}
  particles=particles.filter(p=>p.life>0).slice(-250);
}
function sharedNotice(message){
  const notice=document.getElementById('network-notice');if(!notice)return;
  notice.textContent=message;notice.hidden=false;clearTimeout(sharedNotice.timer);sharedNotice.timer=setTimeout(()=>{notice.hidden=true;},5000);
}
const networkNotice=document.createElement('div');networkNotice.id='network-notice';networkNotice.setAttribute('role','status');networkNotice.hidden=true;document.body.append(networkNotice);
const networkStatus=document.createElement('small');networkStatus.id='network-status';document.body.append(networkStatus);
function renderNetworkStatus(){networkStatus.hidden=!multiplayer.started;networkStatus.textContent=multiplayer.ready && socket.connected ? '● Mundo compartilhado · loot: 5%+' : multiplayer.authority ? 'Reconectando ao mundo…' : 'Modo local · servidor desconectado';}
socket.on('init',data=>{if(data.sharedWorld){multiplayer.authority=true;if(multiplayer.started && !multiplayer.ready)beginSharedSession();}renderNetworkStatus();});
socket.on('connect',()=>{multiplayer.pendingJoin=false;if(multiplayer.started)beginSharedSession();renderNetworkStatus();});
socket.on('disconnect',()=>{multiplayer.ready=false;multiplayer.pendingJoin=false;heldKeys.clear();movementAimActive=false;renderNetworkStatus();});
socket.on('sessionReplaced',()=>{sharedNotice('Este perfil entrou em outra aba. Use outro nome para testar um segundo jogador.');multiplayer.started=false;});
socket.on('profileReady',data=>{
  const keys=profileKeys();keys[multiplayer.profileName]=data.credentials;localStorage.setItem(PROFILE_KEYS,JSON.stringify(keys));
  multiplayer.authority=true;multiplayer.ready=true;multiplayer.pendingJoin=false;
  CAVE.maze=null;caveMapImage=null;multiplayer.mapVersion=-1;
  player.name=data.state.name;currentRealm=data.realm;player.x=data.x;player.y=data.y;applyServerPlayer(data.state);renderNetworkStatus();
});
socket.on('playerState',applyServerPlayer);
socket.on('playerDamage',data=>{
  player.hp=data.hp;player.maxHp=data.maxHp;
  const distance=Math.hypot(data.dx,data.dy)||1;player.vx=(player.vx||0)+data.dx/distance*100;player.vy=(player.vy||0)+data.dy/distance*100;
  if(data.dead)enterDeath(data.cause);
});
socket.on('worldSnapshot',snapshot=>{
  if(!multiplayer.ready || snapshot.realm!==currentRealm)return;
  ores=snapshot.ores;mobs=snapshot.mobs;projectiles=snapshot.projectiles;bossMobHazards=snapshot.hazards;bossMobEffects=snapshot.effects;
  multiplayer.contribution=snapshot.contribution;player.hp=snapshot.hp;player.maxHp=snapshot.maxHp;
  if(currentRealm==='cave' && multiplayer.mapVersion!==snapshot.mapVersion){buildCaveMaze();for(const index of snapshot.mapDelta || [])CAVE.maze[index]=1;multiplayer.mapVersion=snapshot.mapVersion;caveMapImage=null;}
  if(snapshot.dead && !player.dead)enterDeath(snapshot.deathCause);
});
socket.on('realmChanged',data=>{
  currentRealm=data.realm;player.x=data.x;player.y=data.y;player.vx=0;player.vy=0;ores=[];mobs=[];projectiles=[];clearBossMobEffects();heldKeys.clear();movementAimActive=false;
  if(currentRealm==='cave')buildCaveMaze();
});
socket.on('entityHit',data=>{miningBurst(data.x,data.y,data.color,data.isMob ? 9 : 16);damageNumbers.push({x:data.x,y:data.y-25,text:Math.round(data.damage),life:.7});});
socket.on('abilityEffect',effect=>abilityEffects.push(effect));
socket.on('lootResult',result=>sharedNotice(result.qualified ? 'Loot recebido · '+result.entity+' '+result.rarity+' · '+(result.share*100).toFixed(1)+'% de participação' : 'Sem loot · participação '+(result.share*100).toFixed(1)+'% · mínimo 5%'));
socket.on('actionResult',result=>{if(!result.ok)sharedNotice(result.message);const message=document.getElementById('recipe-result');if(message && shopOpen)message.textContent=result.message;});
socket.on('saveConfirmed',result=>{networkStatus.title='Save confirmado no servidor · '+new Date(result.at).toLocaleTimeString()+' · '+result.persistence;});
const saveTools=document.createElement('section');saveTools.className='save-tools';
saveTools.innerHTML='<h2>Seu progresso</h2><p>O jogo salva neste navegador e no servidor. Guarde um backup para restaurar seu perfil em outro navegador.</p><button id="export-player-save">Baixar backup</button><label class="save-import">Restaurar backup<input id="import-player-save" type="file" accept="application/json,.json"></label><p id="save-tools-result" role="status"></p>';
settingsPanel.querySelector('.settings-body').append(saveTools);
document.getElementById('export-player-save').onclick=()=>{
  saveGame();const state=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}'),name=multiplayer.profileName || player.name;
  const data={format:'coxinha-profile-v2',name,credentials:profileKeys()[name],state};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='coxinha-save-'+name.replace(/[^a-z0-9]/gi,'_')+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
  document.getElementById('save-tools-result').textContent='Backup baixado. Guarde o arquivo, pois ele dá acesso ao seu perfil.';
};
document.getElementById('import-player-save').onchange=async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try{
    if(file.size>2000000)throw Error('Arquivo de backup muito grande.');const data=JSON.parse(await file.text());
    if(data.format!=='coxinha-profile-v2' || !data.state || typeof data.name!=='string' || !/^[a-f0-9-]{36}$/.test(data.credentials?.id || '') || !/^[a-f0-9]{64}$/.test(data.credentials?.token || ''))throw Error('Backup inválido.');
    const keys=profileKeys();keys[data.name]=data.credentials;localStorage.setItem(PROFILE_KEYS,JSON.stringify(keys));localStorage.setItem('coxinha_backup_'+data.name,JSON.stringify(data.state));localStorage.setItem(SAVE_KEY,JSON.stringify(data.state));
    localStorage.setItem('coxinha_restore_name',data.name);location.reload();
  }catch(error){document.getElementById('save-tools-result').textContent=error.message;}
};
const restoredName=localStorage.getItem('coxinha_restore_name');if(restoredName){document.getElementById('nameInput').value=restoredName;localStorage.removeItem('coxinha_restore_name');}
