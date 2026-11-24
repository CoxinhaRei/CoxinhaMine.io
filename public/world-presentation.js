const iris=document.createElement('canvas');iris.id='scene-iris';iris.setAttribute('aria-hidden','true');iris.style='display:none;position:fixed;inset:0;z-index:220;pointer-events:none;width:100vw;height:100dvh';document.body.append(iris);
async function irisTransition(action){
  if(window.worldTransitioning){await action();return;}
  window.worldTransitioning=true;heldKeys.clear();resetMobileInput();iris.width=innerWidth;iris.height=innerHeight;iris.style.display='block';const brush=iris.getContext('2d'),radius=Math.hypot(iris.width,iris.height)*.55;
  const animate=(closing)=>new Promise(resolve=>{const start=performance.now(),duration=matchMedia('(prefers-reduced-motion:reduce)').matches ? 50 : 280;function frame(now){const t=Math.min(1,(now-start)/duration),ease=t*t*(3-2*t),hole=radius*(closing ? 1-ease : ease);brush.clearRect(0,0,iris.width,iris.height);brush.fillStyle='#071911';brush.beginPath();brush.rect(0,0,iris.width,iris.height);brush.moveTo(iris.width/2+hole,iris.height/2);brush.arc(iris.width/2,iris.height/2,Math.max(.01,hole),0,Math.PI*2);brush.fill('evenodd');if(t<1)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});
  try{await animate(true);await action();await animate(false);}finally{iris.style.display='none';window.worldTransitioning=false;}
}
const exitButton=document.createElement('button');exitButton.id='exit-to-menu';exitButton.type='button';exitButton.textContent='×';exitButton.setAttribute('aria-label','Sair da partida e voltar ao menu');exitButton.title='Voltar ao menu · sua conta continua conectada';gameHud.append(exitButton);
exitButton.onclick=async()=>{if(window.worldTransitioning)return;await irisTransition(async()=>{const result=await callServer('returnToMenu',{});if(!result.ok){sharedNotice('Não foi possível voltar ao menu. Tente novamente.');return;}multiplayer.started=false;multiplayer.inLobby=true;canvas.style.display='none';gameHud.hidden=true;menuElement.style.display='flex';inventoryOpen=shopOpen=craftOpen=talentsOpen=false;extraPanel=null;nearestBoss=null;accountPanel.hidden=true;squadPanel.hidden=true;touchHud.hidden=true;heldKeys.clear();movementAimActive=false;resetMobileInput();renderMenu();renderGameChat();renderNetworkStatus();});};
const avatar=document.createElement('canvas');avatar.className='status-avatar';avatar.width=64;avatar.height=72;avatar.style.display='block';avatar.setAttribute('aria-label','Prévia da sua coxinha e direção do olhar');document.querySelector('.status-avatar').replaceWith(avatar);
const healthTrail=document.createElement('i');healthTrail.className='health-trail';hud.health.before(healthTrail);
const originalHudUpdate=updateGameHud;
updateGameHud=function(){
  const now=performance.now();if(now-(updateGameHud.previous || 0)>80){updateGameHud.previous=now;originalHudUpdate();healthTrail.style.width=Math.max(0,player.hp/Math.max(1,player.maxHp)*100)+'%';}
  const c=avatar.getContext('2d'),aim=playerAimAngle();c.clearRect(0,0,64,72);c.save();if(player.poisoned)c.filter='sepia(1) saturate(5) hue-rotate(220deg)';if(playerBodyImg.complete && playerBodyImg.naturalWidth)c.drawImage(playerBodyImg,0,4,64,64);c.restore();if(playerEyesImg.complete && playerEyesImg.naturalWidth)c.drawImage(playerEyesImg,Math.cos(aim)*4,4+Math.sin(aim)*4,64,64);
};
function drawEntityHealth(entity,x,y,width=70,color='#a9ee6b'){
  const now=performance.now(),ratio=Math.max(0,Math.min(1,entity.hp/Math.max(1,entity.maxHp))),dt=Math.min(.1,(now-(entity._healthTime || now))/1000);entity._healthTime=now;
  if(entity._healthShown===undefined){entity._healthShown=ratio;entity._healthTrail=ratio;}
  if(ratio<(entity._healthTarget ?? ratio))entity._healthHit=now;entity._healthTarget=ratio;
  entity._healthShown+=(ratio-entity._healthShown)*(1-Math.exp(-14*dt));
  if(now-(entity._healthHit || 0)>350)entity._healthTrail+=(ratio-entity._healthTrail)*(1-Math.exp(-6*dt));else entity._healthTrail=Math.max(entity._healthTrail,entity._healthShown);
  ctx.save();ctx.fillStyle='#17382b';ctx.strokeStyle='#17382b';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(x-width/2,y,width,7,3);ctx.fill();ctx.stroke();ctx.fillStyle='#f8a473';ctx.fillRect(x-width/2,y,width*entity._healthTrail,7);ctx.fillStyle=color;ctx.fillRect(x-width/2,y,width*entity._healthShown,7);ctx.restore();
}
let grassPattern=null;
function drawGardenGrass(){
  if(!grassPattern){const tile=document.createElement('canvas');tile.width=tile.height=512;const c=tile.getContext('2d');let seed=154813;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};c.fillStyle='#21b966';c.fillRect(0,0,512,512);
    for(let n=0;n<170;n++){const x=random()*512,y=random()*512,r=3+random()*13;c.save();c.translate(x,y);c.rotate(random()*6.28);c.fillStyle=n%3 ? '#159d5625' : '#5ad87f38';c.beginPath();if(n%4){c.moveTo(-r,-r*.7);c.quadraticCurveTo(r*.3,-r,r,r*.5);c.quadraticCurveTo(0,r*.8,-r,-r*.7);}else c.arc(0,0,r*.45,0,6.28);c.fill();if(n%9===0){c.strokeStyle='#14884a36';c.lineWidth=1.5;c.beginPath();c.moveTo(-4,4);c.lineTo(0,-4);c.lineTo(2,4);c.lineTo(7,-1);c.stroke();}c.restore();}
    grassPattern=ctx.createPattern(tile,'repeat');
  }
  const width=worldViewWidth()+20,height=worldViewHeight()+20;ctx.fillStyle=grassPattern;ctx.fillRect(Math.max(0,player.x-width/2),Math.max(0,player.y-height/2),Math.min(WORLD_SIZE,width),Math.min(WORLD_SIZE,height));
}
const materialLootModels=new Map();
function drawLootModel(c,item,x,y,r){
  c.save();c.translate(x,y);c.lineWidth=Math.max(1.5,r*.12);c.strokeStyle='#293e32';c.lineJoin='round';
  if(item.type==='material'){const index=Math.max(0,rarities.findIndex(a=>a.name===(item.oreRarity || item.rarity)));if(!materialLootModels.has(index)){const stamp=document.createElement('canvas');stamp.width=stamp.height=64;drawCrystal({id:'loot:'+index,x:32,y:32,size:25,rarity:rarities[index]},stamp.getContext('2d'));materialLootModels.set(index,stamp);}c.drawImage(materialLootModels.get(index),-r,-r,r*2,r*2);c.restore();return;}
  const ellipse=(rx,ry,fill)=>{c.fillStyle=fill;c.beginPath();c.ellipse(0,0,rx,ry,-.4,0,Math.PI*2);c.fill();c.stroke();};
  if(item.kind==='bee'){c.fillStyle='#25262a';c.beginPath();c.moveTo(r,-r);c.lineTo(r*.3,r*.8);c.lineTo(-r*.4,r*.2);c.lineTo(-r,-r*.3);c.closePath();c.fill();c.stroke();}
  else if(item.kind==='ladybug'){ellipse(r*.8,r,'#ed4f46');c.fillStyle='#302e30';for(const [a,b] of [[-.3,-.3],[.3,.2],[-.3,.5]]){c.beginPath();c.arc(a*r,b*r,r*.17,0,6.28);c.fill();}}
  else if(item.kind==='spider'){c.strokeStyle='#e9f3eb';c.lineWidth=r*.1;for(let n=0;n<6;n++){const a=n*Math.PI/3;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*r,Math.sin(a)*r);c.stroke();}for(const scale of [.4,.8]){c.beginPath();for(let n=0;n<=6;n++){const a=n*Math.PI/3;c.lineTo(Math.cos(a)*r*scale,Math.sin(a)*r*scale);}c.stroke();}}
  else if(item.kind==='ant'){c.strokeStyle='#62442f';c.lineWidth=r*.32;for(const side of [-1,1]){c.beginPath();c.moveTo(-r*.5,side*r*.7);c.quadraticCurveTo(r*.9,side*r,r*.7,side*r*.2);c.stroke();}}
  else if(item.kind==='beetle'){ellipse(r*.9,r,'#549a73');c.beginPath();c.moveTo(-r*.2,-r*.8);c.lineTo(r*.3,r*.8);c.stroke();}
  else if(item.kind==='centipede'){ellipse(r*.7,r*.95,'#a6ca58');c.fillStyle='#7a3a9f';c.beginPath();c.arc(0,r*.12,r*.4,0,6.28);c.fill();}
  else{c.fillStyle='#889995';c.beginPath();c.moveTo(-r,-r*.3);c.lineTo(-r*.2,-r);c.lineTo(r*.9,-r*.3);c.lineTo(r*.6,r*.9);c.lineTo(-r*.6,r*.7);c.closePath();c.fill();c.stroke();}
  c.restore();
}
function lootPreview(item){const key='loot:'+item.kind+':'+item.rarity;if(!itemPreviewCache.has(key)){const image=document.createElement('canvas');image.width=image.height=80;drawLootModel(image.getContext('2d'),item,40,40,25);itemPreviewCache.set(key,image.toDataURL('image/png'));}return itemPreviewCache.get(key);}
const pickedLoot=[];
function pickedLootAnimation(data){const dx=data.x-player.x,dy=data.y-player.y,d=Math.hypot(dx,dy);pickedLoot.push({...data,x:d>900?player.x+dx/d*180:data.x,y:d>900?player.y+dy/d*180:data.y,started:performance.now()});if(pickedLoot.length>48)pickedLoot.splice(0,pickedLoot.length-48);}
socket.on('dropCollected',data=>{pickedLootAnimation(data);sharedNotice('+ '+data.item.name+' · '+data.item.rarity);});
socket.on('dropsCollected',data=>{for(const drop of data.drops||[])pickedLootAnimation(drop);sharedNotice('Magneto: '+data.count.toLocaleString('pt-BR')+' drops recolhidos!');});
function drawGroundLoot(){
  const now=Date.now()+(multiplayer.timeOffset || 0);ctx.save();
  for(const drop of multiplayer.drops || []){
    if(Math.abs(drop.x-player.x)>worldViewWidth()/2+60 || Math.abs(drop.y-player.y)>worldViewHeight()/2+60)continue;
    const age=(now-drop.createdAt)/1000,appear=Math.max(0,Math.min(1,age/.45)),fade=Math.min(1,(drop.expiresAt-now)/5000),bounce=-Math.sin(appear*Math.PI)*30,bob=Math.sin(now/400+drop.x)*2,rarity=rarities.find(r=>r.name===drop.item.rarity);
    ctx.globalAlpha=appear*Math.max(0,fade)*(drop.eligible ? 1 : .22);ctx.fillStyle='#13392f66';ctx.beginPath();ctx.ellipse(drop.x,drop.y+21,20,6,0,0,6.28);ctx.fill();ctx.save();ctx.translate(drop.x,drop.y+bounce+bob);ctx.fillStyle='#eef5cd';ctx.strokeStyle=rarity?.color || '#a3d578';ctx.lineWidth=4;ctx.beginPath();ctx.roundRect(-19,-19,38,38,5);ctx.fill();ctx.stroke();drawLootModel(ctx,drop.item,0,0,13);ctx.restore();
  }
  for(let i=pickedLoot.length-1;i>=0;i--){const drop=pickedLoot[i],t=(performance.now()-drop.started)/550;if(t>=1){pickedLoot.splice(i,1);continue;}ctx.globalAlpha=1-t;drawLootModel(ctx,drop.item,drop.x+(player.x-drop.x)*t,drop.y+(player.y-drop.y)*t-35*Math.sin(t*Math.PI),14*(1-t*.5));}
  ctx.restore();
}
const componentTab=document.createElement('button');componentTab.type='button';componentTab.dataset.inventoryType='component';componentTab.textContent='Drops';componentTab.onclick=()=>{inventoryType='component';inventorySignature='';renderInventoryPanel();};inventoryPanel.querySelector('.inventory-tabs').append(componentTab);
const cardStyle=document.createElement('style');cardStyle.textContent=`
  #exit-to-menu{position:absolute;top:12px;right:12px;width:34px;height:34px;border:3px solid #934b4e;border-radius:5px;background:#cb6d70;color:#fff;font:bold 28px/23px Ubuntu;pointer-events:auto;cursor:pointer;z-index:3}
  .hud-map{top:57px}.mobile-mode #exit-to-menu{top:10px;right:9px;width:32px;height:32px}.mobile-mode .hud-map{top:54px}
  .status-health #hud-health{transition:width .3s ease-out;z-index:1}.status-health .health-trail{background:#e8a16f;transition:width .8s .15s ease-out;z-index:0}.status-health span{z-index:2}
  .rarity-card,.inventory-card,.gear-slot,.menu-slot{--item-color:#8bc876;border:5px solid color-mix(in srgb,var(--item-color) 72%,#183e35)!important;background:var(--item-color)!important;box-shadow:inset 0 0 0 3px #ffffff24,0 3px #12392d4d!important;border-radius:7px;color:white;isolation:isolate}
  .rare-gradient.rarity-card{background-image:linear-gradient(var(--card-fill),var(--card-fill)),var(--rare-gradient)!important;background-origin:padding-box,border-box;background-clip:padding-box,border-box;border-color:transparent!important}
  .rarity-card img,.inventory-card img,.gear-slot img,.menu-slot img{object-fit:contain;position:relative;filter:drop-shadow(0 2px #153a3255)}
  .inventory-card b,.gear-name,.menu-slot b{text-shadow:-1px -1px #22372d,1px -1px #22372d,-1px 1px #22372d,1px 1px #22372d;font-weight:900}
  .pickaxe-catalog button{border-width:4px;border-color:var(--rarity);background:color-mix(in srgb,var(--rarity) 70%,#306b65)}
  .ingredient{border-color:color-mix(in srgb,var(--item-color,#77ad7e) 70%,#244c3a)}
`;document.head.append(cardStyle);
