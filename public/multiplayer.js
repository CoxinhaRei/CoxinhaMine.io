const multiplayer={authority:!!window.sharedWorldAvailable,ready:false,started:false,inLobby:false,lastMove:0,lastSave:0,realm:'garden',contribution:{},squadContribution:{},profileName:'',pendingJoin:false};
const PROFILE_KEYS='coxinha_profiles_v2';
const SESSION_KEY='coxinha_active_session_v4';
function activeSession(){try{const session=JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');return session && /^[a-f0-9-]{36}$/.test(session.id) && /^[a-f0-9]{64}$/.test(session.token) ? session : null;}catch{return null;}}
function isServerWorld(){return multiplayer.authority;}
function profileKeys(){try{return Object.assign(Object.create(null),JSON.parse(localStorage.getItem(PROFILE_KEYS)||'{}'));}catch{return Object.create(null);}}
function beginSharedSession({lobby=false}={}){
  if(!lobby)multiplayer.started=true;
  if(multiplayer.pendingJoin)return multiplayer.joinPromise.then(ok=>ok && multiplayer.supportsLobby && multiplayer.inLobby!==lobby ? beginSharedSession({lobby}) : ok);
  if(socket.connected===false)return Promise.resolve(false);
  const credentials=activeSession();
  if(!credentials){multiplayer.started=false;if(typeof openAccountRequired==='function')openAccountRequired();return Promise.resolve(false);}
  multiplayer.pendingJoin=true;
  const realm=typeof selectedMenuRealm==='string' ? selectedMenuRealm : currentRealm;
  multiplayer.joinPromise=new Promise(resolve=>socket.timeout(15000).emit('joinGame',{credentials,lobby,realm},(error,result)=>{
    multiplayer.pendingJoin=false;
    if(error || !result?.ok){const message=result?.message || 'Não foi possível conectar. Tente novamente.';sharedNotice(message);multiplayer.started=false;if(!error){localStorage.removeItem(SESSION_KEY);multiplayer.account=null;if(typeof openAccountRequired==='function')openAccountRequired(message);}resolve(false);return;}
    resolve(true);
  }));return multiplayer.joinPromise;
}
function applyServerPlayer(state){
  if(state.dead && !player.dead)enterDeath(state.deathCause);
  const keys=['level','xp','xpToNext','coins','inventory','equipment','talents','talentRanks','talentPoints','maxHp','hp','abilityReadyAt','journal','pendingCraft','dead','deathCause','saveRevision','selectedSlot'];
  for(const key of keys)if(state[key]!==undefined)player[key]=state[key];
  player.progressionVersion=3;restoreEquipment();restoreArmor();
  if(typeof inventorySignature!=='undefined')inventorySignature='';if(typeof lastShopState!=='undefined')lastShopState='';
  saveGame();
}
function queuePlayerSave(data){
  if(!multiplayer.account)return;
  try{localStorage.setItem('coxinha_backup_id_'+activeSession()?.id,JSON.stringify(data));}catch{}
  if(multiplayer.ready && socket.connected && performance.now()-multiplayer.lastSave>5000){multiplayer.lastSave=performance.now();socket.emit('savePlayer');}
}
function sendPlayerMovement(){
  if(!multiplayer.ready || !socket.connected || performance.now()-multiplayer.lastMove<50)return;
  const now=performance.now(),aimAngle=typeof playerAimAngle==='function' ? playerAimAngle() : Math.atan2(mouse.y-canvas.height/2,mouse.x-canvas.width/2),last=multiplayer.lastSent;
  if(last && Math.hypot(last.x-player.x,last.y-player.y)<.1 && Math.abs(last.aimAngle-aimAngle)<.01 && last.selectedSlot===player.selectedSlot && now-multiplayer.lastMove<250)return;
  multiplayer.lastMove=now;multiplayer.seq=(multiplayer.seq || 0)+1;
  const packet={seq:multiplayer.seq,realm:currentRealm,epoch:multiplayer.movementEpoch,x:player.x,y:player.y,selectedSlot:player.selectedSlot,aimAngle,viewRadius:Math.hypot(worldViewWidth(),worldViewHeight())/2+350};multiplayer.lastSent=packet;
  pendingMovement.set(packet.seq,{x:packet.x,y:packet.y});if(pendingMovement.size>40)pendingMovement.delete(pendingMovement.keys().next().value);
  socket.volatile.emit('move',packet);
}
const pendingMovement=new Map();
function mergeNetworkEntities(previous,incoming){const existing=new Map(previous.map(e=>[e.id,e])),now=performance.now();return incoming.map(data=>{const item=existing.get(data.id);if(!item || Math.hypot(item.x-data.x,item.y-data.y)>1400)return {...data};const from={x:item.x,y:item.y,angle:item.angle || 0,walkPhase:item.walkPhase || 0};Object.assign(item,data);item._from=from;item._to={x:data.x,y:data.y,angle:data.angle || 0,walkPhase:data.walkPhase || 0};item._received=now;item.x=from.x;item.y=from.y;return item;});}
function mergeRemotePlayers(packet){const list=mergeNetworkEntities(Object.entries(players).map(([id,p])=>({...p,id})),Object.entries(packet || {}).map(([id,p])=>({...p,id})));return Object.fromEntries(list.map(p=>[p.id,p]));}
function interpolateNetwork(now){for(const entity of [...mobs,...Object.values(players),...projectiles]){if(!entity._from)continue;const t=Math.min(1,(now-entity._received)/100),a=entity._from,b=entity._to;entity.x=a.x+(b.x-a.x)*t;entity.y=a.y+(b.y-a.y)*t;entity.angle=a.angle+Math.atan2(Math.sin(b.angle-a.angle),Math.cos(b.angle-a.angle))*t;entity.walkPhase=a.walkPhase+(b.walkPhase-a.walkPhase)*t;}}
function requestPlayerAction(kind,data={}){
  if(!multiplayer.ready || !socket.connected || player.dead)return false;
  socket.emit('playerAction',{kind,data});return true;
}
function requestSharedAbility(type){
  if(!multiplayer.ready || isUiBlocking() || player.dead || Date.now()<(player.abilityReadyAt?.[type] || 0))return false;
  socket.emit('useAbility',type);return true;
}
function updateSharedPresentation(dt){
  interpolateNetwork(performance.now());
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
function renderNetworkStatus(){networkStatus.hidden=!multiplayer.started;networkStatus.textContent=multiplayer.ready && socket.connected ? '● Mundo compartilhado · '+(multiplayer.ping ?? '…')+' ms · loot: 5%+' : 'Reconectando ao mundo…';}
setInterval(()=>{if(!socket.connected)return;const sent=performance.now();socket.timeout(3000).emit('latencyProbe',{},(error,result)=>{if(!error){multiplayer.ping=Math.round(performance.now()-sent);multiplayer.serverTick=result.tickMs;renderNetworkStatus();}});},5000);
socket.on('init',data=>{multiplayer.supportsLobby=data.protocol>=3;multiplayer.accounts=!!data.accounts;multiplayer.squads=!!data.squads;multiplayer.durable=data.durable;if(data.sharedWorld){multiplayer.authority=true;if((multiplayer.started || multiplayer.inLobby) && !multiplayer.ready)beginSharedSession({lobby:!multiplayer.started});}renderNetworkStatus();});
socket.on('connect',()=>{multiplayer.pendingJoin=false;if(multiplayer.started || multiplayer.inLobby)beginSharedSession({lobby:!multiplayer.started});renderNetworkStatus();});
socket.on('disconnect',()=>{multiplayer.ready=false;multiplayer.pendingJoin=false;heldKeys.clear();movementAimActive=false;renderNetworkStatus();});
socket.on('sessionReplaced',()=>{sharedNotice('Este perfil entrou em outra aba. Use outro nome para testar um segundo jogador.');multiplayer.started=false;});
socket.on('profileReady',data=>{
  const keys=profileKeys();if(data.credentials){for(const name of Object.keys(keys))if(keys[name]?.id===data.credentials.id)keys[name]=data.credentials;keys[data.state.name]=data.credentials;localStorage.setItem(PROFILE_KEYS,JSON.stringify(keys));}multiplayer.profileName=data.state.name;
  multiplayer.account=data.account || null;
  if(data.account && data.credentials)localStorage.setItem(SESSION_KEY,JSON.stringify({...data.credentials,username:data.account.username,accountId:data.account.id}));
  multiplayer.authority=true;multiplayer.ready=true;multiplayer.pendingJoin=false;
  multiplayer.inLobby=!!data.lobby;
  multiplayer.movementEpoch=data.epoch;
  CAVE.maze=null;caveMapImage=null;multiplayer.mapVersion=-1;
  pendingMovement.clear();multiplayer.lastSent=null;player.name=data.state.name;currentRealm=data.realm;player.x=data.x;player.y=data.y;applyServerPlayer(data.state);renderNetworkStatus();
});
socket.on('playerState',applyServerPlayer);
socket.on('playerDamage',data=>{
  player.hp=data.hp;player.maxHp=data.maxHp;
  const distance=Math.hypot(data.dx,data.dy)||1;player.vx=(player.vx||0)+data.dx/distance*100;player.vy=(player.vy||0)+data.dy/distance*100;
  if(data.dead)enterDeath(data.cause);
});
function applyWorldSnapshot(snapshot){
  if(!multiplayer.ready || snapshot.realm!==currentRealm)return;
  ores=snapshot.ores;mobs=mergeNetworkEntities(mobs,snapshot.mobs);projectiles=mergeNetworkEntities(projectiles,snapshot.projectiles);bossMobHazards=snapshot.hazards;bossMobEffects=snapshot.effects;
  multiplayer.drops=snapshot.drops || [];multiplayer.timeOffset=snapshot.serverTime-Date.now();
  const self=snapshot.self,history=self && pendingMovement.get(self.seq);
  if(history && self.epoch===multiplayer.movementEpoch && self.seq>(multiplayer.correctedSeq || 0)){multiplayer.correctedSeq=self.seq;const dx=self.x-history.x,dy=self.y-history.y;if(Math.hypot(dx,dy)>2){player.x+=dx;player.y+=dy;for(const [seq,point] of pendingMovement)if(seq>=self.seq){point.x+=dx;point.y+=dy;}}}
  multiplayer.contribution=snapshot.contribution;player.hp=snapshot.hp;player.maxHp=snapshot.maxHp;
  multiplayer.squadContribution=snapshot.squadContribution || {};
  if(currentRealm==='cave' && multiplayer.mapVersion!==snapshot.mapVersion && Array.isArray(snapshot.mapDelta)){buildCaveMaze();for(const index of snapshot.mapDelta)CAVE.maze[index]=1;multiplayer.mapVersion=snapshot.mapVersion;caveMapImage=null;socket.emit('mapAck',{realm:currentRealm,version:snapshot.mapVersion});}
  if(snapshot.dead && !player.dead)enterDeath(snapshot.deathCause);
}
socket.on('worldSnapshot',applyWorldSnapshot);
socket.on('worldFrame',frame=>{players=mergeRemotePlayers(frame.players);applyWorldSnapshot(frame.world);});
socket.on('realmChanged',data=>{
  const change=()=>{currentRealm=data.realm;multiplayer.movementEpoch=data.epoch;player.x=data.x;player.y=data.y;player.vx=0;player.vy=0;ores=[];mobs=[];projectiles=[];multiplayer.drops=[];pendingMovement.clear();clearBossMobEffects();heldKeys.clear();movementAimActive=false;multiplayer.mapVersion=-1;if(currentRealm==='cave')buildCaveMaze();};
  if(typeof irisTransition==='function')irisTransition(change);else change();
});
socket.on('entityHit',data=>{miningBurst(data.x,data.y,data.color,data.isMob ? 9 : 16);damageNumbers.push({x:data.x,y:data.y-25,text:Math.round(data.damage),life:.7});});
socket.on('abilityEffect',effect=>abilityEffects.push(effect));
socket.on('lootResult',result=>sharedNotice(result.qualified ? (result.shared ? 'Loot do Squad · ' : 'Loot recebido · ')+result.entity+' '+result.rarity+' · '+((result.shared ? result.squadShare : result.share)*100).toFixed(1)+'% de participação' : 'Sem loot · participação '+(result.share*100).toFixed(1)+'% · mínimo 5%'));
socket.on('actionResult',result=>{if(!result.ok)sharedNotice(result.message);const message=document.getElementById('recipe-result');if(message && shopOpen)message.textContent=result.message;});
socket.on('saveConfirmed',result=>{networkStatus.title=(result.committed===false ? 'Banco indisponível; salvamento pendente' : 'Save confirmado no servidor')+' · '+new Date(result.at).toLocaleTimeString()+' · '+result.persistence;if(result.committed===false)sharedNotice('O banco está temporariamente indisponível. O servidor está tentando salvar novamente.');});
const saveTools=document.createElement('section');saveTools.className='save-tools';
saveTools.innerHTML='<h2>Seu progresso</h2><p>O jogo salva neste navegador e no servidor. Guarde um backup para restaurar seu perfil em outro navegador.</p><button id="export-player-save">Baixar backup</button><label class="save-import">Restaurar backup<input id="import-player-save" type="file" accept="application/json,.json"></label><p id="save-tools-result" role="status"></p>';
settingsPanel.querySelector('.settings-body').append(saveTools);
document.getElementById('export-player-save').onclick=()=>{
  saveGame();const state=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}'),name=multiplayer.profileName || player.name;
  const data={format:'coxinha-profile-v2',name,credentials:activeSession(),state};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='coxinha-save-'+name.replace(/[^a-z0-9]/gi,'_')+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
  document.getElementById('save-tools-result').textContent='Backup baixado. Guarde o arquivo, pois ele dá acesso ao seu perfil.';
};
document.getElementById('import-player-save').onchange=async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try{
    if(file.size>2000000)throw Error('Arquivo de backup muito grande.');const data=JSON.parse(await file.text());
    if(data.format!=='coxinha-profile-v2' || !data.state || typeof data.name!=='string' || !/^[a-f0-9-]{36}$/.test(data.credentials?.id || '') || !/^[a-f0-9]{64}$/.test(data.credentials?.token || ''))throw Error('Backup inválido.');
    localStorage.setItem(SESSION_KEY,JSON.stringify({...data.credentials,username:data.name}));
    localStorage.setItem('coxinha_restore_name',data.name);location.reload();
  }catch(error){document.getElementById('save-tools-result').textContent=error.message;}
};
const restoredName=localStorage.getItem('coxinha_restore_name');if(restoredName){document.getElementById('nameInput').value=restoredName;localStorage.removeItem('coxinha_restore_name');}
