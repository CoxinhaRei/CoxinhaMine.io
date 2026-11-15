const crypto=require('crypto');
const safeNumber=(n,fallback=0,min=0,max=1e12)=>Number.isFinite(Number(n)) ? Math.min(max,Math.max(min,Number(n))) : fallback;
const clone=value=>JSON.parse(JSON.stringify(value,(key,item)=>key==='img' ? undefined : item));
const hash=token=>crypto.createHash('sha256').update(token).digest('hex');

module.exports=function playerStore(db,game){
  db.defaults({players:{},profiles:{},guilds:{}}).write();
  function sanitize(raw={}){
    const state=game.fresh();
    state.level=Math.floor(safeNumber(raw.level,1,1,99999));state.xp=safeNumber(raw.xp);state.coins=Math.floor(safeNumber(raw.coins));
    state.xpToNext=game.xpForLevel(state.level);state.progressionVersion=2;
    state.talentRanks={};for(const [key,value] of Object.entries(raw.talentRanks || {}))if(/^[a-z]{1,20}$/.test(key))state.talentRanks[key]=Math.floor(safeNumber(value,0,0,11));
    state.talentPoints=Math.floor(safeNumber(raw.talentPoints,Math.max(0,state.level-1),0,1e7));
    state.talents={speed:Math.floor(safeNumber(raw.talents?.speed,0,0,11))};
    state.inventory=[];
    for(const item of Array.isArray(raw.inventory) ? raw.inventory.slice(0,500) : []){
      if(item?.type==='material'){
        const rarity=game.rarities.find(r=>r.name===(item.oreRarity || item.name?.replace(/^Minério\s+/i,'') || item.id?.replace(/_material$/,'')));
        const amount=Math.floor(safeNumber(item.amount,1,0,1e9));if(rarity && amount)state.inventory.push({id:rarity.name+'_material',type:'material',name:rarity.name,oreRarity:rarity.name,color:rarity.color,amount});
      }else{
        const list={weapon:game.swords,pickaxe:game.pickaxes,armor:game.armors,utility:game.utilities}[item?.type];
        const recipe=list?.find(r=>r.name===item.name);if(recipe && !state.inventory.some(i=>i.type===item.type && i.name===item.name))state.inventory.push({...recipe,type:item.type,amount:1});
      }
    }
    state.equipment={weapon:null,pickaxe:{...game.pickaxes[0],type:'pickaxe'},armor:null,utility:null};
    for(const [type,list] of Object.entries({weapon:game.swords,pickaxe:game.pickaxes,armor:game.armors,utility:game.utilities})){
      const requested=raw.equipment?.[type],name=typeof requested==='string' ? requested : requested?.name;
      const gear=list.find(r=>r.name===name);if(gear){state.equipment[type]={...gear,type};if(!state.inventory.some(i=>i.type===type && i.name===name))state.inventory.push({...gear,type,amount:1});}
    }
    state.journal={mined:0,kills:0,crafted:0,bossKills:0,seen:{},species:{},unlocked:[],...(raw.journal && typeof raw.journal==='object' ? clone(raw.journal) : {})};
    for(const key of ['mined','kills','crafted','bossKills'])state.journal[key]=Math.floor(safeNumber(state.journal[key]));
    state.journal.seen=state.journal.seen && typeof state.journal.seen==='object' ? state.journal.seen : {};
    state.journal.species=state.journal.species && typeof state.journal.species==='object' ? state.journal.species : {};
    state.journal.unlocked=Array.isArray(state.journal.unlocked) ? state.journal.unlocked.slice(0,100) : [];
    state.abilityReadyAt={};for(const type of ['weapon','pickaxe','utility'])state.abilityReadyAt[type]=safeNumber(raw.abilityReadyAt?.[type],0,0,Date.now()+120000);
    state.pendingCraft=raw.pendingCraft && typeof raw.pendingCraft.from==='string' ? clone(raw.pendingCraft) : null;
    state.maxHp=100+(state.talentRanks.vitality || 0)*20;state.hp=state.maxHp;state.size=20;state.damage=10;
    state.x=50000;state.y=50000;state.realm='garden';state.dead=false;state.deathCause='';state.selectedSlot=2;state.vx=0;state.vy=0;
    return state;
  }
  function join(data={}){
    const creds=data.credentials || {},id=typeof creds.id==='string' ? creds.id : '';
    const token=typeof creds.token==='string' && /^[a-f0-9]{64}$/.test(creds.token) ? creds.token : '';
    let profile=id ? db.get(['profiles',id]).value() : null;
    if(profile && (!token || !crypto.timingSafeEqual(Buffer.from(profile.tokenHash,'hex'),Buffer.from(hash(token),'hex'))))throw Error('Este perfil precisa da chave de acesso salva no navegador.');
    const name=String(data.name || 'Player').trim().slice(0,24) || 'Player';
    if(!profile){
      // A browser backup can recover the same identity after ephemeral host storage resets.
      const recover=/^[a-f0-9-]{36}$/.test(id) && token;
      const newId=recover ? id : crypto.randomUUID(),newToken=recover ? token : crypto.randomBytes(32).toString('hex');
      const occupied=Object.values(db.get('profiles').value()).some(p=>p.name===name);
      profile={id:newId,name:occupied ? name.slice(0,17)+'-'+newId.slice(0,5) : name,tokenHash:hash(newToken),state:sanitize(data.legacySave),revision:0};
      db.set(['profiles',newId],profile).write();return {profile,credentials:{id:newId,token:newToken}};
    }
    const guildId=profile.state.guildId;profile.state=sanitize(profile.state);profile.state.guildId=guildId || null;
    return {profile,credentials:{id,token}};
  }
  function save(profile){profile.revision++;profile.savedAt=Date.now();db.set(['profiles',profile.id],profile).write();}
  function clientState(profile){return {...clone(profile.state),name:profile.name,saveRevision:profile.revision};}
  return {sanitize,join,save,clientState,clone,find:id=>db.get(['profiles',id]).value()};
};
