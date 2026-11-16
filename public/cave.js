const CAVE={width:WORLD_SIZE*2,height:WORLD_SIZE,tile:500,columns:400,rows:200,maze:null,populated:new Set()};
const CAVE_ENTRANCE={x:WORLD_SIZE-1000,y:1000,r:150};
let cavePromptOpen=false;
function realmDimensions(){return currentRealm==='cave' ? {width:CAVE.width,height:CAVE.height} : {width:WORLD_SIZE,height:WORLD_SIZE};}
function seededRandom(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function buildCaveMaze(){
  if(CAVE.maze)return;
  const grid=new Uint8Array(CAVE.columns*CAVE.rows),rng=seededRandom(1407),stack=[[1,1]];
  grid[CAVE.columns+1]=1;
  while(stack.length){
    const [x,y]=stack[stack.length-1];
    const choices=[[2,0],[-2,0],[0,2],[0,-2]].filter(([dx,dy])=>x+dx>0 && y+dy>0 && x+dx<CAVE.columns-1 && y+dy<CAVE.rows-1 && !grid[(y+dy)*CAVE.columns+x+dx]);
    if(!choices.length){stack.pop();continue;}
    const [dx,dy]=choices[Math.floor(rng()*choices.length)];
    grid[(y+dy/2)*CAVE.columns+x+dx/2]=1;grid[(y+dy)*CAVE.columns+x+dx]=1;stack.push([x+dx,y+dy]);
  }
  for(let y=1;y<=3;y++)for(let x=1;x<=3;x++)grid[y*CAVE.columns+x]=1;
  CAVE.maze=grid;
  CAVE.deposits=[];
  const chamberRandom=seededRandom(2983);
  for(let y=15000;y<CAVE.height-12000;y+=20000)for(let x=15000;x<CAVE.width-12000;x+=20000){
    const roll=chamberRandom(),index=roll<.002 ? 10 : roll<.025 ? 9 : roll<.10 ? 8 : -1;
    if(index<0)continue;
    const rarity=rarities[index],size=GAME_CATALOG.oreRadius(rarity.name);
    const deposit={id:'chamber-'+x+'-'+y,x,y,size,rarity,hp:rarity.hp,maxHp:rarity.hp,isBoss:true};
    CAVE.deposits.push(deposit);carveCaveChamber(x,y,size+600);
  }
}
function caveTileOpen(x,y){return x>=0 && y>=0 && x<CAVE.columns && y<CAVE.rows && CAVE.maze?.[y*CAVE.columns+x]===1;}
function circleHitsCaveWall(x,y,radius){
  const minX=Math.floor((x-radius)/CAVE.tile),maxX=Math.floor((x+radius)/CAVE.tile),minY=Math.floor((y-radius)/CAVE.tile),maxY=Math.floor((y+radius)/CAVE.tile);
  for(let ty=minY;ty<=maxY;ty++)for(let tx=minX;tx<=maxX;tx++){
    if(caveTileOpen(tx,ty))continue;
    const nearestX=Math.max(tx*CAVE.tile,Math.min((tx+1)*CAVE.tile,x));
    const nearestY=Math.max(ty*CAVE.tile,Math.min((ty+1)*CAVE.tile,y));
    if(Math.hypot(nearestX-x,nearestY-y)<radius)return true;
  }
  return false;
}
function moveWithWalls(entity,x,y,radius){
  const dimensions=realmDimensions();
  x=Math.max(radius,Math.min(dimensions.width-radius,x));y=Math.max(radius,Math.min(dimensions.height-radius,y));
  if(currentRealm!=='cave'){entity.x=x;entity.y=y;return;}
  if(!circleHitsCaveWall(x,entity.y,radius))entity.x=x;else if(entity===player)player.vx=0;
  if(!circleHitsCaveWall(entity.x,y,radius))entity.y=y;else if(entity===player)player.vy=0;
}
function caveLineClear(x,y,tx,ty){
  if(currentRealm!=='cave')return true;
  const count=Math.ceil(Math.hypot(tx-x,ty-y)/80);
  for(let n=0;n<=count;n++)if(!caveTileOpen(Math.floor((x+(tx-x)*n/(count || 1))/CAVE.tile),Math.floor((y+(ty-y)*n/(count || 1))/CAVE.tile)))return false;
  return true;
}
function nextCaveStep(mob){
  const sx=Math.floor(mob.x/CAVE.tile),sy=Math.floor(mob.y/CAVE.tile),tx=Math.floor(player.x/CAVE.tile),ty=Math.floor(player.y/CAVE.tile);
  if(sx===tx && sy===ty)return {x:player.x,y:player.y};
  const queue=[{x:sx,y:sy,first:null}],visited=new Set([sy*CAVE.columns+sx]);
  for(let i=0;i<queue.length && i<500;i++){
    const node=queue[i];
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const x=node.x+dx,y=node.y+dy,key=y*CAVE.columns+x;
      if(Math.abs(x-sx)>12 || Math.abs(y-sy)>12 || visited.has(key) || !caveTileOpen(x,y))continue;
      visited.add(key);const first=node.first || {x:(x+.5)*CAVE.tile,y:(y+.5)*CAVE.tile};
      if(x===tx && y===ty)return first;
      queue.push({x,y,first});
    }
  }
  return {x:mob.x,y:mob.y};
}
function switchRealm(next){
  if(isServerWorld()){socket.emit('changeRealm',next);cavePromptOpen=false;return;}
  clearBossMobEffects();
  realmStates[currentRealm]={ores,mobs,cells};
  currentRealm=next;const state=realmStates[next];ores=state.ores;mobs=state.mobs;cells=state.cells;
  projectiles=[];particles=[];abilityEffects=[];nearestBoss=null;heldKeys.clear();movementAimActive=false;touch.active=false;
  player.vx=0;player.vy=0;cavePromptOpen=false;
  if(next==='cave'){buildCaveMaze();player.x=750;player.y=750;populateCave();}
  else{player.x=CAVE_ENTRANCE.x-250;player.y=CAVE_ENTRANCE.y+150;}
  socket.emit('move',{x:player.x,y:player.y,realm:next});
}
function interactPortal(){
  if(player.dead || isUiBlocking())return;
  const distance=currentRealm==='garden' ? Math.hypot(player.x-CAVE_ENTRANCE.x,player.y-CAVE_ENTRANCE.y) : Math.hypot(player.x-750,player.y-750);
  if(distance>360)return;
  if(currentRealm==='cave')switchRealm('garden');else cavePromptOpen=true;
}
function populateCave(){
  if(isServerWorld())return;
  buildCaveMaze();
  for(const deposit of CAVE.deposits || []){
    if(!deposit.spawned && Math.hypot(deposit.x-player.x,deposit.y-player.y)<deposit.size+2600){deposit.spawned=true;ores.push({...deposit});}
  }
  const cx=Math.floor(player.x/CAVE.tile),cy=Math.floor(player.y/CAVE.tile);
  for(let y=cy-4;y<=cy+4;y++)for(let x=cx-4;x<=cx+4;x++){
    const key=y*CAVE.columns+x;
    if(!caveTileOpen(x,y) || CAVE.populated.has(key))continue;
    CAVE.populated.add(key);
    if(x<=3 && y<=3)continue;
    const rng=seededRandom(key+913),roll=rng();
    const index=roll<.00003 ? 10 : roll<.001 ? 9 : roll<.008 ? 8 : roll<.035 ? 7 : roll<.15 ? 6 : roll<.4 ? 5 : 4;
    const rarity=rarities[index],size=GAME_CATALOG.oreRadius(rarity.name),px=(x+.5)*CAVE.tile,py=(y+.5)*CAVE.tile;
    if(ores.some(o=>Math.hypot(o.x-px,o.y-py)<o.size+size+150))continue;
    // Giant deposits get reachable chambers; the remaining passages stay a maze.
    if(size>200){
      if(px<size+1000 || py<size+1000 || px>CAVE.width-size-1000 || py>CAVE.height-size-1000 || Math.hypot(px-player.x,py-player.y)<size+350)continue;
      carveCaveChamber(px,py,size+350);
    }
    const hasOre=rng()<.8;
    if(hasOre)ores.push({id:'cave-ore-'+key,x:px,y:py,size,hp:rarity.hp,maxHp:rarity.hp,rarity,rotation:rng()*Math.PI,isBoss:index>6});
    if(!hasOre && rng()<.9 && mobs.length<65){
      const guard=createCreature('guardian',rarity,px,py);
      if(!circleHitsCaveWall(guard.x,guard.y,guard.size)){mobs.push(guard);noteCreature(guard);}
    }
  }
}
function drawCaveEntrance(){
  const {x,y,r}=CAVE_ENTRANCE;
  if(Math.abs(x-player.x)>canvas.width/2+r || Math.abs(y-player.y)>canvas.height/2+r)return;
  ctx.save();ctx.fillStyle='#536054';ctx.beginPath();ctx.ellipse(x,y,r,r*.85,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#111b23';ctx.beginPath();ctx.ellipse(x,y+15,r*.65,r*.6,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#f1dca0';ctx.strokeStyle='#263a29';ctx.lineWidth=4;ctx.font='bold 20px "Trebuchet MS"';ctx.textAlign='center';
  ctx.strokeText('CAVERNA',x,y-r-35);ctx.fillText('CAVERNA',x,y-r-35);
  ctx.font='bold 13px "Trebuchet MS"';ctx.fillText('Nível 90 · Matéria Vermelha+',x,y-r-10);
  ctx.restore();
}
function drawCaveWorld(){
  ctx.fillStyle='#22262b';ctx.fillRect(player.x-worldViewWidth()/2,player.y-worldViewHeight()/2,worldViewWidth(),worldViewHeight());
  const left=Math.floor((player.x-worldViewWidth()/2)/CAVE.tile)-1,right=Math.ceil((player.x+worldViewWidth()/2)/CAVE.tile)+1;
  const top=Math.floor((player.y-worldViewHeight()/2)/CAVE.tile)-1,bottom=Math.ceil((player.y+worldViewHeight()/2)/CAVE.tile)+1;
  for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
    const px=x*CAVE.tile,py=y*CAVE.tile;
    if(caveTileOpen(x,y)){
      ctx.fillStyle='#454248';ctx.fillRect(px,py,CAVE.tile,CAVE.tile);
      ctx.fillStyle='#535058';for(let n=0;n<6;n++)ctx.fillRect(px+40+(n*71)%400,py+30+(n*113)%420,7,5);
    }else{
      ctx.fillStyle='#202329';ctx.fillRect(px,py,CAVE.tile,CAVE.tile);ctx.strokeStyle='#62606b';ctx.lineWidth=8;ctx.strokeRect(px+4,py+4,CAVE.tile-8,CAVE.tile-8);
    }
  }
  ctx.fillStyle='#94dbb3';ctx.font='bold 18px "Trebuchet MS"';ctx.textAlign='center';ctx.fillText('SAÍDA · E',750,650);
}
function carveCaveChamber(px,py,radius){
  CAVE.revision=(CAVE.revision || 0)+1;
  for(let y=Math.floor((py-radius)/CAVE.tile);y<=Math.ceil((py+radius)/CAVE.tile);y++)for(let x=Math.floor((px-radius)/CAVE.tile);x<=Math.ceil((px+radius)/CAVE.tile);x++){
    if(x>0 && y>0 && x<CAVE.columns-1 && y<CAVE.rows-1 && Math.hypot((x+.5)*CAVE.tile-px,(y+.5)*CAVE.tile-py)<radius+CAVE.tile*.7)CAVE.maze[y*CAVE.columns+x]=1;
  }
  caveMapImage=null;
}
function visionRadius(){return 100+talentRank('vision')*28+utilityBonus('vision')+(player.lanternOn && ownsLantern() ? 260 : 0);}
function drawCaveDarkness(){
  if(currentRealm!=='cave')return;
  const radius=visionRadius()*cameraZoom(),x=canvas.width/2,y=canvas.height/2;
  const gradient=ctx.createRadialGradient(x,y,Math.max(25,radius*.2),x,y,radius);
  gradient.addColorStop(0,'rgba(0,0,8,0)');gradient.addColorStop(.6,'rgba(0,0,8,.35)');gradient.addColorStop(1,'rgba(0,0,8,.98)');
  ctx.save();ctx.fillStyle=gradient;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();
}
let caveMapImage=null;
function renderCaveMinimap(){
  buildCaveMaze();
  if(!caveMapImage){
    caveMapImage=document.createElement('canvas');caveMapImage.width=CAVE.columns;caveMapImage.height=CAVE.rows;
    const c=caveMapImage.getContext('2d');c.fillStyle='#15171d';c.fillRect(0,0,CAVE.columns,CAVE.rows);c.fillStyle='#b0ada2';
    for(let y=0;y<CAVE.rows;y++)for(let x=0;x<CAVE.columns;x++)if(caveTileOpen(x,y))c.fillRect(x,y,1,1);
  }
  const span=42,left=Math.max(0,Math.min(CAVE.columns-span,Math.floor(player.x/CAVE.tile)-span/2)),top=Math.max(0,Math.min(CAVE.rows-span,Math.floor(player.y/CAVE.tile)-span/2));
  mapCanvas.title='Caverna · mapa da região próxima';
  mapContext.clearRect(0,0,mapCanvas.width,mapCanvas.height);mapContext.imageSmoothingEnabled=false;
  mapContext.drawImage(caveMapImage,left,top,span,span,0,0,mapCanvas.width,mapCanvas.height);
  mapContext.fillStyle='#ffe769';mapContext.beginPath();mapContext.arc((player.x/CAVE.tile-left)/span*mapCanvas.width,(player.y/CAVE.tile-top)/span*mapCanvas.height,3,0,Math.PI*2);mapContext.fill();
  if(left<2 && top<2){mapContext.fillStyle='#7dffaf';mapContext.fillRect((1.5-left)/span*mapCanvas.width,(1.5-top)/span*mapCanvas.height,4,4);}
}
