const crypto=require('node:crypto');
function origin(value){
 if(!value)return null;
 let url;try{url=new URL(value);}catch{throw Error('URL regional inválida. Use o endereço HTTPS completo do servidor.');}
 const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 if((url.protocol!=='https:' && !(local && url.protocol==='http:')) || url.username || url.password || url.search || url.hash || (url.pathname!=='/' && url.pathname!==''))throw Error('Use somente a origem HTTPS do servidor, sem senha, caminho ou parâmetros.');
 return url.origin;
}
module.exports=function regions(env={}){
 const id=String(env.SERVER_REGION || 'GLOBAL').toUpperCase();
 if(!['BR','US','GLOBAL'].includes(id))throw Error('SERVER_REGION precisa ser BR, US ou GLOBAL.');
 const currentUrl=origin(env.PUBLIC_URL || env.RENDER_EXTERNAL_URL);
 const location=env.SERVER_LOCATION || ({BR:'São Paulo, Brasil',US:'Virgínia, EUA',GLOBAL:'Região não informada'})[id];
 const entries=[{id:'BR',name:'Brasil',location:env.BR_SERVER_LOCATION || 'São Paulo, Brasil',url:origin(env.BR_SERVER_URL)},{id:'US',name:'Estados Unidos',location:env.US_SERVER_LOCATION || 'Virgínia, EUA',url:origin(env.US_SERVER_URL)}];
 const own=entries.find(entry=>entry.id===id);if(own){own.location=location;if(currentUrl && !own.url)own.url=currentUrl;}
 const allowed=new Set([currentUrl,...entries.map(entry=>entry.url),...String(env.FRONTEND_ORIGINS || '').split(',').filter(Boolean).map(origin)].filter(Boolean));
 const sharedSaveId=env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN ? crypto.createHash('sha256').update(env.UPSTASH_REDIS_REST_URL.replace(/\/$/,'')+'|'+(env.SAVE_KEY || 'coxinha:database:v2')).digest('hex').slice(0,24) : null;
 return {id,location,currentUrl,entries,sharedSaveId,allowedOrigin(value){return !value || allowed.has(value);},public(){return {current:{id,location,url:currentUrl},servers:entries.map(entry=>({...entry,configured:!!entry.url})),sharedSaveId};}};
};
