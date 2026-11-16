const workshop=document.createElement('section');
workshop.className='garden-panel workshop';workshop.hidden=true;
workshop.setAttribute('role','dialog');workshop.setAttribute('aria-label','Loja de equipamentos');
workshop.innerHTML=`
  <header class="garden-panel-header"><h1>Loja de equipamentos</h1><button class="panel-close" aria-label="Fechar loja">×</button></header>
  <div class="workshop-wallet"><span>Oficina do jardim</span><b id="workshop-coins"></b></div>
  <nav class="system-tabs shop-tabs"><button data-shop="pickaxe" class="active">Picaretas</button><button data-shop="weapon">Espadas</button><button data-shop="armor">Armaduras</button><button data-shop="utility">Utilidades</button></nav>
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

const talentPanel=document.createElement('section');
talentPanel.className='garden-panel talent-panel';talentPanel.hidden=true;
talentPanel.setAttribute('role','dialog');talentPanel.setAttribute('aria-label','Árvore de talentos');
talentPanel.innerHTML=`<header class="garden-panel-header"><h1>Talentos</h1><button type="button" class="panel-close" aria-label="Fechar talentos">×</button></header>
  <div class="talent-points"><b id="tree-points">0</b> PT <span>Ganhe 1 ponto a cada nível.</span></div>
  <div class="talent-scroll"><div class="talent-stage"><svg viewBox="0 0 600 430" aria-hidden="true"><path d="M100 55V350 M300 55V245 M500 55V245"/></svg><div id="talent-nodes"></div></div></div>
  <p class="talent-footnote">Ative o talento anterior para abrir o ramo. O próximo nível custa 1 PT a mais, até Aleph.</p>`;
document.body.append(talentPanel);
talentPanel.querySelector('.panel-close').onclick=()=>{talentsOpen=false;};
talentPanel.addEventListener('pointerover',()=>{movementAimActive=false;});
const talentPositions=TALENTS.map((_,index)=>[index%3,Math.floor(index/3)]);
const nodeContainer=document.getElementById('talent-nodes');
TALENTS.forEach((talent,index)=>{
  const button=document.createElement('button');button.type='button';button.className='talent-node';button.dataset.talent=talent.id;
  button.style.left=(talentPositions[index][0]*200+100)+'px';button.style.top=(talentPositions[index][1]*100+10)+'px';
  button.innerHTML='<span class="talent-symbol"></span><b></b><small></small><em></em>';
  button.querySelector('.talent-symbol').textContent=talent.symbol;button.querySelector('b').textContent=talent.name;
  button.onclick=()=>{selectedTalent=talent.id;renderTalentTree();};nodeContainer.append(button);
});
const treeHeight=Math.ceil(TALENTS.length/3)*100+15;
const treeStage=talentPanel.querySelector('.talent-stage'),treeSvg=treeStage.querySelector('svg');
treeStage.style.height=treeHeight+'px';treeSvg.style.height=treeHeight+'px';treeSvg.setAttribute('viewBox','0 0 600 '+treeHeight);
treeSvg.querySelector('path').setAttribute('d',TALENTS.filter(t=>t.parent).map(t=>{
  const child=talentPositions[TALENTS.indexOf(t)],parent=talentPositions[TALENTS.findIndex(p=>p.id===t.parent)];
  return 'M'+(parent[0]*200+100)+' '+(parent[1]*100+55)+' L'+(child[0]*200+100)+' '+(child[1]*100+30);
}).join(' '));
let selectedTalent='damage',talentDetailSignature='';
const talentDetail=document.createElement('div');talentDetail.className='talent-ranks';talentPanel.append(talentDetail);
function renderTalentTree(){
  talentPanel.hidden=!talentsOpen;
  if(!talentsOpen)return;
  document.getElementById('tree-points').textContent=player.talentPoints || 0;
  for(const button of nodeContainer.children){
    const talent=TALENTS.find(t=>t.id===button.dataset.talent),rank=talentRank(talent.id),parent=talent.parent && TALENTS.find(t=>t.id===talent.parent);
    const locked=parent && !talentRank(parent.id);
    button.disabled=false;
    button.classList.toggle('selected',selectedTalent===talent.id);
    button.querySelector('b').textContent=talent.name+' '+ROMAN_RANKS[Math.max(0,rank-1)];
    button.style.setProperty('--talent-color',rank ? TALENT_COLORS[rank-1] : '#8a9290');
    button.classList.toggle('unlocked',rank>0);
    button.querySelector('small').textContent=rank ? TALENT_TIERS[rank-1]+' '+rank+'/11' : '0/11';
    button.querySelector('em').textContent=rank===11 ? 'MÁX.' : (rank+1)+' PT';
    button.title=talent.description+(locked ? ' Requer '+parent.name+'.' : '');
  }
  const talent=TALENTS.find(t=>t.id===selectedTalent),rank=talentRank(talent.id),locked=talent.parent && !talentRank(talent.parent);
  const signature=JSON.stringify([selectedTalent,rank,locked,player.talentPoints]);if(signature===talentDetailSignature)return;talentDetailSignature=signature;
  talentDetail.replaceChildren();
  const heading=document.createElement('h2');heading.textContent=talent.name+' · I a XI';const description=document.createElement('p');description.textContent=talent.description;talentDetail.append(heading,description);
  ROMAN_RANKS.forEach((roman,index)=>{
    const stage=document.createElement('button');stage.type='button';stage.style.setProperty('--stage-color',TALENT_COLORS[index]);
    stage.textContent=talent.name+' '+roman+' · '+TALENT_TIERS[index]+' · '+(index<rank ? '✓ adquirido' : (index+1)+' PT');
    stage.disabled=index!==rank || locked || player.talentPoints<index+1;
    stage.onclick=()=>{unlockTalent(talent.id);renderTalentTree();};talentDetail.append(stage);
  });
  if(locked){const note=document.createElement('p');note.textContent='Requer '+TALENTS.find(t=>t.id===talent.parent).name+' I.';talentDetail.append(note);}
}
