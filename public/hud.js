const gameHud = document.createElement('div');
gameHud.id = 'game-hud';
gameHud.hidden = true;
gameHud.innerHTML = `
  <nav class="hud-top" aria-label="Menus do jogo">
    <button class="hud-button settings" data-panel="settings" title="Configurações" aria-label="Configurações">⚙</button>
    <button class="hud-button guild" data-panel="guild" title="Guilda" aria-label="Guilda">♟</button>
    <button class="hud-button" data-panel="inventory" title="Inventário (B)" aria-label="Inventário">▣</button>
    <button class="hud-button talents" data-panel="talents" title="Talentos (T)" aria-label="Talentos">★</button>

    <button class="hud-button craft" data-panel="craft" title="Forja (C)" aria-label="Forja">⚒</button>
    <button class="hud-button shop" data-panel="shop" title="Loja (V)" aria-label="Loja">♜</button>
    <button class="hud-button" data-panel="gallery" title="Galeria" aria-label="Galeria">▤</button>
    <button class="hud-button" data-panel="achievements" title="Conquistas" aria-label="Conquistas">✦</button>
  </nav>
  <section class="player-status" aria-label="Status do jogador">
    <img class="status-avatar" src="sprites/player_body.png" alt="Coxinha">
    <div class="status-bars">
      <div class="status-health" title="Vida"><i id="hud-health"></i><span id="hud-name"></span></div>
      <div class="status-xp"><i id="hud-xp"></i><span id="hud-level"></span></div>
      <span class="status-wallet" id="hud-coins"></span>
    </div>
  </section>
  <section class="hud-map" aria-label="Minimapa">
    <canvas id="hud-minimap" width="220" height="220"></canvas>
    <b id="hud-zone">Praça central</b><small id="hud-position"></small>
    <div style="font-size:9px;margin-top:3px">S Super · A Absolut · Q Quantium<br>ℵ Aleph · P Primordial</div>
  </section>
  <nav class="hud-actions" aria-label="Ações rápidas">
    <button class="hud-button" data-panel="inventory" title="Inventário (B)" aria-label="Abrir inventário">♧<kbd>B</kbd></button>
    <button class="hud-button sell" id="hud-sell" title="Vender materiais" aria-label="Vender materiais">◉<kbd>X</kbd></button>
  </nav>
  <nav class="equipment-hotbar" id="hud-equipment" aria-label="Equipamentos"></nav>
  <span class="hud-tip">ENTER para conversar · mova o mouse para andar</span>`;
document.body.append(gameHud);
gameHud.addEventListener('pointerover', () => { movementAimActive = false; });

const hud = Object.fromEntries(['health', 'name', 'xp', 'level', 'coins', 'zone', 'position', 'equipment'].map(key => [key, document.getElementById('hud-' + key)]));
const mapCanvas = document.getElementById('hud-minimap');
const mapContext = mapCanvas.getContext('2d');
let lastEquipmentKey = '';

function toggleHudPanel(panel) {

  if(panel==='accessories'){openAccessoryInventory();return;}
  const basic={inventory:inventoryOpen,talents:talentsOpen,craft:craftOpen,shop:shopOpen};
  const wasOpen=basic[panel] ?? extraPanel===panel;
  extraPanel=null;
  inventoryOpen = false;
  talentsOpen = false;
  craftOpen = false;
  shopOpen = false;
  if (panel === 'inventory') inventoryOpen = !wasOpen;
  if (panel === 'talents') talentsOpen = !wasOpen;
  if (panel === 'craft') craftOpen = !wasOpen;
  if (panel === 'shop') shopOpen = !wasOpen;
  if(['settings','guild','gallery','achievements','changelog','accessories','ranking','profile'].includes(panel))extraPanel=wasOpen ? null : panel;
  if(extraPanel==='guild')socket.emit('guildList');
}

document.querySelectorAll('[data-panel]').forEach(button => {
  button.addEventListener('click', () => toggleHudPanel(button.dataset.panel));
});
document.getElementById('hud-sell').addEventListener('click', () => {
  if(isServerWorld()){requestPlayerAction('sellAll');return;}
  let total = 0;
  player.inventory = player.inventory.filter(item => {
    if (item.type !== 'material') return true;
    total += (item.value || 1) * 5 * (item.amount || 1);
    return false;
  });
  player.coins += total;
  addChat('Materiais vendidos por ' + total + ' moedas.');
  saveGame();
});

