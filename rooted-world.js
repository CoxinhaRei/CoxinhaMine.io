const crypto=require('node:crypto');
module.exports=class RootedWorld{
  constructor(world){this.world=world;this.clock=0;this.poison=new Map();this.effects=[];this.shots=[];}
  effect(m,kind,radius,duration){this.effects.push({id:crypto.randomUUID(),kind,x:m.x,y:m.y,radius,color:m.color,createdAt:Date.now(),expiresAt:Date.now()+duration*1000});this.effects=this.effects.slice(-64);}
  infect(actor,m){
    if(actor.state.dead||this.world.safe(actor.state))return;
    const old=this.poison.get(actor),dps=m.damage*.18;
    this.poison.set(actor,{until:this.clock+4,dps:Math.max(old?.dps||0,dps),cause:m.name+' '+m.rarity.name+' · veneno'});actor.state.poisoned=true;
  }
  tick(dt,live){
    this.clock+=dt;const w=this.world,g=w.game,active=new Set(live),defenders=w.arcana.projectileTargets();
    this.effects=this.effects.filter(e=>e.expiresAt>Date.now());
    for(const [a,p] of this.poison){
      if(!active.has(a)||a.state.dead||w.safe(a.state)||p.until<=this.clock){a.state.poisoned=false;this.poison.delete(a);continue;}
      w.hurt(a.state,p.dps*Math.min(dt,p.until-this.clock+dt),0,0,p.cause);
      if(a.state.dead){a.state.poisoned=false;this.poison.delete(a);}
    }
    for(const m of g.mobs){
      if(!m.stationary||m.hp<=0)continue;
      const targets=live.filter(a=>!w.safe(a.state)&&Math.hypot(a.state.x-m.x,a.state.y-m.y)<m.size+700&&g.lineClear(m.x,m.y,a.state.x,a.state.y));
      const allies=defenders.filter(a=>Math.hypot(a.x-m.x,a.y-m.y)<m.size+700&&g.lineClear(m.x,m.y,a.x,a.y));
      if(!targets.length&&!allies.length){m.rootedCast=null;continue;}
      if(m.rootedCast){
        if(this.clock<m.rootedCast.at)continue;
        const aim=m.rootedCast.angle;m.rootedCast=null;m.rootedReady=this.clock+(m.poison?4.5:3.2);
        if(m.poison){
          const radius=m.size+260;this.effect(m,'sporeCloud',radius,1.4);
          for(const a of targets)if(Math.hypot(a.state.x-m.x,a.state.y-m.y)<radius+(a.state.size||20))this.infect(a,m);
          for(const a of allies)if(Math.hypot(a.x-m.x,a.y-m.y)<radius+a.size)w.arcana.hurtSummon(a,m.damage*.7);
        }else for(let n=-1;n<=1&&g.projectiles.length<600;n++){
          const angle=aim+n*.22;g.projectiles.push({owner:m.id,cause:m.name+' '+m.rarity.name,x:m.x+Math.cos(angle)*(m.size+18),y:m.y+Math.sin(angle)*(m.size+18),vx:Math.cos(angle)*380,vy:Math.sin(angle)*380,r:12,life:3,damage:m.damage*.55,rotation:angle,kind:m.kind==='livingDune'?'stone':'orb',chill:m.kind==='frostCrystal'});
        }
      }else if(this.clock>=(m.rootedReady??1.2)){
        const goal=targets[0]?.state||allies[0];m.rootedCast={at:this.clock+.8,angle:Math.atan2(goal.y-m.y,goal.x-m.x)};this.effect(m,'rootedWarning',m.poison?m.size+260:m.size+80,.8);
      }
      if(m.poison)for(const a of targets)if(Math.hypot(a.state.x-m.x,a.state.y-m.y)<m.size*.8+(a.state.size||20))this.infect(a,m);
    }
    // Rooted eggs are turrets. Their projectiles share normal damage/loot rules,
    // collide with the first enemy or ore, and never collide with players.
    const turrets=defenders.filter(m=>m.stationary),valid=new Set(turrets.map(m=>m.id));
    for(const m of turrets){
      const owner=w.actors[m.owner];if(!owner||w.safe(owner.state)||this.clock<(m.turretReady||0))continue;
      let target=null,best=1500+m.size;
      for(const enemy of [...g.mobs,...g.ores]){const d=Math.hypot(enemy.x-m.x,enemy.y-m.y)-enemy.size;if(enemy.hp>0&&!enemy.noRewards&&d<best&&g.lineClear(m.x,m.y,enemy.x,enemy.y)){best=d;target=enemy;}}
      if(!target||this.shots.length>=192)continue;
      const angle=Math.atan2(target.y-m.y,target.x-m.x);m.angle=angle;m.turretReady=this.clock+m.attackInterval;
      this.shots.push({id:crypto.randomUUID(),owner,ally:m.id,x:m.x,y:m.y,vx:Math.cos(angle)*700,vy:Math.sin(angle)*700,r:12,life:(1500+m.size)/700,damage:m.damage,color:'#ffad67',kind:m.kind});
    }
    for(const p of this.shots){
      if(!active.has(p.owner)||!valid.has(p.ally)){p.life=0;continue;}
      const x=p.x,y=p.y;p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;
      if(!g.lineClear(x,y,p.x,p.y)){p.life=0;continue;}
      let first=null,nearest=Infinity,isMob=false;
      for(const [mob,list] of [[true,g.mobs],[false,g.ores]])for(const e of list){if(e.hp<=0)continue;const at=require('./public/body-physics').segmentCircleEntry(x,y,p.x,p.y,e.x,e.y,e.size+p.r);if(at!==null&&at<nearest){nearest=at;first=e;isMob=mob;}}
      if(first){w.arcana.hit(p.owner,first,p.damage,isMob,p,p.color);p.life=0;}
    }
    this.shots=this.shots.filter(p=>p.life>0);
  }
  snapshot(actor){const near=e=>Math.hypot(e.x-actor.state.x,e.y-actor.state.y)<(actor.viewRadius||3000)+(e.radius||0)+500;return {poisoned:!!actor.state.poisoned,rootedEffects:this.effects.filter(near),rootedShots:this.shots.filter(near).map(({owner,damage,ally,...p})=>p)};}
};
