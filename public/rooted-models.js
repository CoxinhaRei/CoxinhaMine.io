const beforeRootedModel=drawCreatureModel;
drawCreatureModel=function(kind,c,x,y,r,angle=0,phase=0,moving=false){
  if(!ROOTED_CATALOG.MOBS.some(m=>m.kind===kind))return beforeRootedModel(kind,c,x,y,r,angle,phase,moving);
  c.save();c.translate(x,y);c.lineJoin='round';c.lineCap='round';c.strokeStyle='#34413d';c.lineWidth=Math.max(1,r*.055);
  const oval=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x*r,y*r,rx*r,ry*r,0,0,Math.PI*2);c.fill();c.stroke();};
  const path=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([a,b],n)=>n?c.lineTo(a*r,b*r):c.moveTo(a*r,b*r));c.closePath();c.fill();c.stroke();};
  oval(0,.4,.9,.5,'#16362830');
  if(kind==='sporecap'){
    oval(0,.24,.34,.7,'#ead8c1');path([[-.22,.6],[-.65,.86],[-.18,.78],[.1,.9],[.25,.7],[.64,.82],[.25,.48]],'#d6bdb3');
    oval(0,-.13,.96,.55,'#67416e');oval(-.03,-.34,.96,.57,'#ae6bc2');
    for(const [a,b,s] of [[-.56,-.41,.16],[.07,-.63,.18],[.55,-.29,.12],[-.12,-.15,.11]])oval(a,b,s,s*.6,'#f2d6e1');
    oval(-.42,-.66,.26,.08,'#d59be2');
    for(let n=0;n<5;n++){const t=performance.now()/1800+n*1.2;c.globalAlpha=.35;oval(Math.sin(t)*.95,-.75-Math.cos(t)*.2,.025,.04,'#d1a4ed');}c.globalAlpha=1;
  }else if(kind==='livingDune'){
    path([[-.98,.45],[-.66,-.17],[-.12,-.93],[.42,-.42],[.96,.4],[.28,.77],[-.5,.73]],'#ce9958');
    path([[-.66,-.17],[-.12,-.93],[.14,-.12],[-.24,.48],[-.98,.45]],'#edc785');
    path([[-.12,-.93],[.42,-.42],[.96,.4],[.14,-.12]],'#a47448');
    c.strokeStyle='#f7d99d';c.beginPath();c.moveTo(-r*.5,r*.22);c.quadraticCurveTo(0,r*.6,r*.66,r*.29);c.stroke();
    oval(-.36,.65,.25,.11,'#e4b66e');oval(.62,.55,.22,.13,'#b57f46');
  }else if(kind==='coralSentry'){
    c.strokeStyle='#a45c62';c.lineWidth=r*.22;
    for(const [a,b] of [[-.62,-.4],[-.2,-.8],[.4,-.6],[.7,-.1]]){c.beginPath();c.moveTo(0,r*.6);c.quadraticCurveTo(a*r,r*.1,a*r,b*r);c.stroke();oval(a,b,.21,.18,'#eea4a0');oval(a,b,.1,.08,'#9d5a73');}
    oval(0,.62,.64,.22,'#ce917f');
  }else{
    oval(0,.52,.76,.32,'#6d9bb8');
    for(const [a,b,s] of [[-.5,.08,.45],[.42,-.05,.52],[0,-.27,.75]]){path([[a-s*.36,b+s*.65],[a-s*.42,b-s*.4],[a,b-s],[a+s*.42,b-s*.25],[a+s*.28,b+s*.65]],'#90d9ec');path([[a,b-s],[a+s*.42,b-s*.25],[a+s*.28,b+s*.65],[a,b+s*.4]],'#498fb8');c.strokeStyle='#dfffff';c.beginPath();c.moveTo(a*r,(b-s*.7)*r);c.lineTo((a-s*.16)*r,(b+s*.2)*r);c.stroke();c.strokeStyle='#34413d';}
  }
  c.restore();
};
const beforeRootedGround=drawGroundLoot;
drawGroundLoot=function(){beforeRootedGround();const now=Date.now()+(multiplayer.timeOffset||0);
  for(const e of multiplayer.rootedEffects||[]){const t=Math.max(0,Math.min(1,(now-e.createdAt)/(e.expiresAt-e.createdAt)));ctx.save();ctx.globalAlpha=(1-t)*(e.kind==='sporeCloud'?.18:.5);ctx.fillStyle=e.color;ctx.strokeStyle=e.color;ctx.lineWidth=4;ctx.beginPath();ctx.arc(e.x,e.y,e.radius*(e.kind==='sporeCloud'?1:.85+t*.15),0,Math.PI*2);if(e.kind==='sporeCloud')ctx.fill();else{ctx.setLineDash([15,12]);ctx.stroke();}ctx.restore();}
  for(const p of multiplayer.rootedShots||[]){ctx.save();ctx.fillStyle=p.color;ctx.strokeStyle='#6c472b';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}
};
