// Rules loaded by both the authoritative server runtime and the browser.
const chosenRarity={name:'CHOSEN',color:'#b9bec8',hp:8e9,mult:240000,craftOnly:true};
rarities.splice(rarities.findIndex(r=>r.adminOnly),0,chosenRarity);
GAME_CATALOG.NAMES.splice(11,0,'CHOSEN');GAME_CATALOG.ORE_RADII.splice(11,0,14000);GAME_CATALOG.ORE_HP.splice(11,0,8e9);GAME_CATALOG.XP_REWARDS.splice(11,0,1e9);
GAME_CATALOG.GRADIENTS.CHOSEN=['#7d838e','#f0f1f4','#a6adb7','#d6dae1'];ORE_VALUES.CHOSEN=450000;
craftRecipes.ALEPH={next:'CHOSEN',chance:1};
for(const def of EXPANSION.MOBS){CREATURES.push({...def});GAME_CATALOG.MOB_LOOT[def.kind]=def.drop;SPECIAL_MOB_ABILITIES[def.kind]={...SPECIAL_MOB_ABILITIES[def.kind.includes('Tornado')?'guardian':def.kind==='mantis'?'ladybug':def.kind==='scorpion'?'centipede':def.kind==='dragonfly'||def.kind==='snowmoth'?'bee':'beetle'],name:def.kind==='sandTornado'?'Tempestade de areia':def.kind==='iceTornado'?'Nevasca espiral':'Instinto de '+def.name};}
const legacyUtilityDefinitions=[...UTILITIES];UTILITIES.length=0;
equippedUtility=()=>null;
utilityBonus=name=>EXPANSION.bonuses(player)[name]||0;
cameraZoom=()=>EXPANSION.bonuses(player).zoom;
restoreUtility=()=>{EXPANSION.normalize(player);};
ownsLantern=()=>EXPANSION.bonuses(player).vision>0;
toggleLantern=()=>{};useUtilityAbility=()=>false;
startOreCraft=name=>name!=='ALEPH'&&(isServerWorld()?requestPlayerAction('expansionFusion',{type:'material',rarity:name}):EXPANSION.fuse(player,{type:'material',rarity:name}));
const oldNormalizeAdventure155=normalizeAdventure;
normalizeAdventure=()=>{oldNormalizeAdventure155();EXPANSION.normalize(player);};
const originalCreatureModel155=drawCreatureModel;
drawCreatureModel=function(kind,c,x,y,r,angle=0,phase=0,moving=false){
 const def=EXPANSION.MOBS.find(m=>m.kind===kind);if(!def)return originalCreatureModel155(kind,c,x,y,r,angle,phase,moving);
 c.save();c.translate(x,y);c.rotate(angle);c.lineWidth=Math.max(1.5,r*.06);c.strokeStyle='#24413d';
 const oval=(ox,oy,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(ox,oy,rx,ry,0,0,Math.PI*2);c.fill();c.stroke();};
 if(kind.includes('Tornado')){const time=performance.now()/350;for(let n=0;n<7;n++){const width=r*(.2+n*.12),y=r*.8-n*r*.25;oval(Math.sin(time+n)*r*.12,y,width,r*.13,n%2?def.color:kind==='iceTornado'?'#e6fbff':'#f7deb0');}for(let n=0;n<5;n++){const a=time+n*1.256;c.fillStyle=def.color;c.fillRect(Math.cos(a)*r*1.1,Math.sin(a)*r*.7,Math.max(2,r*.12),Math.max(2,r*.12));}}
 else if(['dragonfly','snowmoth'].includes(kind)){for(const side of [-1,1]){oval(-r*.12,side*r*.5,r*.7,r*.35,kind==='snowmoth'?'#edf6ff':'#d7fff0');oval(-r*.65,side*r*.5,r*.5,r*.28,'#b4e4eecf');}oval(0,0,r*.8,r*.22,def.color);}
 else{for(let n=0;n<3;n++)for(const side of [-1,1]){const step=moving?Math.sin(phase+n*1.8)*r*.15:0;c.beginPath();c.moveTo((n-1)*r*.35,side*r*.3);c.lineTo((n-1)*r*.65+step,side*r*.85);c.stroke();}oval(-r*.15,0,r*.78,r*.65,def.color);if(kind==='hermit'){oval(-r*.4,0,r*.6,r*.6,'#e8c7a6');c.beginPath();c.arc(-r*.4,0,r*.3,0,5.8);c.stroke();}if(kind==='turtle'||kind==='icebeetle'||kind==='scarab'){c.beginPath();c.moveTo(-r*.7,0);c.lineTo(r*.4,0);c.stroke();}if(kind==='crab'||kind==='scorpion'||kind==='mantis')for(const side of [-1,1]){oval(r*.7,side*r*.65,r*.4,r*.2,def.color);c.beginPath();c.moveTo(r*.65,side*r*.65);c.lineTo(r*1.1,side*r*.5);c.stroke();}if(kind==='scorpion'){c.beginPath();c.moveTo(-r*.7,0);c.quadraticCurveTo(-r*1.5,-r,-r*.55,-r*.9);c.stroke();}if(kind==='frog')for(const side of [-1,1])oval(r*.45,side*r*.5,r*.3,r*.3,'#8cd9a2');}
 if(!kind.includes('Tornado'))for(const side of [-1,1]){oval(r*.48,side*r*.22,r*.115,r*.15,'#fff');oval(r*.52,side*r*.22,r*.05,r*.09,'#233c3c');}c.restore();
};
function drawAccessoryModel(c,id,x,y,r){
 const def=EXPANSION.ACCESSORIES.find(a=>a.id===id);if(!def)return;c.save();c.translate(x,y);c.lineWidth=Math.max(1.5,r*.1);c.strokeStyle='#30464a';
 const oval=(ox,oy,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(ox,oy,rx,ry,0,0,Math.PI*2);c.fill();c.stroke();};
 if(def.model==='orb'){const g=c.createRadialGradient(-r*.25,-r*.3,r*.1,0,0,r);g.addColorStop(0,'#f5ffff');g.addColorStop(.35,'#8eeaff');g.addColorStop(1,'#7053bd');oval(0,0,r*.85,r*.85,g);c.strokeStyle='#effaff';c.lineWidth=r*.1;c.beginPath();c.ellipse(0,0,r*.95,r*.35,-.5,0,Math.PI*2);c.stroke();}
 else if(def.model==='egg'){oval(0,0,r*.7,r,'#fff2da');c.fillStyle='#eaa44a';for(const [ox,oy,s] of [[-.2,-.4,.22],[.3,.05,.19],[-.2,.4,.16]]){c.beginPath();c.arc(ox*r,oy*r,s*r,0,Math.PI*2);c.fill();}drawCreatureModel(def.kind,c,0,r*.1,r*.4,-Math.PI/2,0,false);}
 else if(def.model==='wings'){for(const side of [-1,1]){c.save();c.rotate(side*.28);oval(side*r*.47,0,r*.5,r*.8,id==='sun'?'#ffe28c':id==='moth'?'#e0f3ff':'#bdeee7');c.beginPath();c.moveTo(0,r*.7);c.lineTo(side*r*.6,-r*.65);c.stroke();c.restore();}}
 else if(def.model==='sting'||def.model==='fang'){c.fillStyle=def.model==='sting'?'#343b40':'#d8e9a8';c.beginPath();c.moveTo(0,-r);c.quadraticCurveTo(r,r*.5,0,r);c.lineTo(-r*.3,-r*.3);c.closePath();c.fill();c.stroke();}
 else if(def.model==='web'){c.strokeStyle='#e8f3f4';for(let n=0;n<6;n++){const a=n*Math.PI/3;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*r,Math.sin(a)*r);c.stroke();}for(const size of [.4,.8]){c.beginPath();for(let n=0;n<=6;n++){const a=n*Math.PI/3;c.lineTo(Math.cos(a)*r*size,Math.sin(a)*r*size);}c.stroke();}}
 else if(def.model==='magnet'){c.strokeStyle='#a6a6e8';c.lineWidth=r*.4;c.beginPath();c.arc(0,-r*.2,r*.65,0,Math.PI);c.stroke();c.fillStyle='#d3f5ff';c.fillRect(-r*.85,-r*.6,r*.4,r*.5);c.fillRect(r*.45,-r*.6,r*.4,r*.5);}
 else{oval(0,0,r*.73,r*.85,id==='glacier'?'#a5edff':id==='spiral'?'#ebc3ac':def.model==='vial'?'#a9dd92':'#e9ce83');if(def.model==='eye'){oval(0,0,r*.5,r*.35,'#f5ffff');oval(0,0,r*.16,r*.3,'#37484d');}else{c.beginPath();c.moveTo(-r*.4,0);c.lineTo(r*.4,0);c.moveTo(0,-r*.5);c.lineTo(0,r*.5);c.stroke();}}c.restore();
}
function drawAttachedAccessories(x,y,entity){const refs=entity===player?player.accessories:entity.accessories;if(!refs)return;const wings=refs.find(ref=>ref&&EXPANSION.ACCESSORIES.find(a=>a.id===ref.accessoryId)?.model==='wings');if(wings){ctx.save();ctx.translate(x,y);ctx.rotate(entity===player?playerAimAngle():entity.aimAngle||0);const flutter=Math.sin(performance.now()/100)*3;drawAccessoryModel(ctx,wings.accessoryId,-8,0,34+flutter);ctx.restore();}if(settings.particles)for(const [n,ref] of refs.entries()){if(!ref||EXPANSION.tier(ref.rarity)<7)continue;ctx.fillStyle=rarities.find(r=>r.name===ref.rarity)?.color||'#fff';const a=performance.now()/1400+n*2.4;ctx.beginPath();ctx.arc(x+Math.cos(a)*34,y+Math.sin(a)*34,2,0,Math.PI*2);ctx.fill();}}
