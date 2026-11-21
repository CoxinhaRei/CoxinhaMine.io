const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const storage=require('../storage'),fixture=require('./redis-fixture'),{createGameServer}=require('../server'),low=require('lowdb'),Memory=require('lowdb/adapters/Memory');
function dir(t){const root=path.resolve(os.tmpdir()),p=fs.mkdtempSync(path.join(root,'coxinha-sessions-'));t.after(()=>{if(!path.resolve(p).startsWith(root+path.sep))throw Error('Unsafe cleanup');fs.rmSync(p,{recursive:true,force:true});});return p;}
async function open(t,redis){const s=await storage({...redis.env,DATA_DIR:dir(t)});t.after(()=>s.close());return s;}
const key='coxinha:database:v2';
test('an orphan lease is not renewed after a failed save/release; it expires and another server restores the latest committed inventory',async t=>{
 const r=await fixture(t),a=await open(t,r);await a.claim('hero');a.db.set(['profiles','hero'],{id:'hero',state:{level:90,coins:700,inventory:[{id:'rare-drop',amount:33}]}}).write();assert.equal(await a.flush(),true);const b=await open(t,r),lease=key+':session:hero';
 a.db.set(['profiles','hero','state','coins'],701).write();const expiresAt=Date.now()+2000;r.expires.set(lease,expiresAt);for(let i=0;i<4;i++)assert.deepEqual(await a.renew([]),[]);assert.equal(r.expires.get(lease),expiresAt,'pending save is no reason to indefinitely renew a disconnected session');await assert.rejects(()=>b.claim('hero'),e=>e.code==='SESSION_BUSY');
 r.expires.set(lease,Date.now()-1);await b.claim('hero');assert.equal(b.db.get(['profiles','hero','state','coins']).value(),700);assert.equal(b.db.get(['profiles','hero','state','inventory',0,'amount']).value(),33);b.db.set(['profiles','hero','state','coins'],900).write();assert.equal(await b.flush(),true);assert.equal(await a.flush(),false);await a.refresh();assert.equal(JSON.parse(r.values.get(key)).profiles.hero.state.coins,900);
});
test('only active owners renew their leases; an expired foreign lease can never be renewed or stolen',async t=>{
 const r=await fixture(t),a=await open(t,r),b=await open(t,r);await a.claim('active');await a.claim('orphan');const active=key+':session:active',orphan=key+':session:orphan';const short=Date.now()+1000;r.expires.set(active,short);r.expires.set(orphan,short);assert.deepEqual(await a.renew(['active']),[]);assert.ok(r.expires.get(active)>short+50000);assert.equal(r.expires.get(orphan),short);
 r.expires.set(active,Date.now()-1);await b.claim('active');assert.deepEqual(await a.renew(['active']),['active']);await assert.rejects(()=>a.claim('active'),e=>e.code==='SESSION_BUSY');assert.deepEqual(await a.renew(),[],'without evidence of a live player, no lease is renewed');
});
test('server lease maintenance supplies connected account ids including menu users, excluding guests, departed and disconnected users',async t=>{
 let ids=null;const s=await createGameServer({env:{},storage:{db:low(new Memory()),mode:'memory',flush:async()=>true,renew:async list=>{ids=list;return [];},close(){}}});t.after(()=>s.close());const profile=name=>s.store.create(name).profile;
 const online=profile('ActivePlayer'),lobby=profile('MenuPlayer'),gone=profile('ClosedPlayer'),guest=s.store.createGuest('Guest').profile,departed=profile('AlreadyDeparted');
 for(const [id,p,connected,inLobby] of [['online',online,true,false],['lobby',lobby,true,true],['gone',gone,false,false],['guest',guest,true,false]])s.actors[id]={profile:p,state:p.state,socket:{id,connected,emit(){}},inLobby};
 await s.maintainSessions();assert.deepEqual(new Set(ids),new Set([online.id,lobby.id]));assert.ok(!ids.includes(departed.id));for(const id of Object.keys(s.actors))delete s.actors[id];await s.maintainSessions();assert.deepEqual(ids,[]);
});
