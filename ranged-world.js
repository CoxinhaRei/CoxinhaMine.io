const crypto=require('node:crypto'),R=require('./public/ranged-catalog'),C=require('./public/game-catalog');
const {segmentCircleEntry}=require('./world-physics');
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
class RangedWorld{
 constructor(world){this.world=world;this.clock=0;this.shots=[];this.fields=[];this.drones=[];}
 removeOwner(actor){for(const key of ['shots','fields','drones'])this[key]=this[key].filter(e=>e.actor!==actor);}
 allowed(actor){return actor&&!actor.inLobby&&!actor.state.dead&&actor.state.realm===this.world.realm&&!this.world.safe(actor.state);}
 gear(actor){return R.resolve(actor.state.equipment?.weapon);}
 damage(actor,base){const s=actor.state,u=this.world.game.utility(s);let n=base*(1+(s.talentRanks?.damage||0)*.12)*(1+(u.damage||0));if(Math.random()<(s.talentRanks?.crit||0)*.03)n*=2;return n;}
 shot(actor,w,angle,options={}){if(this.shots.length>=384)return false;const speed=options.speed||w.speed,p={id:crypto.randomUUID(),actor,owner:actor.socket.id,x:actor.state.x,y:actor.state.y,ox:actor.state.x,oy:actor.state.y,angle,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,speed,r:options.r||w.projectileSize,range:w.range,life:8,damage:this.damage(actor,w.damage*(options.mult||1)),weapon:w.rangedId,color:w.color,model:w.model,homing:!!w.homing,returning:!!w.returning,leg:0,hit:new Set(),...options};this.shots.push(p);return true;}
 fire(actor,data={}){if(!this.allowed(actor)||actor.state.selectedSlot!==0)return false;const w=this.gear(actor);if(!w)return false;const now=Date.now(),s=actor.state;if(now<(actor.nextRanged||0))return false;const angle=Number.isFinite(data.angle)?Math.atan2(Math.sin(data.angle),Math.cos(data.angle)):s.aimAngle||0;const u=this.world.game.utility(s),delay=Math.max(.08,w.cooldown*(1-(s.talentRanks?.haste||0)*.035)*(1-(u.haste||0)*.5));if(!this.shot(actor,w,angle))return false;actor.nextRanged=now+delay*1000;s.attackUntil=now+180;s.aimAngle=angle;return true;}
 field(actor,w,kind,options={}){if(this.fields.length>=96)return;const g=w.growth,angle=actor.state.aimAngle||0,reach=Math.min(w.range,700+g*100),center={x:actor.state.x+Math.cos(angle)*reach,y:actor.state.y+Math.sin(angle)*reach};if(!this.world.game.lineClear(actor.state.x,actor.state.y,center.x,center.y)){center.x=actor.state.x;center.y=actor.state.y;}const f={id:crypto.randomUUID(),actor,owner:actor.socket.id,kind,x:center.x,y:center.y,radius:220*g,life:6,age:0,damage:this.damage(actor,w.damage),color:w.color,weapon:w.rangedId,...options};this.fields.push(f);return f;}
 ability(actor,key){if(!this.allowed(actor)||actor.state.selectedSlot!==0)return false;const w=this.gear(actor),spec=w&&R.skill(w,key);if(!spec)return false;const s=actor.state,now=Date.now(),slot=key==='z'?'rangedZ':'rangedX';s.abilityReadyAt||={};if(now<(s.abilityReadyAt[slot]||0))return false;const angle=s.aimAngle||0,g=w.growth;let used=true;
  const fan=(count,spread,extra={})=>{for(let n=0;n<count;n++)this.shot(actor,w,angle+(n-(count-1)/2)*spread,extra);};
  if(key==='z'){
   if(w.rangedId==='thornbow')fan(7,.11,{mult:1.1});
   else if(w.rangedId==='glacial')fan(3,.17,{chill:3,mult:1.4});
   else if(w.rangedId==='firebook')this.shot(actor,w,angle,{r:35*g,mult:4,blast:180*g});
   else if(w.rangedId==='stinger')fan(6,.1,{poison:3,mult:1.2});
   else if(w.rangedId==='chakram')for(let n=0;n<6;n++)this.shot(actor,w,angle+n*Math.PI/3,{mult:1.5,returning:false,model:'fragment'});
   else if(w.rangedId==='voidbow')this.shot(actor,w,angle,{mult:3,gravity:320*g});
   else if(w.rangedId==='starfall')fan(5,.12,{homing:true,mult:1.5});
   else if(w.rangedId==='horizon')this.field(actor,w,'gravity',{radius:380*g,life:5,pull:400,damage:this.damage(actor,w.damage*.5)});
   else used=false;
  }else{
   if(w.rangedId==='thornbow')this.field(actor,w,'roots',{damage:this.damage(actor,w.damage*1.3),chill:true});
   else if(w.rangedId==='glacial')this.field(actor,w,'blizzard',{radius:300*g,damage:this.damage(actor,w.damage*1.8),chill:true});
   else if(w.rangedId==='firebook'||w.rangedId==='starfall'){for(let n=0;n<8;n++){const a=n*2.4,d=(n%3)*80*g;this.field(actor,w,'meteor',{x:s.x+Math.cos(angle)*600+Math.cos(a)*d,y:s.y+Math.sin(angle)*600+Math.sin(a)*d,radius:120*g,life:1.1+n*.16,delay:1+n*.16,damage:this.damage(actor,w.damage*2.5)});}}
   else if(w.rangedId==='stinger'){for(let n=0;n<6&&this.drones.length<96;n++)this.drones.push({id:crypto.randomUUID(),actor,owner:actor.socket.id,x:s.x,y:s.y,angle:n*Math.PI/3,size:14*g,life:8,damage:this.damage(actor,w.damage*.5),attack:0,color:w.color});}
   else if(w.rangedId==='chakram')this.field(actor,w,'orbit',{x:s.x,y:s.y,radius:180+50*g,life:8,damage:this.damage(actor,w.damage*2),follow:true});
   else if(w.rangedId==='voidbow')this.field(actor,w,'collapse',{radius:330*g,life:.5,delay:.4,damage:this.damage(actor,w.damage*5)});
   else if(w.rangedId==='horizon')this.field(actor,w,'singularity',{radius:450*g,life:3.5,delay:3.4,pull:500,damage:this.damage(actor,w.damage*8)});
   else used=false;
  }
  if(!used)return false;s.abilityReadyAt[slot]=now+spec.cooldown*1000;this.world.store.save(actor.profile);actor.socket.emit('playerState',this.world.store.clientState(actor.profile));return true;
 }
 hit(actor,mob,damage,point,color){this.world.arcana.hit(actor,mob,damage,true,point,color);}
 area(actor,x,y,radius,damage,color){const g=this.world.game;for(const m of [...g.mobs]){const p=g.surface(m,{x,y});if(m.hp>0&&dist(p,{x,y})<=radius&&g.lineClear(x,y,p.x,p.y))this.hit(actor,m,damage,{x,y},color);}}
 tick(dt,live){this.clock+=dt;const w=this.world,g=w.game,active=new Set(live),now=Date.now();
  for(const p of this.shots){if(!active.has(p.actor)||p.actor.state.dead){p.life=0;continue;}const state=p.actor.state;let target=null;if(p.homing&&!p.leg){let best=3000;for(const m of g.mobs){const d=dist(m,p)-m.size;if(m.hp>0&&d<best&&g.lineClear(p.x,p.y,m.x,m.y)){best=d;target=m;}}}
   if(p.returning&&!p.leg&&dist(p,{x:p.ox,y:p.oy})>=p.range){p.leg=1;p.hit.clear();}
   if(p.leg)target=state;
   if(target){const desired=Math.atan2(target.y-p.y,target.x-p.x);if(p.leg)p.angle=desired;else p.angle+=Math.atan2(Math.sin(desired-p.angle),Math.cos(desired-p.angle))*Math.min(1,dt*7);p.vx=Math.cos(p.angle)*p.speed;p.vy=Math.sin(p.angle)*p.speed;}
   const previous={x:p.x,y:p.y},nx=p.x+p.vx*dt,ny=p.y+p.vy*dt,steps=Math.max(1,Math.ceil(dist(previous,{x:nx,y:ny})/35));let wall=false;for(let n=1;n<=steps;n++){const x=previous.x+(nx-previous.x)*n/steps,y=previous.y+(ny-previous.y)*n/steps;if(!g.lineClear(p.x,p.y,x,y)){wall=true;break;}p.x=x;p.y=y;}
   const contacts=[];for(const m of g.mobs){if(m.hp<=0||p.hit.has(m.id))continue;const at=segmentCircleEntry(previous.x,previous.y,p.x,p.y,m.x,m.y,m.size*.8+p.r);if(at!==null)contacts.push({m,at});}contacts.sort((a,b)=>a.at-b.at);
   for(const {m,at} of contacts){p.hit.add(m.id);const hit={x:previous.x+(p.x-previous.x)*at,y:previous.y+(p.y-previous.y)*at};this.hit(p.actor,m,p.damage,hit,p.color);if(p.chill)m.chillUntil=now+p.chill*1000;if(p.poison&&m.hp>0&&this.fields.length<96)this.fields.push({id:crypto.randomUUID(),actor:p.actor,owner:p.owner,kind:'poison',target:m.id,x:m.x,y:m.y,radius:1,life:p.poison,age:0,damage:p.damage*.4,color:p.color});if(p.gravity&&this.fields.length<96)this.fields.push({id:crypto.randomUUID(),actor:p.actor,owner:p.owner,kind:'gravity',x:hit.x,y:hit.y,radius:p.gravity,life:3,age:0,pull:280,damage:p.damage*.3,color:p.color});if(p.blast)this.area(p.actor,hit.x,hit.y,p.blast,p.damage*.6,p.color);if(!p.returning){p.life=0;break;}}
   if(p.weapon==='horizon'&&contacts.length&&this.fields.length<96)this.fields.push({id:crypto.randomUUID(),actor:p.actor,owner:p.owner,kind:'gravity',x:p.x,y:p.y,radius:250,life:2,age:0,pull:160,damage:p.damage*.2,color:p.color});
   p.life-=dt;if(wall||!p.returning&&dist(p,{x:p.ox,y:p.oy})>p.range)p.life=0;if(p.leg&&dist(p,state)<p.r+35)p.life=0;
  }
  this.shots=this.shots.filter(p=>p.life>0).slice(-384);
  for(const f of this.fields){if(!active.has(f.actor)||f.actor.state.dead){f.life=0;continue;}if(f.follow){f.x=f.actor.state.x;f.y=f.actor.state.y;}f.age+=dt;const used=Math.min(dt,f.life);if(f.kind==='poison'){const m=g.mobs.find(m=>m.id===f.target&&m.hp>0);if(m){f.x=m.x;f.y=m.y;this.hit(f.actor,m,f.damage*used,f,f.color);}else f.life=0;}
   else{for(const m of [...g.mobs]){if(m.hp<=0)continue;const p=g.surface(m,f),d=dist(p,f);if(d>f.radius||!g.lineClear(f.x,f.y,p.x,p.y))continue;if(f.pull&&m.size<Math.max(900,f.radius*.75)){const center=dist(m,f)||1,step=Math.min(Math.max(0,center-m.size-25),f.pull*used/(1+m.size/600));g.moveEntity(m,m.x+(f.x-m.x)/center*step,m.y+(f.y-m.y)/center*step,m.size*.7);}if(f.chill)m.chillUntil=now+400;if(f.delay){if(f.age>=f.delay&&!f.exploded)this.hit(f.actor,m,f.damage,f,f.color);}else if(f.kind!=='orbit'||Math.abs(d-f.radius*.7)<m.size*.8+40)this.hit(f.actor,m,f.damage*used,f,f.color);}if(f.delay&&f.age>=f.delay)f.exploded=true;}
   f.life-=dt;
  }
  this.fields=this.fields.filter(f=>f.life>0).slice(-96);
  for(const d of this.drones){if(!active.has(d.actor)||d.actor.state.dead){d.life=0;continue;}let target=null,best=2400;for(const m of g.mobs){const n=dist(m,d)-m.size;if(m.hp>0&&n<best&&g.lineClear(d.x,d.y,m.x,m.y)){best=n;target=m;}}const goal=target||d.actor.state,angle=Math.atan2(goal.y-d.y,goal.x-d.x),range=dist(goal,d);d.angle=angle;if(range>(target?target.size*.7:120))g.moveEntity(d,d.x+Math.cos(angle)*Math.min(range,650*dt),d.y+Math.sin(angle)*Math.min(range,650*dt),d.size);d.attack-=dt;if(target&&dist(target,d)<target.size+d.size+10&&d.attack<=0){this.hit(d.actor,target,d.damage,d,d.color);d.attack=.5;}d.life-=dt;}
  this.drones=this.drones.filter(d=>d.life>0).slice(-96);
 }
 snapshot(actor){const s=actor.state,near=e=>dist(e,s)<(actor.viewRadius||3000)+(e.radius||e.r||e.size||0)+600;return {rangedShots:this.shots.filter(near).map(({actor,hit,damage,...p})=>p),rangedFields:this.fields.filter(near).map(({actor,damage,...f})=>f),rangedDrones:this.drones.filter(near).map(({actor,damage,attack,...d})=>d)};}
}
module.exports=RangedWorld;
