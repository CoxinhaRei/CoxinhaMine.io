const workshop=document.createElement('section');
workshop.className='garden-panel workshop';workshop.hidden=true;
workshop.setAttribute('role','dialog');workshop.setAttribute('aria-label','Loja de equipamentos');
workshop.innerHTML=`
  <header class="garden-panel-header"><h1>Loja de equipamentos</h1><button class="panel-close" aria-label="Fechar loja">×</button></header>
  <div class="workshop-wallet"><span>Oficina do jardim</span><b id="workshop-coins"></b></div>
  <nav class="system-tabs shop-tabs"><button data-shop="pickaxe" class="active">Picaretas</button><button data-shop="weapon">Espadas</button><button data-shop="armor">Armaduras</button></nav>
  <div class="workshop-body"><nav id="pickaxe-catalog" class="pickaxe-catalog" aria-label="Catálogo de equipamentos"></nav>
  <div class="recipe-detail"><div class="equipped-note">Equipada <strong id="workshop-equipped"></strong></div>
    <div class="pickaxe-hero"><img id="recipe-preview" alt=""><div><small id="recipe-kind"></small><h2 id="recipe-name"></h2><b id="recipe-power"></b></div></div>
    <h3>Ingredientes necessários</h3><div id="recipe-materials" class="recipe-materials"></div>
    <p id="recipe-prerequisite" class="recipe-prerequisite"></p><button id="craft-pickaxe" class="craft-pickaxe"></button><p id="recipe-result" role="status" class="recipe-result"></p>
  </div></div>`;
document.body.append(workshop);
let shopCategory='pickaxe',selectedRecipe='Pedra',lastShopState='';
const catalog=document.getElementById('pickaxe-catalog');
workshop.addEventListener('pointerover',()=>{movementAimActive=false;});
workshop.querySelector('.panel-close').onclick=()=>{shopOpen=false;};
workshop.querySelectorAll('[data-shop]').forEach(button=>button.onclick=()=>{
  shopCategory=button.dataset.shop;selectedRecipe=shopCategory==='utility' ? 'Lanterna' : shopCategory==='pickaxe' ? 'Pedra' : 'Madeira';lastShopState='';renderWorkshop();
});
document.getElementById('craft-pickaxe').onclick=()=>{
  const ok=shopCategory==='utility' ? craftUtility(selectedRecipe) : shopCategory==='armor' ? craftGear(ARMORS.find(a=>a.name===selectedRecipe)) : shopCategory==='weapon' ? craftSword(selectedRecipe) : craftPickaxe(selectedRecipe);
  document.getElementById('recipe-result').textContent=ok ? 'Equipamento pronto!' : 'Complete os ingredientes necessários.';
  lastShopState='';renderWorkshop();
};
function renderWorkshop(){
  workshop.hidden=!shopOpen;if(!shopOpen)return;
  const recipes=shopCategory==='utility' ? UTILITIES : shopCategory==='armor' ? ARMORS : shopCategory==='weapon' ? SWORDS : PICKAXE_RECIPES;
  const state=JSON.stringify([shopCategory,selectedRecipe,player.coins,Object.values(player.equipment).map(i=>i?.name),player.inventory.map(i=>[i.name,i.type,i.amount])]);
  if(state===lastShopState)return;lastShopState=state;
  catalog.replaceChildren();
  recipes.forEach((recipe,index)=>{
    const button=document.createElement('button');button.dataset.recipe=recipe.name;
    const img=document.createElement('img');img.src=shopCategory!=='pickaxe' ? recipe.img.src : pickaxeSprites[recipe.name].src;img.alt='';
    const span=document.createElement('span');span.textContent=recipe.name;
    const small=document.createElement('small');
    const owned=['utility','armor'].includes(shopCategory) ? ownsGear(recipe) : shopCategory==='weapon' ? ownedSword(recipe.name) : ownedPickaxe(recipe.name);
    small.textContent=player.equipment[shopCategory]?.name===recipe.name ? 'EQUIPADA' : owned ? 'OBTIDA' : 'RECEITA';
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
  const materials=document.getElementById('recipe-materials');materials.replaceChildren();
  for(const entry of ingredients){
    const chip=document.createElement('div');chip.className='ingredient '+(entry.have>=entry.need ? 'ready' : 'missing');
    chip.style.setProperty('--item-color',entry.color);
    const icon=document.createElement('i');icon.className=entry.coin ? 'coin-icon' : 'ore-icon';icon.style.background=entry.color;
    if(!entry.coin){icon.style.background='transparent';const image=document.createElement('img');image.src=itemPreview({type:'material',oreRarity:entry.name,name:entry.name});image.alt='';icon.append(image);}
    const label=document.createElement('div'),name=document.createElement('span'),count=document.createElement('b');
    name.textContent=entry.name;count.textContent=entry.have.toLocaleString('pt-BR')+' / '+entry.need.toLocaleString('pt-BR');
    label.append(name,count);chip.append(icon,label);materials.append(chip);
  }
  document.getElementById('recipe-prerequisite').textContent=shopCategory==='utility' ? 'Equipe uma utilidade por vez. A lanterna continua disponível no F.' : shopCategory==='armor' ? 'A armadura protege em qualquer slot selecionado. Receita independente.' : index ? 'Requer possuir '+recipes[index-1].name+'.' : 'Equipamento inicial.';
  const action=document.getElementById('craft-pickaxe'),equipped=player.equipment[shopCategory]?.name===recipe.name;
  action.textContent=equipped ? 'Equipada ✓' : status.owned ? 'Equipar' : 'Criar e equipar';
  action.disabled=equipped || (!status.owned && (!status.previousReady || !status.coinsReady || !status.materialsReady));
  workshop.querySelectorAll('[data-shop]').forEach(b=>b.classList.toggle('active',b.dataset.shop===shopCategory));
}