function updateGameHud() {
  const tag=players[playerId]?.guildTag??guildState.directory.find(g=>g.id===guildState.guildId)?.tag;const guild=tag?{tag}:null;
  hud.name.textContent = playerDisplayName(player);
  const maxHp = Math.max(1, player.maxHp || 100);
  const hp = Number.isFinite(player.hp) ? player.hp : maxHp;
  hud.health.style.width = Math.max(0, Math.min(100, hp / maxHp * 100)) + '%';
  hud.health.parentElement.title = 'Vida ' + Math.ceil(hp) + ' / ' + maxHp;
  hud.xp.style.width = Math.max(0, Math.min(100, player.xp / player.xpToNext * 100)) + '%';
  hud.level.replaceChildren(document.createTextNode('Lv. '+player.level));const asc=document.createElement('b'),ascension=GAME_CATALOG.roman(GAME_CATALOG.ascensions(player));asc.id='hud-ascension';asc.className='ascension-badge';asc.textContent='Asc. '+ascension;asc.title='Ascensão '+ascension;hud.level.append(asc);if(guild){const tag=document.createElement('b');tag.className='guild-tag';tag.textContent='['+guild.tag+']';hud.level.append(tag);}
  hud.level.style.color=rarities[highestOwnedRarity()].color;
  hud.coins.textContent = '◉ ' + player.coins.toLocaleString('pt-BR');
  hud.zone.textContent = currentRealm==='cave' ? 'Caverna profunda' : getZone(player.x, player.y) === 'P' ? (currentRealm==='garden'?'Praça central':'Refúgio · '+EXPANSION.mapFor(currentRealm).name) : EXPANSION.mapFor(currentRealm).name;
  hud.position.textContent = Math.round(player.x) + ', ' + Math.round(player.y);
  const panelState = {inventory: inventoryOpen, talents: talentsOpen, craft: craftOpen, shop: shopOpen};
  for(const name of ['settings','guild','gallery','achievements','changelog','accessories','ranking','profile'])panelState[name]=extraPanel===name;
  panelState.accessories=inventoryOpen&&inventoryType==='accessory';
  document.querySelectorAll('[data-panel]').forEach(button => button.setAttribute('aria-pressed', String(panelState[button.dataset.panel])));
  const entries=equipmentSlots(player),equipmentKey=JSON.stringify([entries.map(e=>[e.type,e.item?.name,e.item?.rarity,e.item?.accessoryId,e.item?.color,e.item?.img?.src]),settings.particles]);
  if(lastEquipmentKey!==equipmentKey){
    lastEquipmentKey=equipmentKey;const scroll=hud.equipment.scrollLeft;hud.equipment.replaceChildren();hud.equipment.dataset.expanded=String(entries.length>4);
    for(const entry of entries){const item=entry.item,slot=document.createElement('button');slot.type='button';slot.className='gear-slot';slot.dataset.equipmentType=entry.type;if(entry.type==='accessory')slot.dataset.accessorySlot=entry.accessorySlot;
      if(item){decorateRarity(slot,itemRarityIndex(item));if(entry.type!=='accessory'&&equipmentParticleColor(item)&&settings.particles){slot.classList.add('enchanted');slot.style.setProperty('--spark-color',equipmentParticleColor(item));}}
      slot.title=entry.label+(item?' · '+item.name+(entry.type==='accessory'?' · '+item.rarity+' · '+accessoryDescription(item.accessoryId,item.rarity):item.power?' · Poder +'+item.power:''):' · vazio');slot.setAttribute('aria-label',slot.title);if(item)bindItemTooltip(slot,item);
      const rarity=item?rarities[itemRarityIndex(item)]:null;slot.style.setProperty('--slot-border',rarity?.color||'#60876c');slot.style.setProperty('--slot-fill',rarity?.color||'#6b9479');slot.style.setProperty('--item-color',rarity?.color||'#6b9479');
      const src=item?(entry.type==='accessory'?accessoryPreview(item.accessoryId,item.rarity):item.img?.src):null;if(src){const img=document.createElement('img');img.src=src;img.alt='';slot.append(img);}else{const icon=document.createElement('span');icon.className='gear-icon';icon.textContent=entry.symbol;slot.append(icon);}
      const name=document.createElement('span'),key=document.createElement('kbd');name.className='gear-name';name.textContent=item?.name||entry.label;key.textContent=entry.shortcut;slot.append(name,key);slot.onclick=()=>{if(entry.type==='accessory')openAccessoryInventory(entry.accessorySlot);else player.selectedSlot=entry.selectedSlot;};hud.equipment.append(slot);
    }hud.equipment.scrollLeft=scroll;
  }
  [...hud.equipment.children].forEach((slot,n)=>slot.classList.toggle('selected',n<4?n===(player.selectedSlot??2):inventoryOpen&&inventoryType==='accessory'&&n-4===selectedAccessorySlot));
}

