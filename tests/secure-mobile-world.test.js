const {test}=require('node:test'),assert=require('node:assert/strict');
const low=require('lowdb'),Memory=require('lowdb/adapters/Memory');
const {io:connect}=require('../node_modules/socket.io/client-dist/socket.io.js');
const {createGameServer}=require('../server'),catalog=require('../public/game-catalog');
const {resolveWorldCollisions}=require('../world-physics');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const call=(socket,event,data)=>new Promise((resolve,reject)=>socket.timeout(5000).emit(event,data,(error,result)=>error ? reject(error) : resolve(result)));
async function client(url){const socket=connect(url,{transports:['websocket'],reconnection:false});socket.on('profileReady',data=>socket.profile=data);await new Promise(r=>socket.on('connect',r));return socket;}

test('100 billion total XP to level 300, unlimited subsequent milestones and buffed health',()=>{
  let sum=0;for(let level=1;level<300;level++){const xp=catalog.xpForLevel(level);assert.ok(xp>=100);assert.equal(Number.isSafeInteger(xp),true);sum+=xp;}
  assert.equal(sum,100000000000);assert.ok(catalog.xpForLevel(300)>catalog.xpForLevel(299));assert.ok(catalog.totalXpForLevel(301)>100000000000);
  assert.ok(catalog.ORE_HP[7]>2000000);assert.ok(catalog.ORE_HP[10]>64000000);assert.ok(catalog.mobHealth(25,7)>=3000000);
});

