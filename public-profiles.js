const expansion=require('./public/expansion'),catalog=require('./public/game-catalog');
const METRICS={level:'Mais nível',xp:'Mais XP total',mined:'Mais minérios minerados',collected:'Mais pedras obtidas',crafted:'Mais crafts concluídos',destroyed:'Mais itens destruídos em falhas'};
function score(profile,metric){const s=profile.state||{},j=s.journal||{};return expansion.num(({level:s.level,xp:catalog.totalXpForLevel(s.level||1)+(s.xp||0),mined:j.mined,collected:j.stonesCollected,crafted:j.crafted,destroyed:j.craftsDestroyed})[metric]);}
function publicProfile(profile,claims){
 if(claims)profile={...profile,state:require('./chosen-forge').filteredState(profile.state,profile.id,claims,profile.developerTest===true)};
 const s=profile.state||{},j=s.journal||{},allowed=expansion.RARITIES;
 const gear=Object.fromEntries(['weapon','armor','pickaxe'].map(type=>[type,s.equipment?.[type]?.name||null]));
 return {id:profile.id,name:profile.name,developerTest:profile.developerTest===true,level:s.level||1,xp:s.xp||0,xpToNext:catalog.xpForLevel(s.level||1),joinedAt:s.joinedAt||null,playTimeMs:expansion.num(s.playTimeMs),lastSeen:profile.savedAt||null,gear,accessories:(s.accessories||[]).slice(0,expansion.slots(s.level)),slots:expansion.slots(s.level),nextSlotLevel:expansion.slots(s.level)<20?(Math.floor((s.level||1)/25)+1)*25:null,stats:Object.fromEntries(Object.keys(METRICS).map(k=>[k,score(profile,k)])),kills:expansion.num(j.kills),inventory:expansion.inventoryTotals(s),killTiers:Object.fromEntries(Object.entries(j.killTiers||{}).filter(([key])=>allowed.some(r=>key.endsWith(':'+r))).map(([k,v])=>[k,expansion.num(v)])),oreTiers:Object.fromEntries(Object.entries(j.oreTiers||{}).filter(([key])=>allowed.includes(key)).map(([k,v])=>[k,expansion.num(v)]))};
}
module.exports=function attachPublicProfiles(socket,{actors,store,persistence,catalogAction,chosen}){
 let next=0;const all=()=>Object.values(persistence.db.get('profiles').value()||{}).filter(p=>p.accountId&&!p.guest&&!p.developerTest);
 socket.on('publicStats',async(request={},reply)=>{
  if(typeof reply!=='function')return;if(Date.now()<next){reply({ok:false,message:'Aguarde um instante para atualizar.'});return;}next=Date.now()+150;
  try{
   // Refresh remote account records at most every 15s; cached reads survive DB outages.
   if(persistence.shared&&Date.now()-(persistence.publicStatsRefresh||0)>15000){persistence.publicStatsRefresh=Date.now();try{await catalogAction(()=>{});}catch{}}
   const profiles=all();if(request.self){const own=actors[socket.id]?.profile;reply(own?{ok:true,profile:publicProfile(own,persistence.db.get('chosenClaims').value()||{})}:{ok:false,message:'Entre no jogo para abrir seu perfil.'});return;}if(request.profile || request.nickname){const p=request.profile?profiles.find(p=>p.id===request.profile)||Object.values(actors).find(a=>a.profile.id===request.profile&&!a.profile.developerTest)?.profile:profiles.find(p=>p.name.normalize('NFKC').toLocaleLowerCase()===String(request.nickname).normalize('NFKC').trim().toLocaleLowerCase());reply(p?{ok:true,profile:publicProfile(p,persistence.db.get('chosenClaims').value()||{})}:{ok:false,message:'Conta não encontrada. Convidados não entram no ranking.'});return;}
   const boards=Object.entries(METRICS).map(([id,title])=>({id,title,rows:profiles.map(p=>({id:p.id,name:p.name,level:p.state.level,value:score(p,id)})).sort((a,b)=>b.value-a.value||a.name.localeCompare(b.name)).slice(0,15)}));reply({ok:true,boards,generatedAt:Date.now(),registeredOnly:true});
  }catch{reply({ok:false,message:'Não foi possível carregar os perfis agora.'});}
 });
};
module.exports.publicProfile=publicProfile;module.exports.score=score;
