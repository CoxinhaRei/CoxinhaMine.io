const workshop=document.createElement('section');
workshop.className='garden-panel workshop';workshop.hidden=true;
workshop.setAttribute('role','dialog');workshop.setAttribute('aria-label','Loja de equipamentos');
workshop.innerHTML=`
  <header class="garden-panel-header"><h1>Loja de equipamentos</h1><button class="panel-close" aria-label="Fechar loja">×</button></header>
  <div class="workshop-wallet"><span>Oficina do jardim</span><b id="workshop-coins"></b></div>
  <nav class="system-tabs shop-tabs"><button data-shop="pickaxe" class="active">Picaretas</button><button data-shop="weapon">Espadas</button><button data-shop="armor">Armaduras</button><button data-shop="ranged">Armas à distância</button></nav>
  <div class="workshop-body"><nav id="pickaxe-catalog" class="pickaxe-catalog" aria-label="Catálogo de equipamentos"></nav>
  <div class="recipe-detail"><div class="equipped-note">Equipada <strong id="workshop-equipped"></strong></div>
    <div class="pickaxe-hero"><img id="recipe-preview" alt=""><div><small id="recipe-kind"></small><h2 id="recipe-name"></h2><b id="recipe-power"></b></div></div>
    <h3>Ingredientes necessários</h3><div id="recipe-materials" class="recipe-materials"></div>
    <p id="recipe-prerequisite" class="recipe-prerequisite"></p><button id="craft-pickaxe" class="craft-pickaxe"></button><p id="recipe-result" role="status" class="recipe-result"></p>
  </div></div>`;
