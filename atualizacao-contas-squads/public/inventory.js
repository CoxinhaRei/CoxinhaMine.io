const inventoryPanel=createSystemPanel('inventory','Inventário');
inventoryPanel.querySelector('.panel-close').onclick=()=>{inventoryOpen=false;};
inventoryPanel.insertAdjacentHTML('beforeend',`<div class="inventory-toolbar"><input id="inventory-search" type="search" placeholder="Buscar itens" aria-label="Buscar itens"><select id="inventory-rarity" aria-label="Filtrar raridade"><option value="all">Todas as raridades</option></select><span id="inventory-total"></span></div>
  <nav class="system-tabs inventory-tabs"><button data-inventory-type="all" class="active">Todos</button><button data-inventory-type="material">Minérios</button><button data-inventory-type="weapon">Armas</button><button data-inventory-type="pickaxe">Picaretas</button><button data-inventory-type="armor">Armaduras</button><button data-inventory-type="utility">Utilidades</button></nav>
  <div class="inventory-body"><div id="inventory-items" class="inventory-items"></div><aside id="inventory-detail" class="inventory-detail"></aside></div>`);
rarities.forEach((rarity,index)=>{const option=document.createElement('option');option.value=index;option.textContent=rarity.name;document.getElementById('inventory-rarity').append(option);});
let inventoryType='all',selectedInventoryKey=null,inventorySignature='';
inventoryPanel.querySelectorAll('[data-inventory-type]').forEach(button=>button.onclick=()=>{inventoryType=button.dataset.inventoryType;inventorySignature='';renderInventoryPanel();});
for(const id of ['inventory-search','inventory-rarity'])document.getElementById(id).addEventListener('input',()=>{inventorySignature='';renderInventoryPanel();});
const INVENTORY_TYPES={material:'Minério',weapon:'Arma',pickaxe:'Picareta',armor:'Armadura',utility:'Utilidade'};
function itemKey(item){return item.type+':'+(item.type==='material' ? materialRarity(item) : item.name);}
function inventoryRows(){
  const grouped=new Map();
  for(const item of [...player.inventory,...Object.values(player.equipment).filter(Boolean)]){
    if(!item || typeof item!=='object' || (item.amount ?? 1)<=0)continue;
    const key=itemKey(item),existing=grouped.get(key),isStored=player.inventory.includes(item);
    if(existing){if(item.type==='material' && isStored)existing.quantity+=item.amount ?? 1;continue;}
    grouped.set(key,{key,item,quantity:item.type==='material' ? item.amount ?? 1 : 1,rarityIndex:itemRarityIndex(item)});
  }
  return [...grouped.values()].sort((a,b)=>b.rarityIndex-a.rarityIndex || a.item.name.localeCompare(b.item.name,'pt-BR'));
}
function itemPreview(item){
  if(item.type==='material'){
    const index=itemRarityIndex(item),key='ore-'+index;
    if(!itemPreviewCache.has(key)){
      const image=document.createElement('canvas');image.width=96;image.height=96;
      drawCrystal({id:key,x:48,y:48,size:30,rarity:rarities[index]},image.getContext('2d'));itemPreviewCache.set(key,image.toDataURL('image/png'));
    }
    return itemPreviewCache.get(key);
  }
  if(item.type==='weapon')return SWORDS.find(s=>s.name===item.name)?.img.src || item.img?.src || null;
  if(item.type==='pickaxe')return pickaxeSprites[item.name]?.src || item.img?.src || null;
  if(item.type==='utility')return UTILITIES.find(u=>u.name===item.name)?.img.src || null;
  if(item.type==='armor')return ARMORS.find(a=>a.name===item.name)?.img.src || null;
  return item.img?.src || null;
}
function equippedItem(item){return player.equipment[item.type]?.name===item.name;}
function equipInventoryItem(item){
  if(isServerWorld()){requestPlayerAction('equip',{type:item.type,name:item.name});return;}
  if(player.dead || item.type==='material')return;
  if(item.type==='weapon'){
    const definition=SWORDS.find(s=>s.name===item.name);player.equipment.weapon=definition ? {...definition} : {...item};player.selectedSlot=0;
  }else if(item.type==='pickaxe'){
    const definition=pickaxes.find(p=>p.name===item.name);player.equipment.pickaxe=definition ? {...definition,type:'pickaxe',img:pickaxeSprites[item.name]} : {...item};player.selectedSlot=2;
  }else if(item.type==='utility'){player.equipment.utility={...(UTILITIES.find(u=>u.name===item.name) || item)};player.selectedSlot=3;}
  else if(item.type==='armor')player.equipment.armor={...(ARMORS.find(a=>a.name===item.name) || item)};
  saveGame();inventorySignature='';renderInventoryPanel();
}
function sellInventoryMaterial(item,amount){
  if(isServerWorld()){requestPlayerAction('sell',{name:materialRarity(item),amount});return;}
  if(player.dead || item.type!=='material')return;
  const rarity=materialRarity(item),quantity=Math.min(materialCount(rarity),amount);
  if(quantity<=0 || !consumeMaterials([[rarity,quantity]]))return;
  player.coins+=quantity*(ORE_VALUES[rarity] || item.value || 1)*5;
  saveGame();inventorySignature='';renderInventoryPanel();
}
function renderInventoryPanel(){
  inventoryPanel.hidden=!inventoryOpen;if(!inventoryOpen)return;
  const search=document.getElementById('inventory-search').value.toLocaleLowerCase('pt-BR'),rarity=document.getElementById('inventory-rarity').value;
  const rows=inventoryRows(),signature=JSON.stringify([inventoryType,search,rarity,selectedInventoryKey,rows.map(r=>[r.key,r.quantity,r.item.power,r.item.damage]),Object.values(player.equipment).map(i=>i?.name)]);
  if(signature===inventorySignature)return;inventorySignature=signature;
  inventoryPanel.querySelectorAll('[data-inventory-type]').forEach(b=>b.classList.toggle('active',b.dataset.inventoryType===inventoryType));
  const visible=rows.filter(row=>(inventoryType==='all' || row.item.type===inventoryType) && (rarity==='all' || row.rarityIndex===Number(rarity)) && (row.item.name+' '+(INVENTORY_TYPES[row.item.type] || '')).toLocaleLowerCase('pt-BR').includes(search));
  document.getElementById('inventory-total').textContent=visible.length+' tipos · '+player.coins.toLocaleString('pt-BR')+' moedas';
  if(!visible.some(r=>r.key===selectedInventoryKey))selectedInventoryKey=visible[0]?.key || null;
  const grid=document.getElementById('inventory-items');grid.replaceChildren();
  if(!visible.length){const empty=document.createElement('p');empty.className='empty-inventory';empty.textContent='Nenhum item encontrado com esses filtros.';grid.append(empty);}
  for(const row of visible){
    const button=document.createElement('button');button.className='inventory-card';button.type='button';button.style.setProperty('--item-color',rarities[row.rarityIndex].color);button.classList.toggle('selected',row.key===selectedInventoryKey);button.setAttribute('aria-pressed',String(row.key===selectedInventoryKey));
    button.title=INVENTORY_TYPES[row.item.type]+' · '+row.item.name+' · '+rarities[row.rarityIndex].name;
    decorateRarity(button,row.rarityIndex);
    button.setAttribute('aria-label',button.title);
    const src=itemPreview(row.item);
    if(src){const image=document.createElement('img');image.src=src;image.alt='';button.append(image);}else{const icon=document.createElement('span');icon.className='armor-preview';icon.textContent='⛨';button.append(icon);}
    const name=document.createElement('b');name.textContent=row.item.name;
    const label=document.createElement('small');label.textContent=rarities[row.rarityIndex].name+' · '+INVENTORY_TYPES[row.item.type];
    const count=document.createElement('em');count.textContent=row.item.type==='material' ? '×'+row.quantity : equippedItem(row.item) ? '✓' : '1';
    button.append(name,label,count);button.onclick=()=>{selectedInventoryKey=row.key;inventorySignature='';renderInventoryPanel();};grid.append(button);
  }
  renderInventoryDetail(visible.find(r=>r.key===selectedInventoryKey));
}
function renderInventoryDetail(row){
  const detail=document.getElementById('inventory-detail');detail.replaceChildren();if(!row)return;
  const {item,quantity,rarityIndex}=row;
  detail.style.setProperty('--item-color',rarities[rarityIndex].color);
  const title=document.createElement('h2');title.textContent=item.name;
  const rarity=document.createElement('span');rarity.className='item-rarity';rarity.textContent=rarities[rarityIndex].name+' · '+INVENTORY_TYPES[item.type];
  const src=itemPreview(item);if(src){const image=document.createElement('img');image.className='detail-preview';image.src=src;image.alt=item.name;detail.append(image);}
  detail.append(title,rarity);
  const stats=document.createElement('dl');
  const lines=[['Quantidade',quantity]];
  if(item.type==='material')lines.push(['Uso','Receitas e fusão'],['Venda por unidade',((ORE_VALUES[materialRarity(item)] || item.value || 1)*5).toLocaleString('pt-BR')+' moedas']);
  if(item.type==='weapon')lines.push(['Dano',SWORDS.find(s=>s.name===item.name)?.damage || item.damage || 0],['Uso','Combate e habilidades']);
  if(item.type==='pickaxe')lines.push(['Poder',pickaxes.find(p=>p.name===item.name)?.power || item.power || 0],['Uso','Mineração e habilidades']);
  if(item.type==='armor')lines.push(['Defesa',Math.round((ARMORS.find(a=>a.name===item.name)?.defense || 0)*100)+'% menos dano'],['Visual',item.aura ? 'Aura de partículas' : 'Armadura visível']);
  if(item.type==='utility'){const utility=UTILITIES.find(u=>u.name===item.name);lines.push(['Efeito',utility?.description || 'Utilidade'],['Uso','Bônus ao equipar · uma utilidade por vez']);if(utility?.active)lines.push(['Recarga',utility.cooldown+'s'],['Atalho','Z']);}
  const ability=equipmentAbility(item);if(ability)lines.push(['Habilidade',ability.name],['Recarga',ability.cooldown+' segundos'],['Atalho',item.type==='weapon' ? 'Q' : 'R']);
  for(const [name,value] of lines){const label=document.createElement('dt'),text=document.createElement('dd');label.textContent=name;text.textContent=value;stats.append(label,text);}detail.append(stats);
  if(item.type==='material'){
    const actions=document.createElement('div');actions.className='inventory-sell';
    for(const [text,amount] of [['Vender 1',1],['Vender 5',5],['Vender pilha',quantity]]){const button=document.createElement('button');button.textContent=text;button.disabled=quantity<amount;button.onclick=()=>sellInventoryMaterial(item,amount);actions.append(button);}detail.append(actions);
  }else{const action=document.createElement('button');action.className='craft-pickaxe';action.textContent=equippedItem(item) ? 'Equipado ✓' : 'Equipar';action.disabled=equippedItem(item);action.onclick=()=>equipInventoryItem(item);detail.append(action);}
}
