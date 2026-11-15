const crypto=require('crypto');
const catalog=require('./public/game-catalog');

module.exports=function attachAdmin(socket,io,ores,token){
  let authorized=false;
  let attempts=0,windowEnd=0;
  const reply=(ok,message)=>socket.emit('adminResult',{ok,message});
  const state=()=>socket.emit('adminState',{enabled:!!token,authorized});
  socket.on('adminStatus',state);
  socket.on('adminAuthenticate',value=>{
    const now=Date.now();if(now>windowEnd){attempts=0;windowEnd=now+60000;}
    if(++attempts>5){reply(false,'Muitas tentativas. Aguarde um minuto.');return;}
    if(!token){reply(false,'Admin desativado. Configure ADMIN_TOKEN no servidor.');state();return;}
    const candidate=typeof value==='string' && value.length<=512 ? value : '';
    const hash=text=>crypto.createHash('sha256').update(text).digest();
    authorized=crypto.timingSafeEqual(hash(candidate),hash(token));
    state();reply(authorized,authorized ? 'Administrador autenticado nesta conexão.' : 'Chave de administrador inválida.');
  });
  socket.on('adminSpawnPrimordial',()=>{
    if(!authorized){reply(false,'Apenas um administrador autenticado pode invocar PRIMORDIAL.');return;}
    if(ores.some(o=>o.rarity?.name==='PRIMORDIAL')){reply(false,'Já existe uma PRIMORDIAL neste servidor.');return;}
    // Fixed footprint stays inside the garden and preserves the central plaza.
    const ore={id:'primordial_'+crypto.randomUUID(),x:25500,y:25500,size:catalog.oreRadius('PRIMORDIAL'),hp:catalog.PRIMORDIAL.hp,maxHp:catalog.PRIMORDIAL.hp,rarity:{...catalog.PRIMORDIAL},isBoss:true,adminOnly:true};
    ores.push(ore);io.emit('oreUpdate',ore);io.emit('chat','✦ Um administrador invocou uma pedra PRIMORDIAL!');
    reply(true,'PRIMORDIAL invocada no noroeste. Diâmetro: 50.000 unidades.');
  });
};