document.body.append(workshop);
let shopCategory='pickaxe',selectedRecipe='Pedra',lastShopState='',rangedShopBusy=false;
const catalog=document.getElementById('pickaxe-catalog');
workshop.addEventListener('pointerover',()=>{movementAimActive=false;});
workshop.querySelector('.panel-close').onclick=()=>{shopOpen=false;};
workshop.querySelectorAll('[data-shop]').forEach(button=>button.onclick=()=>{
  shopCategory=button.dataset.shop;selectedRecipe=shopCategory==='utility' ? 'Lanterna' : shopCategory==='pickaxe' ? 'Pedra' : shopCategory==='ranged' ? RANGED_CATALOG.WEAPONS[0].name : 'Madeira';lastShopState='';renderWorkshop();
});
document.getElementById('craft-pickaxe').onclick=async()=>{
  if(shopCategory==='ranged'){await craftRangedFromShop();return;}
  const ok=shopCategory==='utility' ? craftUtility(selectedRecipe) : shopCategory==='armor' ? craftGear(ARMORS.find(a=>a.name===selectedRecipe)) : shopCategory==='weapon' ? craftSword(selectedRecipe) : craftPickaxe(selectedRecipe);
  document.getElementById('recipe-result').textContent=ok ? 'Equipamento pronto!' : 'Complete os ingredientes necessários.';
  lastShopState='';renderWorkshop();
};
function renderWorkshop(){
  workshop.hidden=!shopOpen;if(!shopOpen)return;if(shopCategory==='ranged'){renderRangedWorkshop();return;}
  const recipes=shopCategory==='utility' ? UTILITIES : shopCategory==='armor' ? ARMORS : shopCategory==='weapon' ? SWORDS.filter(s=>!s.rangedId) : PICKAXE_RECIPES;
  const state=JSON.stringify([shopCategory,selectedRecipe,player.coins,player.level,player.ascensions,Object.values(player.equipment).map(i=>i?.name),player.inventory.map(i=>[i.name,i.type,i.amount])]);
  if(state===lastShopState)return;lastShopState=state;
  catalog.replaceChildren();
  recipes.forEach((recipe,index)=>{
    const button=document.createElement('button');button.dataset.recipe=recipe.name;
    const img=document.createElement('img');img.src=shopCategory!=='pickaxe' ? recipe.img.src : pickaxeSprites[recipe.name].src;img.alt='';
    const span=document.createElement('span');span.textContent=recipe.name;
    const small=document.createElement('small');
    const owned=['utility','armor'].includes(shopCategory) ? ownsGear(recipe) : shopCategory==='weapon' ? ownedSword(recipe.name) : ownedPickaxe(recipe.name);
    small.textContent=!GAME_CATALOG.canUse(player,recipe)?'🔒 LV. '+GAME_CATALOG.itemLevel(recipe):player.equipment[shopCategory]?.name===recipe.name ? 'EQUIPADA' : owned ? 'OBTIDA' : 'RECEITA';
    button.style.setProperty('--rarity',rarities[itemRarityIndex(recipe)].color);decorateRarity(button,itemRarityIndex(recipe));button.classList.toggle('selected',selectedRecipe===recipe.name);
    button.setAttribute('aria-pressed',String(selectedRecipe===recipe.name));button.append(img,span,small);
    button.onclick=()=>{selectedRecipe=recipe.name;lastShopState='';document.getElementById('recipe-result').textContent='';renderWorkshop();};catalog.append(button);
  });
  const recipe=recipes.find(r=>r.name===selectedRecipe),index=recipes.indexOf(recipe);
  const status=['utility','armor'].includes(shopCategory) ? gearStatus(recipe) : shopCategory==='weapon' ? swordRecipeStatus(recipe) : recipeStatus(recipe);
  document.getElementById('workshop-coins').textContent='◉ '+player.coins.toLocaleString('pt-BR');
  document.getElementById('workshop-equipped').textContent=player.equipment[shopCategory]?.name || 'Nenhuma';
  const preview=document.getElementById('recipe-preview');preview.src=shopCategory!=='pickaxe' ? recipe.img.src : pickaxeSprites[recipe.name].src;
  preview.alt=shopCategory==='utility' ? recipe.name : (shopCategory==='armor' ? 'Armadura de ' : shopCategory==='weapon' ? 'Espada de ' : 'Picareta de ')+recipe.name;
  preview.classList.toggle('enchanted',!!equipmentParticleColor(recipe));
  preview.style.setProperty('--preview-color',rarities[itemRarityIndex(recipe)].color);
  document.getElementById('recipe-kind').textContent=shopCategory==='utility' ? 'UTILIDADE · '+recipe.rarity : shopCategory==='armor' ? 'ARMADURA · '+recipe.rarity : shopCategory==='weapon' ? 'ESPADA' : 'PICARETA';
  document.getElementById('recipe-name').textContent=recipe.name;
  document.getElementById('recipe-power').textContent=shopCategory==='utility' ? recipe.description : shopCategory==='armor' ? Math.round(recipe.defense*100)+'% de redução de dano'+(recipe.aura ? ' · aura de partículas' : ' · proteção visível') : 'Dano +'+(shopCategory==='weapon' ? recipe.damage : pickaxes[index].power);
  const ingredients=[{name:'Moedas',have:player.coins,need:recipe.coins,color:'#f6d76c',coin:true},...recipe.materials.map(([name,count])=>({name,have:materialCount(name),need:count,color:rarities.find(r=>r.name===name).color}))];
  for(const [kind,need] of GAME_CATALOG.gearComponents(recipe,shopCategory))ingredients.push({name:GAME_CATALOG.MOB_LOOT[kind]||CREATURES.find(m=>m.kind===kind)?.drop||kind,kind,have:GAME_CATALOG.componentCount(player,kind),need,color:'#b2d3a0'});
  paintWorkshopIngredients(ingredients);
  document.getElementById('recipe-prerequisite').textContent=shopCategory==='utility' ? 'Equipe uma utilidade por vez. A lanterna continua disponível no F.' : shopCategory==='armor' ? 'A armadura protege em qualquer slot selecionado. Receita independente.' : index ? 'Requer possuir '+recipes[index-1].name+'.' : 'Equipamento inicial.';
  const action=document.getElementById('craft-pickaxe'),equipped=player.equipment[shopCategory]?.name===recipe.name;
  action.textContent=!GAME_CATALOG.canUse(player,recipe)?'🔒 Requer nível '+GAME_CATALOG.itemLevel(recipe):equipped ? 'Equipada ✓' : status.owned ? 'Equipar' : 'Criar e equipar';
  action.disabled=!GAME_CATALOG.canUse(player,recipe)||equipped || (!status.owned && (!status.previousReady || !status.coinsReady || !status.materialsReady));
  workshop.querySelectorAll('[data-shop]').forEach(b=>b.classList.toggle('active',b.dataset.shop===shopCategory));
}



function paintWorkshopIngredients(ingredients){
  const materials=document.getElementById('recipe-materials');materials.replaceChildren();
  for(const entry of ingredients){
    const chip=document.createElement('div');chip.className='ingredient '+(entry.have>=entry.need ? 'ready' : 'missing');
    chip.style.setProperty('--item-color',entry.color);
    const icon=document.createElement('i');icon.className=entry.coin ? 'coin-icon' : 'ore-icon';icon.style.background=entry.color;
    if(!entry.coin){icon.style.background='transparent';const image=document.createElement('img');image.src=itemPreview(entry.kind?{type:'component',kind:entry.kind,rarity:'Comum',name:entry.name}:{type:'material',oreRarity:entry.name,name:entry.name});image.alt='';icon.append(image);}
    const label=document.createElement('div'),name=document.createElement('span'),count=document.createElement('b');
    name.textContent=entry.name;count.textContent=entry.have.toLocaleString('pt-BR')+' / '+entry.need.toLocaleString('pt-BR');
    label.append(name,count);chip.append(icon,label);materials.append(chip);
  }
}

