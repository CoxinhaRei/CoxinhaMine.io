function createSystemPanel(name,title) {
  const panel=document.createElement('section');panel.className='garden-panel system-panel '+name+'-panel';panel.hidden=true;
  panel.setAttribute('role','dialog');panel.setAttribute('aria-label',title);
  const header=document.createElement('header');header.className='garden-panel-header';
  const heading=document.createElement('h1');heading.textContent=title;
  const close=document.createElement('button');close.className='panel-close';close.textContent='×';close.setAttribute('aria-label','Fechar '+title);
  close.onclick=()=>{if(name==='fusion')craftOpen=false;else extraPanel=null;};
  header.append(heading,close);panel.append(header);
  panel.addEventListener('pointerover',()=>{movementAimActive=false;});document.body.append(panel);return panel;
}
const fusionPanel=createSystemPanel('fusion','Crafting');
fusionPanel.insertAdjacentHTML('beforeend',`<div class="fusion-body"><label>Minério <select id="fusion-rarity"></select></label>
  <canvas id="fusion-stage" width="440" height="250" aria-label="Animação de fusão dos minérios"></canvas>
  <h2 id="fusion-target"></h2><div class="fusion-info"><b id="fusion-count"></b><span id="fusion-chance"></span></div>
  <button class="craft-pickaxe" id="fusion-start">Craftar</button><p id="fusion-result" role="status"></p>
  <small>Combine 5 minérios. Uma falha perde de 1 a 4 deles. A chance diminui conforme a raridade.</small></div>`);
const fusionSelect=document.getElementById('fusion-rarity');
for(const rarity of rarities){if(!craftRecipes[rarity.name])continue;const option=document.createElement('option');option.value=rarity.name;option.textContent=rarity.name;fusionSelect.append(option);}
const fusionCanvas=document.getElementById('fusion-stage'),fusionCtx=fusionCanvas.getContext('2d');
fusionSelect.onchange=()=>{craftResult=null;};
document.getElementById('fusion-start').onclick=()=>{startOreCraft(fusionSelect.value);renderCraftPanel();};
function renderCraftPanel(){
  fusionPanel.hidden=!craftOpen;if(!craftOpen)return;
  const active=player.pendingCraft,animation=active || craftResult,name=active?.from || craftResult?.from || fusionSelect.value;
  const recipe=craftRecipes[name],count=materialCount(name);
  fusionSelect.disabled=!!active;
  document.getElementById('fusion-target').textContent=name+' → '+recipe.next;
  document.getElementById('fusion-count').textContent=count+' / 5 minérios';
  document.getElementById('fusion-chance').textContent=(recipe.chance*100).toLocaleString('pt-BR',{maximumFractionDigits:2})+'% de sucesso';
  document.getElementById('fusion-start').disabled=!!active || count<5;
  document.getElementById('fusion-result').textContent=active ? 'Combinando...' : animation ? animation.success ? recipe.next+' criado!' : 'A fusão falhou. '+(animation.lost || 5)+' minério(s) perdido(s).' : 'Selecione uma raridade para combinar.';
  const progress=animation ? Math.min(1,(Date.now()-animation.startedAt)/2400) : 0;
  fusionCtx.clearRect(0,0,440,250);
  const radius=animation ? animation.success ? 78*(1-Math.max(0,(progress-.5)*2)) : 78+Math.max(0,progress-.65)*160 : 78;
  const spin=animation ? progress*13 : performance.now()/7000;
  const rarity=rarities.find(r=>r.name===name);
  if(!animation || progress<.95 || !animation.success){
    for(let n=0;n<5;n++){
      const angle=spin+n*Math.PI*2/5;
      drawCrystal({id:'fusion_'+n,x:220+Math.cos(angle)*radius,y:125+Math.sin(angle)*radius,size:22,rarity},fusionCtx);
    }
  }
  if(animation?.success && progress>.65){
    fusionCtx.save();fusionCtx.globalAlpha=Math.min(1,(progress-.65)*3);
    drawCrystal({id:'fusion-result',x:220,y:125,size:34,rarity:rarities.find(r=>r.name===animation.to)},fusionCtx);fusionCtx.restore();
  }
}

