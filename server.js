const path=require('path');
const express=require('express');
const SharedWorld=require('./shared-world');
const openStorage=require('./storage');
const createPlayerStore=require('./player-store');
const createGuilds=require('./guilds');
const attachAdmin=require('./admin');
const createAccounts=require('./accounts');
const createSquads=require('./squads');
const movement=require('./public/movement-net');
const expansion=require('./public/expansion');
const developer=require('./developer-account');
const saveDiagnostics=require('./save-diagnostics');
const {movePlayerBody}=require('./world-physics');

const attachPublicProfiles=require('./public-profiles');
const attachChat=require('./chat-channels');

async function createGameServer(options={}){
  const persistence=options.storage || await openStorage(options.env || process.env);
  const environment=options.env || process.env;
  const regions=require('./regions')(environment);
  const durable=persistence.mode==='redis' || !environment.RENDER || !!environment.DATA_DIR;
  const app=express(),http=require('http').createServer(app),io=require('socket.io')(http,{maxHttpBufferSize:300000,cors:{origin:(value,done)=>done(null,regions.allowedOrigin(value))},allowRequest:(request,done)=>{const value=request.headers.origin;let same=false;try{same=new URL(value).host===request.headers.host;}catch{}done(null,same || regions.allowedOrigin(value));},perMessageDeflate:{threshold:2048,concurrencyLimit:2,zlibDeflateOptions:{level:1}}});
  const actors={},worlds={},guestRates=new Map();
  const addressOf=socket=>String(socket.handshake.headers['x-forwarded-for'] || socket.handshake.address).split(',').at(-1).trim();
  // Guild handlers share these records but never receive account tokens.
  const guildPlayers={};
  let store;
  const proxyStore={find:id=>store.find(id),save:p=>store.save(p),clientState:p=>store.clientState(p)};
  for(const map of expansion.MAPS)worlds[map.id]=new SharedWorld(map.id,actors,proxyStore,io);
  store=createPlayerStore(persistence.db,worlds.garden.game);
  let developerStatus={enabled:false,ready:false,code:'disabled'};const developerConfig=developer.settings(environment);
  const accounts=createAccounts(persistence.db,store,{beforeRegister:nick=>{if(developerConfig.enabled&&nick.normalize('NFKC').toLowerCase()===developerConfig.nickname.toLowerCase())throw Error('Este nick é reservado à conta de testes do servidor. Use Entrar.');},beforeSession:profile=>{developer.assertAvailable(profile,developerStatus);return persistence.claim?.(profile.id);}}),squads=createSquads(actors,store);
  async function catalogAction(action){
    if(!persistence.transact)return action();
    return persistence.transact(async()=>{for(const actor of Object.values(actors))store.save(actor.profile);await persistence.refresh();return action();});
  }
  developerStatus=await developer.provision({env:environment,db:persistence.db,store,game:worlds.garden.game,persistence,durable,transact:catalogAction});
  const releaseJobs=new Set();
  async function releaseProfile(id,locked=false){
    const release=async()=>{if(Object.values(actors).some(actor=>actor.profile.id===id))return;if(await persistence.flush()===false)throw Error('Save pendente; sessão será liberada após expirar.');if(Object.values(actors).some(actor=>actor.profile.id===id))return;await persistence.release?.(id);};
    return !locked && persistence.transact ? persistence.transact(release) : release();
  }
  for(const world of Object.values(worlds))world.squads=squads;
  const chosen=require('./chosen-forge')(persistence.db,store);
  const resurrection=require('./resurrection')(actors,worlds,store,welcome);
  const resetMarker=process.env.RESET_GUILDS_ON_START;
  if(resetMarker && persistence.db.get('guildResetMarker').value()!==resetMarker){
    const file=path.join(path.dirname(persistence.file || path.join(__dirname,'db.json')),'guild-reset-backup-'+Date.now()+'.json');
    require('fs').writeFileSync(file,JSON.stringify(persistence.db.getState()));
    require('./scripts/reset-guilds')(persistence.db);persistence.db.set('guildResetMarker',resetMarker).write();await persistence.flush();
  }
  const guilds=createGuilds(io,persistence.db,guildPlayers,{transact:catalogAction,flush:()=>persistence.flush(),getProfile:id=>Object.values(actors).find(a=>a.profile.id===id)?.profile||store.find(id),setMembership:(id,guildId)=>{let local=false;for(const a of Object.values(actors))if(a.profile.id===id){a.state.guildId=guildId;a.profile.state.guildId=guildId;local=true;}return local;}});
  const publicPlayer=actor=>({name:actor.name,guest:!!actor.profile.guest,accessories:actor.state.accessories,x:actor.state.x,y:actor.state.y,hp:actor.state.hp,maxHp:actor.state.maxHp,realm:actor.state.realm,dead:actor.state.dead,level:actor.state.level,aimAngle:actor.state.aimAngle || 0,vx:actor.state.vx || 0,vy:actor.state.vy || 0,moving:!!actor.state.moving,attackUntil:actor.state.attackUntil || 0,rarityIndex:worlds.garden.game.rarityIndex(actor.state),weapon:actor.state.equipment.weapon?.name,pickaxe:actor.state.equipment.pickaxe?.name,armor:actor.state.equipment.armor?.name,utility:actor.state.equipment.utility?.name,selectedSlot:actor.state.selectedSlot,guildTag:guildPlayers[actor.socket.id]?.guildTag || '',squadId:squads.groupFor(actor.profile.id)?.id || null});
  const playersPacket=()=>Object.fromEntries(Object.entries(actors).filter(([,actor])=>!actor.inLobby).map(([id,actor])=>[id,publicPlayer(actor)]));
  const sendState=actor=>actor.socket.emit('playerState',store.clientState(actor.profile));
  app.use(express.static(path.join(__dirname,'public'),{setHeaders(response,file){if(/\.(html|js|css)$/.test(file))response.setHeader('Cache-Control','no-cache');}}));
  const metrics={tickMs:0,slowTicks:0};
  app.get('/servers',(_request,response)=>{response.set('Cache-Control','no-store');response.json({...regions.public(),protocol:6,sharedSaves:!!persistence.shared});});
  app.get('/ping',(_request,response)=>{response.set({'Cache-Control':'no-store','Access-Control-Allow-Origin':'*'});response.json({ok:!persistence.lastError,region:regions.id,location:regions.location,protocol:6,sharedSaveId:regions.sharedSaveId,sharedSaves:!!persistence.shared});});
  app.get('/health',(_request,response)=>response.json({ok:true,version:'1.5.5',build:'release-155-arcana1',developerAccountReady:developerStatus.ready,protocol:6,region:regions.id,location:regions.location,sharedSaves:!!persistence.shared,accounts:true,squads:true,accountRequired:false,guests:true,durable,players:Object.values(actors).filter(a=>!a.inLobby).length,persistence:persistence.mode,saveError:!!persistence.lastError,saveErrorCode:persistence.lastError?saveDiagnostics.code({code:persistence.lastErrorCode}):null,worldRevision:worlds.garden.revision,tickMs:Math.round(metrics.tickMs*100)/100,slowTicks:metrics.slowTicks,entities:Object.fromEntries(Object.entries(worlds).map(([name,world])=>[name,{activeOres:world.game.ores.length,dormantOres:world.dormantOres.size,mobs:world.game.mobs.length,projectiles:world.game.projectiles.length}]))}));
  function unbind(socket,{preserveSquad=false,discard=false}={}){
    const actor=actors[socket.id];if(!actor)return;
    if(!discard)store.save(actor.profile);delete actors[socket.id];delete guildPlayers[socket.id];
    if(actor.profile.guest){if(preserveSquad)store.deferGuest(actor.profile.id);else store.discardGuest(actor.profile.id);}
    if(preserveSquad)squads.disconnected(actor.profile.id);else squads.leave(actor.profile.id);
    io.emit('playerLeft',socket.id);
  }
  function welcome(actor,credentials){
    actor.mapAckRealm=null;actor.mapAckVersion=null;
    actor.oreCacheKey=null;actor.oreSeq=0;actor.oreAck=-1;actor.orePending=null;actor.oreCacheEnabled=actor.socket.handshake.auth?.oreCache===true;
    actor.movementEpoch=(actor.movementEpoch || 0)+1;actor.moveSeq=0;actor.moveBudget=.15;actor.lastMove=Date.now();
    const s=actor.state;actor.socket.emit('profileReady',{credentials:credentials || actor.credentials,state:store.clientState(actor.profile),account:accounts.summary(actor.profile),lobby:!!actor.inLobby,realm:s.realm,x:s.x,y:s.y,epoch:actor.movementEpoch || 1});
    if(!actor.inLobby)actor.socket.emit('worldSnapshot',worlds[s.realm].snapshot(actor));squads.connected(actor.profile.id);
  }
  function bind(socket,profile,credentials,data={}){
    developer.assertAvailable(profile,developerStatus);
    const previous=actors[socket.id],lobby=!!data.lobby,realm=expansion.mapFor(data.realm==='garden'&&data.biome&&data.biome!=='garden'?data.biome:data.realm).id,spawn=expansion.mapFor(realm).spawn;
    if(profile.guest)store.touchGuest(profile.id);else chosen.reconcile(profile);
    if(previous?.profile.id===profile.id){
      if(credentials)previous.credentials=credentials;
      previous.name=profile.name;guildPlayers[socket.id].name=profile.name;guildPlayers[socket.id].guest=!!profile.guest;
      if(previous.inLobby && !lobby)Object.assign(previous.state,{realm,x:spawn.x,y:spawn.y,hp:previous.state.dead ? previous.state.maxHp : previous.state.hp,dead:false,vx:0,vy:0,hurtUntil:Date.now()+2000});
      if(previous.inLobby!==lobby){previous.movementEpoch=(previous.movementEpoch || 1)+1;previous.moveSeq=0;previous.moveBudget=.15;previous.lastMove=Date.now();}previous.inLobby=lobby;guilds.sync(socket);welcome(previous,credentials);return previous;
    }
    if(previous)unbind(socket);
    for(const old of Object.values(actors))if(old.profile.id===profile.id){old.socket.data.preserveSquad=true;old.socket.emit('sessionReplaced');old.socket.disconnect(true);}
    const guildId=profile.state.guildId;profile.state=store.sanitize(profile.state);profile.state.guildId=guildId || null;
    if(profile.developerTest)developer.grant(profile,worlds.garden.game,store);
    const state=profile.state;Object.assign(state,{name:profile.name,realm,x:spawn.x,y:spawn.y,hp:state.maxHp,dead:false,hurtUntil:Date.now()+2000});
    const actor={socket,profile,credentials,state,name:profile.name,inLobby:lobby,movementEpoch:1,nextAttack:0,contacts:{},lastMove:Date.now()};actors[socket.id]=actor;
    guildPlayers[socket.id]={name:profile.name,guest:!!profile.guest,developerTest:profile.developerTest===true,profileId:profile.id,guildId:state.guildId || null};
    if(!socket.data.guildAttached){guilds.attach(socket);socket.data.guildAttached=true;}guilds.sync(socket);welcome(actor,credentials);return actor;
  }
  io.on('connection',socket=>{
    socket.emit('init',{id:socket.id,players:playersPacket(),ores:[],sharedWorld:true,protocol:6,region:regions.id,location:regions.location,accounts:true,squads:true,accountRequired:false,guests:true,durable});
    // The array reference remains stable for admin spawns, including after mining.
    attachAdmin(socket,{emit:(event,data)=>{
      if(event==='oreUpdate'){const list=worlds.garden.game.ores;if(!list.some(o=>o.id===data.id)){list.push(data);worlds.garden.announceSpawn(data,false);}}
      else io.emit(event,data);
    }},new Proxy([],{
      get(_target,key){const list=worlds.garden.game.ores;return typeof list[key]==='function' ? list[key].bind(list) : list[key];}
    }),process.env.ADMIN_TOKEN);
    socket.on('guestJoin',(data={},reply)=>{
      if(socket.data.authBusy || socket.data.leaving){reply?.({ok:false,message:'Aguarde a solicitação anterior.'});return;}
      try{
        const current=actors[socket.id];
        if(current && !current.profile.guest)throw Error('Saia da sua conta antes de entrar como convidado.');
        if(current){bind(socket,current.profile,current.credentials,data);reply?.({ok:true,guest:true});return;}
        const now=Date.now(),address=addressOf(socket),rate=guestRates.get(address);
        if(rate && rate.until>now && rate.count>=15)throw Error('Muitas sessões de convidado. Aguarde alguns minutos.');
        if(guestRates.size>=10000)for(const [key,value] of guestRates)if(value.until<=now)guestRates.delete(key);
        if(guestRates.size>=10000 && !rate)throw Error('O servidor está ocupado. Tente novamente em instantes.');
        guestRates.set(address,{count:rate && rate.until>now ? rate.count+1 : 1,until:rate && rate.until>now ? rate.until : now+300000});
        const session=store.createGuest(data?.name);bind(socket,session.profile,session.credentials,data || {});reply?.({ok:true,guest:true});
      }catch(error){reply?.({ok:false,message:error.message});}
    });
    socket.on('joinGame',async(data,reply)=>{
      if(socket.data.authBusy){reply?.({ok:false,message:'Aguarde a entrada anterior.'});return;}socket.data.authBusy=true;
      try{
        if(!data || typeof data!=='object')throw Error('Entrada inválida.');
        const currentGuest=actors[socket.id],verifiedGuest=store.verifyCredentials(data.credentials);
        if(currentGuest?.profile.guest || (!currentGuest && verifiedGuest?.guest)){
          const session=currentGuest ? {profile:currentGuest.profile,credentials:currentGuest.credentials} : {profile:verifiedGuest,credentials:data.credentials};
          bind(socket,session.profile,session.credentials,data);reply?.({ok:true,guest:true});return;
        }
        if(data.guest && !currentGuest){const error=Error('A sessão de convidado terminou. Jogue novamente ou entre na sua conta.');error.code='GUEST_EXPIRED';throw error;}
        await catalogAction(async()=>{
          const current=actors[socket.id];
          if(!current){const verified=store.verifyCredentials(data.credentials);if(!verified){const error=Error('Entre com seu nick e senha.');error.code='AUTH_REQUIRED';throw error;}await persistence.claim?.(verified.id);}
          const session=current ? {profile:current.profile,credentials:current.credentials} : store.join(data);
          if(!accounts.summary(session.profile))throw Error('Crie sua conta com nick e senha antes de jogar.');
          if(!socket.connected){await releaseProfile(session.profile.id,true);return;}
          bind(socket,session.profile,session.credentials,data);reply?.({ok:true});
        });
      }catch(error){reply?.({ok:false,message:error.message,code:error.code});socket.emit('actionResult',{ok:false,message:error.message});}
      finally{socket.data.authBusy=false;}
    });
    for(const [event,method] of [['accountRegister','register'],['accountLogin','login']])socket.on(event,async(data,reply)=>{
      if(socket.data.authBusy){reply?.({ok:false,message:'Aguarde a solicitação anterior.'});return;}
      if(!data || typeof data!=='object'){reply?.({ok:false,message:'Dados inválidos.'});return;}
      socket.data.authBusy=true;
      try{
        if(method==='register' && !durable)throw Error('Cadastros aguardam a configuração do banco persistente pelo dono do servidor.');
        const address=addressOf(socket);
        await catalogAction(async()=>{
        const result=method==='register' ? await accounts.register(data,actors[socket.id]?.profile,address) : await accounts.login(data,address);
        const saved=await persistence.flush()!==false;
        if(!socket.connected){await releaseProfile(result.profile.id,true);return;}
        bind(socket,result.profile,result.credentials,{lobby:data.lobby,realm:data.realm,biome:data.biome});squads.refresh();
        reply?.({ok:true,saved,account:result.account,message:!saved ? 'Conta conectada, mas o banco ainda não confirmou o save. Mantenha a sessão aberta enquanto o servidor tenta novamente.' : method==='register' ? 'Conta criada. Seu progresso foi salvo.' : 'Você entrou na sua conta.'});
        });
      }catch(error){reply?.({ok:false,message:error.message});}
      finally{socket.data.authBusy=false;}
    });
    socket.on('accountLogout',async(_data,reply)=>{if(socket.data.authBusy){reply?.({ok:false,message:'Aguarde a solicitação anterior.'});return;}const actor=actors[socket.id];try{if(actor?.profile.guest){unbind(socket);reply?.({ok:true,saved:false,guest:true});return;}if(actor){accounts.logout(actor.profile);unbind(socket);await releaseProfile(actor.profile.id);}const saved=await persistence.flush();reply?.({ok:saved!==false,saved:saved!==false});}catch{reply?.({ok:false,message:'Não foi possível confirmar o save. Tente novamente.'});}});
    socket.on('returnToMenu',async(_data,reply)=>{const actor=actors[socket.id];if(!actor){reply?.({ok:false});return;}actor.inLobby=true;actor.state.vx=0;actor.state.vy=0;store.save(actor.profile);squads.refresh();welcome(actor);if(actor.profile.guest){reply?.({ok:true,guest:true,saved:false});return;}const saved=await persistence.flush();reply?.({ok:saved!==false});});
    socket.on('leaveServer',async(_data,reply)=>{
      if(socket.data.authBusy || socket.data.leaving){reply?.({ok:false,message:'Aguarde a solicitação anterior.'});return;}
      const actor=actors[socket.id];if(!actor){reply?.({ok:true});return;}socket.data.leaving=true;
      try{if(actor.profile.guest){unbind(socket);reply?.({ok:true,guest:true,saved:false});return;}actor.inLobby=true;actor.state.vx=0;actor.state.vy=0;store.save(actor.profile);if(await persistence.flush()===false)throw Error('O banco não confirmou seu save. A troca foi cancelada.');unbind(socket);await releaseProfile(actor.profile.id);reply?.({ok:true});}catch(error){reply?.({ok:false,message:error.message});}finally{socket.data.leaving=false;}
    });
    attachPublicProfiles(socket,{actors,store,persistence,catalogAction,chosen});
    socket.on('latencyProbe',(_data,reply)=>reply?.({time:Date.now(),tickMs:metrics.tickMs}));
    socket.on('mapAck',data=>{const actor=actors[socket.id];if(actor && data?.realm===actor.state.realm && data.version===worlds[actor.state.realm].mapVersion){actor.mapAckRealm=data.realm;actor.mapAckVersion=data.version;}});
    socket.on('oreAck',data=>{const actor=actors[socket.id];if(actor && data?.realm===actor.state.realm && data.epoch===actor.movementEpoch && data.seq===actor.orePending?.seq)actor.oreAck=data.seq;});
    socket.on('squadAction',(data,reply)=>{
      const actor=actors[socket.id];if(!actor){reply?.({ok:false,message:'Entre no lobby para usar o squad.'});return;}
      if(Date.now()<(socket.data.nextSquadAction || 0)){reply?.({ok:false,message:'Aguarde um instante.'});return;}socket.data.nextSquadAction=Date.now()+200;
      try{const state=squads.action(actor,data);reply?.({ok:true,state});}catch(error){reply?.({ok:false,message:error.message});}
    });
    socket.on('squadStatus',()=>{const actor=actors[socket.id];if(actor)socket.emit('squadState',squads.snapshot(actor.profile.id));});
    socket.on('lobbyRealm',realm=>{const actor=actors[socket.id];if(actor?.inLobby && expansion.MAPS.some(m=>m.id===realm)){actor.state.realm=realm;squads.refresh();}});
    socket.on('move',data=>{
      const actor=actors[socket.id];if(!actor || actor.inLobby || !data || !Number.isFinite(data.x) || !Number.isFinite(data.y))return;
      if(Array.isArray(data.commands)){
        if(data.realm!==actor.state.realm || data.epoch!==actor.movementEpoch || data.commands.length>12)return;
        if(Date.now()-(actor.inputWindow || 0)>1000){actor.inputWindow=Date.now();actor.inputPackets=0;}if(++actor.inputPackets>60)return;
        const now=Date.now(),s=actor.state,g=worlds[s.realm].game,utility=g.utility(s),speed=240*(1+(s.talentRanks.speed || 0)*.08+(s.realm==='cave' ? (s.talentRanks.sprint || 0)*.04 : 0))*(1+(utility.speed || 0))*(s.slowUntil>Date.now()?Math.max(.55,1-.45*(1-(utility.slowResist||0))):1);
        actor.moveBudget=Math.min(.45,(actor.moveBudget ?? .15)+Math.max(0,(now-actor.lastMove)/1000));actor.lastMove=now;
        for(const command of data.commands){
          if(!Number.isSafeInteger(command.seq) || command.seq<=0 || command.seq<=(actor.moveSeq || 0) || !Array.isArray(command.steps) || command.steps.length>128)continue;
          if(command.steps.some(step=>!step || !Number.isFinite(step.dx) || !Number.isFinite(step.dy) || !Number.isFinite(step.dt) || step.dt<=0 || step.dt>.15 || Math.abs(step.dx)>1 || Math.abs(step.dy)>1))continue;
          for(const step of command.steps){const dt=Math.min(step.dt,actor.moveBudget);actor.moveBudget=Math.max(0,actor.moveBudget-dt);if(dt>0 && !s.dead)movement.advance(s,step,dt,speed,(state,x,y)=>movePlayerBody(worlds[s.realm],state,x,y));}
          actor.moveSeq=command.seq;
        }
        s.moving=Math.hypot(s.vx,s.vy)>.2;
        if(Number.isFinite(data.viewRadius))actor.viewRadius=Math.max(1200,Math.min(6500,data.viewRadius));
        if(Number.isFinite(data.aimAngle))s.aimAngle=Math.atan2(Math.sin(data.aimAngle),Math.cos(data.aimAngle));
        if([0,1,2,3].includes(data.selectedSlot))s.selectedSlot=data.selectedSlot;
        return;
      }
      if((data.realm && data.realm!==actor.state.realm) || (data.epoch!==undefined && data.epoch!==actor.movementEpoch) || (actor.moveSeq>0 && Date.now()-actor.lastMove<20))return;
      const s=actor.state,now=Date.now(),dt=Math.max(.01,Math.min(.5,(now-actor.lastMove)/1000));actor.lastMove=now;
      if(!s.dead){
        const dimensions=expansion.mapFor(s.realm),x=Math.max(20,Math.min(dimensions.w-20,data.x)),y=Math.max(20,Math.min(dimensions.h-20,data.y));
        const dx=x-s.x,dy=y-s.y,distance=Math.hypot(dx,dy),utility=worlds[s.realm].game.utility(s);
        const speed=240*(1+(s.talentRanks.speed || 0)*.08+(s.realm==='cave' ? (s.talentRanks.sprint || 0)*.04 : 0))*(1+(utility.speed || 0))*(s.slowUntil>Date.now()?Math.max(.55,1-.45*(1-(utility.slowResist||0))):1),limit=speed*dt+12,factor=distance>limit ? limit/distance : 1;
        const nx=s.x+dx*factor,ny=s.y+dy*factor;
        const previousX=s.x,previousY=s.y;movePlayerBody(worlds[s.realm],s,nx,ny);s.vx=(s.x-previousX)/dt;s.vy=(s.y-previousY)/dt;s.moving=Math.hypot(s.x-previousX,s.y-previousY)>.2;
      }
      actor.moveSeq=Number.isSafeInteger(data.seq) ? data.seq : actor.moveSeq || 0;
      if(Number.isFinite(data.viewRadius))actor.viewRadius=Math.max(1200,Math.min(6500,data.viewRadius));
      if(Number.isFinite(data.aimAngle))s.aimAngle=Math.atan2(Math.sin(data.aimAngle),Math.cos(data.aimAngle));
      if([0,1,2,3].includes(data.selectedSlot))s.selectedSlot=data.selectedSlot;
    });
    socket.on('attack',data=>{const a=actors[socket.id];if(a)worlds[a.state.realm].attack(a,data);});
    socket.on('magicAction',(data,reply)=>{const a=actors[socket.id];if(!a||!data||typeof data!=='object'){reply?.({ok:false});return;}const now=Date.now();if(now<(a.nextMagicAction||0)){reply?.({ok:false,message:'Aguarde um instante.'});return;}a.nextMagicAction=now+80;try{const ok=worlds[a.state.realm].arcana.action(a,data);reply?.({ok});}catch(error){reply?.({ok:false,message:error.message});}});
    socket.on('useAbility',type=>{const a=actors[socket.id];if(a)worlds[a.state.realm].ability(a,type);});
    socket.on('playerAction',async(request={},reply)=>{
      if(!request || typeof request!=='object'){reply?.({ok:false});return;}
      const a=actors[socket.id];if(!a || a.state.dead){reply?.({ok:false});return;}
      const now=Date.now();if(now<(a.nextAction || 0)){reply?.({ok:false});return;}a.nextAction=now+80;
      const beforeCraft=a.state.pendingCraft?.id,beforeItems=a.state.inventory.length;
      let ok=false,forgeSaved=true;
      if(request.kind==='forgeChosen'){
        if(socket.data.forgeBusy){reply?.({ok:false,message:'Aguarde a forja anterior.'});return;}socket.data.forgeBusy=true;
        try{await catalogAction(async()=>{if(!worlds[a.state.realm].canForge(a))throw Error('Converse com a Coxinha Forjadora no Deserto, perto dela e fora do menu.');chosen.forge(a,request.data||{});forgeSaved=await persistence.flush()!==false;ok=true;for(const other of Object.values(actors))if(chosen.reconcile(other.profile)){other.socket.emit('chosenLost','Sua posse de Chosen foi superada por uma oferta maior.');sendState(other);}});}catch(error){reply?.({ok:false,message:error.message});socket.emit('actionResult',{ok:false,message:error.message});return;}finally{socket.data.forgeBusy=false;}
      }else ok=worlds[a.state.realm].game.command(a.state,request.kind,request.data||{});
      if(ok){if(['pickaxe','weapon','gear'].includes(request.kind)&&a.state.inventory.length>beforeItems){a.state.journal.crafted=(a.state.journal.crafted||0)+1;a.state.journal.craftAttempts=(a.state.journal.craftAttempts||0)+1;}store.save(a.profile);const craft=a.state.pendingCraft;if(craft?.success&&!a.profile.developerTest&&craft.id!==beforeCraft&&expansion.tier(craft.to)>=7)io.emit('craftAnnouncement',{name:a.name,item:craft.name,rarity:craft.to,chance:craft.chance,type:craft.type,count:craft.successes||1});}sendState(a);
      const result={ok,message:ok ? (!forgeSaved?'Forja registrada nesta sessão, mas o banco ainda não confirmou. Mantenha a conexão aberta.':a.profile.guest ? 'Alteração aplicada à sessão temporária.' : 'Alteração salva no servidor.') : 'Requisitos insuficientes ou ação indisponível.'};socket.emit('actionResult',result);reply?.(result);
    });
    socket.on('savePlayer',async()=>{const a=actors[socket.id];if(a){if(a.profile.guest){socket.emit('saveConfirmed',{guest:true,committed:false,at:Date.now()});return;}store.save(a.profile);const committed=await persistence.flush();socket.emit('saveConfirmed',{revision:a.profile.revision,at:Date.now(),persistence:persistence.mode,committed:committed!==false});}});
    socket.on('changeRealm',next=>{
      const a=actors[socket.id];if(!a || a.inLobby || a.state.dead)return;
      const s=a.state,portal=expansion.portalsFor(s.realm).find(p=>p.to===next&&Math.hypot(s.x-p.x,s.y-p.y)<=360);
      if(next===s.realm || !Object.hasOwn(worlds,next) || !portal)return;
      const spawn=expansion.mapFor(next).spawn;s.realm=next;s.x=spawn.x;s.y=spawn.y;s.vx=0;s.vy=0;s.hurtUntil=Date.now()+2000;
      a.contacts={};a.seenCreatures=new Set();
      a.mapAckRealm=null;a.mapAckVersion=null;a.oreCacheKey=null;a.oreAck=-1;a.orePending=null;a.movementEpoch++;a.moveSeq=0;a.moveBudget=.15;a.lastMove=Date.now();socket.emit('realmChanged',{realm:next,x:s.x,y:s.y,epoch:a.movementEpoch});socket.emit('worldSnapshot',worlds[next].snapshot(a));
    });
    socket.on('respawn',()=>{
      const a=actors[socket.id];if(!a || !a.state.dead)return;
      Object.assign(a.state,{dead:false,hp:a.state.maxHp,deathCause:'',realm:'garden',x:expansion.mapFor('garden').spawn.x,y:expansion.mapFor('garden').spawn.y,vx:0,vy:0,hurtUntil:Date.now()+2000});
      a.movementEpoch++;a.oreCacheKey=null;a.oreAck=-1;a.moveSeq=0;a.moveBudget=.15;a.lastMove=Date.now();socket.emit('realmChanged',{realm:'garden',x:expansion.mapFor('garden').spawn.x,y:expansion.mapFor('garden').spawn.y,epoch:a.movementEpoch});sendState(a);store.save(a.profile);
    });
    attachChat(socket,{actors,publicPlayer,squads,persistence,guilds});
    resurrection.attach(socket);
    socket.on('forgeStatus',(_data,reply)=>reply?.({ok:true,claims:chosen.status()}));
    socket.on('disconnect',()=>{
      const profile=actors[socket.id]?.profile,id=profile?.id;
      unbind(socket,{preserveSquad:true});
      if(id && !profile.guest){const job=releaseProfile(id).catch(()=>{});releaseJobs.add(job);job.finally(()=>releaseJobs.delete(job));}
    });
  });
  let frames=0,lastTick=Date.now();
  const loop=setInterval(()=>{
    const tickStart=performance.now(),now=Date.now(),dt=Math.min(.15,Math.max(.01,(now-lastTick)/1000));lastTick=now;
    try{for(const world of Object.values(worlds)){world.tick(dt);world.arcana.tick(dt);}resurrection.tick();frames++;for(const actor of Object.values(actors)){if(!actor.inLobby)actor.state.playTimeMs=Math.min(Number.MAX_SAFE_INTEGER,(actor.state.playTimeMs||0)+dt*1000);if(chosen.reconcile(actor.profile)){actor.socket.emit('chosenLost','Sua posse de Chosen foi superada por uma oferta maior.');sendState(actor);}}
      for(const actor of Object.values(actors))if(actor.inLobby && actor.state.pendingCraft && Date.now()-actor.state.pendingCraft.startedAt>=expansion.craftDurationOf(actor.state.pendingCraft)){worlds[actor.state.realm].game.tickPlayer(actor.state);store.save(actor.profile);sendState(actor);}
      if(frames%2===0){const people=playersPacket();for(const actor of Object.values(actors))if(!actor.inLobby){const nearby=Object.fromEntries(Object.entries(people).filter(([,p])=>p.realm===actor.state.realm && Math.hypot(p.x-actor.state.x,p.y-actor.state.y)<(actor.viewRadius || 3000)+200));actor.socket.volatile.emit('worldFrame',{players:nearby,world:worlds[actor.state.realm].snapshot(actor),party:frames%4===0?partyPacket(actor):undefined});}}
      if(frames%20===0)squads.refresh();

      if(frames%100===0)for(const actor of Object.values(actors))store.save(actor.profile);
    }catch(error){console.error('Falha no ciclo do mundo:',error);}
    metrics.tickMs=metrics.tickMs*.9+(performance.now()-tickStart)*.1;if(performance.now()-tickStart>50)metrics.slowTicks++;
  },50);
  function partyPacket(actor){const all=Object.values(actors),member=a=>({id:a.socket.id,profileId:a.profile.id,name:a.name,level:a.state.level,hp:a.state.hp,maxHp:a.state.maxHp,dead:!!a.state.dead,realm:a.state.realm,x:a.inLobby?null:a.state.x,y:a.inLobby?null:a.state.y,aimAngle:a.state.aimAngle||0,vx:a.state.vx||0,vy:a.state.vy||0,moving:!!a.state.moving,inLobby:a.inLobby,guildTag:guildPlayers[a.socket.id]?.guildTag||''}),team=squads.groupFor(actor.profile.id),guildId=guildPlayers[actor.socket.id]?.guildId;return {squad:team?all.filter(a=>team.members.has(a.profile.id)).map(member):[],guild:guildId?all.filter(a=>guildPlayers[a.socket.id]?.guildId===guildId).slice(0,50).map(member):[]};}

  let refreshingChosen=false;
  const chosenRefresh=setInterval(async()=>{if(refreshingChosen||!persistence.shared||!Object.values(actors).some(a=>a.state.inventory.some(i=>(i.rarity||i.oreRarity)==='CHOSEN')))return;refreshingChosen=true;try{await catalogAction(()=>{});}catch{}finally{refreshingChosen=false;}},5000);chosenRefresh.unref?.();
  let renewing=false;
  const leases=setInterval(async()=>{if(renewing || !persistence.renew)return;renewing=true;try{let lost;try{lost=await persistence.renew();}catch{lost=Object.values(actors).filter(actor=>!actor.profile.guest).map(actor=>actor.profile.id);}for(const id of lost){for(const actor of Object.values(actors))if(actor.profile.id===id){unbind(actor.socket,{discard:true});actor.socket.emit('serverSessionLost','A conexão com o banco expirou. Entre novamente para continuar com segurança.');actor.socket.disconnect(true);}try{await persistence.discard(id);}catch{}}}finally{renewing=false;}},15000);leases.unref?.();
  const close=async()=>{clearInterval(chosenRefresh);resurrection.close();clearInterval(loop);clearInterval(leases);for(const actor of Object.values(actors))store.save(actor.profile);await new Promise(resolve=>io.close(resolve));squads.close();store.close();await Promise.allSettled([...releaseJobs]);await persistence.flush();persistence.close?.();};
  return {app,http,io,worlds,actors,store,persistence,accounts,squads,chosen,resurrection,developerStatus,close};
}
module.exports={createGameServer};
if(require.main===module)createGameServer().then(server=>{
  server.http.listen(process.env.PORT || 3000,'0.0.0.0',()=>console.log('CoxinhaMiner online · mundo compartilhado · porta '+(process.env.PORT || 3000)));
  for(const signal of ['SIGTERM','SIGINT'])process.on(signal,async()=>{await server.close();process.exit(0);});
}).catch(error=>{console.error(error.message);process.exitCode=1;});
