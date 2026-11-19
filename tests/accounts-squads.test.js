const {test}=require('node:test');
const assert=require('node:assert/strict');
const {io:connect}=require('../node_modules/socket.io/client-dist/socket.io.js');
const low=require('lowdb'),Memory=require('lowdb/adapters/Memory');
const {createGameServer}=require('../server');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const call=(socket,event,data)=>new Promise((resolve,reject)=>socket.timeout(5000).emit(event,data,(error,result)=>error ? reject(error) : resolve(result)));
async function until(check){for(let i=0;i<200;i++){if(check())return;await delay(15);}throw Error('Timed out');}
test('accounts preserve guest progress, protect passwords, rotate sessions and restore on another device; squads reward once',{timeout:30000},async t=>{
  const db=low(new Memory()),storage={db,flush:async()=>{},mode:'memory',close(){}};
  const server=await createGameServer({storage});await new Promise(r=>server.http.listen(0,'127.0.0.1',r));
  const sockets=[],url='http://127.0.0.1:'+server.http.address().port;
  t.after(async()=>{sockets.forEach(s=>s.disconnect());await server.close();});
  for(const world of Object.values(server.worlds)){world.nextSpawn=Infinity;world.game.ores=[];world.game.mobs=[];}
  async function client(name,lobby=true){const s=connect(url,{transports:['websocket'],reconnection:false});sockets.push(s);s.on('profileReady',p=>s.profile=p);s.loots=[];s.on('lootResult',l=>s.loots.push(l));await new Promise(r=>s.on('connect',r));if(name){const seed=server.store.create(name,{level:231,coins:12000,xp:0,progressionVersion:3,equipment:{pickaxe:'Diamante',weapon:{name:'Solar'}}});s.legacyCredentials=seed.credentials;if(name!=='OldGuest'){const account=await server.accounts.register({nickname:name,password:'fixture-password',credentials:seed.credentials},null,'fixture:'+name);assert.equal((await call(s,'joinGame',{credentials:account.credentials,lobby})).ok,true);}}return s;}
  const a=await client('OldGuest'),oldId=a.legacyCredentials.id,oldToken=a.legacyCredentials.token;
  const registered=await call(a,'accountRegister',{nickname:'CoxinhaTeste',password:'local-test-123',credentials:a.legacyCredentials,lobby:true});assert.equal(registered.ok,true,registered.message);
  const firstActor=server.actors[a.id];assert.equal(firstActor.inLobby,true);a.emit('move',{x:81000,y:75000});await delay(70);assert.equal(firstActor.state.x,75000,'lobby cannot move into combat');
  assert.equal(a.profile.credentials.id,oldId);assert.equal(a.profile.state.level,231);assert.equal(a.profile.state.coins,12000);assert.equal(a.profile.account.username,'CoxinhaTeste');assert.notEqual(a.profile.credentials.token,oldToken);
  const account=db.get('accounts').values().value()[0];assert.equal(account.password.algorithm,'scrypt');assert.equal(account.password.hash.length,128);assert.equal(account.password.salt.length,32);assert.ok(!JSON.stringify(db.getState()).includes('local-test-123'));assert.ok(!JSON.stringify(a.profile).includes('password'));
  const b=await client();let result=await call(b,'accountLogin',{nickname:'coxinhateste',password:'incorrect-password',lobby:true});assert.equal(result.ok,false);assert.match(result.message,/Nick ou senha/);
  const beforeLogin=a.profile.credentials;
  result=await call(b,'accountLogin',{nickname:'COXINHATESTE',password:'local-test-123',lobby:true,realm:'cave'});assert.equal(result.ok,true,result.message);assert.equal(b.profile.credentials.id,oldId);assert.equal(b.profile.state.level,231);assert.equal(b.profile.realm,'cave');assert.notEqual(b.profile.credentials.token,beforeLogin.token);await until(()=>!a.connected);
  assert.equal(server.store.verifyCredentials(beforeLogin),null,'old device token revoked');
  const c=await client('Friend'),d=await client('FarFriend'),e=await client('OtherMap'),f=await client('Extra');
  result=await call(c,'accountRegister',{nickname:'coxinhateste',password:'another-password',lobby:true});assert.equal(result.ok,false,'case insensitive duplicate account');
  let created=await call(b,'squadAction',{action:'create'});assert.equal(created.ok,true);const code=created.state.code;
  for(const s of [c,d,e]){result=await call(s,'squadAction',{action:'join',code:code.toLowerCase()});assert.equal(result.ok,true);}
  result=await call(f,'squadAction',{action:'join',code});assert.equal(result.ok,false);assert.match(result.message,/quatro/);
  await delay(210);result=await call(c,'squadAction',{action:'kick',profileId:b.profile.credentials.id});assert.equal(result.ok,false,'only leader manages members');
  for(const s of [b,c,d,e])assert.equal((await call(s,'joinGame',{name:s.profile.state.name,lobby:false,realm:s===e ? 'cave' : 'garden'})).ok,true);
  assert.ok(Math.abs(server.actors[e.id].state.x-750)<70,'menu cave spawn');assert.ok(Math.abs(server.actors[b.id].state.x-75000)<120,'garden central spawn with physical separation');
  const world=server.worlds.garden,g=world.game;
  const actorB=server.actors[b.id],actorC=server.actors[c.id],actorD=server.actors[d.id];
  for(const actor of [actorB,actorC]){actor.state.x=81000;actor.state.y=75000;actor.state.hurtUntil=Date.now()+100000;}
  actorD.state.x=90000;actorD.state.y=75000;
  const ore={id:'squad-ore',x:81300,y:75000,size:100,hp:1000,maxHp:1000,rarity:g.rarities[7]};g.ores.push(ore);
  const start=new Map([b,c,d,e].map(s=>[s.id,{coins:server.actors[s.id].state.coins,mined:server.actors[s.id].state.journal.mined}]));
  world.damage(actorB,ore,30,false);world.damage(actorC,ore,20,false);
  assert.equal(world.snapshot(actorC).squadContribution[ore.id],.05,'group damage sums to threshold');
  world.damage(server.actors[f.id],ore,950,false);
  await until(()=>c.loots.length===1 && b.loots.length===1);
  const firstDrop=world.drops.find(d=>d.item.type==='material');assert.ok(firstDrop);assert.equal(actorB.state.inventory.filter(i=>i.type==='material').length,0,'material is on the ground before pickup');
  firstDrop.createdAt-=1000;for(const actor of [actorB,actorC]){actor.state.x=firstDrop.x;actor.state.y=firstDrop.y;world.collectDrops(actor);world.collectDrops(actor);actor.state.x=81000;actor.state.y=75000;}
  const normalCoins=Math.round(5*Math.pow(1.8,7));
  for(const s of [b,c]){const state=server.actors[s.id].state;assert.equal(state.coins-start.get(s.id).coins,normalCoins,'one normal payout, not doubled');assert.equal(state.journal.mined-start.get(s.id).mined,1);assert.equal(s.loots.length,1);assert.equal(s.loots[0].shared,true);assert.equal(state.inventory.find(i=>i.type==='material' && i.oreRarity==='SUPER').amount,1);}
  for(const s of [d,e])assert.equal(server.actors[s.id].state.coins,start.get(s.id).coins,'far/other-map members excluded');
  const second={...ore,id:'own-and-group',hp:1000};g.ores.push(second);world.damage(actorB,second,1000,false);await until(()=>b.loots.length===2);assert.equal(actorB.state.coins-start.get(b.id).coins,normalCoins*2,'personal and squad qualification never duplicate');
  const late={...ore,id:'late-join',hp:1000};g.ores.push(late);world.damage(actorB,late,50,false);
  await delay(210);assert.equal((await call(b,'squadAction',{action:'kick',profileId:d.profile.credentials.id})).ok,true);await delay(210);assert.equal((await call(f,'squadAction',{action:'join',code})).ok,true);server.actors[f.id].inLobby=false;server.actors[f.id].state.x=81000;server.actors[f.id].state.y=75000;
  const fCoins=server.actors[f.id].state.coins;world.damage(actorB,late,950,false);assert.equal(server.actors[f.id].state.coins-fCoins,normalCoins,'late member earns only damage while member (95% here)');
  const creature=g.createCreature('spider',g.rarities[5],81300,75000);creature.noRewards=true;creature.summoned=true;g.mobs.push(creature);const before=actorC.state.coins;world.damage(actorB,creature,creature.hp,true);assert.equal(actorC.state.coins,before,'summons do not reward squad');
  await delay(210);assert.equal((await call(b,'squadAction',{action:'kick',profileId:f.profile.credentials.id})).ok,true);
  const retro={...ore,id:'no-retroactive-credit',hp:1000};g.ores.push(retro);world.damage(actorB,retro,50,false);
  await delay(210);assert.equal((await call(f,'squadAction',{action:'join',code})).ok,true);const beforeRetro=server.actors[f.id].state.coins;world.damage(actorD,retro,950,false);assert.equal(server.actors[f.id].state.coins,beforeRetro,'joining after the group damage grants no retroactive credit');
  for(const mode of ['dead','inLobby']){const target={...ore,id:'exclude-'+mode,hp:1000};g.ores.push(target);const beforeExcluded=actorC.state.coins;if(mode==='dead')actorC.state.dead=true;else actorC.inLobby=true;world.damage(actorB,target,1000,false);assert.equal(actorC.state.coins,beforeExcluded,'inactive squad member gets no shared loot');actorC.state.dead=false;actorC.inLobby=false;}
  await delay(210);assert.equal((await call(b,'squadAction',{action:'leave'})).ok,true);assert.equal(server.squads.groupFor(c.profile.credentials.id).leaderId,c.profile.credentials.id,'leader transfers on leaving');
  const currentToken=b.profile.credentials;assert.equal((await call(b,'accountLogout',{})).ok,true);assert.equal(server.store.verifyCredentials(currentToken),null);assert.equal(server.actors[b.id],undefined);
  const again=await client();assert.equal((await call(again,'accountLogin',{nickname:'CoxinhaTeste',password:'local-test-123',lobby:true})).ok,true);assert.equal(again.profile.credentials.id,oldId);assert.equal(again.profile.state.coins,actorB.state.coins);
  const accountsAfterRestart=require('../accounts')(db,server.store);assert.equal((await accountsAfterRestart.login({nickname:'CoxinhaTeste',password:'local-test-123'},'another-ip')).profile.id,oldId,'account hash survives recreating service');
});
