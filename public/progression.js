const PICKAXE_RECIPES = [
  {name:'Madeira', coins:0, materials:[]},
  {name:'Pedra', coins:100, materials:[['Comum',15]]},
  {name:'Ferro', coins:450, materials:[['Comum',25],['Incomum',15]]},
  {name:'Ouro', coins:1200, materials:[['Incomum',30],['Raro',20]]},
  {name:'Matéria Vermelha', coins:3500, materials:[['Raro',40],['Épico',25]]},
  {name:'Diamante', coins:9000, materials:[['Épico',50],['Lendário',30]]},
  {name:'Void', coins:25000, materials:[['Lendário',60],['Mítico',35],['ULTRA',10]]},
  {name:'Solar', coins:75000, materials:[['Mítico',80],['ULTRA',35],['SUPER',5],['ABSOLUT',1]]}
];
const TALENT_TIERS = ['Comum','Incomum','Raro','Épico','Lendário','Mítico','Ultra','Super','Absolut','Quantium','Aleph'];
const TALENT_COLORS = ['#87bf68','#e0cb62','#619bd4','#a779c9','#db8d57','#e56593','#d372e2','#60d9cf','#eff2e5','#62bfee','#eada70'];
const TALENTS = [
  {id:'broodpower',name:'Fúria da Ninhada',symbol:'⚔',description:'+15% de dano das invocações dos ovos por nível.',parent:null},
  {id:'broodvitality',name:'Vigor da Ninhada',symbol:'♥',description:'+20% de vida das invocações dos ovos por nível.',parent:null},
  {id:'broodspeed',name:'Marcha do Enxame',symbol:'➜',description:'+12% de velocidade de movimento das invocações por nível.',parent:null},
  {id:'broodhaste',name:'Frenesi do Enxame',symbol:'↻',description:'+10% de frequência de ataque das invocações por nível.',parent:'broodpower'},
  {id:'fov',name:'Visão ampliada',symbol:'◉',description:'+30% de campo de visão máximo por nível. Ajuste com o scroll.',parent:'speed'},
  {id:'damage',name:'Impacto',symbol:'⚒',description:'+12% de dano por nível.',parent:null},
  {id:'speed',name:'Agilidade',symbol:'➜',description:'+8% de velocidade por nível.',parent:null},
  {id:'vitality',name:'Vitalidade',symbol:'♥',description:'Vida base: 1.000. Vitalidade adiciona 1.000 × nível²; com acessórios, até 400.000 de vida.',parent:null},
  {id:'crit',name:'Precisão',symbol:'✧',description:'+3% de chance de dano dobrado por nível.',parent:'damage'},
  {id:'range',name:'Alcance',symbol:'◎',description:'+18 de alcance de ataques e mineração por nível. Pode investir diretamente.',parent:null},
  {id:'defense',name:'Proteção',symbol:'⛨',description:'Reduz o dano recebido em 4% por nível.',parent:'vitality'},
  {id:'drain',name:'Vampirismo',symbol:'◒',description:'Recupera 1,5% do dano real em vida por nível.',parent:'crit'},
  {id:'haste',name:'Ritmo',symbol:'↻',description:'Reduz a espera entre golpes em 5% por nível.',parent:'range'},
  {id:'fortune',name:'Prosperidade',symbol:'✦',description:'+2% de chance de minério extra por nível.',parent:'defense'},
  {id:'xp',name:'Aprendizado',symbol:'★',description:'+10% de experiência por nível.',parent:'drain'}
];
let lastMiningHit = -Infinity;
const guardianImage = loadImg('sprites/Mob.png');
socket.on('oreUpdate', ore => {
  if(!ore?.id || !ore.rarity || !Number.isFinite(ore.x) || !Number.isFinite(ore.y)) return;
  const destination=currentRealm==='cave' ? realmStates.garden.ores : ores;
  const index=destination.findIndex(existing=>existing.id===ore.id);
  if(index>=0)destination[index]=ore;
  else destination.push(ore);
});

function talentRank(id) { return player.talentRanks?.[id] || 0; }
function normalizeProgression() {
  player.talentRanks = Object.fromEntries(TALENTS.map(t => [t.id, Math.max(0, Math.min(11, Math.floor(Number(player.talentRanks?.[t.id]) || 0)))]));
  const spent = Object.values(player.talentRanks).reduce((sum, rank) => sum + rank*(rank+1)/2, 0);
  const legacyPoints = Math.max(0, Math.floor(player.level-1-spent));
  player.talentPoints = Number.isFinite(player.talentPoints) ? Math.max(0, Math.floor(player.talentPoints)) : legacyPoints;
  player.maxHp = GAME_CATALOG.playerHealth(player,EXPANSION.bonuses(player).health);
}

