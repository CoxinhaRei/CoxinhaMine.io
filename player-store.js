const crypto=require('crypto');
const safeNumber=(n,fallback=0,min=0,max=1e12)=>Number.isFinite(Number(n)) ? Math.min(max,Math.max(min,Number(n))) : fallback;
const clone=value=>JSON.parse(JSON.stringify(value,(key,item)=>key==='img' ? undefined : item));
const hash=token=>crypto.createHash('sha256').update(token).digest('hex');

module.exports=function playerStore(db,game){
  db.defaults({players:{},profiles:{},guilds:{}}).write();
  // Guest saves and bearer tokens exist only in this process, never in the database.
  const guests=new Map(),guestTimers=new Map();
  const find=id=>guests.get(id) || db.get(['profiles',id]).value();
  function touchGuest(id){clearTimeout(guestTimers.get(id));guestTimers.delete(id);}
  function discardGuest(id){touchGuest(id);guests.delete(id);}
  function deferGuest(id){if(!guests.has(id))return;touchGuest(id);const timer=setTimeout(()=>discardGuest(id),60000);timer.unref?.();guestTimers.set(id,timer);}
  function createGuest(value){
    if(guests.size>=256)throw Error('O servidor está cheio de convidados. Tente novamente em instantes.');
    const name=String(value || '').normalize('NFKC').replace(/[^\p{L}\p{N}_. -]/gu,'').trim().replace(/\s+/g,' ').slice(0,24) || 'Convidado';
    const id=crypto.randomUUID(),token=crypto.randomBytes(32).toString('hex'),profile={id,name,guest:true,tokenHash:hash(token),state:sanitize(),revision:0};
    guests.set(id,profile);return {profile,credentials:{id,token}};
  }
  function promoteGuest(profile){if(!profile.guest)return;if(!profile.accountId)throw Error('Vincule uma conta antes de salvar.');discardGuest(profile.id);delete profile.guest;}
  function sanitize(raw={}){
    const state=game.fresh();
    state.level=Math.floor(safeNumber(raw.level,1,1,99999));state.xp=safeNumber(raw.xp,0,0,Number.MAX_SAFE_INTEGER);state.coins=Math.floor(safeNumber(raw.coins));
    state.ascensions=require('./public/game-catalog').ascensions(raw);state.summonsEnabled=raw.summonsEnabled!==false;state.xpToNext=require('./public/game-catalog').xpForLevel(state.level,state.ascensions);
    if(raw.progressionVersion!==3)state.xp=Math.floor(Math.min(.999,Math.max(0,state.xp/(Number(raw.xpToNext)||100)))*state.xpToNext);
    state.progressionVersion=3;
    state.talentRanks={};for(const [key,value] of Object.entries(raw.talentRanks || {}))if(/^[a-z]{1,20}$/.test(key))state.talentRanks[key]=Math.floor(safeNumber(value,0,0,11));
    state.talentPoints=Math.floor(safeNumber(raw.talentPoints,Math.max(0,state.level-1),0,1e7));
    state.talents={speed:Math.floor(safeNumber(raw.talents?.speed,0,0,11))};
    state.inventory=[];
    for(const item of Array.isArray(raw.inventory) ? raw.inventory.slice(0,2000) : []){
      if(item?.type==='material'){
        const rarity=game.rarities.find(r=>r.name===(item.oreRarity || item.name?.replace(/^Minério\s+/i,'') || item.id?.replace(/_material$/,'')));
        const amount=Math.floor(safeNumber(item.amount,1,0,1e12));if(rarity && amount)state.inventory.push({id:rarity.name+'_material',type:'material',name:rarity.name,chosenDropId:/^[a-f0-9-]{36}$/.test(item.chosenDropId||'')?item.chosenDropId:undefined,chosenSerial:/^[a-f0-9-]{36}$/.test(item.chosenSerial||'')?item.chosenSerial:undefined,oreRarity:rarity.name,color:rarity.color,amount});
      }else if(item?.type==='component'){
        const rarity=game.rarities.find(r=>r.name===item.rarity),definition=game.creatures.find(c=>c.kind===item.kind);
        if(rarity && definition)state.inventory.push({id:item.kind+'_'+rarity.name,type:'component',kind:item.kind,name:game.lootName(item.kind),chosenDropId:/^[a-f0-9-]{36}$/.test(item.chosenDropId||'')?item.chosenDropId:undefined,chosenSerial:/^[a-f0-9-]{36}$/.test(item.chosenSerial||'')?item.chosenSerial:undefined,rarity:rarity.name,color:rarity.color,amount:Math.floor(safeNumber(item.amount,1,1,1e12))});
      }else if(item?.type==='accessory'){const accessory=game.expansion.accessory(item.accessoryId,item.rarity,item.amount);if(accessory?.amount){if(/^[a-f0-9-]{36}$/.test(item.chosenDropId||''))accessory.chosenDropId=item.chosenDropId;if(/^[a-f0-9-]{36}$/.test(item.chosenSerial||''))accessory.chosenSerial=item.chosenSerial;state.inventory.push(accessory);};
      }else{
        const list={weapon:game.swords,pickaxe:game.pickaxes,armor:game.armors,utility:game.legacyUtilities}[item?.type];
        const recipe=list?.find(r=>r.name===item.name);if(recipe && !state.inventory.some(i=>i.type===item.type && i.name===item.name))state.inventory.push({...recipe,type:item.type,amount:1});
      }
    }
    state.equipment={weapon:{...game.swords[0],type:'weapon'},pickaxe:{...game.pickaxes[0],type:'pickaxe'},armor:null,utility:null};
    for(const [type,list] of Object.entries({weapon:game.swords,pickaxe:game.pickaxes,armor:game.armors,utility:game.legacyUtilities})){
      const requested=raw.equipment?.[type],name=typeof requested==='string' ? requested : requested?.name;
      const gear=list.find(r=>r.name===name);if(gear){state.equipment[type]={...gear,type};if(!state.inventory.some(i=>i.type===type && i.name===name))state.inventory.push({...gear,type,amount:1});}
    }
    const requestedRanged=require('./public/ranged-catalog').resolve(raw.equipment?.ranged);if(requestedRanged)state.equipment.ranged=requestedRanged;
    require('./public/ranged-catalog').migrateSlots(state,game.swords);
    const starter=state.equipment.weapon;if(starter.name===game.swords[0].name&&!state.inventory.some(i=>i.type==='weapon'&&i.name===starter.name))state.inventory.push({...starter,amount:1});
    state.journal={mined:0,kills:0,crafted:0,bossKills:0,seen:{},species:{},unlocked:[],...(raw.journal && typeof raw.journal==='object' ? clone(raw.journal) : {})};
    for(const key of ['mined','kills','crafted','bossKills'])state.journal[key]=Math.floor(safeNumber(state.journal[key]));
    state.journal.seen=state.journal.seen && typeof state.journal.seen==='object' ? state.journal.seen : {};
    state.journal.species=state.journal.species && typeof state.journal.species==='object' ? state.journal.species : {};
    state.journal.unlocked=Array.isArray(state.journal.unlocked) ? state.journal.unlocked.slice(0,100) : [];
    state.gearUpgrades=require('./public/ranged-catalog').normalizeUpgrades(raw.gearUpgrades,state);
    state.abilityReadyAt={};for(const type of ['weapon','pickaxe','utility','rangedZ','rangedX'])state.abilityReadyAt[type]=safeNumber(raw.abilityReadyAt?.[type],0,0,Date.now()+120000);
    state.magic=require('./public/arcana-catalog').normalize(raw.magic);state.mana=safeNumber(raw.mana,100,0,546);state.maxMana=100;state.magicReadyAt=safeNumber(raw.magicReadyAt,0,0,Date.now()+7000);
    state.pendingCraft=raw.pendingCraft && typeof raw.pendingCraft.from==='string' ? clone(raw.pendingCraft) : null;
    state.accessoryVersion=raw.accessoryVersion;state.accessories=Array.isArray(raw.accessories)?clone(raw.accessories):[];state.joinedAt=raw.joinedAt;state.playTimeMs=safeNumber(raw.playTimeMs);state.reviveReadyAt=safeNumber(raw.reviveReadyAt,0,0,Date.now()+180000);game.expansion.normalize(state);
    state.checkpoints=require('./checkpoints').normalize(raw.checkpoints);
    require('./public/game-catalog').enforceEquipment(state,game.swords,game.pickaxes);
    state.maxHp=require('./public/game-catalog').playerHealth(state,game.utility(state).health);state.hp=state.maxHp;state.size=require('./public/game-catalog').playerRadius(game.utility(state).size);state.damage=10;
    const arrival=game.expansion.mapFor('garden').spawn;state.x=arrival.x;state.y=arrival.y;state.realm='garden';state.dead=false;state.deathCause='';state.selectedSlot=2;state.vx=0;state.vy=0;
    return state;
  }
  function join(data={}){
    const profile=verifyCredentials(data.credentials);
    if(!profile)throw Error('Entre com seu nick e senha. Digitar um nome não abre uma conta.');
    const guildId=profile.state.guildId;profile.state=sanitize(profile.state);profile.state.guildId=guildId || null;
    return {profile,credentials:{id:profile.id,token:data.credentials.token}};
  }
  // Trusted server code only. Network requests never import arbitrary browser saves.
  function create(name,state={}){
    name=String(name || '').normalize('NFKC').trim();if(name.length<3 || name.length>24)throw Error('Informe um nick de 3 a 24 caracteres.');
    if(Object.values(db.get('profiles').value()).some(p=>p.name.normalize('NFKC').toLowerCase()===name.toLowerCase()))throw Error('Esse nick já está em uso.');
    const id=crypto.randomUUID(),token=crypto.randomBytes(32).toString('hex'),profile={id,name,tokenHash:hash(token),state:sanitize(state),revision:0};
    db.set(['profiles',id],profile).write();return {profile,credentials:{id,token}};
  }
  function save(profile){require('./public/ranged-catalog').dedupeWeapons(profile.state);profile.revision++;if(profile.guest)return;profile.savedAt=Date.now();db.set(['profiles',profile.id],profile).write();}
  function verifyCredentials(creds={}){
    if(!creds || typeof creds!=='object')return null;
    if(!/^[a-f0-9-]{36}$/.test(creds.id || '') || !/^[a-f0-9]{64}$/.test(creds.token || ''))return null;
    const profile=find(creds.id);if(!profile || !/^[a-f0-9]{64}$/.test(profile.tokenHash || ''))return null;
    return crypto.timingSafeEqual(Buffer.from(profile.tokenHash,'hex'),Buffer.from(hash(creds.token),'hex')) ? profile : null;
  }
  function rotateToken(profile){const token=crypto.randomBytes(32).toString('hex');profile.tokenHash=hash(token);save(profile);return {id:profile.id,token};}
  function rename(profile,name){
    if(profile.name===name)return;
    if(Object.values(db.get('profiles').value()).some(p=>p.id!==profile.id && p.name.toLowerCase()===name.toLowerCase()))throw Error('Esse nick já está em uso por outro perfil.');
    const oldName=profile.name;profile.name=name;profile.state.name=name;
    if(!profile.guest)for(const guild of Object.values(db.get('guilds').value() || {})){guild.members=guild.members.map(member=>member===oldName ? name : member);if(guild.owner===oldName)guild.owner=name;}
  }
  function clientState(profile){return {...clone(profile.state),name:profile.name,guest:!!profile.guest,developerTest:profile.developerTest===true,saveRevision:profile.revision};}
  function close(){for(const timer of guestTimers.values())clearTimeout(timer);guestTimers.clear();guests.clear();}
  return {sanitize,join,create,save,clientState,clone,verifyCredentials,rotateToken,rename,find,createGuest,promoteGuest,touchGuest,deferGuest,discardGuest,close};
};
