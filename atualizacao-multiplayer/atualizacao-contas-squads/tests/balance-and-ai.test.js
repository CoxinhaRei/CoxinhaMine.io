const {test}=require('node:test');const assert=require('node:assert/strict');const createRuntime=require('../game-runtime');
test('walking, retaliation, boss summons and abundant edge Ultra ores',()=>{
  const g=createRuntime('garden',()=>false),player=g.fresh();Object.assign(player,{x:60000,y:50000,hp:100000,dead:false});
  for(const kind of ['ladybug','bee','ant','beetle','centipede']){
    const mob=g.createCreature(kind,g.rarities[0],60400,50000);mob.wanderAngle=Math.PI/2;mob.wanderTimer=10;mob.angle=Math.PI/2;g.mobs=[mob];
    g.moveMob(mob,player,.1);g.moveMob(mob,player,.1);assert.ok(mob.walkPhase>0);assert.ok(Math.abs(mob.angle-Math.PI/2)<.01);
    mob.aggroUntil=Date.now()+12000;const before=Math.hypot(mob.x-player.x,mob.y-player.y);for(let n=0;n<10;n++)g.moveMob(mob,player,.1);assert.ok(Math.hypot(mob.x-player.x,mob.y-player.y)<before);
  }
  const boss=g.createCreature('spider',g.rarities[7],61400,50000);boss.specialCooldown=0;g.mobs=[boss];g.ores=[];
  g.bossStep(boss,player,.1);assert.ok(boss.bossAction);assert.equal(g.mobs.length,1);g.bossStep(boss,player,1.4);
  assert.equal(g.mobs.length,4);for(const helper of g.mobs.slice(1)){assert.equal(helper.rarity.name,'Mítico');assert.ok(helper.noRewards);assert.equal(g.bossMobAbility(helper),null);}
  player.x=5000;g.ores=[];g.mobs=[];for(let n=0;n<150;n++)g.refill(player);
  assert.ok(g.ores.length>80);assert.ok(g.ores.filter(o=>o.rarity.name==='ULTRA').length/g.ores.length>.4,'Ultra ores are common at the map edges');
});
