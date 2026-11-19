// Real maps: menu selection and portal destinations use the same shared catalog.
const realmButtons155=document.querySelector('.menu-realms');realmButtons155.replaceChildren();
for(const map of EXPANSION.MAPS){const button=document.createElement('button');button.type='button';button.dataset.realm=map.id;button.textContent=map.name;button.onclick=()=>selectMenuRealm(map.id);realmButtons155.append(button);}
selectMenuRealm(selectedMenuRealm,false);

function drawRealmLanding(c=ctx,realm=currentRealm,camera=player,width=worldViewWidth()){
 if(Math.hypot(camera.x-WORLD_SIZE/2,camera.y-WORLD_SIZE/2)>width+1500)return;
 const map=EXPANSION.mapFor(realm);c.save();c.fillStyle='#f7edcc33';c.strokeStyle='#fff4c899';c.lineWidth=8;c.beginPath();c.arc(WORLD_SIZE/2,WORLD_SIZE/2,990,0,Math.PI*2);c.fill();c.stroke();
 c.fillStyle='#fff4d8';c.strokeStyle='#24493b';c.lineWidth=5;c.textAlign='center';c.font='bold 35px Ubuntu';c.strokeText(map.name.toUpperCase(),WORLD_SIZE/2,WORLD_SIZE/2-230);c.fillText(map.name.toUpperCase(),WORLD_SIZE/2,WORLD_SIZE/2-230);c.font='18px Ubuntu';c.fillText('REFÚGIO DOS VIAJANTES',WORLD_SIZE/2,WORLD_SIZE/2-190);c.restore();
}
function drawRealmPortals(brush=ctx,realm=currentRealm,camera=player,width=worldViewWidth(),height=worldViewHeight(),clock=performance.now()){
 const time=clock/1000;
 for(const portal of EXPANSION.portalsFor(realm)){
  if(Math.abs(camera.x-portal.x)>width/2+250||Math.abs(camera.y-portal.y)>height/2+250)continue;
  const map=EXPANSION.mapFor(portal.to),r=portal.r,c=brush;c.save();c.translate(portal.x,portal.y);
  c.fillStyle='#162e41';c.strokeStyle='#f7e9c6';c.lineWidth=10;c.beginPath();c.ellipse(0,0,r*.8,r,0,0,Math.PI*2);c.fill();c.stroke();
  c.strokeStyle=map.color;c.lineWidth=6;for(let n=0;n<3;n++){c.beginPath();c.ellipse(0,0,r*(.24+n*.18),r*(.3+n*.22),time*.5+n,0,Math.PI*2);c.stroke();}
  for(let n=0;n<9;n++){const a=time*.7+n*Math.PI*2/9;c.fillStyle='#fff6da';c.beginPath();c.arc(Math.cos(a)*r*.68,Math.sin(a)*r*.85,3,0,Math.PI*2);c.fill();}
  c.font='bold 20px Ubuntu';c.textAlign='center';c.fillStyle='#fff8df';c.strokeStyle='#24413c';c.lineWidth=5;c.strokeText(map.name,0,-r-24);c.fillText(map.name,0,-r-24);
  if(map.id==='cave'){c.font='bold 13px Ubuntu';c.fillText('Nível 90 · Matéria Vermelha+',0,r+28);}c.restore();
 }
}
const worldBeforeRealms155=drawWorld;drawWorld=function(){worldBeforeRealms155();RealmScenery.visible(currentRealm,ctx,player,worldViewWidth(),worldViewHeight(),performance.now());if(currentRealm==='cave')drawRealmPortals();};
// Keep gallery models in sync after loading the new garden drawings.
itemPreviewCache.clear();
const mapBeforeDistantPortals155=renderMinimap;renderMinimap=function(){mapBeforeDistantPortals155();const c=mapContext,size=mapCanvas.width,labels={garden:'JD',beach:'PR',jungle:'JG',ice:'GL',desert:'DS',cave:'CV'};for(const p of EXPANSION.portalsFor(currentRealm)){let x,y;if(currentRealm==='cave'){const span=42,left=Math.max(0,Math.min(CAVE.columns-span,Math.floor(player.x/CAVE.tile)-span/2)),top=Math.max(0,Math.min(CAVE.rows-span,Math.floor(player.y/CAVE.tile)-span/2));x=(p.x/CAVE.tile-left)/span*size;y=(p.y/CAVE.tile-top)/span*size;}else{x=p.x/WORLD_SIZE*size;y=p.y/WORLD_SIZE*size;}x=Math.max(8,Math.min(size-8,x));y=Math.max(8,Math.min(size-8,y));c.fillStyle=EXPANSION.mapFor(p.to).color;c.strokeStyle='#f7edc1';c.lineWidth=1;c.beginPath();c.arc(x,y,3,0,Math.PI*2);c.fill();c.stroke();c.textAlign='center';c.font='700 8px Ubuntu';c.lineWidth=2;c.strokeStyle='#203a36';c.strokeText(labels[p.to],x,y-5);c.fillStyle='#fff8de';c.fillText(labels[p.to],x,y-5);}};