async function craftRangedFromShop(){
 if(rangedShopBusy)return;const def=RANGED_CATALOG.definition(selectedRecipe);if(!def)return;
 rangedShopBusy=true;lastShopState='';renderWorkshop();
 try{const result=await callServer('playerAction',{kind:'rangedCraft',data:{id:def.id}});document.getElementById('recipe-result').textContent=result?.ok?'Arma à distância pronta e equipada no slot 4!':result?.message||'Complete os ingredientes necessários.';inventorySignature='';}
 finally{rangedShopBusy=false;lastShopState='';renderWorkshop();}
}
function renderRangedWorkshop(){
 const R=RANGED_CATALOG,recipes=R.WEAPONS.map(w=>SWORDS.find(s=>s.name===w.name)),recipe=recipes.find(r=>r.name===selectedRecipe)||recipes[0];selectedRecipe=recipe.name;
 const signature=JSON.stringify(['ranged',selectedRecipe,player.coins,player.equipment.ranged?.name,player.inventory.map(i=>[i.name,i.type,i.kind,i.amount]),rangedShopBusy]);if(signature===lastShopState)return;lastShopState=signature;
 catalog.replaceChildren();for(const entry of recipes){const button=document.createElement('button');button.dataset.recipe=entry.name;const image=document.createElement('img');image.src=entry.img.src;image.alt='';const name=document.createElement('span');name.textContent=entry.name;const label=document.createElement('small');label.textContent=player.equipment.ranged?.name===entry.name?'EQUIPADA':R.owned(player,entry.name)?'OBTIDA':'RECEITA';button.style.setProperty('--rarity',rarities[0].color);decorateRarity(button,0);button.classList.toggle('selected',entry.name===recipe.name);button.setAttribute('aria-pressed',String(entry.name===recipe.name));button.append(image,name,label);button.onclick=()=>{selectedRecipe=entry.name;lastShopState='';document.getElementById('recipe-result').textContent='';renderWorkshop();};catalog.append(button);}
 const cost=R.acquisitionCost(recipe.rangedId);document.getElementById('workshop-coins').textContent='◉ '+player.coins.toLocaleString('pt-BR');document.getElementById('workshop-equipped').textContent=player.equipment.ranged?.name||'Nenhuma';const preview=document.getElementById('recipe-preview');preview.src=recipe.img.src;preview.alt=recipe.name;preview.classList.remove('enchanted');preview.style.setProperty('--preview-color',rarities[0].color);document.getElementById('recipe-kind').textContent='ARMA À DISTÂNCIA · COMUM';document.getElementById('recipe-name').textContent=recipe.name;document.getElementById('recipe-power').textContent='Dano '+recipe.damage.toLocaleString('pt-BR')+(recipe.returning?' por impacto · ida e volta':'')+' · Recarga '+recipe.cooldown+'s';
 const ingredients=[{name:'Moedas',have:player.coins,need:cost.coins,color:'#f6d76c',coin:true},{name:cost.rarity,have:R.materialCount(player,cost.rarity),need:cost.ore,color:rarities.find(r=>r.name===cost.rarity).color}];if(cost.components)ingredients.push({name:GAME_CATALOG.MOB_LOOT[cost.kind]||cost.kind,kind:cost.kind,have:R.componentCount(player,cost.kind),need:cost.components,color:'#b2d3a0'});paintWorkshopIngredients(ingredients);
 document.getElementById('recipe-prerequisite').textContent='Espada e arma à distância usam slots separados. Fabrique a versão Comum; evolua sua raridade com a Mestra das Raízes na Jungle.'+(recipe.z?' Z: '+recipe.z+' · X: '+recipe.x+'.':'');
 const action=document.getElementById('craft-pickaxe'),equipped=player.equipment.ranged?.name===recipe.name,owned=R.owned(player,recipe.name);action.textContent=equipped?'Equipada ✓':owned?'Equipar no slot 4':'Criar e equipar';action.disabled=rangedShopBusy||equipped||(!owned&&!R.ready(player,cost));workshop.querySelectorAll('[data-shop]').forEach(b=>b.classList.toggle('active',b.dataset.shop==='ranged'));
}
