const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const low=require('lowdb'),Memory=require('lowdb/adapters/Memory');
const {io:connect}=require('../node_modules/socket.io/client-dist/socket.io.js');
const {createGameServer}=require('../server'),openStorage=require('../storage'),regions=require('../regions'),motion=require('../public/movement-net');
const redisFixture=require('./redis-fixture');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const call=(s,event,data)=>new Promise((resolve,reject)=>s.timeout(10000).emit(event,data,(error,result)=>error ? reject(error) : resolve(result)));
function directory(t){const root=path.resolve(os.tmpdir()),dir=fs.mkdtempSync(path.join(root,'coxinha-regions-'));t.after(()=>{if(!path.resolve(dir).startsWith(root+path.sep))throw Error('Unsafe cleanup');fs.rmSync(dir,{recursive:true,force:true});});return dir;}
async function client(t,server,options={}){const s=connect('http://127.0.0.1:'+server.http.address().port,{transports:['websocket'],reconnection:false,...options});s.on('profileReady',profile=>s.profile=profile);await new Promise(resolve=>s.on('connect',resolve));t.after(()=>s.disconnect());return s;}
async function listen(server){for(const world of Object.values(server.worlds)){world.nextSpawn=Infinity;world.game.ores=[];world.game.mobs=[];}await new Promise(resolve=>server.http.listen(0,'127.0.0.1',resolve));return server;}

test('region config exposes only public origins; no invented BR server or fixed ping',async()=>{
 const empty=regions({});assert.equal(empty.id,'GLOBAL');assert.ok(empty.public().servers.every(s=>!s.configured && !s.url));
 const configured=regions({SERVER_REGION:'US',SERVER_LOCATION:'Virginia, USA',PUBLIC_URL:'https://us.example.test',BR_SERVER_URL:'https://br.example.test',UPSTASH_REDIS_REST_URL:'https://redis.example.test',UPSTASH_REDIS_REST_TOKEN:'private-test-token'});
 assert.equal(configured.allowedOrigin('https://br.example.test'),true);assert.equal(configured.allowedOrigin('https://evil.example.test'),false);assert.ok(configured.sharedSaveId);assert.ok(!JSON.stringify(configured.public()).includes('private-test-token'));
 assert.throws(()=>regions({BR_SERVER_URL:'javascript:alert(1)'}));assert.throws(()=>regions({US_SERVER_URL:'https://user:password@evil.test/path'}));
});

test('shared database merges simultaneous players and fences expired owners without losing empty arrays',async t=>{
 const redis=await redisFixture(t),a=await openStorage({...redis.env,DATA_DIR:directory(t)}),b=await openStorage({...redis.env,DATA_DIR:directory(t)});t.after(()=>{a.close();b.close();});
 for(const storage of [a,b])storage.db.defaults({accounts:{},accountsByNick:{}}).write();assert.equal(await a.flush(),true);assert.equal(await b.flush(),true);
 await a.claim('first');await b.claim('second');
 a.db.set(['profiles','first'],{state:{coins:100,inventory:[],journal:{unlocked:[]}}}).write();b.db.set(['profiles','second'],{state:{coins:200,inventory:[]}}).write();
 assert.deepEqual(await Promise.all([a.flush(),b.flush()]),[true,true]);let saved=JSON.parse(redis.values.get('coxinha:database:v2'));assert.equal(saved.profiles.first.state.coins,100);assert.equal(saved.profiles.second.state.coins,200);assert.deepEqual(saved.profiles.first.state.inventory,[]);
 a.db.get(['profiles','first']).value().state.coins=101;a.db.write();b.db.get(['profiles','second']).value().state.coins=202;b.db.write();assert.deepEqual(await Promise.all([a.flush(),b.flush()]),[true,true]);
 await assert.rejects(()=>b.claim('first'),/outro servidor/);assert.equal(await a.flush(),true);await a.release('first');await b.refresh();await b.claim('first');assert.equal(b.db.get(['profiles','first','state','coins']).value(),101);
 b.db.set(['profiles','first','state','coins'],900).write();assert.equal(await b.flush(),true);
 a.db.set(['profiles','first','state','coins'],999999).write();assert.equal(await a.flush(),false,'old region cannot overwrite the transferred profile');saved=JSON.parse(redis.values.get('coxinha:database:v2'));assert.equal(saved.profiles.first.state.coins,900);
 await a.discard('first');assert.equal(await a.flush(),true);
});