const settingsPanel=createSystemPanel('settings','Configurações');
settingsPanel.insertAdjacentHTML('beforeend',`<div class="settings-body"><label>Movimentação<select id="setting-controls"><option value="hybrid">WASD + mouse</option><option value="wasd">Somente WASD</option><option value="mouse">Somente mouse</option></select></label>
  <label>Partículas de equipamentos<input type="checkbox" id="setting-particles"></label><label>Mostrar minimapa<input type="checkbox" id="setting-minimap"></label><label>Mostrar nomes<input type="checkbox" id="setting-names"></label><p>Preferências salvas neste navegador.</p></div>`);
for(const id of ['controls','particles','minimap','names']){
  const input=document.getElementById('setting-'+id);
  if(id==='controls')input.value=settings[id];else input.checked=settings[id];
  input.onchange=()=>{settings[id]=id==='controls' ? input.value : input.checked;localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));};
}
const galleryPanel=createSystemPanel('gallery','Galeria');
galleryPanel.insertAdjacentHTML('beforeend',`<nav class="system-tabs"><button data-gallery="mobs" class="active">Mobs</button><button data-gallery="rarities">Raridades</button><button data-gallery="sprites">Sprites 2D</button></nav><div id="gallery-content" class="gallery-content"></div>`);
let galleryTab='mobs',gallerySignature='',spriteSheet=null;
galleryPanel.querySelectorAll('[data-gallery]').forEach(button=>button.onclick=()=>{galleryTab=button.dataset.gallery;gallerySignature='';renderGallery();});
function renderGallery(){
  if(extraPanel!=='gallery')return;
  const signature=JSON.stringify([galleryTab,player.journal?.seen,player.journal?.species]);if(signature===gallerySignature)return;gallerySignature=signature;
  galleryPanel.querySelectorAll('[data-gallery]').forEach(b=>b.classList.toggle('active',b.dataset.gallery===galleryTab));
  const content=document.getElementById('gallery-content');content.replaceChildren();
  if(galleryTab==='sprites'){
    const note=document.createElement('p');note.textContent='Prancha 2D de minérios, picaretas, espadas, armaduras e utilidades.';
    const sheet=document.createElement('canvas');sheet.id='sprite-sheet';sheet.width=1088;sheet.height=1050;
    const download=document.createElement('a');download.textContent='Baixar PNG';download.className='download-sheet';download.download='coxinha-sprites-2d.png';
    content.append(note,sheet,download);
    buildSpriteSheet(sheet).then(()=>{download.href=sheet.toDataURL('image/png');});return;
  }
  if(galleryTab==='mobs'){renderBestiary(content);return;}
  const grid=document.createElement('div');grid.className='gallery-grid';content.append(grid);
  rarities.forEach((rarity,index)=>{
    const card=document.createElement('article');card.className='gallery-card';card.style.setProperty('--card-color',rarity.color);
    const count=player.journal?.seen[rarity.name] || 0;
    if(galleryTab==='mobs'){
      const image=document.createElement('img');image.src='sprites/Mob.png';image.alt='Guardião '+rarity.name;if(!count)image.className='undiscovered';
      card.append(image);
    }else{
      const image=document.createElement('canvas');image.width=90;image.height=90;
      drawCrystal({id:'gallery-'+index,x:45,y:45,size:25,rarity},image.getContext('2d'));card.append(image);
    }
    const name=document.createElement('b');name.textContent=galleryTab==='mobs' ? 'Guardião '+rarity.name : rarity.name;
    const info=document.createElement('small');info.textContent=rarity.adminOnly ? 'Exclusiva de administrador · diâmetro 50.000' : 'Raridade '+(index+1)+' / 11 naturais · diâmetro '+(GAME_CATALOG.oreRadius(rarity.name)*2).toLocaleString('pt-BR');
    card.append(name,info);grid.append(card);
  });
}
async function buildSpriteSheet(sheet){
  await Promise.all([...Object.values(pickaxeSprites),...SWORDS.map(s=>s.img),...ARMORS.map(a=>a.img),...UTILITIES.map(u=>u.img)].map(image=>image.decode ? image.decode().catch(()=>{}) : Promise.resolve()));
  const c=sheet.getContext('2d');c.fillStyle='#edf3d9';c.fillRect(0,0,sheet.width,sheet.height);
  c.fillStyle='#254b3b';c.font='bold 24px Arial';c.fillText('COXINHAMINER.IO · SPRITES 2D',24,34);
  const assets=[...rarities.map((rarity,index)=>({name:rarity.name,kind:'MINÉRIO',rarity,index})),...PICKAXE_RECIPES.map(p=>({name:p.name,kind:'PICARETA',image:pickaxeSprites[p.name]})),...SWORDS.map(s=>({name:s.name,kind:'ESPADA',image:s.img})),...ARMORS.map(a=>({name:a.name,kind:'ARMADURA',image:a.img})),...UTILITIES.map(u=>({name:u.name,kind:'UTILIDADE',image:u.img}))];
  assets.forEach((asset,index)=>{
    const x=index%8*136,y=55+Math.floor(index/8)*158;
    c.fillStyle='#d4e3bb';c.fillRect(x+6,y,124,146);
    if(asset.image?.complete && asset.image.naturalWidth)c.drawImage(asset.image,x+30,y+16,76,76);
    else if(asset.rarity){
      c.save();c.translate(x+68,y+58);const size=22+asset.index*14;c.scale(34/size,34/size);drawCrystal({id:'atlas-'+index,x:0,y:0,size,rarity:asset.rarity},c);c.restore();
    }
    c.textAlign='center';c.fillStyle='#284a39';c.font='bold 9px Arial';c.fillText(asset.kind,x+68,y+111);
    c.font='bold 11px Arial';c.fillText(asset.name,x+68,y+129);c.textAlign='left';
  });
  spriteSheet=sheet;
}