function materialRarity(item) {
  if(item.type !== 'material') return null;
  return item.oreRarity || item.name?.replace(/^Minério\s+/i,'') || item.id?.replace(/_material$/,'');
}
function materialCount(rarity) {
  return player.inventory.reduce((sum,item) => materialRarity(item) === rarity ? sum + Math.max(0, Math.floor(item.amount ?? 1)) : sum, 0);
}
function addOreMaterial(rarity, amount=1) {
  const existing = player.inventory.find(item => materialRarity(item) === rarity.name);
  if(existing) existing.amount = (existing.amount ?? 1) + amount;
  else player.inventory.push({id:rarity.name+'_material',name:rarity.name,oreRarity:rarity.name,type:'material',amount,color:rarity.color,value:ORE_VALUES[rarity.name] || 1});
}
function ownedPickaxe(name) {
  return name === 'Madeira' || player.equipment.pickaxe?.name === name || player.inventory.some(item => item.type === 'pickaxe' && item.name === name);
}
function recipeStatus(recipe) {
  const index = PICKAXE_RECIPES.indexOf(recipe);
  const previous = index > 0 ? PICKAXE_RECIPES[index-1].name : null;
  return {
    owned:ownedPickaxe(recipe.name),
    previousReady:!previous || ownedPickaxe(previous),
    coinsReady:player.coins >= recipe.coins,
    materialsReady:GAME_CATALOG.canUse(player,recipe)&&GAME_CATALOG.gearComponentsReady(player,recipe)&&recipe.materials.every(([name,amount]) => materialCount(name) >= amount)
  };
}
function equipPickaxe(name) {
  if(isServerWorld())return requestPlayerAction('equip',{type:'pickaxe',name});
  if(!ownedPickaxe(name)||!GAME_CATALOG.canUse(player,{name})) return false;
  const definition = pickaxes.find(p => p.name === name);
  if(!definition) return false;
  player.equipment.pickaxe = {...definition,id:'pickaxe_'+name,type:'pickaxe',img:pickaxeSprites[name]};
  saveGame();
  return true;
}
function craftPickaxe(name) {
  if(isServerWorld())return requestPlayerAction('pickaxe',{name});
  const recipe = PICKAXE_RECIPES.find(p => p.name === name);
  if(!recipe) return false;
  const status = recipeStatus(recipe);
  if(status.owned) return equipPickaxe(name);
  if(!status.previousReady || !status.coinsReady || !status.materialsReady) return false;
  // Validate the entire recipe first, then consume stacked legacy or new materials.
  for(const [rarity,required] of recipe.materials) {
    let remaining = required;
    for(const item of player.inventory) {
      if(materialRarity(item) !== rarity || remaining <= 0) continue;
      const used = Math.min(item.amount ?? 1, remaining);
      item.amount = (item.amount ?? 1)-used;
      remaining -= used;
    }
  }
  player.inventory = player.inventory.filter(item => item.type !== 'material' || item.amount > 0);
  GAME_CATALOG.consumeGearComponents(player,recipe);
  player.coins -= recipe.coins;
  const definition = pickaxes.find(p => p.name === name);
  player.inventory.push({...definition,id:'pickaxe_'+name,type:'pickaxe',amount:1,color:TALENT_COLORS[PICKAXE_RECIPES.indexOf(recipe)],img:pickaxeSprites[name]});
  equipPickaxe(name);
  addChat('Picareta de '+name+' criada e equipada!');
  return true;
}
function resetTalentRanks(){
  const spent=TALENTS.reduce((sum,t)=>{const n=Math.max(0,Math.min(11,Math.floor(Number(player.talentRanks?.[t.id])||0)));return sum+n*(n+1)/2;},0);if(!spent)return false;
  player.talentPoints=Math.max(0,Math.floor(Number(player.talentPoints)||0))+spent;player.talentRanks=Object.fromEntries(TALENTS.map(t=>[t.id,0]));player.talents={speed:0};player.maxHp=GAME_CATALOG.playerHealth(player,EXPANSION.bonuses(player).health);player.hp=Math.min(player.hp,player.maxHp);saveGame();return true;
}
function unlockTalent(id) {
  if(isServerWorld())return requestPlayerAction('talent',{id});
  const talent = TALENTS.find(t => t.id === id);
  if(!talent) return false;
  const rank = talentRank(id);
  const cost = rank+1;
  if(rank>=11 || player.talentPoints<cost || (talent.parent && !talentRank(talent.parent))) return false;
  player.talentPoints -= cost;
  player.talentRanks[id] = rank+1;
  if(id==='vitality') { player.maxHp=GAME_CATALOG.playerHealth(player,EXPANSION.bonuses(player).health);player.hp=Math.min(player.maxHp,player.hp); }
  saveGame();
  return true;
}

