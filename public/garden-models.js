// One canvas model per species, shared by the world, inventory gallery and menu.
const beforeGardenModels155=drawCreatureModel;
drawCreatureModel=function(kind,c,x,y,r,angle=0,phase=0,moving=false){
 if(!['ladybug','bee','ant','spider','beetle','centipede','invertedBeetle'].includes(kind))return beforeGardenModels155(kind,c,x,y,r,angle,phase,moving);
 c.save();c.translate(x,y);c.rotate(angle);c.lineCap='round';c.lineJoin='round';c.strokeStyle='#293b37';c.lineWidth=Math.max(1,r*.065);
 const oval=(x,y,rx,ry,fill,outline=true)=>{c.beginPath();c.ellipse(x*r,y*r,rx*r,ry*r,0,0,Math.PI*2);c.fillStyle=fill;c.fill();if(outline)c.stroke();};
 const path=(points,color='#293b37',width=.065)=>{c.strokeStyle=color;c.lineWidth=Math.max(1,r*width);c.beginPath();points.forEach(([px,py],n)=>n?c.lineTo(px*r,py*r):c.moveTo(px*r,py*r));c.stroke();};
 const eyes=(x=.61,spread=.17)=>{for(const side of [-1,1]){oval(x,side*spread,.105,.14,'#fff9e6');oval(x+.035,side*spread,.043,.077,'#203b38',false);oval(x+.05,side*spread-.025,.018,.025,'#fff',false);}};
 const antenna=(x=.68)=>{for(const side of [-1,1]){path([[x,side*.24],[x+.18,side*.47],[x+.42,side*.5]],'#33423b',.05);oval(x+.42,side*.5,.055,.055,'#33423b',false);}};
 const legs=(count=3,color='#38483c',body=.3)=>{for(let n=0;n<count;n++)for(const side of [-1,1]){const px=(n-(count-1)/2)*.42,swing=moving?Math.sin(phase+n*1.9+side*1.57)*.16:0;path([[px,side*body],[px-.15+swing,side*.68],[px-.4+swing,side*.95]],color,.075);}};
 // Small offset shadow stays inside the entity's collision silhouette.
 oval(-.04,.12,.87,.63,'#153f2c25',false);
 if(moving)c.translate(0,Math.sin(phase*2)*r*.025);
 if(kind==='ladybug'){
  legs();antenna(.7);oval(.62,0,.38,.44,'#2e393b');oval(-.15,0,.9,.82,'#e95b51');
  path([[-1,0],[.52,0]],'#683d3a',.06);
  for(const side of [-1,1]){oval(-.57,side*.32,.16,.18,'#333b3a',false);oval(-.03,side*.5,.19,.18,'#333b3a',false);oval(.28,side*.24,.11,.13,'#333b3a',false);}
  oval(-.45,-.47,.2,.1,'#ffb2a4',false);eyes(.74,.18);
 }else if(kind==='bee'){
  const flutter=.2+Math.abs(Math.sin(performance.now()/60))*.21;
  for(const side of [-1,1]){oval(-.12,side*.58,.64,flutter,'#e2ffffd9');path([[-.63,side*.54],[.26,side*.6]],'#9fc7bd',.025);}
  legs(3,'#514737',.2);path([[-.78,0],[-1.12,0]],'#3e4234',.11);oval(-.12,0,.86,.59,'#ffcf55');
  c.save();c.beginPath();c.ellipse(-r*.12,0,r*.86,r*.59,0,0,Math.PI*2);c.clip();
  c.fillStyle='#4a4034';for(const px of [-.58,-.04])c.fillRect(px*r,-r*.6,r*.22,r*1.2);c.restore();
  oval(.65,0,.38,.4,'#f6b947');antenna(.75);eyes(.77,.15);oval(.56,-.25,.12,.05,'#ffe9a1',false);
 }else if(kind==='ant'){
  legs(3,'#65473b',.21);oval(-.57,0,.51,.43,'#946344');oval(-.02,0,.27,.26,'#bd8655');oval(.52,0,.42,.38,'#b47b50');antenna(.64);
  oval(-.66,-.2,.22,.075,'#d8a576',false);path([[.82,-.11],[1.01,-.14],[.93,-.02]],'#694b3e',.05);path([[.82,.11],[1.01,.14],[.93,.02]],'#694b3e',.05);eyes(.65,.13);
 }else if(kind==='spider'){
  for(let n=0;n<4;n++)for(const side of [-1,1]){const px=(n-1.5)*.26,swing=moving?Math.sin(phase+n*1.5+side)*.16:0;path([[px,side*.27],[px-.22+swing,side*.68],[px-.4+swing,side*1.05]],'#665078',.085);}
  oval(-.35,0,.65,.61,'#77618d');oval(.38,0,.43,.4,'#9c83ae');oval(-.48,-.25,.27,.12,'#b49bc6',false);
  path([[-.5,-.06],[-.28,-.25],[-.1,-.06],[-.28,.12],[-.5,-.06]],'#bba2cc',.055);eyes(.52,.17);
  for(const side of [-1,1]){oval(.32,side*.3,.052,.065,'#fff1d4',false);path([[.7,side*.13],[.84,side*.2],[.8,side*.29]],'#e4d1bd',.05);}
 }else if(kind==='centipede'){
  for(let n=5;n>=0;n--){const px=.65-n*.29,wave=Math.sin(phase*.7-n*.7)*(moving?.09:.025),size=.27-n*.013;
   for(const side of [-1,1]){const step=moving?Math.sin(phase-n*.9+side)*.12:0;path([[px,wave+side*.12],[px-.08+step,wave+side*.39],[px-.22+step,wave+side*.5]],'#557245',.055);}
   oval(px,wave,size,size,n===0?'#aed66a':n%2?'#92bc54':'#a3cb60');oval(px-.055,wave-size*.5,size*.5,size*.19,'#d4e797',false);
  }antenna(.71);eyes(.73,.12);
 }else{
  const inverted=kind==='invertedBeetle',shell=inverted?'#e0c0d5':'#55a59b',head=inverted?'#624a76':'#345c65';
  legs(3,head);antenna(.67);oval(.57,0,.38,.4,head);oval(-.18,0,.88,.73,shell);path([[-1.03,0],[.49,0]],head,.065);
  for(const side of [-1,1])path([[-.77,side*.21],[-.43,side*.37],[-.1,side*.37],[.2,side*.19]],inverted?'#ac7ea0':'#a5d8bd',.04);
  oval(-.49,-.41,.27,.1,inverted?'#fff0f8':'#b9ead4',false);eyes(.7,.16);
 }
 c.restore();
};
