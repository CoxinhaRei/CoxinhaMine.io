const menuTour155=new MenuTour(EXPANSION.LANDMARKS);
const tourCaption155=document.createElement('div');tourCaption155.className='menu-tour-caption';tourCaption155.setAttribute('aria-hidden','true');tourCaption155.id='menu-tour-place';menuElement.append(tourCaption155);
const tourReduced155=matchMedia('(prefers-reduced-motion: reduce)'),tourOreCache155=new Map();let tourLastFrame155=-Infinity,tourPlaceKey155='';
function drawMenuShot155(c,shot,map,w,h,time){
 const zoom=w<600?.42:.64,viewWidth=w/zoom,viewHeight=h/zoom,left=shot.x-viewWidth/2,top=shot.y-viewHeight/2,p=shot.point;
 c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,w,h);c.save();c.translate(w/2,h/2);c.scale(zoom,zoom);c.translate(-shot.x,-shot.y);
 if(map.id==='cave'){buildCaveMaze();RealmScenery.caveFloor(c,left,top,viewWidth,viewHeight);}
 else{
  RealmScenery.ground(c,map.id,left,top,viewWidth,viewHeight);
  if(map.id==='garden'){c.fillStyle='#1e90ff';c.fillRect(WORLD_SIZE/2-60,top,120,viewHeight);drawCity(c);}else drawRealmLanding(c,map.id,shot,viewWidth);
 }
 RealmScenery.visible(map.id,c,shot,viewWidth,viewHeight,time);
 drawRealmPortals(c,map.id,shot,viewWidth,viewHeight,time);
 if(p.model!=='city'&&p.model!=='landing'){
  const key=map.id+':'+p.id;if(!tourOreCache155.has(key)){const rng=seededRandom(p.x+p.y),list=[];for(let n=0;n<10;n++){const a=rng()*Math.PI*2,d=650+rng()*350;list.push({id:'preview-'+key+n,x:p.x+Math.cos(a)*d,y:p.y+Math.sin(a)*d*.7,size:20+n%3*10,rarity:rarities[n%3]});}tourOreCache155.set(key,list);}
  for(const ore of tourOreCache155.get(key)){if(map.id==='cave'&&!caveTileOpen(Math.floor(ore.x/500),Math.floor(ore.y/500)))continue;drawCrystal(ore,c);}
 }
 const population=w<600?10:16,seconds=time/1000;
 for(let n=0;n<population;n++){
  const kind=map.mobs[n%map.mobs.length],a=n*2.4+seconds*(.045+(n%3)*.012),r=p.model==='city'?1000+(n%4)*90:280+(n%4)*190,rx=r,ry=r*.65,x=p.x+Math.cos(a)*rx,y=p.y+Math.sin(a)*ry;
  if(map.id==='cave'&&!caveTileOpen(Math.floor(x/500),Math.floor(y/500)))continue;
  const angle=Math.atan2(Math.cos(a)*ry,-Math.sin(a)*rx),size=28+n%3*5;
  drawCreatureModel(kind,c,x,y,size,angle,seconds*(2+n%3*.3)+n,!tourReduced155.matches);
 }
 if(p.model==='city'&&playerBodyImg.complete&&playerBodyImg.naturalWidth){for(let n=0;n<3;n++){const a=seconds*.12+n*Math.PI*2/3,x=p.x+Math.cos(a)*340,y=p.y+Math.sin(a)*230,angle=Math.atan2(Math.cos(a)*230,-Math.sin(a)*340);c.drawImage(playerBodyImg,x-30,y-30,60,60);if(playerEyesImg.complete&&playerEyesImg.naturalWidth)c.drawImage(playerEyesImg,x-30+Math.cos(angle)*4,y-30+Math.sin(angle)*4,60,60);}}
 if(p.model==='forge')RealmScenery.forger(c,{x:p.x+Math.sin(seconds*.055)*230,y:p.y+Math.cos(seconds*.04)*80,size:340,angle:Math.atan2(Math.sin(seconds*.04),Math.cos(seconds*.055))});
 if(map.id==='cave'){const light=c.createRadialGradient(p.x,p.y,150,p.x,p.y,Math.max(viewWidth,viewHeight)*.65);light.addColorStop(0,'#02000b00');light.addColorStop(1,'#02000bcb');c.fillStyle=light;c.fillRect(left,top,viewWidth,viewHeight);}
 c.restore();
}
drawMenuGarden=function(now){
 const visible=menuVisible()&&!document.hidden;
 menuTour155.select(EXPANSION.mapFor(selectedMenuRealm).id);menuTour155.step(now,visible,tourReduced155.matches);
 if(visible&&now-tourLastFrame155>=1000/30){
  tourLastFrame155=now;const w=innerWidth,h=innerHeight,map=EXPANSION.mapFor(selectedMenuRealm),frame=menuTour155.frame();
  if(menuCanvas.width!==w||menuCanvas.height!==h){menuCanvas.width=w;menuCanvas.height=h;}
  drawMenuShot155(menuCtx,frame.primary,map,w,h,frame.elapsed);
  if(frame.blackout>0){menuCtx.save();menuCtx.globalAlpha=frame.blackout;menuCtx.fillStyle='#07130f';menuCtx.fillRect(0,0,w,h);menuCtx.restore();}
  const shade=menuCtx.createRadialGradient(w*.55,h*.5,70,w*.55,h*.5,Math.max(w,h)*.66);shade.addColorStop(0,'#102b246b');shade.addColorStop(.65,'#102b2428');shade.addColorStop(1,'#102b2420');menuCtx.fillStyle=shade;menuCtx.fillRect(0,0,w,h);
  const shown=frame.primary.point,key=map.id+':'+shown.id;if(key!==tourPlaceKey155){tourPlaceKey155=key;tourCaption155.textContent=map.name+' · '+shown.name;}

 }
 requestAnimationFrame(drawMenuGarden);
};