function handleMiningClick(screenX,screenY) {
  if(player.dead)return;
  const now = performance.now();
  const cooldown = Math.max(70, 350*(1-talentRank('haste')*.05)*(1-utilityBonus('haste'))/(player.miningSpeed || 1));
  if(now-lastMiningHit<cooldown || (!player.equipment.pickaxe && !player.equipment.weapon)) return;
  const point = {x:(screenX-canvas.width/2)/cameraZoom()+player.x,y:(screenY-canvas.height/2)/cameraZoom()+player.y};
  const range = 175 + talentRank('range')*18 + (player.range || 0)+utilityBonus('range');
  const mob = player.selectedSlot===0 ? mobs.find(m => Math.hypot(m.x-point.x,m.y-point.y)<m.size && Math.hypot(m.x-player.x,m.y-player.y)<=range+m.size) : null;
  const ore = player.selectedSlot===2 ? ores.find(o => o?.rarity && Math.hypot(o.x-point.x,o.y-point.y)<o.size+12 && Math.hypot(o.x-player.x,o.y-player.y)<=range+o.size) : null;
  if(!mob && !ore) return;
  const surface=targetSurface(mob || ore);
  if(!caveLineClear(player.x,player.y,surface.x,surface.y))return;
  const tool=mob ? player.equipment.weapon : player.equipment.pickaxe;
  if(!tool)return;
  lastMiningHit = now;
  player.swingUntil=now+160;
  if(isServerWorld()){socket.emit('attack',{targetId:(mob || ore).id,type:mob ? 'weapon' : 'pickaxe'});return;}
  let damage = (player.damage+(tool.type==='weapon' ? tool.damage || 5 : tool.power || 5))*(1+.12*talentRank('damage'));
  if(!mob)damage*=1+utilityBonus('mining');
  if(Math.random()<talentRank('crit')*.03+(player.crit || 0)/100) damage*=2;
  const target = mob || ore;
  damageEntity(target,damage,!!mob);

}

function spawnOreGuardian(ore) {
  const mob=createCreature('guardian',ore.rarity,ore.x,ore.y);
  mobs.push(mob);noteCreature(mob);
  if(player.journal)player.journal.seen[ore.rarity.name]=(player.journal.seen[ore.rarity.name] || 0)+1;
  addChat('Um guardião '+ore.rarity.name+' saiu do minério!');
  return mob;
}
function updateGuardians(dt){updateCreatureMovement(dt);}
function drawGuardians(){drawCreatures();}

function drawCrystal(ore, brush=ctx) {
  const index = Math.max(0,rarities.findIndex(r=>r.name===ore.rarity.name));
  if(!ore.crystalPoints || ore.crystalSize!==ore.size) {
    ore.crystalSize=ore.size;
    let seed = [...String(ore.id)].reduce((sum,c)=>sum+c.charCodeAt(0),0);
    const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    const smoothness=Math.max(0,Math.min(1,(ore.size-20)/150));
    const count=5+Math.min(4,index);
    ore.crystalPoints=Array.from({length:count*2},(_,i)=>({angle:i*Math.PI/count,radius:i%2 ? .40+smoothness*.46+random()*.10 : .94+random()*.12}));
  }
  brush.save();brush.translate(ore.x,ore.y);brush.rotate(ore.rotation || 0);
  brush.globalAlpha=ore.hit>0 ? .7 : 1;
  if(ore.hit>0)ore.hit--;
  const vertices=ore.crystalPoints.map(p=>({x:Math.cos(p.angle)*p.radius*ore.size,y:Math.sin(p.angle)*p.radius*ore.size}));
  brush.beginPath();vertices.forEach((p,i)=>i ? brush.lineTo(p.x,p.y) : brush.moveTo(p.x,p.y));brush.closePath();
  brush.fillStyle=index>=7 ? rarityPaint(ore.rarity,-ore.size,-ore.size,ore.size*2,brush) : '#646d70';brush.fill();brush.strokeStyle=rarityPaint(ore.rarity,-ore.size,-ore.size,ore.size*2,brush);brush.lineWidth=2.5;brush.stroke();
  for(let i=0;i<vertices.length;i+=2){
    const a=vertices[i],b=vertices[(i+1)%vertices.length];
    brush.beginPath();brush.moveTo(-ore.size*.1,-ore.size*.05);brush.lineTo(a.x,a.y);brush.lineTo(b.x,b.y);brush.closePath();
    brush.fillStyle=i%4===0 ? '#b5c4c480' : '#29384270';brush.fill();
  }
  brush.restore();
}