test('same account transfers across real Socket.IO servers, keeps latest save and refuses simultaneous region use',{timeout:30000},async t=>{
 const servers=[];t.after(async()=>{for(const server of servers)await server.close();});const redis=await redisFixture(t);
 for(const region of ['BR','US'])servers.push(await listen(await createGameServer({env:{...redis.env,DATA_DIR:directory(t),SERVER_REGION:region,SERVER_LOCATION:'Local test '+region}})));
 const [br,us]=servers,a=await client(t,br),b=await client(t,us),other=await client(t,us);
 let result=await call(a,'accountRegister',{nickname:'RegionalHero',password:'regional-test-password',lobby:true});assert.equal(result.ok,true,result.message);const credentials=a.profile.credentials;
 const actor=br.actors[a.id];actor.state.level=99;actor.state.coins=12345;actor.state.inventory.push({id:'Raro_material',name:'Raro',oreRarity:'Raro',type:'material',amount:17});br.store.save(actor.profile);assert.equal(await br.persistence.flush(),true);
 result=await call(b,'accountLogin',{nickname:'RegionalHero',password:'regional-test-password',lobby:true});assert.equal(result.ok,false);assert.match(result.message,/outro servidor/);assert.equal(br.store.verifyCredentials(credentials).id,credentials.id,'rejected remote login does not rotate the live token');
 const flush=br.persistence.flush;br.persistence.flush=async()=>false;result=await call(a,'leaveServer',{});assert.equal(result.ok,false);assert.equal(br.actors[a.id],actor,'failed save cancels transfer and retains the source session');br.persistence.flush=flush;
 result=await call(a,'leaveServer',{});assert.equal(result.ok,true,result.message);assert.equal(br.actors[a.id],undefined);
 result=await call(b,'joinGame',{credentials,lobby:true});assert.equal(result.ok,true,result.message);assert.equal(b.profile.state.level,99);assert.equal(b.profile.state.coins,12345);assert.equal(b.profile.state.inventory.find(i=>i.type==='material').amount,17);
 assert.equal((await call(other,'accountRegister',{nickname:'AnotherRegionHero',password:'regional-test-password',lobby:true})).ok,true);
 const raceA=await client(t,br),raceB=await client(t,us),registration={nickname:'UniqueAcrossRegions',password:'regional-test-password',lobby:true};const race=await Promise.all([call(raceA,'accountRegister',registration),call(raceB,'accountRegister',registration)]);assert.equal(race.filter(r=>r.ok).length,1,'nickname uniqueness is atomic across regions');
 us.actors[b.id].state.coins=777;us.store.save(us.actors[b.id].profile);assert.equal((await call(b,'leaveServer',{})).ok,true);assert.equal((await call(a,'joinGame',{credentials,lobby:true})).ok,true);assert.equal(a.profile.state.coins,777);
 const health=await (await fetch('http://127.0.0.1:'+us.http.address().port+'/health')).json();assert.equal(health.region,'US');assert.equal(health.sharedSaves,true);assert.equal(health.build,'release-155-xp1');
});

