// One equipped utility grants its bonuses. An owned lantern can still be toggled with F.
const ARMORS=PICKAXE_RECIPES.map((recipe,index)=>({
  ...recipe,id:'armor_'+index,type:'armor',amount:1,coins:Math.round(recipe.coins*1.4+80),
  defense:[.05,.1,.16,.23,.36,.43,.58,.65][index],rarity:rarities[index].name,color:rarities[index].color,
  aura:['Diamante','Matéria Vermelha','Solar','Void'].includes(recipe.name),
  img:loadImg('sprites/armor_'+index+'.png')
}));
UTILITIES.push(
  {id:'utility_lens',name:'Lente de Libélula',rarity:'Épico',coins:3500,materials:[['Raro',35],['Épico',15]],vision:210,zoom:.78,description:'Campo de visão +28% e +210 de iluminação na caverna.',icon:'lens'},
  {id:'utility_boots',name:'Botas de Gafanhoto',rarity:'Lendário',coins:9000,materials:[['Épico',30],['Lendário',12]],speed:.45,description:'Velocidade de movimento +45%.',icon:'boots'},
  {id:'utility_drill',name:'Núcleo de Escavação',rarity:'Mítico',coins:24000,materials:[['Lendário',35],['Mítico',20]],mining:1,haste:.25,range:120,description:'Mineração +100% de dano, recarga -25%, alcance +120.',icon:'drill'},
  {id:'utility_compass',name:'Observatório Astral',rarity:'ULTRA',coins:65000,materials:[['Mítico',40],['ULTRA',15]],vision:420,zoom:.65,range:180,description:'Campo de visão +54%, luz +420 e alcance +180.',icon:'compass'},
  {id:'utility_wings',name:'Asas de Fóton',rarity:'SUPER',coins:180000,materials:[['ULTRA',40],['SUPER',8]],speed:.85,vision:120,description:'Velocidade +85% e iluminação +120.',icon:'wings'},
  {id:'utility_magnet',name:'Magneto Cósmico',rarity:'ABSOLUT',coins:450000,materials:[['SUPER',25],['ABSOLUT',5]],vision:150,range:350,active:'magnet',radius:1300,mult:8,cooldown:14,color:'#c5a0ff',description:'Z: puxa inimigos provocados e causa uma onda de dano em mobs e minérios a 1.300 unidades. Alcance normal +350.',icon:'magnet'},
  {id:'utility_reactor',name:'Reator Quantium',rarity:'QUANTIUM',coins:1200000,materials:[['ABSOLUT',20],['QUANTIUM',3]],speed:.35,mining:2,active:'reactor',radius:1900,mult:15,cooldown:20,color:'#7dfaff',description:'Mineração +200%, velocidade +35%. Z: supernova de combate e mineração a 1.900 unidades.',icon:'reactor'},
  {id:'utility_eye',name:'Olho de Aleph',rarity:'ALEPH',coins:5000000,materials:[['QUANTIUM',15],['ALEPH',2]],speed:1,vision:900,zoom:.5,range:500,mining:3,description:'Velocidade +100%, campo de visão +100%, luz +900, alcance +500 e mineração +300%.',icon:'eye'}
);
for(const utility of UTILITIES){
  utility.type='utility';utility.amount=1;
  utility.color=rarities.find(r=>r.name===utility.rarity)?.color || '#c5e5af';
  if(utility.icon)utility.img=loadImg('sprites/utility_'+utility.icon+'.png');
}
LANTERN.description='F: liga a lanterna e adiciona 260 de luz na caverna. Funciona mesmo com outra utilidade equipada.';
const ROMAN_RANKS=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
function equippedUtility(){return UTILITIES.find(u=>u.id===player.equipment.utility?.id || u.name===player.equipment.utility?.name) || null;}
function utilityBonus(name){return equippedUtility()?.[name] || 0;}
function cameraZoom(){return equippedUtility()?.zoom || 1;}
function worldViewWidth(){return canvas.width/cameraZoom();}
function worldViewHeight(){return canvas.height/cameraZoom();}
function ownsGear(recipe){return player.equipment[recipe.type]?.name===recipe.name || player.inventory.some(i=>i.type===recipe.type && i.name===recipe.name && (i.amount ?? 1)>0);}
function gearStatus(recipe){return {owned:ownsGear(recipe),previousReady:true,coinsReady:player.coins>=recipe.coins,materialsReady:recipe.materials.every(([name,count])=>materialCount(name)>=count)};}
function craftGear(recipe){
  if(isServerWorld())return recipe && requestPlayerAction('gear',{type:recipe.type,name:recipe.name});
  if(!recipe || player.dead)return false;
  const state=gearStatus(recipe);
  if(!state.owned){
    if(!state.coinsReady || !state.materialsReady || !consumeMaterials(recipe.materials))return false;
    player.coins-=recipe.coins;player.inventory.push({...recipe});
  }
  player.equipment[recipe.type]={...recipe};if(recipe.type==='utility')player.selectedSlot=3;
  restoreUtility();saveGame();return true;
}
function restoreArmor(){
  const definition=ARMORS.find(a=>a.name===player.equipment.armor?.name);
  if(definition)player.equipment.armor={...definition};
  for(const item of player.inventory){const recipe=(item.type==='armor' ? ARMORS : item.type==='utility' ? UTILITIES : []).find(r=>r.name===item.name);if(recipe)Object.assign(item,recipe);}
}
function armorReduction(){return ARMORS.find(a=>a.name===player.equipment.armor?.name)?.defense || 0;}
function drawPlayerArmor(x,y,entity){
  const armor=entity===player ? player.equipment.armor : ARMORS.find(a=>a.name===entity.armor);
  if(!armor)return;
  ctx.save();
  if(armor.aura){
    if(settings.particles){
      const color=equipmentParticleColor(armor),time=performance.now()/750;
      ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=10;
      for(let i=0;i<12;i++){const angle=time+i*Math.PI/6,radius=36+Math.sin(time*2+i)*7;ctx.globalAlpha=.45+.45*Math.sin(time+i)**2;ctx.beginPath();ctx.arc(x+Math.cos(angle)*radius,y+Math.sin(angle)*radius,2+i%3,0,Math.PI*2);ctx.fill();}
    }
  }else{
    const colors=['#b18a56','#a3a5a8','#cbd3da','#e7c34e','#e06363','#73e8ef'];
    ctx.strokeStyle=colors[ARMORS.findIndex(a=>a.name===armor.name)] || '#d4dce3';ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=5;
    ctx.beginPath();ctx.arc(x,y+5,23,.1,Math.PI-.1);ctx.stroke();
    ctx.fillRect(x-28,y+1,8,14);ctx.fillRect(x+20,y+1,8,14);
  }
  ctx.restore();
}
function normalizeOreScale(ore){
  if(!ore?.rarity)return;
  // Scaling must never move deposits out of their spawn cells.
  ore.size=GAME_CATALOG.oreRadius(ore.rarity.name);
}
function targetSurface(target){
  const dx=player.x-target.x,dy=player.y-target.y,distance=Math.hypot(dx,dy)||1;
  return {x:target.x+dx/distance*Math.min(target.size,distance),y:target.y+dy/distance*Math.min(target.size,distance)};
}
function useUtilityAbility(){
  if(isServerWorld())return requestSharedAbility('utility');
  const utility=equippedUtility(),now=Date.now();
  if(player.dead || isUiBlocking() || !utility?.active || now<(player.abilityReadyAt.utility || 0))return false;
  player.abilityReadyAt.utility=now+utility.cooldown*1000*(1-talentRank('resonance')*.03);
  abilityEffects.push({...utility,x:player.x,y:player.y,life:1.2,maxLife:1.2});
  const tool=player.equipment.pickaxe?.power || 5,damage=(tool+player.damage)*(utility.mult || 1)*(1+player.level*.02);
  const targets=[...mobs.map(target=>({target,isMob:true})),...ores.map(target=>({target,isMob:false}))];
  for(const {target,isMob} of targets){
    const surface=targetSurface(target);
    if(Math.hypot(surface.x-player.x,surface.y-player.y)>utility.radius || !caveLineClear(player.x,player.y,surface.x,surface.y))continue;
    if(utility.active==='magnet' && isMob && creatureAggressive(target))moveWithWalls(target,target.x+(player.x-target.x)*.45,target.y+(player.y-target.y)*.45,target.size*.65);
    damageEntity(target,damage,isMob);
  }
  miningBurst(player.x,player.y,utility.color,40);saveGame();return true;
}
window.addEventListener('keydown',event=>{if(!event.repeat && !event.target.closest?.('input,textarea,select,[role="dialog"]') && event.key.toLowerCase()==='z')useUtilityAbility();});