const achievementsPanel=createSystemPanel('achievements','Conquistas');
const achievementList=document.createElement('div');achievementList.className='achievement-list';achievementsPanel.append(achievementList);
let achievementsSignature='';
function renderAchievements(){
  const signature=JSON.stringify([player.journal,player.level]);if(signature===achievementsSignature)return;achievementsSignature=signature;achievementList.replaceChildren();
  for(const achievement of ACHIEVEMENTS){
    const progress=achievement.stat==='level' ? player.level : player.journal?.[achievement.stat] || 0;
    const unlocked=player.journal?.unlocked.includes(achievement.id);
    const card=document.createElement('article');card.className='achievement '+(unlocked ? 'complete' : '');
    const title=document.createElement('h2');title.textContent=(unlocked ? '★ ' : '☆ ')+achievement.name;
    const description=document.createElement('p');description.textContent=achievement.description;
    const count=document.createElement('b');count.textContent=Math.min(progress,achievement.goal)+' / '+achievement.goal;
    const bar=document.createElement('progress');bar.max=achievement.goal;bar.value=progress;
    card.append(title,description,count,bar);achievementList.append(card);
  }
}

const guildPanel=createSystemPanel('guild','Guilda');
guildPanel.insertAdjacentHTML('beforeend',`<div class="guild-body"><p id="guild-connection"></p><div id="guild-current"></div><form id="guild-create"><h2>Criar guilda</h2><label>Nome<input id="guild-name" minlength="3" maxlength="24" required></label><label>Sigla<input id="guild-tag" minlength="2" maxlength="5" pattern="[A-Za-z0-9]{2,5}" required></label><button class="craft-pickaxe">Criar guilda</button></form><p id="guild-message" role="status"></p><h2>Guildas abertas</h2><div id="guild-directory"></div></div>`);
document.getElementById('guild-create').onsubmit=event=>{event.preventDefault();if(!guildState.connected)return;socket.emit('guildAction',{action:'create',name:document.getElementById('guild-name').value,tag:document.getElementById('guild-tag').value});};
let guildSignature='';
function renderGuild(){
  const signature=JSON.stringify(guildState);if(signature===guildSignature)return;guildSignature=signature;
  const own=guildState.directory.find(g=>g.id===guildState.guildId);
  document.getElementById('guild-connection').textContent=guildState.connected ? 'Guildas compartilhadas com os jogadores deste servidor.' : 'Conecte pelo servidor do jogo (npm start) para criar e entrar em guildas.';
  document.getElementById('guild-create').hidden=!!own || !guildState.connected;
  const current=document.getElementById('guild-current');current.replaceChildren();
  if(own){
    const title=document.createElement('h2');title.textContent='['+own.tag+'] '+own.name;
    const roster=document.createElement('p');roster.textContent='Líder: '+own.owner+' · Membros: '+own.members.join(', ');
    const leave=document.createElement('button');leave.className='leave-guild';leave.textContent='Sair da guilda';leave.onclick=()=>socket.emit('guildAction',{action:'leave'});
    current.append(title,roster,leave);
  }
  const directory=document.getElementById('guild-directory');directory.replaceChildren();
  if(!guildState.directory.length)directory.textContent='Nenhuma guilda criada ainda.';
  for(const guild of guildState.directory){
    const row=document.createElement('div');row.className='guild-row';
    const title=document.createElement('b');title.textContent='['+guild.tag+'] '+guild.name;
    const count=document.createElement('span');count.textContent=guild.members.length+'/50';
    const button=document.createElement('button');button.textContent=own?.id===guild.id ? 'Sua guilda' : 'Entrar';button.disabled=!!own || !guildState.connected || guild.members.length>=50;
    button.onclick=()=>socket.emit('guildAction',{action:'join',id:guild.id});row.append(title,count,button);directory.append(row);
  }
}