test('name alone, blank name, forged saves and unknown bearer cannot open another account; menu exit keeps session',{timeout:20000},async t=>{
  const db=low(new Memory()),server=await createGameServer({storage:{db,flush:async()=>true,mode:'memory',close(){}}});await new Promise(r=>server.http.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.http.address().port,sockets=[];
  t.after(async()=>{sockets.forEach(s=>s.disconnect());await server.close();});for(const world of Object.values(server.worlds)){world.nextSpawn=Infinity;world.game.ores=[];world.game.mobs=[];}
  const a=await client(url),b=await client(url);sockets.push(a,b);
  assert.equal((await call(a,'joinGame',{name:''})).ok,false);assert.equal((await call(a,'accountRegister',{nickname:'   ',password:'secure-test-password',lobby:true})).ok,false);
  assert.equal((await call(a,'accountRegister',{nickname:'SecurePlayer',password:'secure-test-password',lobby:true,legacySave:{level:86,coins:999999,inventory:[{name:'Solar',type:'weapon'}]}})).ok,true);
  assert.equal(a.profile.state.level,1);assert.equal(a.profile.state.coins,0);assert.equal(a.profile.state.equipment.weapon,null,'new account does not inherit unrelated browser save');
  const credentials=a.profile.credentials;
  assert.equal((await call(b,'joinGame',{name:'SecurePlayer'})).ok,false);assert.equal(server.actors[b.id],undefined);
  assert.equal((await call(b,'joinGame',{name:'SecurePlayer',credentials:{id:credentials.id,token:'0'.repeat(64)}})).ok,false);
  assert.equal((await call(b,'joinGame',{name:'Player',credentials:{id:require('crypto').randomUUID(),token:'f'.repeat(64)},legacySave:{level:86}})).ok,false);
  assert.equal((await call(a,'joinGame',{name:'OtherPerson',lobby:false})).ok,true);assert.equal(server.actors[a.id].name,'SecurePlayer','nickname field cannot change authenticated identity');
  const actor=server.actors[a.id];actor.state.x=61000;actor.state.y=50000;actor.state.hp=35;actor.state.hurtUntil=Date.now()+100000;
  assert.equal((await call(a,'returnToMenu',{})).ok,true);assert.equal(actor.inLobby,true);assert.equal(server.store.verifyCredentials(credentials).id,credentials.id);
  a.emit('move',{x:90000,y:50000});await delay(80);assert.equal(actor.state.x,61000,'menu cannot move');
  assert.equal((await call(a,'joinGame',{lobby:false})).ok,true);assert.equal(actor.inLobby,false);assert.ok(actor.state.hp<50,'returning to the menu is not a full-heal exploit');
  const beforeStale=actor.state.x;a.emit('move',{seq:1,realm:'garden',epoch:actor.movementEpoch-1,x:90000,y:50000});await delay(30);assert.equal(actor.state.x,beforeStale,'old-scene movement is ignored after returning to play');
  a.emit('move',{seq:1,x:90000,y:50000,aimAngle:0,selectedSlot:2});await delay(80);assert.ok(actor.state.x<50500,'teleport packets are clamped');
  assert.equal((await call(b,'accountLogin',{nickname:'SecurePlayer',password:'wrong-password',lobby:true})).ok,false);
  actor.state.dead=true;actor.state.hp=0;assert.equal((await call(a,'returnToMenu',{})).ok,true);assert.equal((await call(a,'joinGame',{lobby:false})).ok,true);assert.equal(actor.state.dead,false);assert.equal(actor.state.hp,actor.state.maxHp,'dead players can respawn when returning from the menu');
  assert.equal((await call(b,'accountLogin',{nickname:'SecurePlayer',password:'secure-test-password',lobby:true})).ok,true);assert.equal(b.profile.credentials.id,credentials.id);
});

test('Render without persistent storage refuses new durable-account registration',{timeout:10000},async t=>{
  const db=low(new Memory()),server=await createGameServer({env:{RENDER:'true'},storage:{db,flush:async()=>true,mode:'file',close(){}}});await new Promise(r=>server.http.listen(0,'127.0.0.1',r));const socket=await client('http://127.0.0.1:'+server.http.address().port);t.after(async()=>{socket.disconnect();await server.close();});
  const result=await call(socket,'accountRegister',{nickname:'NeedsDatabase',password:'secure-test-password',lobby:true});assert.equal(result.ok,false);assert.match(result.message,/persistente/);assert.equal(Object.keys(db.get('accounts').value()).length,0);
});

test('mob/player/ore collisions resolve; all natural species drop collectible, private and nonduplicated loot',async()=>{
  const db=low(new Memory()),server=await createGameServer({storage:{db,flush:async()=>true,mode:'memory',close(){}}});
  try{const world=server.worlds.garden,g=world.game;world.nextSpawn=Infinity;const seed=server.store.create('DropTester'),profile=seed.profile,events=[],actor={profile,state:profile.state,inLobby:false,socket:{id:'test',emit:(event,value)=>events.push({event,value})}};server.actors.test=actor;
    Object.assign(actor.state,{x:61000,y:50000,hurtUntil:Date.now()+100000});g.ores=[];g.mobs=[];
    const other={profile:{id:'other'},state:{...actor.state},inLobby:false},mob=g.createCreature('ant',g.rarities[0],61000,50000);g.mobs=[mob];
    for(let n=0;n<12;n++)resolveWorldCollisions(world,[actor,other]);assert.ok(Math.hypot(actor.state.x-other.state.x,actor.state.y-other.state.y)>39);assert.ok(Math.hypot(actor.state.x-mob.x,actor.state.y-mob.y)>mob.size*.7+19);
    g.mobs=[];g.ores=[{id:'obstacle',x:61000,y:50000,size:80}];actor.state.x=61000;actor.state.y=50000;resolveWorldCollisions(world,[actor]);assert.ok(Math.hypot(actor.state.x-61000,actor.state.y-50000)>=100);
    g.ores=[];world.drops=[];
    const guard=g.createCreature('guardian',g.rarities[2],actor.state.x+90,actor.state.y);g.mobs=[guard];const idleX=actor.state.x,idleY=actor.state.y;for(let n=0;n<200;n++){g.moveMob(guard,actor.state,.05);resolveWorldCollisions(world,[actor]);}assert.ok(Math.hypot(actor.state.x-idleX,actor.state.y-idleY)<60,'a stopped pursuer does not push an idle player forever');g.mobs=[];
    actor.state.x=61000;actor.state.y=50000;actor.state.hp=100;actor.state.hurtUntil=0;g.ores=[{id:'projectile-owner',x:65000,y:50000,size:24,hp:10,maxHp:10,rarity:g.rarities[0]}];g.projectiles=[{owner:'projectile-owner',x:60800,y:50000,vx:4000,vy:0,r:5,life:2,damage:10,cause:'test'}];world.tick(.1);assert.equal(actor.state.hp,90,'fast bullets hit along their path even on a longer server tick');g.ores=[];
    for(const definition of g.creatures){const target=g.createCreature(definition.kind,g.rarities[2],61500,50000);g.mobs=[target];world.damage(actor,target,target.maxHp,true);const drop=world.drops.at(-1);assert.equal(drop.item.name,catalog.MOB_LOOT[definition.kind]);assert.equal(drop.item.type,'component');assert.ok(drop.claims.has(profile.id));assert.equal(actor.state.inventory.filter(i=>i.kind===definition.kind).length,0);drop.createdAt-=1000;actor.state.x=drop.x;actor.state.y=drop.y;world.collectDrops(actor);world.collectDrops(actor);assert.equal(actor.state.inventory.find(i=>i.kind===definition.kind).amount,1);}
    const helper=g.createCreature('spider',g.rarities[3],61500,50000);helper.summoned=true;helper.noRewards=true;g.mobs=[helper];const before=world.drops.length;world.damage(actor,helper,helper.maxHp,true);assert.equal(world.drops.length,before,'summons cannot farm drops');
    assert.equal(events.filter(e=>e.event==='dropCollected').length,g.creatures.length);const rareBee=actor.state.inventory.find(i=>i.kind==='bee');assert.ok(g.command(actor.state,'sellComponent',{kind:'bee',rarity:rareBee.rarity,amount:1}));assert.equal(actor.state.inventory.find(i=>i.kind==='bee'),undefined);
  }finally{await server.close();}
});
