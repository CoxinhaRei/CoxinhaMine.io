// The server calculates each attempt. Five orbiting cards represent the selected batch.
fusionPanel.setAttribute('aria-label','Forja');fusionPanel.classList.add('exp-fusion','craft-rework');const forgeTitle=fusionPanel.querySelector('h1');if(forgeTitle)forgeTitle.textContent='Forja';fusionPanel.querySelector('.fusion-body').remove();
fusionPanel.insertAdjacentHTML('beforeend',`<div class="exp-body">
  <canvas id="craft-wheel155" width="500" height="225" aria-label="Cinco itens com bordas de raridade giram e se unem ao forjar"></canvas>
  <h2 id="craft-title155"></h2><p id="craft-info155"></p>
  <div class="craft-selection"><label>Raridade <select id="craft-rarity155" aria-label="Raridade para craftar"></select></label><div class="craft-quantity"><span>Tentativas</span><button type="button" id="craft-less155" aria-label="Reduzir tentativas pela metade">÷2</button><input id="craft-count155" type="number" min="1" step="1" value="1" aria-label="Quantidade de tentativas"><button type="button" id="craft-more155" aria-label="Dobrar tentativas">×2</button><button type="button" id="craft-max155">Máx.</button></div></div>
  <p id="craft-stock155"></p><button id="craft-start155" class="craft-pickaxe">Forjar</button><p id="craft-result155" role="status"></p>
  <nav class="system-tabs" id="craft-types155"><button data-type="material">Minérios</button><button data-type="component">Drops</button><button data-type="accessory">Acessórios</button></nav>
  <div class="craft-collection-tools"><input id="craft-search155" type="search" placeholder="Buscar ingrediente ou acessório" aria-label="Buscar no craft"><small>Uma linha por item · raridades lado a lado →</small></div>
  <div id="craft-owned155" class="craft-matrix" aria-label="Itens do craft organizados por tipo e raridade"></div>
</div>`);
let craftType155='material',craftChoice155=null,craftGridKey155='',craftQuantity155=1,craftSending155=false,craftHoldTimer155=null,craftHoldRepeat155=null;
const craftCanvas155=document.getElementById('craft-wheel155'),craftBrush155=craftCanvas155.getContext('2d'),craftRarity155=document.getElementById('craft-rarity155');
for(const name of EXPANSION.RARITIES){const option=document.createElement('option');option.value=option.textContent=name;craftRarity155.append(option);}
function craftLimit155(){if(!craftChoice155)return 0;return ['ALEPH','CHOSEN'].includes(craftChoice155.rarity)?0:EXPANSION.fusionLimit(player,craftChoice155);}
function chooseCraft155(item,mode){if(player.pendingCraft||craftSending155)return;craftChoice155={...item,rarity:item.oreRarity||item.rarity,mode:'fusion'};craftQuantity155=1;craftResult=null;craftGridKey155='';renderCraftPanel();}
function changeCraftQuantity155(direction){if(player.pendingCraft||craftSending155||!craftChoice155)return false;const previous=craftQuantity155;craftQuantity155=CraftLayout.quantity(craftQuantity155,direction,craftLimit155());renderCraftPanel();return previous!==craftQuantity155;}
function stopCraftHold155(){clearTimeout(craftHoldTimer155);clearInterval(craftHoldRepeat155);craftHoldTimer155=craftHoldRepeat155=null;}
for(const [id,direction] of [['craft-less155',-1],['craft-more155',1]]){
  const button=document.getElementById(id);button.onclick=e=>{if(!e.detail)changeCraftQuantity155(direction);};
  button.addEventListener('pointerdown',e=>{if(e.button!==0||button.disabled)return;e.preventDefault();stopCraftHold155();button.setPointerCapture(e.pointerId);if(!changeCraftQuantity155(direction))return;craftHoldTimer155=setTimeout(()=>{craftHoldRepeat155=setInterval(()=>{if(!changeCraftQuantity155(direction))stopCraftHold155();},120);},350);});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,stopCraftHold155);
}
window.addEventListener('blur',stopCraftHold155);document.addEventListener('visibilitychange',stopCraftHold155);
document.getElementById('craft-count155').onchange=e=>{craftQuantity155=Math.max(1,Math.min(craftLimit155()||1,Math.floor(Number(e.target.value))||1));e.target.value=craftQuantity155;renderCraftPanel();};
document.getElementById('craft-count155').oninput=e=>{const value=Number(e.target.value);if(Number.isSafeInteger(value)&&value>=1)craftQuantity155=Math.min(craftLimit155()||1,value);};
document.getElementById('craft-max155').onclick=()=>{craftQuantity155=Math.max(1,craftLimit155());renderCraftPanel();};
craftRarity155.onchange=()=>{if(!craftChoice155)return;const r=craftRarity155.value,old=craftChoice155,item=old.type==='accessory'?EXPANSION.accessory(old.accessoryId,r):{...old,rarity:r,oreRarity:old.type==='material'?r:undefined,name:old.type==='material'?r:old.name};chooseCraft155(item,craftType155==='recipes'&&r==='Comum'?'make':'fusion');};
document.querySelectorAll('#craft-types155 button').forEach(b=>b.onclick=()=>{if(player.pendingCraft||craftSending155||!['material','component','accessory'].includes(b.dataset.type))return;stopCraftHold155();craftType155=b.dataset.type;craftChoice155=null;craftQuantity155=1;craftResult=null;craftGridKey155='';renderCraftPanel();});
document.getElementById('craft-search155').oninput=()=>{craftGridKey155='';renderCraftPanel();};
document.getElementById('craft-start155').onclick=()=>{
  if(!craftChoice155||craftSending155||player.pendingCraft||craftQuantity155>craftLimit155())return;
  const choice=craftChoice155;craftSending155=true;craftResult=null;stopCraftHold155();
  const accepted=requestPlayerAction('expansionFusion',{type:choice.type,rarity:choice.rarity,accessoryId:choice.accessoryId,kind:choice.kind,count:craftQuantity155});
  if(!accepted)craftSending155=false;renderCraftPanel();
};
socket.on('actionResult',()=>{craftSending155=false;craftGridKey155='';});socket.on('disconnect',()=>{craftSending155=false;stopCraftHold155();});
function drawCraftCard155(c,item,rarity,x,y,size=48){
  const color=rarities.find(r=>r.name===rarity)?.color||'#acd88f',hex=color.replace('#',''),shade=hex.length===6?'#'+[0,2,4].map(n=>Math.round(parseInt(hex.slice(n,n+2),16)*.58).toString(16).padStart(2,'0')).join(''):'#4b6554';
  c.save();c.fillStyle=color;c.strokeStyle=shade;c.lineWidth=5;c.beginPath();c.roundRect(x-size/2,y-size/2,size,size,5);c.fill();c.stroke();
  c.strokeStyle='#ffffff44';c.lineWidth=1.5;c.strokeRect(x-size/2+4,y-size/2+4,size-8,size-8);
  if(item){if(item.type==='accessory')drawAccessoryModel(c,item.accessoryId,x,y,size*.34,rarity);else drawLootModel(c,{...item,rarity,oreRarity:item.type==='material'?rarity:undefined},x,y,size*.34);}c.restore();
}
renderCraftPanel=function(){
  fusionPanel.hidden=!craftOpen;if(!craftOpen){stopCraftHold155();return;}
  const active=player.pendingCraft,anim=active||craftResult,blocked=!!active||craftSending155,search=document.getElementById('craft-search155').value,choice=craftChoice155;
  const signature=JSON.stringify([craftType155,search,player.inventory,player.accessories,choice?.type,choice?.accessoryId,choice?.kind,choice?.rarity,choice?.mode,blocked]);
  if(signature!==craftGridKey155){craftGridKey155=signature;const grid=document.getElementById('craft-owned155'),scroll=grid.scrollLeft;grid.replaceChildren();
    document.querySelectorAll('#craft-types155 button').forEach(b=>{b.disabled=blocked;b.classList.toggle('active',b.dataset.type===craftType155);});
    const rows=CraftLayout.rows(player,craftType155,EXPANSION,GAME_CATALOG.MOB_LOOT,search),table=document.createElement('div');table.className='craft-table';
    const head=document.createElement('div');head.className='craft-row craft-head';const title=document.createElement('b');title.textContent='Item';head.append(title);
    for(const rarity of EXPANSION.RARITIES){const label=document.createElement('b');label.textContent=rarity;label.style.color=rarities.find(r=>r.name===rarity)?.color;head.append(label);}table.append(head);
    for(const family of rows){const row=document.createElement('div');row.className='craft-row';const name=document.createElement('b');name.className='craft-family';name.textContent=family.name;row.append(name);
      for(const cell of family.cells){const card=expansionCard(cell.item,cell.amount,()=>chooseCraft155(cell.item,cell.mode));card.classList.add('craft-cell');card.classList.toggle('empty',!cell.amount&&!cell.limit);card.classList.toggle('selected',!!choice&&EXPANSION.key(choice)===EXPANSION.key(cell.item)&&choice.mode===cell.mode);card.disabled=blocked;card.dataset.craftRarity=cell.item.rarity;card.dataset.craftFamily=family.id;card.setAttribute('aria-label',family.name+' · '+cell.item.rarity+' · '+cell.amount+' itens'+(cell.mode==='make'?' · Criar acessório Comum':''));
        if(cell.mode==='make'){const badge=document.createElement('small');badge.className='craft-recipe-tag';badge.textContent='Criar';card.append(badge);}row.append(card);
      }table.append(row);
    }
    if(rows.length)grid.append(table);else{const empty=document.createElement('p');empty.textContent='Nenhum item encontrado. Explore os mapas e colete materiais.';grid.append(empty);}grid.scrollLeft=scroll;
  }
  const limit=craftLimit155();if(!blocked)craftQuantity155=Math.max(1,Math.min(limit||1,craftQuantity155));
  const rarity=choice?.rarity||'Comum',tier=EXPANSION.tier(rarity),make=choice?.mode==='make',to=make?'Comum':EXPANSION.RARITIES[tier+1],chance=make?1:EXPANSION.CHANCES[tier]||0;
  craftRarity155.value=rarity;craftRarity155.disabled=!choice||blocked;const quantity=document.getElementById('craft-count155');if(document.activeElement!==quantity||blocked)quantity.value=active?.count||craftQuantity155;quantity.max=Math.max(1,limit);quantity.disabled=!choice||blocked||!limit;
  document.getElementById('craft-more155').disabled=!choice||blocked||craftQuantity155>=limit;document.getElementById('craft-less155').disabled=!choice||blocked||craftQuantity155<=1;document.getElementById('craft-max155').disabled=!choice||blocked||!limit;
  document.getElementById('craft-title155').textContent=choice?choice.name+' · '+(make?'Criar Comum':rarity+(to?' → '+to:' · raridade máxima')):'Escolha um item e sua raridade na grade';
  const percent=(chance*100).toLocaleString('pt-BR',{maximumFractionDigits:3})+'%';
  document.getElementById('craft-info155').textContent=choice?(make?'Por tentativa: 8 minérios Comum + 3 '+GAME_CATALOG.MOB_LOOT[EXPANSION.ACCESSORIES.find(a=>a.id===choice.accessoryId).kind]+' de qualquer raridade':'Por tentativa: 5 iguais · falha destrói 1–4')+' · '+percent+' de sucesso':'';
  document.getElementById('craft-stock155').textContent=choice?limit.toLocaleString('pt-BR')+' tentativas disponíveis · clique ou segure ×2: 1 → 2 → 4 → 8…'+(limit===EXPANSION.MAX_CRAFT_BATCH?' · limite por lote':''):'';
  if(['ALEPH','CHOSEN'].includes(rarity)&&!make)document.getElementById('craft-info155').textContent=rarity==='ALEPH'?'Leve 5 ou mais ALEPH iguais à Coxinha Forjadora no Deserto.':'Chosen não tem fusão nesta bancada.';
  document.getElementById('craft-start155').disabled=!choice||blocked||limit<craftQuantity155;document.getElementById('craft-start155').textContent=blocked?'Forjando…':'Forjar'+(craftQuantity155>1?' · '+craftQuantity155.toLocaleString('pt-BR')+' tentativas':'');
  const successes=anim?.successes??(anim?.success?1:0),attempts=anim?.count||1;
  document.getElementById('craft-result155').textContent=craftSending155?'Enviando lote…':active?'Combinando '+attempts.toLocaleString('pt-BR')+' tentativa(s)…':anim?(attempts>1?successes.toLocaleString('pt-BR')+' sucessos · '+(attempts-successes).toLocaleString('pt-BR')+' falhas · '+(anim.consumed??anim.lost).toLocaleString('pt-BR')+' itens consumidos':anim.success?anim.name+' '+anim.to+' criado!':'Falhou · '+anim.lost+' itens destruídos'):'Itens equipados não são consumidos. Cada tentativa tem a sua própria chance.';
  const c=craftBrush155,now=Date.now()+(multiplayer.timeOffset||0),duration=anim?EXPANSION.craftDurationOf(anim):0,elapsed=anim?Math.max(0,now-anim.startedAt):0,t=anim?Math.min(1,elapsed/duration):0;
  c.clearRect(0,0,500,225);const radius=anim?.success&&t>.78?65*Math.max(0,1-(t-.78)/.22):65,spin=anim?elapsed/1000*(18+20*(1-(anim.chance||0))):performance.now()/3500;
  const model=anim?{type:anim.type||choice?.type,accessoryId:anim.accessoryId||choice?.accessoryId,kind:anim.kind||choice?.kind}:choice;
  for(let n=0;n<5;n++){const a=spin+n*Math.PI*2/5;c.globalAlpha=anim&&!anim.success&&t>.78?Math.max(.08,1-(t-.78)/.22):1;drawCraftCard155(c,model,anim?.from||rarity,250+Math.cos(a)*radius,112+Math.sin(a)*radius);}
  c.globalAlpha=1;if(anim?.success&&t>.96)drawCraftCard155(c,model,anim.to,250,112,57);
};
