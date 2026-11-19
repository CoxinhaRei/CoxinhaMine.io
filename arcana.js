const crypto=require('node:crypto'),A=require('./public/arcana-catalog'),E=require('./public/expansion'),atlas=require('./public/map-atlas');
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const segmentDistance=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);};
module.exports=class ArcanaWorld{
 constructor(world){this.world=world;this.allies=[];this.groups=new Map();this.effects=[];this.bolts=[];this.clock=0;this.mentor=world.realm==='jungle'?{...A.MENTOR}:null;}
 wall(x,y,r){return this.world.realm==='cave'?this.world.game.wall(x,y,r):atlas.blocked(this.world.realm,x,y,r);}
 nearMentor(actor){return !!this.mentor&&!actor.inLobby&&!actor.state.dead&&actor.state.realm==='jungle'&&distance(actor.state,this.mentor)<300;}
 action(actor,data){
  const s=actor.state;s.magic=A.normalize(s.magic);
  if(actor.inLobby||s.dead||s.realm!==this.world.realm)throw Error('Entre no mapa para usar magia.');
  if(data.action==='awaken'){
   if(!this.nearMentor(actor))throw Error('Converse com o Sábio do Dossel na Jungle.');
   if(!s.magic.awakened){s.magic.awakened=true;s.magic.ranks.spark=1;E.add(s,E.accessory('orb'));E.normalize(s);const free=s.accessories.findIndex((v,i)=>!v&&i<E.slots(s.level));if(free>=0)E.equip(s,free,{accessoryId:'orb',rarity:'Comum'});s.mana=100;}
  }else if(data.action==='learn'){
   if(!s.magic.awakened)throw Error('Desperte sua magia com o Sábio da Jungle.');
   const def=A.SPELLS.find(d=>d.id===data.spell);if(!def||A.points(s)<1||s.magic.ranks[def.id]>=11||def.requires&&!s.magic.ranks[def.requires])throw Error('Talento bloqueado ou pontos insuficientes.');s.magic.ranks[def.id]++;
  }else if(data.action==='select'){
   if(!s.magic.awakened||!s.magic.ranks[data.spell]||!A.SPELLS.some(d=>d.id===data.spell))throw Error('Aprenda essa magia primeiro.');s.magic.selected=data.spell;
  }else if(data.action==='cast')return this.cast(actor,data);
  else throw Error('Ação de magia inválida.');
  this.world.store.save(actor.profile);actor.socket.emit('playerState',this.world.store.clientState(actor.profile));return true;
 }
 cast(actor,data){
  const s=actor.state,tier=A.orb(s,E),spell=A.spec(s.magic?.selected,tier,s.magic?.ranks?.[s.magic?.selected]);
  if(!s.magic?.awakened||!s.magic.ranks[s.magic.selected]||!spell)throw Error('Equipe uma Orbe Mágica e aprenda uma magia.');
  if(this.world.safe(s))throw Error('A praça é uma área segura.');
  if(actor.magicReady===undefined)actor.magicReady=this.clock+Math.max(0,((s.magicReadyAt||0)-Date.now())/1000);
  const now=this.clock;if(now<(actor.magicReady||0))throw Error('A magia está recarregando.');
  if((s.mana||0)<spell.mana)throw Error('Mana insuficiente.');
  const angle=Number.isFinite(data.angle)?Math.atan2(Math.sin(data.angle),Math.cos(data.angle)):s.aimAngle||0;
  s.mana-=spell.mana;actor.magicReady=now+spell.cooldown;s.magicReadyAt=Date.now()+spell.cooldown*1000;
  const start={x:s.x,y:s.y},end={x:s.x+Math.cos(angle)*spell.range,y:s.y+Math.sin(angle)*spell.range},g=this.world.game;
  // Every damage query and cast direction is resolved on the server. Walls stop beams.
  let reach=0;for(let d=0;d<=spell.range;d+=40){const x=start.x+Math.cos(angle)*d,y=start.y+Math.sin(angle)*d;if(this.wall(x,y,8))break;reach=d;}end.x=start.x+Math.cos(angle)*reach;end.y=start.y+Math.sin(angle)*reach;
  const fx={id:crypto.randomUUID(),kind:spell.id,x:s.x,y:s.y,tx:end.x,ty:end.y,radius:spell.radius,width:spell.width,color:spell.color,createdAt:Date.now(),expiresAt:Date.now()+900,owner:actor.socket.id};
  if(spell.id==='spark')this.bolts.push({...fx,actor,spell,vx:Math.cos(angle)*800,vy:Math.sin(angle)*800,life:reach/800,hit:new Set()});
  else if(spell.id==='comet')for(let n=1;n<=3;n++)this.bolts.push({...fx,id:crypto.randomUUID(),kind:'comet',x:start.x+(end.x-start.x)*n/3,y:start.y+(end.y-start.y)*n/3,actor,spell,delay:n*.18,life:.01});
  else {for(const mob of [...g.mobs])if((spell.id==='beam'?segmentDistance(mob,start,end)<=mob.size+spell.width/2:distance(mob,start)<=mob.size+spell.radius)&&g.lineClear(start.x,start.y,mob.x,mob.y))this.world.damage(actor,mob,spell.damage,true);this.effect(fx);}
  return true;
 }
 effect(fx){this.effects.push(fx);if(this.effects.length>64)this.effects.shift();}
 blast(b){const g=this.world.game;for(const mob of [...g.mobs])if(distance(mob,b)<=mob.size+b.spell.radius&&g.lineClear(b.x,b.y,mob.x,mob.y))this.world.damage(b.actor,mob,b.spell.damage,true);this.effect({...b,id:crypto.randomUUID(),kind:'burst',actor:undefined,spell:undefined,hit:undefined,createdAt:Date.now(),expiresAt:Date.now()+650});}
 tick(dt){
  this.clock+=dt;const w=this.world,g=w.game,actors=w.live(),active=new Map(actors.map(a=>[a.profile.id,a]));
  this.effects=this.effects.filter(e=>e.expiresAt>Date.now());
  for(const a of actors){if(a.magicReady===undefined)a.magicReady=this.clock+Math.max(0,((a.state.magicReadyAt||0)-Date.now())/1000);const tier=A.orb(a.state,E),max=100+Math.max(0,tier)*24;a.state.maxMana=max;a.state.mana=Math.min(max,Math.max(0,a.state.mana||0)+dt*(12+Math.max(0,tier)*2));}
  for(const b of this.bolts){if(!active.has(b.actor.profile.id)||active.get(b.actor.profile.id)!==b.actor){b.life=-1;continue;}if(b.delay>0){b.delay-=dt;continue;}b.life-=dt;if(b.kind==='comet'){this.blast(b);b.life=-1;continue;}const from={x:b.x,y:b.y};b.x+=b.vx*dt;b.y+=b.vy*dt;const collision=g.mobs.some(m=>segmentDistance(m,from,b)<=m.size+18);if(collision||b.life<=0||!g.lineClear(from.x,from.y,b.x,b.y)){this.blast(b);b.life=-1;}}
  this.bolts=this.bolts.filter(b=>b.life>0);
  for(const m of this.allies)if(m.hp<=0){const group=this.groups.get(m.group);if(group)group.ready[m.index]=this.clock+m.cooldown;}this.allies=this.allies.filter(m=>m.hp>0);
  // Groups are tied to an equipped slot and a live session, never a permanent world mob.
  const valid=new Set();for(const a of actors){let count=this.allies.filter(m=>m.ownerId===a.profile.id&&m.hp>0).length;
   for(const [slot,ref] of (a.state.accessories||[]).slice(0,E.slots(a.state.level)).entries()){
    const egg=ref&&A.EGGS.find(e=>e.id===ref.accessoryId);if(!egg||!a.state.inventory.some(i=>i.accessoryId===ref.accessoryId&&i.rarity===ref.rarity&&i.amount>0))continue;
    const key=a.socket.id+':'+slot+':'+ref.accessoryId+':'+ref.rarity;valid.add(key);let group=this.groups.get(key);if(!group){group={ready:Array(egg.count).fill(0)};this.groups.set(key,group);}
    for(let n=0;n<egg.count;n++){if(this.allies.some(m=>m.group===key&&m.index===n&&m.hp>0)||this.clock<group.ready[n]||count>=A.LIMIT||this.allies.length>=192)continue;
     const rarity=g.rarities.find(r=>r.name===ref.rarity);if(!rarity)continue;const base=g.createCreature(egg.kind,rarity,a.state.x,a.state.y),r=base.size*.7,angle=n*Math.PI*2/egg.count,x=a.state.x+Math.cos(angle)*(r+80),y=a.state.y+Math.sin(angle)*(r+80);
     if(this.wall(x,y,r*.5))continue;
     this.allies.push({id:'ally-'+crypto.randomUUID(),group:key,index:n,ownerId:a.profile.id,owner:a.socket.id,ownerName:a.name,kind:egg.kind,name:base.name,rarity:rarity.name,x,y,size:r,maxHp:base.maxHp*.7,hp:base.maxHp*.7,damage:base.damage,speed:Math.max(170,base.speed||120),angle,phase:0,attackAt:0,hurtAt:0,cooldown:egg.cooldown,summoned:true,noRewards:true});count++;
    }
   }
  }
  this.allies=this.allies.filter(m=>valid.has(m.group)&&active.has(m.ownerId));for(const key of this.groups.keys())if(!valid.has(key))this.groups.delete(key);
  const targetMobs=g.mobs.filter(m=>m.hp>0&&!m.noRewards&&!m.summoned);
  for(const m of this.allies){const a=active.get(m.ownerId);if(!a)continue;let target=null,best=2600+m.size;for(const enemy of targetMobs){const d=distance(m,enemy)-enemy.size;if(d<best&&g.lineClear(m.x,m.y,enemy.x,enemy.y)){best=d;target=enemy;}}
   const goal=target||{x:a.state.x+Math.cos(m.index*2.4)*150,y:a.state.y+Math.sin(m.index*2.4)*150};const d=distance(m,goal),contact=m.size+(target?.size||65);m.angle=Math.atan2(goal.y-m.y,goal.x-m.x);m.moving=d>contact*.8;
   if(!target&&d>4500){m.x=a.state.x;m.y=a.state.y;}else if(m.moving)g.moveEntity(m,m.x+Math.cos(m.angle)*Math.min(d-contact*.7,m.speed*dt),m.y+Math.sin(m.angle)*Math.min(d-contact*.7,m.speed*dt),m.size*.45);
   m.phase+=dt*(m.moving?8:1);
   if(target&&target.hp>0&&d<=contact+70){if(this.clock>=m.attackAt){m.attackAt=this.clock+.8;w.damage(a,target,m.damage*(1+Math.max(0,E.tier(m.rarity))*.25),true);}
    // Allies have enemy hitboxes; no allied body ever enters the player collision grid.
    if(this.clock>=m.hurtAt){m.hurtAt=this.clock+.9;m.hp-=target.damage||1;}
    const overlap=contact-d;if(overlap>0){const shift=Math.min(45,overlap*.25);g.moveEntity(m,m.x-Math.cos(m.angle)*shift,m.y-Math.sin(m.angle)*shift,m.size*.45);}
   }
   if(m.hp<=0){const group=this.groups.get(m.group);if(group)group.ready[m.index]=this.clock+m.cooldown;this.effect({id:crypto.randomUUID(),kind:'summonFade',x:m.x,y:m.y,radius:m.size,color:'#ff9c45',createdAt:Date.now(),expiresAt:Date.now()+600});}
  }
  this.allies=this.allies.filter(m=>m.hp>0);
 }
 snapshot(actor){const s=actor.state,near=e=>distance(e,s)<(actor.viewRadius||3000)+(e.size||e.radius||0)+500;return {mentor:this.mentor&&near(this.mentor)?this.mentor:null,mana:s.mana||0,maxMana:s.maxMana||100,magicReadyIn:Math.max(0,(actor.magicReady||0)-this.clock),allies:this.allies.filter(near).map(({group,ownerId,attackAt,hurtAt,cooldown,...m})=>m),magicEffects:this.effects.filter(e=>near(e)||Math.hypot(e.tx-s.x,e.ty-s.y)<8000||segmentDistance(s,e,{x:e.tx??e.x,y:e.ty??e.y})<(e.width||0)+8000).map(({actor,spell,hit,...e})=>e),magicBolts:this.bolts.filter(near).map(b=>({id:b.id,kind:b.kind,x:b.x,y:b.y,radius:18,color:b.color}))};}
};
