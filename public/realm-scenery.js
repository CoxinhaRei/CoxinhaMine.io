// Shared, decorative scenery for the actual maps and their menu tour.
const RealmScenery=(()=>{
 const patterns=new WeakMap();
 function ground(c,realm,left,top,width,height){
  const map=EXPANSION.mapFor(realm);let cache=patterns.get(c);if(!cache)patterns.set(c,cache=new Map());
  if(!cache.has(realm)){
   const tile=document.createElement('canvas');tile.width=tile.height=512;const t=tile.getContext('2d'),rng=seededRandom(15517+EXPANSION.MAPS.indexOf(map));t.fillStyle=map.color;t.fillRect(0,0,512,512);
   for(let n=0;n<80;n++){const x=rng()*512,y=rng()*512,r=4+rng()*12;t.strokeStyle=map.texture;t.fillStyle=map.texture;t.lineWidth=2;t.beginPath();
    if(realm==='ice'){for(let k=0;k<3;k++){const a=k*Math.PI/3;t.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r);t.lineTo(x-Math.cos(a)*r,y-Math.sin(a)*r);}t.stroke();}
    else if(realm==='desert'||realm==='beach'){t.ellipse(x,y,r*1.7,r*.35,-.1,0,Math.PI);t.stroke();}
    else{t.ellipse(x,y,r,r*.55,rng()*Math.PI,0,Math.PI*2);t.fill();}
   }cache.set(realm,c.createPattern(tile,'repeat'));
  }c.fillStyle=cache.get(realm);c.fillRect(left,top,width,height);
 }
 function caveFloor(c,left,top,width,height){
  c.fillStyle='#202329';c.fillRect(left,top,width,height);
  for(let y=Math.floor(top/CAVE.tile);y<=Math.ceil((top+height)/CAVE.tile);y++)for(let x=Math.floor(left/CAVE.tile);x<=Math.ceil((left+width)/CAVE.tile);x++){
   const px=x*CAVE.tile,py=y*CAVE.tile;
   if(caveTileOpen(x,y)){c.fillStyle='#454248';c.fillRect(px,py,CAVE.tile,CAVE.tile);c.fillStyle='#535058';for(let n=0;n<6;n++)c.fillRect(px+40+(n*71)%400,py+30+(n*113)%420,7,5);}
   else{c.strokeStyle='#62606b';c.lineWidth=8;c.strokeRect(px+4,py+4,CAVE.tile-8,CAVE.tile-8);}
  }
 }
 function forger(c,f){const {x,y,size:r}=f;c.save();c.fillStyle='#132f2738';c.beginPath();c.ellipse(x,y+r*.7,r*.9,r*.22,0,0,Math.PI*2);c.fill();c.fillStyle='#f9fbff';c.strokeStyle='#b1b7c1';c.lineWidth=7;c.beginPath();c.moveTo(x,y-r*1.12);c.bezierCurveTo(x-r*.13,y-r*.55,x-r*.82,y-r*.04,x-r*.79,y+r*.42);c.bezierCurveTo(x-r*.75,y+r*1.05,x+r*.75,y+r*1.05,x+r*.79,y+r*.42);c.bezierCurveTo(x+r*.82,y-r*.04,x+r*.13,y-r*.55,x,y-r*1.12);c.fill();c.stroke();for(const side of [-1,1]){c.fillStyle='#283442';c.beginPath();c.ellipse(x+side*r*.23+Math.cos(f.angle)*8,y+r*.18+Math.sin(f.angle)*8,r*.046,r*.075,0,0,Math.PI*2);c.fill();}c.textAlign='center';c.font='700 24px Ubuntu';c.lineWidth=4;c.strokeStyle='#334b40';c.strokeText('Coxinha Forjadora · CHOSEN',x,y-r*1.25);c.fillStyle='#f4f5f9';c.fillText('Coxinha Forjadora · CHOSEN',x,y-r*1.25);c.restore();}
 function landmark(c,realm,p,time=0){
  if(['city','landing','entrance'].includes(p.model))return;
  c.save();c.translate(p.x,p.y);c.lineJoin='round';c.lineCap='round';
  const oval=(x,y,rx,ry,fill,stroke)=>{c.fillStyle=fill;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=5;c.stroke();}};
  const flower=(x,y,color)=>{for(let n=0;n<5;n++){const a=n*Math.PI*2/5;oval(x+Math.cos(a)*12,y+Math.sin(a)*12,10,10,color);}oval(x,y,7,7,'#fff0a8');};
  const crystal=(x,y,r,color)=>{c.fillStyle=color;c.strokeStyle='#dffaff99';c.lineWidth=4;c.beginPath();c.moveTo(x,y-r);c.lineTo(x+r*.47,y-r*.25);c.lineTo(x+r*.35,y+r*.55);c.lineTo(x-r*.4,y+r*.45);c.lineTo(x-r*.55,y-r*.2);c.closePath();c.fill();c.stroke();c.beginPath();c.moveTo(x,y-r);c.lineTo(x-r*.1,y+r*.4);c.stroke();};
  const tree=(x,y,r,snow=false)=>{oval(x+10,y+15,r*.85,r*.65,'#092e3333');c.fillStyle=snow?'#d3e6e8':'#347453';c.strokeStyle=snow?'#8db9c4':'#1e5843';c.lineWidth=5;for(let n=2;n>=0;n--){const yy=y+(n-1)*r*.4,ww=r*(.45+n*.18);c.beginPath();c.moveTo(x,yy-r*.6);c.lineTo(x+ww,yy+r*.35);c.lineTo(x-ww,yy+r*.35);c.closePath();c.fill();c.stroke();}};
  const palm=(x,y)=>{c.strokeStyle='#98764c';c.lineWidth=18;c.beginPath();c.moveTo(x,y+90);c.quadraticCurveTo(x-30,y,x,y-70);c.stroke();for(let n=0;n<6;n++){const a=n*Math.PI/3;c.fillStyle=n%2?'#4b9e6b':'#347e58';c.beginPath();c.moveTo(x,y-70);c.quadraticCurveTo(x+Math.cos(a+.3)*120,y-70+Math.sin(a+.3)*120,x+Math.cos(a)*180,y-70+Math.sin(a)*160);c.quadraticCurveTo(x+Math.cos(a-.4)*80,y-70+Math.sin(a-.4)*80,x,y-70);c.fill();}};
  const water=(color='#55adbf')=>{oval(0,0,530,300,'#ead6a0');oval(0,0,490,265,color,'#b2e4d5');c.strokeStyle='#e3faff60';c.lineWidth=5;for(let n=0;n<5;n++){c.beginPath();c.ellipse(-290+n*140,Math.sin(time/2200+n)*45,65,12,0,0,Math.PI);c.stroke();}};
  if(p.model==='bridge'){
   for(const side of [-1,1]){c.fillStyle='#657c57';c.fillRect(side*220-90,-250,180,500);for(let n=0;n<7;n++)flower(side*220,-210+n*70,n%2?'#f7d578':'#ecacbc');}
   c.fillStyle='#b49b71';c.fillRect(-160,-100,320,200);c.strokeStyle='#735f46';c.lineWidth=5;for(let x=-150;x<=150;x+=30){c.beginPath();c.moveTo(x,-100);c.lineTo(x,100);c.stroke();}for(const y of [-110,110]){c.strokeStyle='#e2ce9a';c.lineWidth=12;c.beginPath();c.moveTo(-185,y);c.lineTo(185,y);c.stroke();}
  }else if(p.model==='flowers'){
   oval(0,0,530,350,'#53ac6d');for(let n=0;n<44;n++){const a=n*2.4,r=100+(n%7)*53;flower(Math.cos(a)*r,Math.sin(a)*r*.65,n%3?'#f2b8c9':'#f9d77b');}
  }else if(p.model==='coast'||p.model==='shells'){
   c.fillStyle='#5fbcc9';c.fillRect(-1200,120,2400,900);c.fillStyle='#8ed9dc';c.beginPath();c.moveTo(-1200,120);for(let x=-1200;x<=1200;x+=35)c.lineTo(x,120+Math.sin(x/120+time/1800)*20);c.lineTo(1200,210);c.lineTo(-1200,210);c.fill();c.strokeStyle='#e4fcf1';c.lineWidth=7;c.stroke();
   if(p.model==='coast'){for(let n=0;n<10;n++){const x=-650+n*145,y=300+(n%3)*100;c.strokeStyle=n%2?'#f5a7b3':'#f3c49d';c.lineWidth=12;c.beginPath();c.moveTo(x,y+60);c.lineTo(x,y);c.moveTo(x,y+20);c.lineTo(x-30,y-10);c.moveTo(x,y+30);c.lineTo(x+30,y+2);c.stroke();}}
   else for(let n=0;n<13;n++){const x=-700+n*115,y=-100+(n%3)*65;oval(x,y,33,25,n%2?'#eed8bc':'#dbb59f','#b79780');c.strokeStyle='#ae8e76';c.lineWidth=3;c.beginPath();c.arc(x,y,15,0,5.6);c.stroke();}palm(-700,-320);palm(750,-280);
  }else if(p.model==='ruins'||p.model==='caveRuins'){
   c.fillStyle=realm==='cave'?'#5e596c':'#77867b';c.strokeStyle=realm==='cave'?'#938a9d':'#a5afa1';c.lineWidth=8;c.fillRect(-360,-240,720,480);c.strokeRect(-360,-240,720,480);
   for(const x of [-310,310])for(const y of [-220,220]){oval(x,y,65,65,'#526662');c.fillStyle='#9da79a';c.fillRect(x-36,y-110,72,110);oval(x,y-110,53,28,'#b9bda8');if(realm!=='cave'){c.strokeStyle='#397755';c.lineWidth=13;c.beginPath();c.moveTo(x-40,y-100);c.bezierCurveTo(x+65,y-50,x-60,y+20,x+40,y+40);c.stroke();}}
   crystal(0,0,115,realm==='cave'?'#997ace':'#79bba0');if(realm!=='cave')for(let n=0;n<8;n++)tree(Math.cos(n)*650,Math.sin(n)*440,100);
  }else if(p.model==='pond'||p.model==='oasis'||p.model==='frozenLake'){
   water(p.model==='frozenLake'?'#9ed7e9':p.model==='pond'?'#418f91':'#5bb8bb');
   if(p.model==='pond')for(let n=0;n<7;n++){const x=-350+n*110,y=Math.sin(n)*130;oval(x,y,39,25,'#7baa69');flower(x+5,y-3,'#edc2db');}
   if(p.model==='oasis'){palm(-570,60);palm(520,-70);palm(400,370);}
   if(p.model==='frozenLake'){c.strokeStyle='#ecfbff';c.lineWidth=4;c.beginPath();c.moveTo(-330,-80);c.lineTo(-100,0);c.lineTo(80,-160);c.moveTo(-100,0);c.lineTo(50,140);c.lineTo(280,70);c.stroke();for(let n=0;n<7;n++)tree(Math.cos(n)*680,Math.sin(n)*450,90,true);}
  }else if(p.model==='iceForest'||p.model==='caveCrystals'){
   for(let n=0;n<13;n++){const a=n*2.4,r=120+(n%4)*145,x=Math.cos(a)*r,y=Math.sin(a)*r*.7;if(p.model==='iceForest'&&n%2)tree(x,y,120,true);else crystal(x,y,65+(n%3)*30,n%2?'#91d9e5':'#b1a1e9');}
  }else if(p.model==='forge'){
   oval(0,0,530,400,'#d3aa703d');for(let n=0;n<6;n++){const a=n*Math.PI/3;crystal(Math.cos(a)*570,Math.sin(a)*390,55,'#c8c9d3');}
  }
  c.restore();
 }
 function visible(realm,c,camera,width,height,time){for(const p of EXPANSION.LANDMARKS[realm]||[]){if(Math.abs(p.x-camera.x)>width/2+p.radius||Math.abs(p.y-camera.y)>height/2+p.radius)continue;landmark(c,realm,p,time);}}
 return {ground,caveFloor,landmark,visible,forger};
})();
const buildBeforeScenery155=buildCaveMaze;buildCaveMaze=function(){const built=!!CAVE.maze;buildBeforeScenery155();if(!built)for(const p of EXPANSION.LANDMARKS.cave.slice(1))carveCaveChamber(p.x,p.y,p.radius);};