const gameChat=document.createElement('section');gameChat.id='game-chat';gameChat.hidden=true;
gameChat.innerHTML='<div id="game-chat-log" role="log" aria-live="polite"></div><form id="game-chat-form"><input id="game-chat-input" placeholder="ENTER para conversar" maxlength="220" aria-label="Mensagem de chat"><button aria-label="Enviar mensagem">➤</button></form>';
document.body.append(gameChat);
const chatField=document.getElementById('game-chat-input');
chatField.onfocus=()=>{typing=true;heldKeys.clear();movementAimActive=false;};chatField.onblur=()=>{typing=false;};
chatField.onkeydown=event=>{if(event.key==='Escape'){chatField.blur();event.stopPropagation();}};
document.getElementById('game-chat-form').onsubmit=event=>{
  event.preventDefault();const message=chatField.value.trim();if(!message)return;
  const payload={text:message,level:player.level,rarityIndex:highestOwnedRarity()};
  if(socket.connected)socket.emit('chat',payload);else addChat({...payload,name:player.name});
  chatField.value='';chatField.blur();renderGameChat();
};
let lastChatSignature='';
function renderGameChat(){
  gameChat.hidden=document.getElementById('menu').style.display!=='none';
  const signature=JSON.stringify(chat);if(signature===lastChatSignature)return;lastChatSignature=signature;
  const log=document.getElementById('game-chat-log');log.replaceChildren();
  for(const message of chat.slice(-30)){
    const line=document.createElement('p');
    if(typeof message==='string')line.textContent=message;
    else{
      const badge=document.createElement('b');badge.className='chat-level';badge.style.color=rarities[message.rarityIndex]?.color || '#fff';badge.textContent='Lv.'+message.level;
      const name=document.createElement('strong');name.textContent=' '+message.name+': ';
      line.append(badge,name,document.createTextNode(message.text));
    }
    log.append(line);
  }log.scrollTop=log.scrollHeight;
}
const bossBar=document.createElement('div');bossBar.id='boss-bar';bossBar.hidden=true;bossBar.innerHTML='<b></b><div><i></i><span></span></div>';document.body.append(bossBar);
const achievementToast=document.createElement('div');achievementToast.id='achievement-toast';achievementToast.hidden=true;document.body.append(achievementToast);
function renderSystems(){
  tickOreCraft();
  for(const [name,panel] of [['settings',settingsPanel],['guild',guildPanel],['gallery',galleryPanel],['achievements',achievementsPanel]])panel.hidden=extraPanel!==name;
  if(extraPanel==='guild')renderGuild();if(extraPanel==='gallery')renderGallery();if(extraPanel==='achievements')renderAchievements();
  document.querySelector('.hud-map').hidden=!settings.minimap;
  bossBar.hidden=!nearestBoss;
  const participation=document.getElementById('boss-participation');if(participation && nearestBoss){const own=(multiplayer.contribution[nearestBoss.id] || 0)*100,team=multiplayer.squadContribution?.[nearestBoss.id];participation.textContent='Você: '+own.toFixed(1)+'%'+(team!==undefined ? ' · Squad: '+(team*100).toFixed(1)+'%' : '')+' · loot a partir de 5%';}
  if(nearestBoss){bossBar.querySelector('b').textContent=(nearestBoss.name || 'PEDRA')+' '+nearestBoss.rarity.name;bossBar.querySelector('i').style.width=Math.max(0,nearestBoss.hp/nearestBoss.maxHp*100)+'%';bossBar.querySelector('span').textContent=Math.ceil(nearestBoss.hp).toLocaleString('pt-BR')+' / '+nearestBoss.maxHp.toLocaleString('pt-BR');}
  if(lastAchievementNotice){achievementToast.textContent='★ '+lastAchievementNotice;achievementToast.hidden=false;lastAchievementNotice='';clearTimeout(renderSystems.notice);renderSystems.notice=setTimeout(()=>{achievementToast.hidden=true;},3500);}
}
