const http=require('node:http');
module.exports=async function redisFixture(t){
 const values=new Map(),expires=new Map();
 const get=key=>{if(expires.has(key) && expires.get(key)<=Date.now()){values.delete(key);expires.delete(key);}return values.get(key) ?? null;};
 function command(args){
  const [op,key,value,...options]=args;
  if(op==='GET')return get(key);
  if(op==='SET'){if(options.includes('NX') && get(key)!==null)return null;values.set(key,value);const px=options.indexOf('PX');if(px>=0)expires.set(key,Date.now()+Number(options[px+1]));else expires.delete(key);return 'OK';}
  if(op==='EVAL'){
   const count=Number(value),keys=options.slice(0,count),argv=options.slice(count);
   if(key.includes('coxinha-record-commit-v1')){const current=get(keys[0]) || '';if(current!==argv[0])return [0,current];if(keys.slice(1).some(k=>get(k)!==argv[2]))return [-1,'SESSION_LOST'];values.set(keys[0],argv[1]);return [1,argv[1]];}
   if(key.includes('coxinha-renew-v1')){const lost=[];keys.forEach((k,i)=>{if(get(k)!==argv[0])lost.push(i+1);else expires.set(k,Date.now()+Number(argv[1]));});return lost;}
   if(key.includes('coxinha-release-v1')){if(get(keys[0])!==argv[0])return 0;values.delete(keys[0]);expires.delete(keys[0]);return 1;}
  }
  throw Error('Unsupported test Redis command: '+op);
 }
 const server=http.createServer(async(req,res)=>{try{let body='';for await(const chunk of req)body+=chunk;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({result:command(JSON.parse(body))}));}catch(error){res.statusCode=400;res.end(JSON.stringify({error:error.message}));}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
 return {values,expires,command,env:{UPSTASH_REDIS_REST_URL:'http://127.0.0.1:'+server.address().port,UPSTASH_REDIS_REST_TOKEN:'test-only-token'}};
};
