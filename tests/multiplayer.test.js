const {test}=require('node:test');
const assert=require('node:assert/strict');
const {io:connect}=require('../node_modules/socket.io/client-dist/socket.io.js');
const low=require('lowdb'),Memory=require('lowdb/adapters/Memory');
const {createGameServer}=require('../server');
const resetGuilds=require('../scripts/reset-guilds');
const catalog=require('../public/game-catalog');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(check,message='condition',timeout=5000){const start=Date.now();while(!check()){if(Date.now()-start>timeout)throw Error('Timeout: '+message);await delay(15);}}
function once(socket,event){return new Promise(resolve=>socket.once(event,resolve));}
let fixtureServer;
async function login(url,name,credentials,gear='Diamante'){
  if(!credentials){const seed=fixtureServer.store.create(name,{level:231,coins:12345,xp:0,progressionVersion:3,talentPoints:230,talentRanks:{},inventory:[],equipment:{pickaxe:gear,weapon:{name:'Solar'},armor:{name:'Diamante'}}});credentials=(await fixtureServer.accounts.register({nickname:name,password:'fixture-password',credentials:seed.credentials},null,'fixture:'+name)).credentials;}
  const socket=connect(url,{autoConnect:false,transports:['websocket'],reconnection:false});socket.world=null;socket.people={};socket.loots=[];
  socket.on('worldSnapshot',packet=>socket.world=packet);socket.on('updatePlayers',packet=>socket.people=packet);socket.on('lootResult',packet=>socket.loots.push(packet));
  socket.on('worldFrame',packet=>{socket.world=packet.world;socket.people=packet.players;});
  const ready=once(socket,'profileReady');socket.on('connect',()=>socket.emit('joinGame',{name,credentials,legacySave:{level:231,coins:12345,xp:0,talentPoints:230,talentRanks:{},inventory:[],equipment:{pickaxe:gear,weapon:{name:'Solar'},armor:{name:'Diamante'}}}}));socket.connect();
  const profile=await ready;socket.profile=profile;return socket;
}
test('authoritative world, loot threshold, independent aim, tool restrictions, saves and guild reset',{timeout:30000},async t=>{
  const db=low(new Memory());let server=await createGameServer({storage:{db,flush:async()=>{},mode:'memory',close(){}}});
  fixtureServer=server;
  await new Promise(resolve=>server.http.listen(0,'127.0.0.1',resolve));let url='http://127.0.0.1:'+server.http.address().port;
  const sockets=[];t.after(async()=>{sockets.forEach(s=>s.disconnect());await server.close();});
  const a=await login(url,'Alpha'),b=await login(url,'Beta',null,'Solar');sockets.push(a,b);
  assert.equal(a.profile.state.level,231);assert.equal(a.profile.state.coins,12345);
  const world=server.worlds.garden;world.nextSpawn=Infinity;world.game.ores=[];world.game.mobs=[];
  for(const actor of Object.values(server.actors))actor.state.hurtUntil=Date.now()+100000;
  Object.assign(server.actors[a.id].state,{x:80600,y:75000});Object.assign(server.actors[b.id].state,{x:80600,y:75100});a.emit('move',{x:80600,y:75000,aimAngle:0,selectedSlot:2});b.emit('move',{x:80600,y:75100,aimAngle:Math.PI/2,selectedSlot:2});
  await until(()=>server.actors[a.id]?.state.x===80600 && server.actors[b.id]?.state.y===75100,'player movement');
  await until(()=>a.people[b.id]?.aimAngle===Math.PI/2 && b.people[a.id]?.aimAngle===0,'independent cursors');
  assert.equal(a.people[b.id].pickaxe,'Solar');assert.equal(b.people[a.id].pickaxe,'Diamante');
  function ore(id,hp){const entity={id,x:81000,y:75000,size:320,rarity:world.game.rarities[7],hp,maxHp:hp,isBoss:true};world.game.ores.push(entity);return entity;}
  const first=ore('shared-test',2000000),xpBefore=server.actors[a.id].state.xp;
  a.emit('attack',{type:'pickaxe',targetId:first.id,damage:1e15});await until(()=>first.hp<first.maxHp,'first hit');
  assert.equal(first.maxHp-first.hp,45010,'server calculates canonical tool damage');
  a.emit('attack',{type:'pickaxe',targetId:first.id});await delay(100);assert.equal(first.maxHp-first.hp,45010,'rate limit');
  await until(()=>a.world?.ores.find(o=>o.id===first.id)?.hp===first.hp && b.world?.ores.find(o=>o.id===first.id)?.hp===first.hp,'same entity health on both clients');
  await delay(270);a.emit('attack',{type:'pickaxe',targetId:first.id});await until(()=>first.maxHp-first.hp===90020,'second hit');
  while(first.hp>0){b.emit('attack',{type:'pickaxe',targetId:first.id});await delay(365);}
  await until(()=>a.loots.some(l=>l.rarity==='SUPER') && b.loots.some(l=>l.rarity==='SUPER'),'loot broadcast');
  assert.equal(a.loots[0].qualified,false);assert.equal(b.loots[0].qualified,true);assert.equal(server.actors[a.id].state.xp,xpBefore,'under 5% grants no XP');
  assert.ok(Math.abs(a.loots[0].share+b.loots[0].share-1)<1e-9,'overkill does not inflate contribution');
  assert.equal(server.actors[a.id].state.inventory.filter(i=>i.type==='material').length,0,'under 5% grants no item');
  const second=ore('exact-threshold',900200);await delay(365);a.emit('attack',{type:'pickaxe',targetId:second.id});await until(()=>second.hp===855190,'exact 5 percent hit');
  while(second.hp>0){b.emit('attack',{type:'pickaxe',targetId:second.id});await delay(365);}
  await until(()=>a.loots.length===2,'exact threshold reward');assert.equal(a.loots[1].qualified,true);
  const resource=ore('pickaxe-only',2000000),enemy=world.game.createCreature('spider',world.game.rarities[7],81000,75200);enemy.hp=enemy.maxHp=10000000;enemy.noBossAbilities=true;enemy.speed=0;world.game.mobs.push(enemy);
  a.emit('attack',{type:'pickaxe',targetId:enemy.id});await delay(100);assert.equal(enemy.hp,enemy.maxHp,'pickaxe cannot attack mob');
  a.emit('move',{x:80600,y:75000,aimAngle:0,selectedSlot:0});await delay(80);a.emit('attack',{type:'weapon',targetId:resource.id});await delay(100);assert.equal(resource.hp,resource.maxHp,'sword cannot mine');
  a.emit('useAbility','pickaxe');await until(()=>resource.hp<resource.maxHp,'pickaxe ability');assert.equal(enemy.hp,enemy.maxHp,'pickaxe ability excludes mobs');
  const oreAfter=resource.hp;a.emit('useAbility','weapon');await until(()=>enemy.hp<enemy.maxHp,'sword ability');assert.equal(resource.hp,oreAfter,'sword ability excludes ores');
  world.solarSuns.length=0;const alpha=server.actors[a.id],coins=alpha.state.coins;a.emit('savePlayer',{coins:1e12,level:99999});await delay(100);assert.equal(alpha.state.coins,coins);assert.notEqual(alpha.state.level,99999);
  const helper=world.game.createCreature('spider',world.game.rarities[5],81000,75500);helper.summoned=true;helper.noRewards=true;helper.summonerId=enemy.id;world.game.mobs.push(helper);
  const beforeHelper=JSON.stringify([alpha.state.xp,alpha.state.coins,alpha.state.inventory,alpha.state.journal.kills]);world.damage(alpha,helper,helper.maxHp,true);
  assert.equal(JSON.stringify([alpha.state.xp,alpha.state.coins,alpha.state.inventory,alpha.state.journal.kills]),beforeHelper,'summoned mobs never grant rewards');
  const creds=a.profile.credentials,expectedLevel=alpha.state.level,expectedCoins=alpha.state.coins;
  a.disconnect();await until(()=>!server.actors[a.id],'disconnect');b.disconnect();await server.close();
  server=await createGameServer({storage:{db,flush:async()=>{},mode:'memory',close(){}}});await new Promise(resolve=>server.http.listen(0,'127.0.0.1',resolve));url='http://127.0.0.1:'+server.http.address().port;
  fixtureServer=server;
  const resumed=await login(url,'Alpha',creds);sockets.push(resumed);assert.equal(resumed.profile.state.level,expectedLevel);assert.equal(resumed.profile.state.coins,expectedCoins);
  db.set('guilds',{ghost:{id:'ghost',members:['Alpha']}}).set(['profiles',creds.id,'state','guildId'],'ghost').write();
  const before=JSON.stringify(db.get(['profiles',creds.id,'state','inventory']).value());assert.equal(resetGuilds(db),1);assert.deepEqual(db.get('guilds').value(),{});assert.equal(db.get(['profiles',creds.id,'state','guildId']).value(),null);assert.equal(JSON.stringify(db.get(['profiles',creds.id,'state','inventory']).value()),before);
  const g=server.worlds.garden.game;
  for(const definition of g.creatures){const common=g.createCreature(definition.kind,g.rarities[0],79000,75000),superMob=g.createCreature(definition.kind,g.rarities[7],79000,75000);assert.ok(common.hp>definition.hp);assert.ok(superMob.hp>=500000);assert.equal(superMob.size,Math.min(360,25*Math.pow(1.32,7))*3);assert.equal(superMob.damage,catalog.mobDamage(definition.damage,7));}
  assert.equal(g.zone(5000,75000),'Z'+require('../public/map-atlas').at('garden',5000,75000).tier);assert.equal(catalog.ORE_HP[7],18000000);assert.ok(g.pickaxes[5].power>=45000);assert.ok(g.armors.find(a=>a.name==='Diamante').aura);
  const caveFriend=await login(url,'Gamma');sockets.push(caveFriend);
  for(const socket of [resumed,caveFriend]){
    const gate=require('../public/expansion').portalsFor('garden').find(p=>p.to==='cave');Object.assign(server.actors[socket.id].state,{x:gate.x,y:gate.y});socket.emit('move',{x:gate.x,y:gate.y,aimAngle:0,selectedSlot:2});await until(()=>server.actors[socket.id].state.x===gate.x,'portal approach');socket.emit('changeRealm','cave');await until(()=>socket.world?.realm==='cave','shared cave entry');
    server.actors[socket.id].state.hurtUntil=Date.now()+100000;
  }
  await until(()=>resumed.world.ores.length>0 && caveFriend.world.ores.length>0,'cave population');
  assert.deepEqual(resumed.world.ores.map(o=>[o.id,o.hp]).sort(),caveFriend.world.ores.map(o=>[o.id,o.hp]).sort(),'same cave resources and health');
  assert.deepEqual(resumed.world.mapDelta,caveFriend.world.mapDelta,'same maze chamber changes');
});

