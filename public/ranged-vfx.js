(function(root){
 'use strict';
 const LIMIT=256,FRAME_BUDGET=48;
 function star(c,x,y,r,color,rotation=0){c.fillStyle=color;c.beginPath();for(let n=0;n<10;n++){const a=rotation+n*Math.PI/5-Math.PI/2,d=n%2?r*.43:r;n?c.lineTo(x+Math.cos(a)*d,y+Math.sin(a)*d):c.moveTo(x+Math.cos(a)*d,y+Math.sin(a)*d);}c.closePath();c.fill();c.stroke();}
 function drawShot(c,p,time,assets,particles=true){
  const r=Math.max(4,Math.min(240,p.r||10)),unit=r/10,color=p.color||'#d7e9ef';c.save();c.translate(p.x,p.y);c.rotate(p.angle||0);c.strokeStyle='#25414a';c.lineWidth=Math.max(1.5,unit*1.6);c.lineJoin='round';c.lineCap='round';
  if(particles){c.shadowColor=color;c.shadowBlur=8;}
  if(p.model==='chakram'||p.model==='boomerang'){
   c.rotate(time*(p.model==='chakram'?12:8));const image=assets?.get(p.weapon);if(image?.complete&&image.naturalWidth)c.drawImage(image,-r*2,-r*2,r*4,r*4);
   else{c.strokeStyle=color;c.lineWidth=4*unit;c.beginPath();c.arc(0,0,r,0,Math.PI*1.7);c.stroke();}
  }else if(p.weapon==='starfall'){
   c.strokeStyle='#536597';c.lineWidth=2*unit;star(c,0,0,r*1.3,'#fff3b4',time*2);c.strokeStyle='#d8eeff';c.lineWidth=1.3*unit;c.beginPath();c.moveTo(-r*1.8,-r*.25);c.lineTo(-r*3,-r*.25);c.moveTo(-r*1.8,r*.3);c.lineTo(-r*2.6,r*.3);c.stroke();
  }else if(p.model==='bow'||p.model==='crossbow'){
   c.strokeStyle=p.weapon==='voidbow'?'#c1a0ed':'#8a653d';c.lineWidth=3*unit;c.beginPath();c.moveTo(-r*2.6,0);c.lineTo(r,0);c.stroke();c.fillStyle=p.weapon==='thornbow'?'#8dd371':p.weapon==='voidbow'?'#b997f1':'#d6e8e4';c.strokeStyle=p.weapon==='voidbow'?'#5b3981':'#3d624f';c.lineWidth=1.5*unit;c.beginPath();c.moveTo(r*2,0);c.lineTo(r*.55,-r*.65);c.lineTo(r*.9,0);c.lineTo(r*.55,r*.65);c.closePath();c.fill();c.stroke();
   c.fillStyle=p.weapon==='thornbow'?'#659949':p.weapon==='voidbow'?'#9267c8':'#e8d4a0';for(const sign of [-1,1]){c.beginPath();c.moveTo(-r*2.2,0);c.lineTo(-r*2.8,sign*r*.65);c.lineTo(-r*1.8,sign*r*.6);c.lineTo(-r*1.2,0);c.closePath();c.fill();}
   if(p.weapon==='thornbow'){c.beginPath();c.moveTo(-r*.4,0);c.lineTo(-r*.1,-r*.6);c.lineTo(r*.2,0);c.fill();}
  }else if(p.weapon==='glacial'||p.model==='fragment'){
   c.fillStyle='#88e7f3';c.strokeStyle='#447ba1';c.beginPath();c.moveTo(r*1.8,0);c.lineTo(-r*.5,-r*.8);c.lineTo(-r*1.4,0);c.lineTo(-r*.5,r*.8);c.closePath();c.fill();c.stroke();c.fillStyle='#ecffff';c.beginPath();c.moveTo(r*1.5,0);c.lineTo(-r*.5,-r*.6);c.lineTo(-r*.6,0);c.closePath();c.fill();
  }else if(p.weapon==='firebook'){
   c.fillStyle='#e65830';c.beginPath();c.moveTo(r,0);c.bezierCurveTo(r,-r*1.4,-r*1.6,-r*1.6,-r*3.5,-r*.5);c.lineTo(-r*1.5,-r*.2);c.lineTo(-r*2.6,r*.6);c.bezierCurveTo(-r*.3,r*1.8,r,r,r,0);c.fill();c.fillStyle='#ffb546';c.beginPath();c.ellipse(0,0,r,r*.85,0,0,Math.PI*2);c.fill();c.fillStyle='#fff3b4';c.beginPath();c.ellipse(r*.25,-r*.1,r*.55,r*.5,0,0,Math.PI*2);c.fill();
  }else if(p.weapon==='stinger'){
   c.fillStyle='#303b36';c.beginPath();c.moveTo(r*2,0);c.lineTo(-r*.5,-r*.55);c.lineTo(-r*1.7,0);c.lineTo(-r*.5,r*.55);c.closePath();c.fill();c.stroke();c.strokeStyle='#f1d778';c.lineWidth=3*unit;c.beginPath();c.moveTo(-r*.5,-r*.4);c.lineTo(-r*.5,r*.4);c.stroke();
  }else if(p.weapon==='horizon'){
   c.fillStyle='#201a38';c.strokeStyle='#b79aea';c.lineWidth=2*unit;c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fill();c.stroke();c.rotate(time*2);c.strokeStyle='#e4c2ff';c.beginPath();c.ellipse(0,0,r*1.7,r*.4,.4,0,Math.PI*2);c.stroke();
  }else if(p.weapon==='revolver'){
   c.fillStyle='#ffdc8a';c.strokeStyle='#80673e';c.beginPath();c.moveTo(r*1.4,0);c.quadraticCurveTo(r*1.2,-r*.5,0,-r*.5);c.lineTo(-r*.9,-r*.5);c.lineTo(-r*.9,r*.5);c.lineTo(0,r*.5);c.quadraticCurveTo(r*1.2,r*.5,r*1.4,0);c.fill();c.stroke();c.strokeStyle='#fff0ba';c.lineWidth=2*unit;c.beginPath();c.moveTo(-r*1.8,0);c.lineTo(-r*4,0);c.stroke();
  }else{
   c.fillStyle='#a2b3ad';c.beginPath();for(let n=0;n<7;n++){const a=n*Math.PI*2/7,d=r*(n%2?.8:1);n?c.lineTo(Math.cos(a)*d,Math.sin(a)*d):c.moveTo(Math.cos(a)*d,Math.sin(a)*d);}c.closePath();c.fill();c.stroke();c.strokeStyle='#dae5dd';c.lineWidth=2*unit;c.beginPath();c.moveTo(-r*.4,-r*.4);c.lineTo(r*.3,-r*.6);c.stroke();
  }c.restore();
 }
 class Scene{
  constructor(){this.particles=[];this.shots=new Map();this.events=new Map();this.time=0;this.last=0;this.budget=FRAME_BUDGET;}
  reset(){this.particles=[];this.shots.clear();this.events.clear();this.last=0;}
  emit(x,y,color,count,angle=0,spread=Math.PI*2,speed=80){for(let n=0;n<count&&this.particles.length<LIMIT&&this.budget>0;n++,this.budget--){const a=angle+(Math.random()-.5)*spread,v=speed*(.3+Math.random()*.7);this.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,color,life:.2+Math.random()*.25,max:.45,r:1.5+Math.random()*2});}}
  frame(c,shots,visuals,now,enabled,assets,view){
   if(this.last&&now-this.last>.5)this.reset();const dt=this.last?Math.min(.05,Math.max(0,now-this.last)):0;this.last=now;this.time+=dt;this.budget=FRAME_BUDGET;
   const visible=e=>!view||Math.abs(e.x-view.x)<view.width/2+(e.r||e.radius||30)*4+100&&Math.abs(e.y-view.y)<view.height/2+(e.r||e.radius||30)*4+100;
   if(!enabled)this.particles=[];
   for(const v of visuals){if(!visible(v))continue;let rec=this.events.get(v.id);if(!rec){rec={born:now-(v.age||0),seen:now};this.events.set(v.id,rec);if(enabled)this.emit(v.x,v.y,v.color,v.kind==='impact'?9:4,v.angle||0,v.kind==='impact'?Math.PI*2:1.4,v.kind==='impact'?150:95);}rec.seen=now;const age=Math.max(0,now-rec.born),t=age/v.life;if(t>=1)continue;c.save();c.translate(v.x,v.y);c.globalAlpha=1-t;c.strokeStyle=v.color||'#f5edbd';c.lineWidth=v.kind==='muzzle'?2:Math.max(1,3*(1-t));if(v.kind==='muzzle'){c.rotate(v.angle||0);star(c,0,0,Math.max(7,v.radius)*(1-t),'#fff1c6',Math.PI*.1);}else{c.beginPath();c.arc(0,0,v.radius*(.25+t),0,Math.PI*2);c.stroke();if(enabled)for(let n=0;n<7;n++){const a=n*Math.PI*2/7;c.beginPath();c.moveTo(Math.cos(a)*v.radius*t,Math.sin(a)*v.radius*t);c.lineTo(Math.cos(a)*v.radius*(t+.3),Math.sin(a)*v.radius*(t+.3));c.stroke();}}c.restore();}
   for(const [id,e]of this.events)if(now-e.seen>1)this.events.delete(id);while(this.events.size>256)this.events.delete(this.events.keys().next().value);
   c.save();for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.max(0,1-dt*2);p.vy*=Math.max(0,1-dt*2);c.globalAlpha=Math.max(0,p.life/p.max)*.7;c.fillStyle=p.color||'#f5d692';c.beginPath();c.arc(p.x,p.y,Math.max(.1,p.r*p.life/p.max),0,Math.PI*2);c.fill();}c.restore();this.particles=this.particles.filter(p=>p.life>0);
   for(const p of shots){if(!visible(p))continue;let prior=this.shots.get(p.id);if(enabled&&(!prior||now-prior.emitted>.06)){this.emit(p.x,p.y,p.color,2,(p.angle||0)+Math.PI,.8,70);prior={emitted:now,seen:now};this.shots.set(p.id,prior);}if(prior)prior.seen=now;drawShot(c,p,now,assets,enabled);}for(const [id,e]of this.shots)if(now-e.seen>.5)this.shots.delete(id);while(this.shots.size>384)this.shots.delete(this.shots.keys().next().value);
  }
 }
 const api={Scene,drawShot,LIMIT,FRAME_BUDGET};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RANGED_VFX=api;
})(typeof globalThis!=='undefined'?globalThis:this);
