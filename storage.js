const fs=require('fs'),path=require('path');
const low=require('lowdb'),FileSync=require('lowdb/adapters/FileSync');
const diagnostics=require('./save-diagnostics');

module.exports=async function openStorage(env=process.env){
  const directory=path.resolve(env.DATA_DIR || __dirname);fs.mkdirSync(directory,{recursive:true});
  const db=low(new FileSync(path.join(directory,'db.json')));
  const url=env.UPSTASH_REDIS_REST_URL,token=env.UPSTASH_REDIS_REST_TOKEN,key=env.SAVE_KEY || 'coxinha:database:v2';
  if(!!url!==!!token)throw Error('Configure a URL e o token do armazenamento juntos.');
  async function request(command){
    const response=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(command),signal:AbortSignal.timeout(10000)});
    let result;try{result=await response.json();}catch{throw Object.assign(Error('Resposta inválida do banco persistente.'),{code:response.ok?'REDIS_RESPONSE_INVALID':diagnostics.redisCode(response.status)});}
    if(!response.ok || result.error)throw Object.assign(Error('Falha ao acessar o banco persistente.'),{code:diagnostics.redisCode(response.status,result.error)});return result.result;
  }
  let remoteState={},remoteRaw='';
  if(url){const existing=await request(['GET',key]);if(existing){remoteRaw=existing;remoteState=JSON.parse(existing);db.setState(remoteState).write();}else db.setState({}).write();}
  db.defaults({players:{},profiles:{},guilds:{}}).write();
  if(url)return require('./regional-storage')({db,file:path.join(directory,'db.json'),key,request,initial:remoteState,initialRaw:remoteRaw});
  let pending=null,writing=null,dirty=false,localDirty=false,lastError=null,lastErrorCode=null;
  const file=path.join(directory,'db.json');
  async function flush(){
    if(writing){const ok=await writing;if(ok && (dirty || localDirty))return flush();return ok;}
    if(!dirty && !localDirty)return !lastError;
    const remote=dirty,local=localDirty,payload=JSON.stringify(db.getState());dirty=false;localDirty=false;
    writing=(async()=>{try{
      if(local){await fs.promises.writeFile(file+'.tmp',payload,'utf8');await fs.promises.rename(file+'.tmp',file);}
      if(url && remote)await request(['SET',key,payload]);lastError=null;lastErrorCode=null;return true;
    }catch(error){dirty=!!url;localDirty=true;lastError=Date.now();lastErrorCode=diagnostics.code(error);console.error('Save local pendente:',lastErrorCode);return false;}})();
    const ok=await writing;writing=null;
    if(ok && (dirty || localDirty))return flush();return ok;
  }
  // Lowdb mutations are synchronous in memory; disk/network writes are batched off the game tick.
  db.write=returnValue=>{localDirty=true;dirty=!!url;if(!pending){pending=setTimeout(()=>{pending=null;flush();},1500);pending.unref?.();}return returnValue;};
  const retry=setInterval(flush,10000);retry.unref?.();
  return {db,flush,mode:url ? 'redis' : 'file',get lastError(){return lastError;},get lastErrorCode(){return lastErrorCode;},close(){clearInterval(retry);clearTimeout(pending);},file};
};
