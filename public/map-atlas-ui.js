// Region colors belong only to the minimap and atlas; native biome ground stays unchanged.
const atlasMapCache=new Map();
const atlasWalls={garden:'#214f39',beach:'#386b80',jungle:'#173e35',ice:'#487287',desert:'#80613e',cave:'#20232c'};
const atlasWallPatterns=new WeakMap();
function atlasWallPattern(c,realm){
 let cache=atlasWallPatterns.get(c);if(!cache)atlasWallPatterns.set(c,cache=new Map());if(cache.has(realm))return cache.get(realm);
 const tile=document.createElement('canvas');tile.width=tile.height=256;const t=tile.getContext('2d');t.fillStyle=atlasWalls[realm];t.fillRect(0,0,256,256);
 const foliage=realm==='garden'||realm==='jungle',colors=foliage?(realm==='garden'?['#386e41','#4b8a49','#2a5936']:['#28563d','#397147','#1c4936']):realm==='ice'?['#8cbac9','#acd4df','#5f91ab']:realm==='desert'?['#a58353','#bb9762','#745638']:['#7d989b','#a5b6af','#607c83'];
 for(let n=0;n<18;n++){const x=(n*83+29)%256,y=(n*127+41)%256,r=19+n%4*6;t.fillStyle=colors[n%3];t.strokeStyle=foliage?'#142f294f':'#35464e70';t.lineWidth=3;t.beginPath();if(foliage){t.ellipse(x,y,r*1.2,r*.8,n*.7,0,Math.PI*2);}else{for(let k=0;k<6;k++){const a=k*Math.PI/3;const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;if(k)t.lineTo(px,py);else t.moveTo(px,py);}t.closePath();}t.fill();t.stroke();if(foliage&&n%3===0){t.strokeStyle='#85ae6866';t.lineWidth=2;t.beginPath();t.moveTo(x-r*.6,y);t.lineTo(x+r*.6,y);t.stroke();}}
 const pattern=c.createPattern(tile,'repeat');cache.set(realm,pattern);return pattern;
}
const groundBeforeAtlas=RealmScenery.ground;
RealmScenery.ground=function(c,realm,left,top,width,height){
 groundBeforeAtlas(c,realm,left,top,width,height);const m=MAP_ATLAS.build(realm),tile=m.tile;
 for(let y=Math.max(0,Math.floor(top/tile));y<=Math.min(m.rows-1,Math.ceil((top+height)/tile));y++)for(let x=Math.max(0,Math.floor(left/tile));x<=Math.min(m.cols-1,Math.ceil((left+width)/tile));x++){
  const i=y*m.cols+x,px=x*tile,py=y*tile;c.save();
  if(!m.open[i]){
   c.fillStyle=atlasWallPattern(c,realm);c.fillRect(px,py,tile+1,tile+1);c.strokeStyle=realm==='ice'?'#c6e1e6b0':'#a9c18c99';c.lineWidth=9;
   for(const [dx,dy,ax,ay,bx,by] of [[-1,0,0,0,0,tile],[1,0,tile,0,tile,tile],[0,-1,0,0,tile,0],[0,1,0,tile,tile,tile]])if(m.open[(y+dy)*m.cols+x+dx]){c.beginPath();c.moveTo(px+ax,py+ay);c.lineTo(px+bx,py+by);c.stroke();}
  }c.restore();
 }
 for(const gate of m.gates){if(gate.x<left-200||gate.y<top-200||gate.x>left+width+200||gate.y>top+height+200)continue;c.save();c.translate(gate.x,gate.y);c.strokeStyle='#8c88654f';c.lineWidth=3;c.setLineDash([9,12]);c.beginPath();c.arc(0,0,65,0,Math.PI*2);c.stroke();c.setLineDash([]);c.font='bold 15px Ubuntu';c.textAlign='center';c.lineWidth=4;c.strokeStyle='#284231';c.fillStyle='#e9dfba';c.strokeText('Passagem',0,-85);c.fillText('Passagem',0,-85);c.restore();}
};
function atlasMapImage(realm){
 if(realm==='cave')buildCaveMaze();const version=realm==='cave'?(CAVE.revision||0)+':'+(multiplayer.mapVersion||0):MAP_ATLAS.VERSION,key=realm+':'+version;
 if(atlasMapCache.get(realm)?.key===key)return atlasMapCache.get(realm).image;
 const map=MAP_ATLAS.build(realm),cave=realm==='cave',cols=cave?CAVE.columns:map.cols,rows=cave?CAVE.rows:map.rows,tile=cave?CAVE.tile:map.tile,image=document.createElement('canvas');image.width=cols;image.height=rows;const c=image.getContext('2d'),pixels=c.createImageData(cols,rows),rgb=color=>[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)),palette=MAP_ATLAS.COLORS.map(rgb),wall=rgb(atlasWalls[realm]);
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const open=cave?caveTileOpen(x,y):map.open[y*cols+x],index=Math.floor((y+.5)*tile/map.tile)*map.cols+Math.floor((x+.5)*tile/map.tile),color=open?palette[map.tiers[index]]:wall,offset=(y*cols+x)*4;pixels.data[offset]=color[0];pixels.data[offset+1]=color[1];pixels.data[offset+2]=color[2];pixels.data[offset+3]=255;}c.putImageData(pixels,0,0);
 atlasMapCache.set(realm,{key,image});return image;
}
function atlasProjection(realm,w,h,padding=7){const d=MAP_ATLAS.dimensions(realm),scale=Math.min((w-padding*2)/d.width,(h-padding*2)/d.height);return {scale,x:(w-d.width*scale)/2,y:(h-d.height*scale)/2,w:d.width*scale,h:d.height*scale};}
function paintAtlas(c,w,h,large=false){
 const realm=currentRealm,p=atlasProjection(realm,w,h,large?16:5),image=atlasMapImage(realm),screen=(x,y)=>({x:p.x+x*p.scale,y:p.y+y*p.scale});c.clearRect(0,0,w,h);c.fillStyle='#142a25';c.fillRect(0,0,w,h);c.imageSmoothingEnabled=false;c.drawImage(image,p.x,p.y,p.w,p.h);
 const dot=(x,y,r,fill,label)=>{const s=screen(x,y);c.fillStyle=fill;c.strokeStyle='#203630';c.lineWidth=1.5;c.beginPath();c.arc(s.x,s.y,r,0,Math.PI*2);c.fill();c.stroke();if(label){c.font='bold '+(large?11:7)+'px Ubuntu';c.textAlign='center';c.lineWidth=3;c.strokeText(label,s.x,s.y-r-4);c.fillStyle='#fff';c.fillText(label,s.x,s.y-r-4);}};
 for(const gate of MAP_ATLAS.build(realm).gates)dot(gate.x,gate.y,large?3:1.5,'#e8cd82');
 for(const portal of EXPANSION.portalsFor(realm))dot(portal.x,portal.y,large?4:2.5,EXPANSION.mapFor(portal.to).color,large?EXPANSION.mapFor(portal.to).name:null);
 if(realm==='desert'){const f=multiplayer.forge||EXPANSION.LANDMARKS.desert.find(p=>p.id==='forge');dot(f.x,f.y,large?5:3,'#fff',large?'Forjadora':null);}
 for(const ore of ores){const t=rarities.findIndex(r=>r.name===ore.rarity?.name);if(t<9)continue;const s=screen(ore.x,ore.y),r=large?5:3.5;c.globalAlpha=.25;c.fillStyle=ore.rarity.color;c.beginPath();c.arc(s.x,s.y,Math.max(r,ore.size*p.scale),0,Math.PI*2);c.fill();c.globalAlpha=1;c.fillStyle=ore.rarity.color;c.strokeStyle='#203630';c.lineWidth=1.5;c.beginPath();c.moveTo(s.x,s.y-r);c.lineTo(s.x+r,s.y);c.lineTo(s.x,s.y+r);c.lineTo(s.x-r,s.y);c.closePath();c.fill();c.stroke();}
 for(const [id,remote] of Object.entries(players)){if(id===playerId||remote.inLobby||remote.realm!==realm)continue;dot(remote.x,remote.y,large?2.5:1.7,'#d8f1e6');}
 if(typeof partyState155!=='undefined')for(const group of ['guild','squad'])for(const other of partyState155[group]||[]){if(other.id===playerId||other.inLobby||other.realm!==realm||other.x==null)continue;dot(other.x,other.y,large?4:3,PARTY_COLORS[group]);}
 const arrival=MAP_ATLAS.spawn(realm);dot(arrival.x,arrival.y,large?5:3,'#fff29a',large?'Refúgio':null);
 const here=screen(player.x,player.y),aim=playerAimAngle();c.fillStyle='#fff';c.strokeStyle='#263a31';c.lineWidth=2;c.beginPath();c.arc(here.x,here.y,large?5:3.5,0,Math.PI*2);c.fill();c.stroke();c.strokeStyle='#ffe780';c.lineWidth=2;c.beginPath();c.moveTo(here.x,here.y);c.lineTo(here.x+Math.cos(aim)*(large?16:9),here.y+Math.sin(aim)*(large?16:9));c.stroke();return p;
}
const atlasDialog=document.createElement('dialog');atlasDialog.id='atlas-dialog';atlasDialog.setAttribute('role','dialog');atlasDialog.setAttribute('aria-labelledby','atlas-title');atlasDialog.innerHTML='<header><div><small>ATLAS DOS TERRITÓRIOS</small><h2 id="atlas-title">Mapa</h2></div><button type="button" aria-label="Fechar mapa">×</button></header><div class="atlas-content"><div class="atlas-map-wrap"><canvas id="atlas-large" width="900" height="680" aria-label="Mapa completo das regiões"></canvas><p id="atlas-inspect" role="status">Toque ou passe o mouse no mapa para conhecer uma região.</p></div><aside><h3>Regiões e raridades</h3><div id="atlas-legend"></div><p class="atlas-help">Cores indicam as áreas, sem pintar o chão. Paredes separam as regiões; pontos dourados são passagens. Portais levam a outros mapas; roxo e azul mostram guilda e squad.</p></aside></div>';document.body.append(atlasDialog);
const atlasCanvas=document.getElementById('atlas-large'),atlasLegend=document.getElementById('atlas-legend');let atlasRealm=null;
function atlasRefresh(){if(!atlasDialog.open)return;document.getElementById('atlas-title').textContent=EXPANSION.mapFor(currentRealm).name+' · '+Math.round(MAP_ATLAS.dimensions(currentRealm).width/1000)+' × '+Math.round(MAP_ATLAS.dimensions(currentRealm).height/1000)+' mil';paintAtlas(atlasCanvas.getContext('2d'),900,680,true);if(atlasRealm!==currentRealm){atlasRealm=currentRealm;atlasLegend.replaceChildren();const m=MAP_ATLAS.build(currentRealm);MAP_ATLAS.TIERS.forEach((rarity,tier)=>{const row=document.createElement('div');row.className='atlas-region';row.style.setProperty('--region-color',MAP_ATLAS.COLORS[tier]);const title=document.createElement('b');title.textContent=rarity;const name=document.createElement('span');name.textContent=m.names[tier];const chance=document.createElement('small');chance.textContent=tier===8?'79% Absolut · 20% Super · 1% Quantium':tier===7?'84% Super · 16% Ultra':tier===0?'100% Comum':'84% '+rarity+' · 16% '+MAP_ATLAS.TIERS[tier-1];row.append(title,name,chance);atlasLegend.append(row);});}}
function openAtlas(){heldKeys.clear();movementAimActive=false;if(typeof resetMobileInput==='function')resetMobileInput();if(!atlasDialog.open)atlasDialog.showModal();atlasRefresh();}
atlasDialog.querySelector('button').onclick=()=>atlasDialog.close();atlasDialog.addEventListener('click',e=>{if(e.target===atlasDialog)atlasDialog.close();});
atlasCanvas.addEventListener('pointermove',inspectAtlas);atlasCanvas.addEventListener('pointerdown',inspectAtlas);
function inspectAtlas(event){const rect=atlasCanvas.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width*900,y=(event.clientY-rect.top)/rect.height*680,p=atlasProjection(currentRealm,900,680,16),wx=(x-p.x)/p.scale,wy=(y-p.y)/p.scale,d=MAP_ATLAS.dimensions(currentRealm);if(wx<0||wy<0||wx>d.width||wy>d.height)return;const region=MAP_ATLAS.at(currentRealm,wx,wy),names=MAP_ATLAS.pool(currentRealm,region.tier).map(k=>CREATURES.find(c=>c.kind===k)?.name||k);document.getElementById('atlas-inspect').textContent=region.name+' · '+region.rarity+' · '+names.join(', ');}
const minimapHint=document.querySelector('.hud-map div');minimapHint.textContent='Toque no mapa para ampliar · cores = raridades';minimapHint.className='atlas-minimap-hint';
mapCanvas.tabIndex=0;mapCanvas.setAttribute('role','button');mapCanvas.setAttribute('aria-label','Abrir mapa completo e legenda das raridades');mapCanvas.addEventListener('click',openAtlas);mapCanvas.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openAtlas();}});
const uiBeforeAtlas=isUiBlocking;isUiBlocking=function(){return atlasDialog.open||uiBeforeAtlas();};
const hudBeforeAtlas=updateGameHud;updateGameHud=function(){hudBeforeAtlas();const region=MAP_ATLAS.at(currentRealm,player.x,player.y);hud.zone.textContent=region.name;hud.zone.style.color=region.safe?'#fff5bd':region.color;};
renderMinimap=function(){const now=performance.now();if(now-(renderMinimap.last||0)<125)return;renderMinimap.last=now;paintAtlas(mapContext,mapCanvas.width,mapCanvas.height);atlasRefresh();};