test('analytic movement matches 30/60/144 FPS; replay acknowledges pending input and smooths visual correction',()=>{
 const results=[30,60,144].map(fps=>{const s={x:0,y:0,vx:0,vy:0};for(let n=0;n<fps*3;n++)motion.advance(s,{dx:1,dy:0},1/fps,240);return s;});for(const s of results)assert.ok(Math.abs(s.x-results[0].x)<1e-8);
 const predictor=new motion.Predictor(),state={x:0,y:0,vx:0,vy:0},server={...state};let seq=0;
 for(let frame=0;frame<36;frame++){predictor.input(state,1,0,1/60,240);if(frame%3===2){const cmd=predictor.command(++seq);if(seq===1)for(const step of cmd.steps)motion.advance(server,step,step.dt,240);}}
 const before=state.x;predictor.reconcile(state,{...server,seq:1},100,240);assert.ok(Math.abs(state.x-before)<1e-8,'replays all unacknowledged commands instead of snapping to an old position');
 const visual=state.x+predictor.offsetX;predictor.reconcile(state,{x:server.x-12,y:0,vx:server.vx,vy:0,seq:1},200,240);assert.ok(Math.abs(state.x+predictor.offsetX-visual)<1e-8,'correction starts without a visible jump');const offset=Math.abs(predictor.offsetX);predictor.smooth(.1);assert.ok(Math.abs(predictor.offsetX)<offset);predictor.reset();assert.equal(predictor.pending.size,0);assert.equal(predictor.offsetX,0);
});

test('input commands resist duplicate packets, stale epochs, forged positions and accelerated time',{timeout:15000},async t=>{
 const db=low(new Memory()),server=await listen(await createGameServer({storage:{db,flush:async()=>true,mode:'memory',close(){}}}));t.after(()=>server.close());const s=await client(t,server);
 assert.equal((await call(s,'accountRegister',{nickname:'SmoothHero',password:'movement-test-password',lobby:false})).ok,true);const actor=server.actors[s.id],epoch=actor.movementEpoch,start=actor.state.x;
 const packet={x:99999,y:99999,realm:'garden',epoch,commands:[{seq:1,steps:[{dx:1,dy:0,dt:.1}]}]};s.emit('move',packet);await delay(40);const first=actor.state.x;assert.ok(first>start && first<start+25);s.emit('move',packet);await delay(40);assert.equal(actor.state.x,first,'resends do not move twice');
 s.emit('move',{...packet,epoch:epoch-1,commands:[{seq:2,steps:[{dx:1,dy:0,dt:.15}]}]});await delay(30);assert.equal(actor.state.x,first,'old map input rejected');
 for(let n=2;n<25;n++)s.emit('move',{...packet,commands:[{seq:n,steps:Array.from({length:16},()=>({dx:1,dy:0,dt:.15}))}]});await delay(80);assert.ok(actor.state.x-start<160,'server caps simulated time to elapsed time plus a small jitter allowance');assert.equal(actor.state.y,75000);
});

test('movement replay stays continuous with delayed snapshots, jitter and lost movement packets',()=>{
 const predictor=new motion.Predictor(),local={x:0,y:0,vx:0,vy:0},server={...local},commands=[],snapshots=[];let seq=0,ack=0,previousVisual=0,maxStep=0;
 for(let frame=0;frame<600;frame++){
  for(const packet of commands.filter(p=>p.at===frame))for(const command of packet.batch)if(command.seq>ack){for(const input of command.steps)motion.advance(server,input,input.dt,240);ack=command.seq;}
  if(frame%6===0)snapshots.push({at:frame+10+frame%7,time:frame+1,self:{...server,seq:ack}});
  for(const snapshot of snapshots.filter(p=>p.at===frame))predictor.reconcile(local,snapshot.self,snapshot.time,240);
  predictor.smooth(1/60);predictor.input(local,frame<500 ? 1 : 0,0,1/60,240);
  if(frame%3===2){predictor.command(++seq);if(seq%4!==0)commands.push({at:frame+5+seq%5,batch:JSON.parse(JSON.stringify(predictor.batch()))});}
  const visual=local.x+predictor.offsetX;maxStep=Math.max(maxStep,Math.abs(visual-previousVisual));previousVisual=visual;
 }
 assert.ok(maxStep<4.01,'no backward/forward jumps on receipt of old snapshots');assert.ok(Math.abs(predictor.offsetX)<.01,'loss is recovered by replaying and resending unacknowledged commands');assert.ok(Math.abs(local.x-server.x)<.1,'client and server converge after stopping');
});

