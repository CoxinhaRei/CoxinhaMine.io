// Authoritative, bounded lifetime equipment attacks. Clients only draw snapshots.
const crypto=require('crypto');
const {oreIndex,moveOre,segmentHitsCircle}=require('./world-physics');
class EquipmentEffects{
 constructor(world){this.world=world;this.active=[];}
 launch(actor,spec,damage){
  const angle=actor.state.aimAngle||0,e={id:crypto.randomUUID(),actor,owner:actor.socket.id,kind:spec.kind,color:spec.color,name:spec.name,x:actor.state.x,y:actor.state.y,angle,vx:Math.cos(angle)*spec.speed,vy:Math.sin(angle)*spec.speed,radius:spec.radius,life:spec.duration,maxLife:spec.duration,age:0,damage,hit:new Set()};
  this.active.push(e);this.world.emit('abilityEffect',this.packet(e));return e;
 }
 packet(e){const {actor,hit,damage,...safe}=e;return {...safe,maxLife:e.life};}
 snapshot(actor){return this.active.filter(e=>Math.hypot(e.x-actor.state.x,e.y-actor.state.y)<(actor.viewRadius||3000)+e.radius+400).map(e=>this.packet(e));}
 tick(dt,live){
  const w=this.world,g=w.game;
  for(const e of this.active){
   if(!live.includes(e.actor)||e.actor.state.dead){e.life=0;}
   else{
    const used=Math.min(Math.max(0,dt),e.life),old={x:e.x,y:e.y};
    if(e.kind==='voidTrident'){
     const x=e.x+e.vx*used,y=e.y+e.vy*used;
     // Sweep to the first wall; neither very fast movement nor the large model
     // can damage creatures on the other side of a wall.
     const steps=Math.max(1,Math.ceil(Math.hypot(x-e.x,y-e.y)/40));
     for(let n=0;n<steps;n++){const nx=e.x+e.vx*used/steps,ny=e.y+e.vy*used/steps;if(!g.lineClear(e.x,e.y,nx,ny)){e.life=0;break;}e.x=nx;e.y=ny;}
     for(const m of [...g.mobs]){if(e.hit.has(m.id)||!segmentHitsCircle(old.x,old.y,e.x,e.y,m.x,m.y,m.size*.8+e.radius))continue;const p=g.surface(m,e);if(!g.lineClear(e.x,e.y,p.x,p.y))continue;e.hit.add(m.id);w.arcana.hit(e.actor,m,e.damage,true,e,'#c7a6ff');}
    }else{
     const radius=e.kind==='solarSystem'?e.radius*Math.min(1,.15+(e.age+used)/3):e.radius;
     const index=e.kind==='darkZone'?oreIndex(w):null;
     for(const ore of [...g.ores]){
      const p=g.surface(ore,e);if(Math.hypot(p.x-e.x,p.y-e.y)>radius||!g.lineClear(e.x,e.y,p.x,p.y))continue;
      w.arcana.hit(e.actor,ore,e.damage*used,false,e,e.kind==='darkZone'?'#a47aff':'#ffbb54');
      // A subset of deposits is movable; the enormous Quantium/Aleph stay put.
      if(index&&ore.hp>0&&ore.size<=1500&&[...String(ore.id)].reduce((n,c)=>n+c.charCodeAt(0),0)%2===0){
       const d=Math.hypot(ore.x-e.x,ore.y-e.y),step=Math.min(Math.max(0,d-ore.size-50),220*used/(1+ore.size/400));
       if(step>0){const entry=[...index.query(ore.x,ore.y,ore.size)].find(b=>b.id===ore.id);if(entry)moveOre(w,entry,ore.x+(e.x-ore.x)/d*step,ore.y+(e.y-ore.y)/d*step);}
      }
     }
    }
    e.age+=used;e.life-=used;
   }
   if(e.life<=0)w.emit('abilityEffect',{id:e.id,kind:'equipmentEnd',x:e.x,y:e.y,radius:e.radius});
  }
  this.active=this.active.filter(e=>e.life>0);
 }
}
module.exports=EquipmentEffects;
