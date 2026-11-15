const path=require('path');
const express=require('express');
const SharedWorld=require('./shared-world');
const openStorage=require('./storage');
const createPlayerStore=require('./player-store');
const createGuilds=require('./guilds');
const attachAdmin=require('./admin');

async function createGameServer(options={}){
  const persistence=options.storage || await openStorage(options.env || process.env);
  const app=express(),http=require('http').createServer(app),io=require('socket.io')(http,{maxHttpBufferSize:2000000});
  const actors={},worlds={};
  // Guild handlers share these records but never receive account tokens.
  const guildPlayers={};
  let store;
  const proxyStore={find:id=>store.find(id),save:p=>store.save(p),clientState:p=>store.clientState(p)};
  worlds.garden=new SharedWorld('garden',actors,proxyStore,io);worlds.cave=new SharedWorld('cave',actors,proxyStore,io);
  store=createPlayerStore(persistence.db,worlds.garden.game);
  const resetMarker=process.env.RESET_GUILDS_ON_START;
  if(resetMarker && persistence.db.get('guildResetMarker').value()!==resetMarker){
    const file=path.join(path.dirname(persistence.file || path.join(__dirname,'db.json')),'guild-reset-backup-'+Date.now()+'.json');
    require('fs').writeFileSync(file,JSON.stringify(persistence.db.getState()));
    require('./scripts/reset-guilds')(persistence.db);persistence.db.set('guildResetMarker',resetMarker).write();await persistence.flush();
  }
  const guilds=createGuilds(io,persistence.db,guildPlayers);
  const publicPlayer=actor=>({name:actor.name,x:actor.state.x,y:actor.state.y,realm:actor.state.realm,dead:actor.state.dead,level:actor.state.level,aimAngle:actor.state.aimAngle || 0,vx:actor.state.vx || 0,vy:actor.state.vy || 0,moving:!!actor.state.moving,attackUntil:actor.state.attackUntil || 0,rarityIndex:worlds.garden.game.rarityIndex(actor.state),weapon:actor.state.equipment.weapon?.name,pickaxe:actor.state.equipment.pickaxe?.name,armor:actor.state.equipment.armor?.name,utility:actor.state.equipment.utility?.name,selectedSlot:actor.state.selectedSlot,guildTag:guildPlayers[actor.socket.id]?.guildTag || ''});
  const playersPacket=()=>Object.fromEntries(Object.entries(actors).map(([id,actor])=>[id,publicPlayer(actor)]));
  const sendState=actor=>actor.socket.emit('playerState',store.clientState(actor.profile));
  app.use(express.static(path.join(__dirname,'public')));
  app.get('/health',(_request,response)=>response.json({ok:true,players:Object.keys(actors).length,persistence:persistence.mode,worldRevision:worlds.garden.revision}));
  io.on('connection',socket=>{
    socket.emit('init',{id:socket.id,players:playersPacket(),ores:[],sharedWorld:true,protocol:2});
    // The array reference remains stable for admin spawns, including after mining.
    attachAdmin(socket,{emit:(event,data)=>{
      if(event==='oreUpdate'){const list=worlds.garden.game.ores;if(!list.some(o=>o.id===data.id))list.push(data);}
      else io.emit(event,data);
    }},new Proxy([],{
      get(_target,key){const list=worlds.garden.game.ores;return typeof list[key]==='function' ? list[key].bind(list) : list[key];}
    }),process.env.ADMIN_TOKEN);
    socket.on('joinGame',(data,reply)=>{
      try{
        if(actors[socket.id]){reply?.({ok:true});return;}
        const {profile,credentials}=store.join(data);
        for(const old of Object.values(actors))if(old.profile.id===profile.id){old.socket.emit('sessionReplaced');old.socket.disconnect(true);}
        const state=profile.state;state.name=profile.name;state.realm='garden';state.x=50000;state.y=50000;state.dead=false;state.hp=state.maxHp;state.hurtUntil=Date.now()+2000;
        const actor={socket,profile,state,name:profile.name,nextAttack:0,contacts:{},lastMove:Date.now()};actors[socket.id]=actor;
        guildPlayers[socket.id]={name:profile.name,profileId:profile.id,guildId:state.guildId || null};guilds.attach(socket);guilds.sync(socket);
        socket.emit('profileReady',{credentials,state:store.clientState(profile),realm:'garden',x:state.x,y:state.y});
        socket.emit('worldSnapshot',worlds.garden.snapshot(actor));reply?.({ok:true});
      }catch(error){reply?.({ok:false,message:error.message});socket.emit('actionResult',{ok:false,message:error.message});}
    });
    socket.on('move',data=>{
      const actor=actors[socket.id];if(!actor || !data || !Number.isFinite(data.x) || !Number.isFinite(data.y))return;
      const s=actor.state,now=Date.now(),dt=Math.max(.01,Math.min(.5,(now-actor.lastMove)/1000));actor.lastMove=now;
      if(!s.dead){
        const width=s.realm==='cave' ? 200000 : 100000,x=Math.max(20,Math.min(width-20,data.x)),y=Math.max(20,Math.min(99980,data.y));
        if(s.realm!=='cave' || !worlds.cave.game.wall(x,y,20)){s.vx=(x-s.x)/dt;s.vy=(y-s.y)/dt;s.moving=Math.hypot(x-s.x,y-s.y)>.2;s.x=x;s.y=y;}
      }
      if(Number.isFinite(data.aimAngle))s.aimAngle=Math.atan2(Math.sin(data.aimAngle),Math.cos(data.aimAngle));
      if([0,1,2,3].includes(data.selectedSlot))s.selectedSlot=data.selectedSlot;
    });
    socket.on('attack',data=>{const a=actors[socket.id];if(a)worlds[a.state.realm].attack(a,data);});
    socket.on('useAbility',type=>{const a=actors[socket.id];if(a)worlds[a.state.realm].ability(a,type);});
    socket.on('playerAction',(request={},reply)=>{
      if(!request || typeof request!=='object'){reply?.({ok:false});return;}
      const a=actors[socket.id];if(!a || a.state.dead){reply?.({ok:false});return;}
      const now=Date.now();if(now<(a.nextAction || 0)){reply?.({ok:false});return;}a.nextAction=now+80;
      const ok=worlds[a.state.realm].game.command(a.state,request.kind,request.data || {});
      if(ok)store.save(a.profile);sendState(a);
      const result={ok,message:ok ? 'Alteração salva no servidor.' : 'Requisitos insuficientes ou ação indisponível.'};socket.emit('actionResult',result);reply?.(result);
    });
    socket.on('savePlayer',()=>{const a=actors[socket.id];if(a){store.save(a.profile);socket.emit('saveConfirmed',{revision:a.profile.revision,at:Date.now(),persistence:persistence.mode});}});
    socket.on('changeRealm',next=>{
      const a=actors[socket.id];if(!a || a.state.dead)return;
      const s=a.state,source=worlds[s.realm],portal=s.realm==='garden' ? source.game.portal : {x:750,y:750};
      if(next===s.realm || !worlds[next] || Math.hypot(s.x-portal.x,s.y-portal.y)>400)return;
      s.realm=next;s.x=next==='cave' ? 750 : 98750;s.y=next==='cave' ? 750 : 1150;s.vx=0;s.vy=0;s.hurtUntil=Date.now()+1500;
      socket.emit('realmChanged',{realm:next,x:s.x,y:s.y});socket.emit('worldSnapshot',worlds[next].snapshot(a));
    });
    socket.on('respawn',()=>{
      const a=actors[socket.id];if(!a || !a.state.dead)return;
      Object.assign(a.state,{dead:false,hp:a.state.maxHp,deathCause:'',realm:'garden',x:50000,y:50000,vx:0,vy:0,hurtUntil:Date.now()+2000});
      socket.emit('realmChanged',{realm:'garden',x:50000,y:50000});sendState(a);store.save(a.profile);
    });
    socket.on('chat',message=>{
      const a=actors[socket.id],text=typeof message==='string' ? message : message?.text;
      if(!a || typeof text!=='string' || !text.trim() || Date.now()-(a.lastChat || 0)<600)return;a.lastChat=Date.now();
      const p=publicPlayer(a);io.emit('chatMessage',{name:(p.guildTag ? '['+p.guildTag+'] ' : '')+p.name,text:text.trim().slice(0,220),level:p.level,rarityIndex:p.rarityIndex});
    });
    socket.on('disconnect',()=>{
      const a=actors[socket.id];if(a)store.save(a.profile);delete actors[socket.id];delete guildPlayers[socket.id];io.emit('playerLeft',socket.id);
    });
  });
  let frames=0;
  const loop=setInterval(()=>{
    try{for(const world of Object.values(worlds))world.tick(.05);frames++;
      if(frames%2===0){io.emit('updatePlayers',playersPacket());for(const actor of Object.values(actors))actor.socket.emit('worldSnapshot',worlds[actor.state.realm].snapshot(actor));}
      if(frames%100===0)for(const actor of Object.values(actors))store.save(actor.profile);
    }catch(error){console.error('Falha no ciclo do mundo:',error);}
  },50);
  const close=async()=>{clearInterval(loop);for(const actor of Object.values(actors))store.save(actor.profile);await persistence.flush();persistence.close?.();await new Promise(resolve=>io.close(resolve));};
  return {app,http,io,worlds,actors,store,persistence,close};
}
module.exports={createGameServer};
if(require.main===module)createGameServer().then(server=>{
  server.http.listen(process.env.PORT || 3000,'0.0.0.0',()=>console.log('CoxinhaMiner online · mundo compartilhado · porta '+(process.env.PORT || 3000)));
  for(const signal of ['SIGTERM','SIGINT'])process.on(signal,async()=>{await server.close();process.exit(0);});
}).catch(error=>{console.error(error.message);process.exitCode=1;});