test('explored ores sleep outside all players; HP, contribution, other players, bosses and loot survive unloading',async t=>{
 const db=low(new Memory()),server=await createGameServer({storage:{db,flush:async()=>true,mode:'memory',close(){}}});t.after(()=>server.close());const world=server.worlds.garden,g=world.game;world.nextSpawn=Infinity;g.ores=[];g.mobs=[];
 function actor(name,x,y){const profile=server.store.create(name).profile;Object.assign(profile.state,{realm:'garden',x,y,hurtUntil:Date.now()+1e9});const a={state:profile.state,profile,inLobby:false,socket:{id:name,emit(){}},viewRadius:1800,contacts:{old:1,future:Date.now()+100000},seenCreatures:new Set(['expired-mob'])};server.actors[name]=a;return a;}
 const a=actor('ExplorerOne',80000,75000),b=actor('ExplorerTwo',20000,20000),ore=(id,x,y,rarity=g.rarities[0])=>({id,x,y,size:18,hp:65,maxHp:150,rarity});
 const far=ore('damaged-history',10000,10000),local=ore('local',80200,75000),remote=ore('second-player',20200,20000),boss={...ore('distant-boss',90000,90000,g.rarities[7]),size:320,isBoss:true};g.ores=[far,local,remote,boss];
 world.contributions.set(far.id,new Map([[a.profile.id,85]]));world.contributions.set('removed-entity',new Map([[a.profile.id,1]]));world.squadCredits.set('removed-entity',new Map());
 world.drops=[{id:'existing-drop',x:10000,y:10000,createdAt:Date.now(),expiresAt:Date.now()+180000,claims:new Set([a.profile.id])}];
 const now=Date.now();world.maintainActiveAreas([a,b],now);assert.ok(!g.ores.includes(far));assert.equal(world.dormantOres.get(far.id).ore,far);assert.ok(g.ores.includes(remote),'another player keeps their own area loaded');assert.ok(g.ores.includes(boss),'boss is not despawned');assert.equal(world.drops.length,1);assert.equal(world.contributions.get(far.id).get(a.profile.id),85);assert.equal(world.contributions.has('removed-entity'),false);assert.equal(world.squadCredits.has('removed-entity'),false);assert.equal(a.seenCreatures.size,0);assert.ok(!('old' in a.contacts));assert.ok('future' in a.contacts);
 a.state.x=10000;a.state.y=10000;world.maintainActiveAreas([a,b],now+1001);assert.ok(g.ores.includes(far));assert.equal(far.hp,65);assert.equal(world.dormantOres.has(far.id),false);assert.equal(world.contributions.get(far.id).get(a.profile.id),85);
 const cave=server.worlds.cave,cg=cave.game,caveKey=12345;cg.cave.populated.add(caveKey);cave.dormantOres.set('cave-ore-'+caveKey,{ore:ore('cave-ore-'+caveKey,90000,90000),since:now-600001});cave.maintainActiveAreas([],now);assert.equal(cg.cave.populated.has(caveKey),false,'expired ordinary deposit can be generated again on revisit');
});

