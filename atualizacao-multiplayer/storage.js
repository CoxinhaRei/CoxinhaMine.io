const fs=require('fs'),path=require('path');
const low=require('lowdb'),FileSync=require('lowdb/adapters/FileSync');

module.exports=async function openStorage(env=process.env){
  const directory=path.resolve(env.DATA_DIR || __dirname);fs.mkdirSync(directory,{recursive:true});
  const db=low(new FileSync(path.join(directory,'db.json')));
  const url=env.UPSTASH_REDIS_REST_URL,token=env.UPSTASH_REDIS_REST_TOKEN,key=env.SAVE_KEY || 'coxinha:database:v2';
  if(!!url!==!!token)throw Error('Configure a URL e o token do armazenamento juntos.');
  async function request(command){
    const response=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(command),signal:AbortSignal.timeout(10000)});
    const result=await response.json();if(!response.ok || result.error)throw Error('Falha ao acessar o banco persistente.');return result.result;
  }
  if(url){const existing=await request(['GET',key]);if(existing)db.setState(JSON.parse(existing)).write();}
  db.defaults({players:{},profiles:{},guilds:{}}).write();
  let pending=false,writing=null,dirty=false;
  const originalWrite=db.write.bind(db);
  async function flush(){
    if(!url)return;
    if(writing){const ok=await writing;if(ok && dirty)return flush();return;}
    if(!dirty)return;
    dirty=false;
    writing=request(['SET',key,JSON.stringify(db.getState())]).then(()=>true).catch(()=>{dirty=true;console.error('Não foi possível gravar o save remoto; a cópia local foi mantida.');return false;});
    const ok=await writing;writing=null;
    if(ok && dirty)return flush();
  }
  db.write=()=>{const result=originalWrite();dirty=true;if(url && !pending){pending=true;setTimeout(()=>{pending=false;flush();},2000).unref?.();}return result;};
  const retry=setInterval(flush,10000);retry.unref?.();
  return {db,flush,mode:url ? 'redis' : 'file',close:()=>clearInterval(retry),file:path.join(directory,'db.json')};
};
