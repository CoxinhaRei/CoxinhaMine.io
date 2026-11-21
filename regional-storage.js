const crypto=require('node:crypto');
const fs=require('node:fs');
const {isDeepStrictEqual:equal}=require('node:util');
const diagnostics=require('./save-diagnostics');
const clone=value=>JSON.parse(JSON.stringify(value));
const own=(object,key)=>Object.prototype.hasOwnProperty.call(object || {},key);
const object=value=>value && typeof value==='object' && !Array.isArray(value);

// Compare complete records, not the whole stale database. Redis applies the batch atomically.
const COMMIT=`-- coxinha-record-commit-v1
local raw=redis.call('GET',KEYS[1]) or ''
if raw~=ARGV[1] then return {0,raw} end
for i=2,#KEYS do
 if redis.call('GET',KEYS[i])~=ARGV[3] then return {-1,'SESSION_LOST'} end
end
redis.call('SET',KEYS[1],ARGV[2])
return {1,ARGV[2]}`;
const RENEW=`-- coxinha-renew-v1
local lost={}
for i,key in ipairs(KEYS) do
 if redis.call('GET',key)==ARGV[1] then redis.call('PEXPIRE',key,ARGV[2]) else table.insert(lost,i) end
end
return lost`;
const RELEASE=`-- coxinha-release-v1
if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end
return 0`;

function changes(before,after){
 const ops=[];
 for(const root of new Set([...Object.keys(before),...Object.keys(after)])){
  const a=before[root],b=after[root];
  if(equal(a,b))continue;
  if(object(a) && object(b)){
   for(const key of new Set([...Object.keys(a),...Object.keys(b)]))if(!equal(a[key],b[key]))ops.push({path:[root,key],beforeExists:own(a,key),before:a[key] ?? null,afterExists:own(b,key),after:b[key] ?? null});
  }else ops.push({path:[root],beforeExists:own(before,root),before:a ?? null,afterExists:own(after,root),after:b ?? null,ensure:!own(before,root) && object(b) && !Object.keys(b).length});
 }
 return ops;
}
function apply(state,ops){
 for(const op of ops){let parent=state;for(const key of op.path.slice(0,-1)){if(!object(parent[key]))parent[key]={};parent=parent[key];}const key=op.path.at(-1);if(op.afterExists)parent[key]=op.after;else delete parent[key];}
 return state;
}

