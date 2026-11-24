const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../public/rooted-catalog'),E=require('../public/expansion'),A=require('../public/arcana-catalog'),atlas=require('../public/map-atlas');
async function setup(t,realm='jungle'){
  const low=require('lowdb'),Memory=require('lowdb/adapters/Memory');
  const s=await require('../server').createGameServer({env:{},storage:{db:low(new Memory()),mode:'memory',flush:async()=>true,close(){}}});t.after(()=>s.close());
  for(const w of Object.values(s.worlds)){w.nextSpawn=Infinity;w.game.ores=[];w.game.mobs=[];}
  const profile=s.store.create('RootedHero',{level:100,progressionVersion:3}).profile,a={profile,state:profile.state,name:profile.name,inLobby:false,socket:{id:'rooted-hero',emit(){}}};
  Object.assign(a.state,{realm,x:82000,y:75000,hp:1000,maxHp:1000});s.actors[a.socket.id]=a;return {s,a,w:s.worlds[realm]};
}
test('each new stationary species belongs to its own biome, spawns in every territory pool and has an egg at every rarity',()=>{
  for(const def of C.MOBS){assert.ok(E.MOBS.some(m=>m.kind===def.kind));for(let tier=0;tier<=9;tier++)assert.ok(atlas.pool(def.biome,tier).includes(def.kind));assert.ok(!atlas.pool('garden',0).includes(def.kind));const egg=A.EGGS.find(e=>e.kind===def.kind);assert.equal(egg.stationary,true);for(const rarity of E.RARITIES){assert.ok(E.accessory(egg.id,rarity));assert.equal(A.summonStats({size:30,maxHp:1000,damage:5,speed:0},egg,E.tier(rarity)).speed,0);}}
});
test('rooted natural mobs never wander, chase, dash or move under knockback and body collisions',async t=>{
  const {w,a}=await setup(t);for(const def of C.MOBS){const mob=w.game.createCreature(def.kind,w.game.rarities[7],82200,75000),home={x:mob.x,y:mob.y};assert.equal(mob.speed,0);mob.aggroUntil=Date.now()+12000;for(let n=0;n<20;n++){w.game.moveMob(mob,a.state,.1);w.game.bossStep(mob,a.state,.1);}w.game.moveEntity(mob,82400,75200,mob.size);assert.deepEqual({x:mob.x,y:mob.y},home);assert.equal(w.game.bossMobAbility(mob),null);}
  const m=w.game.createCreature('sporecap',w.game.rarities[0],a.state.x,a.state.y);w.game.mobs=[m];require('../world-physics').resolveWorldCollisions(w,[a]);assert.equal(m.x,82000);assert.equal(m.y,75000);assert.ok(Math.hypot(a.state.x-m.x,a.state.y-m.y)>m.size*.7);
});
test('mushroom spores poison only exposed nearby players; damage and purple state clear after expiry, death, sanctuary or realm exit',async t=>{
  const {w,a}=await setup(t),m=w.game.createCreature('sporecap',w.game.rarities[0],82150,75000);w.game.mobs=[m];w.rooted.tick(1.3,[a]);assert.ok(m.rootedCast);w.rooted.tick(.8,[a]);assert.equal(a.state.poisoned,true);assert.equal(w.snapshot(a).poisoned,true);const hp=a.state.hp;w.rooted.tick(.5,[a]);assert.ok(a.state.hp<hp);assert.equal(m.x,82150);
  w.game.mobs=[];w.rooted.tick(5,[a]);assert.equal(a.state.poisoned,false);w.rooted.infect(a,m);a.state.dead=true;w.rooted.tick(.1,[a]);assert.equal(a.state.poisoned,false);a.state.dead=false;w.rooted.infect(a,m);w.rooted.tick(.1,[]);assert.equal(a.state.poisoned,false);
  Object.assign(a.state,atlas.spawn('jungle'));w.rooted.infect(a,m);assert.equal(w.rooted.poison.size,0);
});
test('dunes, coral and frost crystals telegraph bounded projectile attacks without changing position',async t=>{
  const {w,a}=await setup(t,'desert');for(const def of C.MOBS.filter(m=>!m.poison)){const m=w.game.createCreature(def.kind,w.game.rarities[0],82150,75000);w.game.mobs=[m];w.rooted.tick(1.3,[a]);assert.ok(m.rootedCast);w.rooted.tick(.8,[a]);assert.ok(w.game.projectiles.some(p=>p.owner===m.id));assert.equal(m.x,82150);assert.equal(m.y,75000);w.game.projectiles=[];}assert.ok(w.rooted.effects.length<=64);
});
test('rooted eggs are stationary turrets that damage mobs and ores, earn normal owner credit, block hostile shots and cannot be mounted',async t=>{
  const {w,a}=await setup(t);const egg=E.accessory('eggSporecap','Comum');E.add(a.state,egg);E.equip(a.state,0,{accessoryId:egg.accessoryId,rarity:egg.rarity});w.arcana.tick(.1);const ally=w.arcana.allies[0];assert.ok(ally.stationary);assert.equal(ally.speed,0);assert.equal(w.arcana.allies.length,2);const home={x:ally.x,y:ally.y};
  const target=w.game.createCreature('frog',w.game.rarities[0],ally.x+400,ally.y);target.hp=target.maxHp=1e9;w.game.mobs=[target];w.rooted.tick(.1,[a]);assert.ok(w.rooted.shots.length);for(let n=0;n<10;n++)w.rooted.tick(.1,[a]);assert.ok(target.hp<target.maxHp);assert.ok(w.contributions.get(target.id).has(a.profile.id));assert.deepEqual({x:ally.x,y:ally.y},home);
  w.game.mobs=[];w.rooted.shots=[];const ore={id:'rooted-ore',x:ally.x+400,y:ally.y,size:30,hp:1e9,maxHp:1e9,rarity:w.game.rarities[0]};w.game.ores=[ore];for(let n=0;n<20;n++)w.rooted.tick(.1,[a]);assert.ok(ore.hp<ore.maxHp);assert.ok(w.arcana.projectileTargets().includes(ally));ally.rarity='SUPER';assert.throws(()=>w.arcana.summonAction(a,{action:'mount',id:ally.id}));
  a.state.summonsEnabled=false;w.arcana.tick(.1);w.rooted.tick(.1,[a]);assert.equal(w.rooted.shots.length,0);
});
test('killing a rooted mob grants its component, egg drop and gallery entry through normal loot qualification',async t=>{
  const {w,a}=await setup(t);w.lootRandom=()=>0;w.accessoryRandom=()=>.99;const m=w.game.createCreature('sporecap',w.game.rarities[0],82150,75000);w.game.mobs=[m];w.damage(a,m,m.maxHp,true);assert.ok(w.drops.some(d=>d.item.kind==='sporecap'&&d.item.type==='component'));assert.ok(w.drops.some(d=>d.item.accessoryId==='eggSporecap'));assert.equal(a.state.journal.killTiers['sporecap:Comum'],1);
});