function renderMinimap() {
  if(performance.now()-(renderMinimap.last || 0)<125)return;renderMinimap.last=performance.now();
  if(currentRealm==='cave'){renderCaveMinimap();return;}
  const c = mapContext;
  const size = mapCanvas.width;
  const scale = size / WORLD_SIZE;
  c.fillStyle = '#41834b';
  c.fillRect(0, 0, size, size);
  const colors = ['#a5b49d', '#4aa55a', '#83a458', '#4a8e8f', '#965e77', '#77538e', '#455b7e'];
  const radii = [1000, 4000, 8000, 12000, 26000, 50000, 72000];
  for (let index = radii.length - 1; index >= 0; index--) {
    c.fillStyle = colors[index];
    c.beginPath();
    c.arc(size / 2, size / 2, radii[index] * scale, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = '#559fca';
  c.fillStyle='#455b7e';c.fillRect(0,0,size,size*.08);c.fillRect(0,size*.92,size,size*.08);c.fillRect(0,0,size*.08,size);c.fillRect(size*.92,0,size*.08,size);
  c.fillStyle = '#559fca';
  if(currentRealm==='garden')c.fillRect(size / 2 - 1, 0, 2, size);
  c.fillStyle = '#e0d6ad';
  c.fillRect((CITY.x - CITY.size / 2) * scale - 1, (CITY.y - CITY.size / 2) * scale - 1, CITY.size * scale + 2, CITY.size * scale + 2);
  for(const biome of [EXPANSION.mapFor(currentRealm)]){c.fillStyle=biome.color+'bb';c.fillRect(biome.x*scale,biome.y*scale,biome.w*scale,biome.h*scale);}c.fillStyle='#c9d0b9';c.fillRect(size/2-3,size/2-3,6,6);
  for (const ore of ores) {
    const name = ore?.rarity?.name?.toUpperCase();
    if (!['SUPER','ABSOLUT','QUANTIUM','ALEPH','PRIMORDIAL'].includes(name)) continue;
    const x = Math.max(7,Math.min(size-7,ore.x*scale));
    const y = Math.max(7,Math.min(size-7,ore.y*scale));
    c.fillStyle = ore.rarity.color;
    if(ore.size>=1000){c.globalAlpha=.4;c.beginPath();c.arc(ore.x*scale,ore.y*scale,ore.size*scale,0,Math.PI*2);c.fill();c.globalAlpha=1;}
    c.strokeStyle = '#192b2a';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x,y-6);c.lineTo(x+6,y);c.lineTo(x,y+6);c.lineTo(x-6,y);c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = '#192b2a';
    c.font = 'bold 7px Ubuntu';
    c.textAlign = 'center';
    c.fillText(({SUPER:'S',ABSOLUT:'A',QUANTIUM:'Q',ALEPH:'ℵ',PRIMORDIAL:'P'})[name],x,y+2.5);
  }
  c.fillStyle = '#d9f1e7';
  for (const [id, remote] of Object.entries(players)) {
    if (id === playerId || (remote.realm || 'garden')!==currentRealm) continue;
    c.fillRect(remote.x * scale - 1, remote.y * scale - 1, 3, 3);
  }
  c.strokeStyle = '#ffffffaa';
  c.strokeRect((player.x - worldViewWidth() / 2) * scale, (player.y - worldViewHeight() / 2) * scale, Math.max(4, worldViewWidth() * scale), Math.max(4, worldViewHeight() * scale));
  c.fillStyle = '#fff073';
  c.strokeStyle = '#273d27';
  c.lineWidth = 1.5;
  c.beginPath();
  c.arc(player.x * scale, player.y * scale, 3.5, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  for(const portal of EXPANSION.portalsFor(currentRealm)){c.fillStyle=EXPANSION.mapFor(portal.to).color;c.strokeStyle='#fff';c.lineWidth=1.5;c.beginPath();c.arc(portal.x*scale,portal.y*scale,3,0,Math.PI*2);c.fill();c.stroke();}
}