test('long exploration bounds inactive history and keeps spatial spawning non-overlapping',async t=>{
 const db=low(new Memory()),server=await createGameServer({storage:{db,flush:async()=>true,mode:'memory',close(){}}});t.after(()=>server.close());const world=server.worlds.garden,g=world.game,profile=server.store.create('LongExplorer').profile,a={state:profile.state,profile,inLobby:false,socket:{id:'explorer',emit(){}},viewRadius:1800};server.actors.explorer=a;Object.assign(a.state,{realm:'garden',x:80000,y:75000});g.ores=[];g.mobs=[];let now=Date.now();
 for(let n=0;n<90;n++){
  a.state.x=10000+(n%30)*2700;a.state.y=15000+Math.floor(n/30)*25000;world.maintainActiveAreas([a],now+=1001);world.spawnAround(a);
  assert.ok(g.ores.every(o=>o.isBoss || Math.hypot(o.x-a.state.x,o.y-a.state.y)<5000+o.size));assert.ok(world.dormantOres.size<=4000);
 }
 assert.ok(g.ores.length<800,'ordinary active ores do not grow with total explored distance');
 for(let i=0;i<g.ores.length;i++)for(let j=i+1;j<g.ores.length;j++)assert.ok(Math.hypot(g.ores[i].x-g.ores[j].x,g.ores[i].y-g.ores[j].y)>=g.ores[i].size+g.ores[j].size+69.99,'spatial neighborhood preserves the ore separation rule');
 const coins=a.state.coins;for(let n=0;n<4100;n++)world.dormantOres.set('overflow-'+n,{ore:{id:'overflow-'+n,x:5000,y:5000,size:18,hp:150,maxHp:150,rarity:g.rarities[0]},since:now});world.maintainActiveAreas([a],now+1001);assert.equal(world.dormantOres.size,4000);assert.equal(a.state.coins,coins,'cleanup never grants rewards');
});

test('ore snapshots retry until acknowledged, omit static payload afterward, and invalidate on HP/removal/epoch',{timeout:15000},async t=>{
 const db=low(new Memory()),server=await listen(await createGameServer({storage:{db,flush:async()=>true,mode:'memory',close(){}}}));t.after(()=>server.close());const s=await client(t,server,{auth:{oreCache:true}});
 assert.equal((await call(s,'accountRegister',{nickname:'OreCacheHero',password:'ore-cache-test-password',lobby:false})).ok,true);const a=server.actors[s.id],world=server.worlds.garden,g=world.game;Object.assign(a.state,{x:80000,y:75000,hurtUntil:Date.now()+1e9});
 g.ores=Array.from({length:100},(_,i)=>({id:'cache-ore-'+i,x:78000+(i%10)*450,y:73000+Math.floor(i/10)*450,size:18,hp:150,maxHp:150,rarity:g.rarities[0]}));
 const first=world.snapshot(a);assert.ok(first.ores.length>20);assert.ok(Array.isArray(world.snapshot(a).ores),'dropped first packet does not lose the world');
 s.emit('oreAck',{realm:'cave',epoch:a.movementEpoch,seq:first.oreSeq});await delay(30);assert.ok(Array.isArray(world.snapshot(a).ores),'wrong realm ack ignored');
 s.emit('oreAck',{realm:'garden',epoch:a.movementEpoch-1,seq:first.oreSeq});await delay(30);assert.ok(Array.isArray(world.snapshot(a).ores),'old scene ack ignored');
 s.emit('oreAck',{realm:'garden',epoch:a.movementEpoch,seq:first.oreSeq});await delay(30);const steady=world.snapshot(a);assert.equal(steady.ores,undefined);assert.ok(Buffer.byteLength(JSON.stringify(steady))<Buffer.byteLength(JSON.stringify(first))*.2,'stationary ore payload is not resent every frame');
 const ore=g.ores[50];world.damage(a,ore,10,false);const hit=world.snapshot(a);assert.ok(hit.oreSeq>first.oreSeq);assert.equal(hit.ores.find(o=>o.id===ore.id).hp,140);
 s.emit('oreAck',{realm:'garden',epoch:a.movementEpoch,seq:first.oreSeq});await delay(25);assert.ok(Array.isArray(world.snapshot(a).ores),'old ack cannot confirm a newer update');
 g.ores=[];const removed=world.snapshot(a);assert.deepEqual(removed.ores,[],'empty full list clears removed ores');a.oreAck=removed.oreSeq;a.state.x+=40;assert.equal(world.snapshot(a).ores,undefined);a.state.x+=500;assert.ok(Array.isArray(world.snapshot(a).ores),'moving into another spatial window refreshes the list');
 a.oreCacheEnabled=false;assert.ok(Array.isArray(world.snapshot(a).ores),'old clients retain full snapshots');
});

