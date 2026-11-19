const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),vm=require('node:vm'),low=require('lowdb'),Memory=require('lowdb/adapters/Memory');
const atlas=require('../public/map-atlas'),E=require('../public/expansion'),{createGameServer}=require('../server');
function reachable(m,start){const seen=new Set([start]),q=[start];for(let n=0;n<q.length;n++){const i=q[n],x=i%m.cols,y=Math.floor(i/m.cols);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,j=yy*m.cols+xx;if(xx>=0&&yy>=0&&xx<m.cols&&yy<m.rows&&m.open[j]&&!seen.has(j)){seen.add(j);q.push(j);}}}return seen;}
async function server(t){const s=await createGameServer({env:{},storage:{db:low(new Memory()),mode:'memory',flush:async()=>true,close(){}}});t.after(()=>s.close());return s;}
test('six original maps are deterministic, expanded, connected, have every tier and make white Absolut the largest territory',()=>{
 const hashes=new Set();for(const realm of Object.keys(atlas.LAYOUTS)){
  const m=atlas.build(realm),spawn=atlas.spawn(realm),counts=Array(9).fill(0);assert.equal(m.width,realm==='cave'?300000:150000);assert.equal(m.height,150000);assert.deepEqual(E.mapFor(realm).spawn,spawn);
  for(let n=0;n<m.open.length;n++)if(m.open[n])counts[m.tiers[n]]++;assert.ok(counts.every(n=>n>0),realm+' has all tiers');assert.ok(counts[8]>Math.max(...counts.slice(0,8))*3,realm+' white area dominates');assert.equal(atlas.COLORS[8],'#f4f3ed');
  if(realm!=='cave'){const visited=reachable(m,Math.floor(spawn.y/m.tile)*m.cols+Math.floor(spawn.x/m.tile));assert.equal(visited.size,counts.reduce((a,b)=>a+b),realm+' has no unreachable islands');for(const p of [...m.points,...E.portalsFor(realm)])assert.equal(atlas.blocked(realm,p.x,p.y,20),false,realm+' landmark or portal reachable');}
  hashes.add(crypto.createHash('sha256').update(m.open).update(m.tiers).digest('hex'));
 }assert.equal(hashes.size,6);
});
test('browser and server generate exactly the same terrain instead of random per-player maps',()=>{
 const context=vm.createContext({});vm.runInContext(fs.readFileSync(require.resolve('../public/map-atlas'),'utf8'),context);for(const realm of Object.keys(atlas.LAYOUTS)){const client=context.MAP_ATLAS.build(realm),host=atlas.build(realm);assert.deepEqual(Buffer.from(client.open),Buffer.from(host.open));assert.deepEqual(Buffer.from(client.tiers),Buffer.from(host.tiers));}
});
test('territory rarity rolls are exact; Absolut allows only 79% Absolut, 20% Super and 1% Quantium, with no crafted/admin tiers',()=>{
 for(let tier=0;tier<=8;tier++){const counts={};for(let n=0;n<10000;n++){const result=atlas.rollTier(tier,()=>(n+.5)/10000);counts[result]=(counts[result]||0)+1;assert.ok(result<=9);}
  if(tier===8)assert.deepEqual(counts,{7:2000,8:7900,9:100});else if(tier===0)assert.deepEqual(counts,{0:10000});else assert.deepEqual(counts,{[tier-1]:1600,[tier]:8400});
 }for(const realm of Object.keys(atlas.LAYOUTS)){const p=atlas.spawn(realm);assert.equal(atlas.roll(realm,p.x,p.y,()=>0),-1,'no mobs/ores in safe spawn');}
 assert.notDeepEqual(atlas.pool('garden',0),atlas.pool('garden',6));assert.notDeepEqual(atlas.pool('desert',0),atlas.pool('desert',4));
});
test('every biome actually spawns creatures in every territory, with species, rarity, clearance and ore separation matching the shared atlas',{timeout:30000},async t=>{
 const s=await server(t);
 for(const realm of Object.keys(atlas.LAYOUTS)){
  const world=s.worlds[realm],g=world.game,map=atlas.build(realm),profile=s.store.create('Atlas '+realm).profile,actor={profile,state:profile.state,inLobby:false,socket:{id:'atlas-'+realm,emit(){}}};s.actors[actor.socket.id]=actor;
  for(let tier=0;tier<=8;tier++){
   let p=tier<8?map.points[tier]:{x:map.width*.77,y:map.height*.72};if(tier===8&&realm!=='cave'){const candidates=[];for(let y=1;y<map.rows-1;y++)for(let x=1;x<map.cols-1;x++){const wx=(x+.5)*map.tile,wy=(y+.5)*map.tile;if(map.tiers[y*map.cols+x]===8&&map.open[y*map.cols+x]&&!atlas.blocked(realm,wx,wy,4000))candidates.push({x:wx,y:wy});}candidates.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));assert.ok(candidates.length);p=candidates[0];}if(realm==='cave'){let found=false;for(let d=0;d<20&&!found;d++)for(let x=-d;x<=d&&!found;x++)for(const y of [-d,d]){const px=Math.floor(p.x/500)+x,py=Math.floor(p.y/500)+y;if(g.tileOpen(px,py)){p={x:(px+.5)*500,y:(py+.5)*500};found=true;break;}}}
   Object.assign(actor.state,{realm,x:p.x,y:p.y,hp:100000});g.mobs=[];g.ores=[];world.dormantOres.clear();world.dormantMobs.clear();
   for(let n=0;n<4;n++)world.spawnAround(actor);
   assert.ok(g.mobs.length>=2,realm+' tier '+tier+' really spawns mobs');
   if(realm!=='cave'){assert.ok(g.ores.length>0,realm+' tier '+tier+' really spawns ore');if(tier===8)assert.ok(g.ores.some(o=>o.rarity.name==='ABSOLUT'),realm+' white territory contains a real Absolut deposit');}
   for(const mob of g.mobs){const region=atlas.at(realm,mob.x,mob.y),index=E.tier(mob.rarity.name);assert.ok(atlas.pool(realm,region.tier).includes(mob.kind)||mob.kind==='invertedBeetle');assert.ok(region.tier===8?[7,8,9].includes(index):[region.tier,Math.max(0,region.tier-1)].includes(index));assert.equal(region.safe,false);if(realm!=='cave')assert.equal(atlas.blocked(realm,mob.x,mob.y,mob.size*.65),false);}
   if(realm!=='cave')for(let i=0;i<g.ores.length;i++){const ore=g.ores[i];assert.equal(atlas.blocked(realm,ore.x,ore.y,ore.size),false);assert.ok(Math.hypot(ore.x-p.x,ore.y-p.y)>=ore.size+350);for(let j=0;j<i;j++)assert.ok(Math.hypot(ore.x-g.ores[j].x,ore.y-g.ores[j].y)>=ore.size+g.ores[j].size+69.9);}
  }delete s.actors[actor.socket.id];
 }
});
test('the new surface barriers stop player movement and attacks; center and distant portals remain usable',async t=>{
 const s=await server(t),g=s.worlds.garden.game,m=atlas.build('garden');let edge;
 for(let y=2;y<m.rows-2&&!edge;y++)for(let x=2;x<m.cols-2;x++)if(m.open[y*m.cols+x]&&!m.open[y*m.cols+x+1]){edge={x:(x+1)*m.tile-60,y:(y+.5)*m.tile};break;}
 const body={...edge};g.moveEntity(body,edge.x+140,edge.y,20);assert.equal(body.x,edge.x);assert.equal(g.lineClear(edge.x,edge.y,edge.x+140,edge.y),false);const p=E.mapFor('garden').spawn;assert.equal(g.zone(p.x,p.y),'P');assert.ok(E.portalsFor('garden').every(q=>Math.hypot(q.x-p.x,q.y-p.y)>40000));
});
test('sleeping Super+ mobs preserve damage and contribution, wake for any nearby player, and cannot accumulate without bounds',async t=>{
 const s=await server(t),world=s.worlds.garden,g=world.game,p=s.store.create('Atlas sleeper').profile,a={profile:p,state:p.state,inLobby:false,socket:{id:'sleeper',emit(){}}};s.actors.sleeper=a;Object.assign(p.state,{x:75000,y:75000,realm:'garden'});const mob=g.createCreature('bee',g.rarities[8],120000,110000);mob.hp-=77;g.mobs=[mob];world.contributions.set(mob.id,new Map([[p.id,77]]));let now=Date.now();world.maintainActiveAreas([a],now);assert.equal(g.mobs.length,0);assert.equal(world.dormantMobs.get(mob.id).mob.hp,mob.maxHp-77);assert.equal(world.contributions.get(mob.id).get(p.id),77);p.state.x=mob.x;p.state.y=mob.y;world.maintainActiveAreas([a],now+=1001);assert.ok(g.mobs.includes(mob));assert.equal(world.dormantMobs.size,0);
 for(let n=0;n<400;n++)world.dormantMobs.set('sleep-'+n,{mob:{id:'sleep-'+n,x:10000,y:10000,size:20,hp:1},since:now});world.maintainActiveAreas([a],now+1001);assert.equal(world.dormantMobs.size,256);
});
