const {test}=require('node:test'),assert=require('node:assert/strict');
const low=require('lowdb'),Memory=require('lowdb/adapters/Memory'),{io:connect}=require('../node_modules/socket.io/client-dist/socket.io.js');
const {createGameServer}=require('../server'),E=require('../public/expansion');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const call=(s,event,data)=>new Promise((resolve,reject)=>s.timeout(5000).emit(event,data,(error,result)=>error?reject(error):resolve(result)));
async function until(fn){for(let n=0;n<80;n++){if(fn())return;await delay(25);}throw Error('Expected world update did not arrive');}
test('six independent maps isolate entities and players; portals validate proximity, reset movement and preserve progress',{timeout:20000},async t=>{
 const server=await createGameServer({storage:{db:low(new Memory()),mode:'memory',flush:async()=>true,close(){}}});await new Promise(r=>server.http.listen(0,'127.0.0.1',r));const sockets=[];
 t.after(async()=>{sockets.forEach(s=>s.disconnect());await server.close();});for(const w of Object.values(server.worlds))w.nextSpawn=Infinity;
 async function guest(name,realm){const s=connect('http://127.0.0.1:'+server.http.address().port,{transports:['websocket'],reconnection:false});sockets.push(s);s.on('profileReady',p=>s.profile=p);s.on('worldFrame',p=>s.frame=p);s.on('realmChanged',p=>s.changed=p);await new Promise(r=>s.on('connect',r));assert.equal((await call(s,'guestJoin',{name,realm,lobby:false})).ok,true);return s;}
 const a=await guest('Garden Visitor','garden'),b=await guest('Beach Visitor','beach'),aa=server.actors[a.id],bb=server.actors[b.id];assert.equal(b.profile.realm,'beach');assert.deepEqual(Object.keys(server.worlds).sort(),E.MAPS.map(m=>m.id).sort());
 assert.equal(server.worlds.garden.forge,null);assert.ok(server.worlds.desert.forge);
 const garden=server.worlds.garden,beach=server.worlds.beach;Object.assign(aa.state,{x:53000,y:50000});Object.assign(bb.state,{x:53000,y:50000});
 const gMob=garden.game.createCreature('ladybug',garden.game.rarities[0],53100,50000),bMob=beach.game.createCreature('crab',beach.game.rarities[0],53100,50000);garden.game.mobs=[gMob];beach.game.mobs=[bMob];
 await until(()=>a.frame?.world.mobs.some(m=>m.id===gMob.id)&&b.frame?.world.mobs.some(m=>m.id===bMob.id));assert.equal(a.frame.world.mobs.some(m=>m.id===bMob.id),false);assert.equal(b.frame.world.mobs.some(m=>m.id===gMob.id),false);assert.equal(a.frame.players[b.id],undefined);assert.equal(b.frame.players[a.id],undefined);
 aa.state.coins=1234;aa.state.inventory.push(E.accessory('wings','Raro',2));aa.state.level=77;const before=aa.movementEpoch;
 a.emit('changeRealm','desert');await delay(100);assert.equal(aa.state.realm,'garden','remote travel is refused');a.emit('changeRealm','__proto__');await delay(50);assert.equal(aa.state.realm,'garden');
 const portal=E.portalsFor('garden').find(p=>p.to==='desert');Object.assign(aa.state,{x:portal.x,y:portal.y});a.emit('changeRealm','desert');await until(()=>aa.state.realm==='desert'&&a.changed?.realm==='desert');assert.equal(aa.movementEpoch,before+1);assert.equal(aa.state.x,E.mapFor('desert').spawn.x);assert.equal(aa.state.coins,1234);assert.equal(aa.state.level,77);assert.equal(aa.state.inventory.find(i=>i.accessoryId==='wings').amount,2);
 a.emit('move',{realm:'garden',epoch:before,x:10,y:10,commands:[]});await delay(70);assert.equal(aa.state.x,50000,'stale movement cannot move the destination avatar');
 assert.equal((await call(a,'returnToMenu',{})).ok,true);a.emit('lobbyRealm','ice');await until(()=>aa.state.realm==='ice');assert.equal((await call(a,'guestJoin',{credentials:a.profile.credentials,name:'Garden Visitor',realm:'ice',lobby:false})).ok,true);assert.equal(aa.state.realm,'ice');assert.equal(aa.state.coins,1234);assert.equal(aa.state.level,77);
 for(const realm of E.MAPS.map(m=>m.id)){const destinations=E.portalsFor(realm),spawn=E.mapFor(realm).spawn;assert.ok(destinations.length);for(const p of destinations){assert.ok(E.MAPS.some(m=>m.id===p.to));assert.ok(p.to!==realm);assert.ok(Math.hypot(p.x-spawn.x,p.y-spawn.y)>(realm==='cave'?9000:30000),'portals stay far from spawn');}}
 const destinationPortal=E.portalsFor('ice')[0],ice=server.worlds.ice;Object.assign(aa.state,{x:destinationPortal.x,y:destinationPortal.y,hurtUntil:Date.now()+1e6});ice.spawnAround(aa);assert.ok(ice.game.ores.every(o=>Math.hypot(o.x-destinationPortal.x,o.y-destinationPortal.y)>o.size+destinationPortal.r+220),'generated ore cannot block a distant portal');
});