module.exports=function sharedStorage({db,file,key,request,initial,initialRaw=''}){
 const owner=crypto.randomUUID(),held=new Set(),lostSessions=new Set(),ttl=60000,uncertain=[];
 let baseline=initialRaw ? JSON.parse(initialRaw) : {},baselineRaw=initialRaw,dirty=false,pending=null,writing=null,lastError=null,lastErrorCode=null,closed=false,transactions=0,forceRemoteRead=false,recoveredConflict=false,lastConflictScope=null,stateVersion=0;
 async function backup(id,profile,reason){const path=require('node:path'),directory=path.join(path.dirname(file),'save-conflicts');await fs.promises.mkdir(directory,{recursive:true});await fs.promises.writeFile(path.join(directory,crypto.randomUUID()+'.json'),JSON.stringify({reason,createdAt:Date.now(),profileId:id,profile}),'utf8');}
 function record(state,path){let parent=state;for(const key of path.slice(0,-1))parent=parent?.[key];const name=path.at(-1);return {exists:own(parent,name),value:parent?.[name]??null};}
 function sameRecord(a,b){return a.exists===b.exists&&(!a.exists||equal(a.value,b.value));}
 function knownCommit(op,value){
  const reachable=[{exists:op.beforeExists,value:op.before}];
  for(const attempt of uncertain)for(const sent of attempt)if(equal(sent.path,op.path)&&reachable.some(r=>sameRecord(r,{exists:sent.beforeExists,value:sent.before})))reachable.push({exists:sent.afterExists,value:sent.after});
  return reachable.slice(1).some(r=>sameRecord(r,value));
 }
 function install(next){
  const current=db.getState();
  // Keep live actor references stable across asynchronous saves and refreshes.
  for(const id of held)if(current.profiles?.[id] && next.profiles?.[id])next.profiles[id]=current.profiles[id];
  db.setState(next);
 }
 function schedule(){if(!pending && !closed){pending=setTimeout(()=>{pending=null;if(transactions)schedule();else flush();},1500);pending.unref?.();}}
 db.write=returnValue=>{dirty=true;schedule();return returnValue;};
 async function flush(){
  if(writing){const ok=await writing;return ok && dirty ? flush() : ok;}
  if(!dirty)return !lastError;
  const snapshot=clone(db.getState()),ops=changes(baseline,snapshot);dirty=false;
  // Even an in-flight local rollback must fence a write whose HTTP reply was lost.
  for(const attempt of uncertain)for(const sent of attempt)if(!ops.some(o=>equal(o.path,sent.path))){const before=record(baseline,sent.path),after=record(snapshot,sent.path);ops.push({path:sent.path,beforeExists:before.exists,before:before.value,afterExists:after.exists,after:after.value});}
  if(!ops.length){lastError=null;lastErrorCode=null;lastConflictScope=null;return true;}
  stateVersion++;writing=(async()=>{
   try{
    const ids=ops.filter(op=>op.path[0]==='profiles' && op.path.length===2).map(op=>op.path[1]);
    let expected=forceRemoteRead?await request(['GET',key])||'':baselineRaw,result;
    for(let attempt=0;attempt<8;attempt++){
     const remote=expected ? JSON.parse(expected) : {};
     const effective=[];
     for(const op of ops){
      const value=record(remote,op.path);if(op.ensure&&object(value.value))continue;
      const before=sameRecord(value,{exists:op.beforeExists,value:op.before}),after=sameRecord(value,{exists:op.afterExists,value:op.after}),known=knownCommit(op,value);
      if(!before&&!after&&!known)throw Object.assign(Error('SAVE_CONFLICT'),{recordPath:op.path});
      // This exact record is evidence of our previously unconfirmed write.
      // Advance only that proven baseline; unknown remote records remain conflicts.
      if(!before&&known){apply(baseline,[{path:op.path,afterExists:value.exists,after:clone(value.value)}]);forceRemoteRead=true;stateVersion++;}
      effective.push({...op,beforeExists:value.exists,before:value.value});
     }
     // A fresh marker prevents a delayed request from applying after a no-op retry (ABA).
     remote._saveCommitId=crypto.randomUUID();const payload=JSON.stringify(apply(remote,clone(effective)));
     try{result=await request(['EVAL',COMMIT,1+ids.length,key,...ids.map(id=>key+':session:'+id),expected,payload,owner]);}
     catch(error){uncertain.push(clone(effective));if(uncertain.length>8)uncertain.shift();throw error;}
     if(result?.[0]===1)break;
     if(result?.[0]!==0)throw Error(result?.[1] || 'SAVE_FAILED');
     expected=result[1];
    }
    if(result?.[0]!==1)throw Error('Banco ocupado; nova tentativa será feita.');
    baselineRaw=result[1];stateVersion++;forceRemoteRead=false;uncertain.length=0;
    const remote=JSON.parse(result[1]),later=changes(snapshot,clone(db.getState()));baseline=clone(remote);install(apply(remote,later));
    const payload=JSON.stringify(db.getState());await fs.promises.writeFile(file+'.tmp',payload,'utf8');await fs.promises.rename(file+'.tmp',file);
    lastError=null;lastErrorCode=null;lastConflictScope=null;return true;
   }catch(error){
    dirty=true;lastError=error.message;lastErrorCode=diagnostics.code(error);lastConflictScope=error.message==='SAVE_CONFLICT'?(['profiles','accounts','accountsByNick','guilds','chosenClaims','players'].includes(error.recordPath?.[0])?error.recordPath[0]:'other'):null;
    // A fenced-out session must not poison every account on this process.
    // Only discard a stale profile after Redis proves this process is not its owner.
    const candidates=error.message==='SAVE_CONFLICT'&&error.recordPath?.[0]==='profiles'?[error.recordPath[1]]:error.message==='SESSION_LOST'?ops.filter(o=>o.path[0]==='profiles'&&o.path.length===2).map(o=>o.path[1]):[];
    try{for(const id of candidates)if(await request(['GET',key+':session:'+id])!==owner){await backup(id,clone(db.getState().profiles?.[id]||snapshot.profiles?.[id]),error.message);await discard(id);lostSessions.add(id);recoveredConflict=true;console.warn('Sessão antiga isolada; o save mais recente do banco foi preservado.');}}catch(recoveryError){lastErrorCode=diagnostics.code(recoveryError);}
    console.error('Save compartilhado pendente:',lastErrorCode);return false;
   }
  })();
  const ok=await writing;writing=null;return ok && dirty ? flush() : ok;
 }
 async function refresh(){
  // Writes can finish while Redis GET is in flight. Never install that older read
  // over the reference of a write already confirmed by this process.
  for(let attempt=0;attempt<8;attempt++){
   let ok=await flush();if(!ok&&recoveredConflict){recoveredConflict=false;ok=await flush();}if(!ok)throw Object.assign(Error('O banco não confirmou o último save. Tente novamente.'),{code:lastErrorCode});
   const version=stateVersion,snapshot=clone(db.getState()),raw=await request(['GET',key]);
   if(writing||version!==stateVersion)continue;
   const remote=raw?JSON.parse(raw):{};baselineRaw=raw||'';baseline=clone(remote);install(apply(remote,changes(snapshot,clone(db.getState()))));stateVersion++;
   db.defaults({players:{},profiles:{},guilds:{},accounts:{},accountsByNick:{}}).write();return;
  }
  throw Object.assign(Error('O banco está ocupado. Tente novamente em instantes.'),{code:'SAVE_BUSY'});
 }
 async function claim(id){
  if(writing)await writing;
  const alreadyHeld=held.has(id);
  const lockKey=key+':session:'+id;
  const result=await request(['SET',lockKey,owner,'NX','PX',ttl]);
  if(result!=='OK'){
   const existing=await request(['GET',lockKey]);
   if(existing!==owner)throw Object.assign(Error('O servidor ainda mantém uma sessão reservada para esta conta em outro servidor. Após sair ou fechar o jogo, aguarde até 60 segundos e tente novamente.'),{code:'SESSION_BUSY'});
   const lost=await request(['EVAL',RENEW,1,lockKey,owner,String(ttl)]);if(lost.length)throw Error('A sessão expirou. Entre novamente.');
  }
  held.add(id);
  if(!alreadyHeld){
   try{let ready=false;for(let attempt=0;attempt<8;attempt++){if(writing)await writing;const version=stateVersion,raw=await request(['GET',key]);if(writing||version!==stateVersion)continue;const remote=raw?JSON.parse(raw):{},current=db.getState(),cached=current.profiles?.[id],fresh=remote.profiles?.[id];
    if(fresh){const pendingProfile=changes(baseline,clone(current)).some(o=>o.path[0]==='profiles'&&o.path[1]===id);if(pendingProfile&&cached)await backup(id,clone(cached),'STALE_PROFILE_BEFORE_LOGIN');if(writing||version!==stateVersion)continue;baseline.profiles ||= {};baseline.profiles[id]=clone(fresh);stateVersion++;current.profiles ||= {};if(cached){for(const name of Object.keys(cached))delete cached[name];Object.assign(cached,clone(fresh));current.profiles[id]=cached;}else current.profiles[id]=clone(fresh);forceRemoteRead=true;}
    else if(baseline.profiles?.[id])throw Error('Não foi possível encontrar o save desta conta no banco.');
    ready=true;break;}if(!ready)throw Object.assign(Error('O banco está ocupado. Tente novamente em instantes.'),{code:'SAVE_BUSY'});
   }catch(error){await request(['EVAL',RELEASE,1,lockKey,owner]);held.delete(id);throw error;}
  }
 }
 async function renew(activeIds=[]){const active=new Set(activeIds),ids=[...held].filter(id=>active.has(id));if(!ids.length)return [];const lost=await request(['EVAL',RENEW,ids.length,...ids.map(id=>key+':session:'+id),owner,String(ttl)]);return lost.map(index=>ids[index-1]);}
 async function release(id){await request(['EVAL',RELEASE,1,key+':session:'+id,owner]);held.delete(id);}
 async function discard(id){
  held.delete(id);for(let i=uncertain.length-1;i>=0;i--){uncertain[i]=uncertain[i].filter(op=>!(op.path[0]==='profiles'&&op.path[1]===id));if(!uncertain[i].length)uncertain.splice(i,1);}const raw=await request(['GET',key]),remote=raw ? JSON.parse(raw) : {};
  stateVersion++;for(const state of [baseline,db.getState()])if(remote.profiles?.[id]){state.profiles ||= {};state.profiles[id]=clone(remote.profiles[id]);}else if(state.profiles)delete state.profiles[id];
 }
 async function transact(action){
  // Serialize account indexes and guild membership across regions.
  const token=crypto.randomUUID(),lockKey=key+':catalog-lock',until=Date.now()+5000;
  let acquired=false;
  do{if(await request(['SET',lockKey,token,'NX','PX',30000])==='OK'){acquired=true;break;}await new Promise(resolve=>setTimeout(resolve,80));}while(Date.now()<until);
  if(!acquired)throw Error('O banco está ocupado. Tente novamente em instantes.');
  transactions++;
  try{return await action();}finally{transactions--;await request(['EVAL',RELEASE,1,lockKey,token]);if(dirty)schedule();}
 }
 const retry=setInterval(()=>{if(!transactions)flush();},10000);retry.unref?.();
 return {db,file,mode:'redis',shared:true,flush,refresh,claim,release,renew,discard,transact,takeLostSessions(){const ids=[...lostSessions];lostSessions.clear();return ids;},get lastConflictScope(){return lastConflictScope;},get lastError(){return lastError;},get lastErrorCode(){return lastErrorCode;},close(){closed=true;clearTimeout(pending);clearInterval(retry);}};
};
