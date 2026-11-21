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
  <label>Partículas de equipamentos<input type="checkbox" id="setting-particles"></label><label>Mostrar minimapa<input type="checkbox" id="setting-minimap"></label><label>Mostrar nomes<input type="checkbox" id="setting-names"></label><p>Convidados também podem escolher os controles. Preferências salvas neste navegador.</p></div>`);
for(const id of ['controls','particles','minimap','names']){
  const input=document.getElementById('setting-'+id);
  if(id==='controls')input.value=settings[id];else input.checked=settings[id];
  input.onchange=()=>{settings[id]=id==='controls' ? input.value : input.checked;if(id==='controls'){heldKeys.clear();movementAimActive=false;mouse.down=mouse.right=false;if(typeof resetMobileInput==='function')resetMobileInput();}try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));}catch{}};
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
  c.fillStyle='#254b3b';c.font='bold 24px Ubuntu';c.fillText('COXINHAMINER.IO · SPRITES 2D',24,34);
  const assets=[...rarities.map((rarity,index)=>({name:rarity.name,kind:'MINÉRIO',rarity,index})),...PICKAXE_RECIPES.map(p=>({name:p.name,kind:'PICARETA',image:pickaxeSprites[p.name]})),...SWORDS.map(s=>({name:s.name,kind:'ESPADA',image:s.img})),...ARMORS.map(a=>({name:a.name,kind:'ARMADURA',image:a.img})),...UTILITIES.map(u=>({name:u.name,kind:'UTILIDADE',image:u.img}))];
  assets.forEach((asset,index)=>{
    const x=index%8*136,y=55+Math.floor(index/8)*158;
    c.fillStyle='#d4e3bb';c.fillRect(x+6,y,124,146);
    if(asset.image?.complete && asset.image.naturalWidth)c.drawImage(asset.image,x+30,y+16,76,76);
    else if(asset.rarity){
      c.save();c.translate(x+68,y+58);const size=22+asset.index*14;c.scale(34/size,34/size);drawCrystal({id:'atlas-'+index,x:0,y:0,size,rarity:asset.rarity},c);c.restore();
    }
    c.textAlign='center';c.fillStyle='#284a39';c.font='bold 9px Ubuntu';c.fillText(asset.kind,x+68,y+111);
    c.font='bold 11px Ubuntu';c.fillText(asset.name,x+68,y+129);c.textAlign='left';
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
let guildSignature='';
function renderGuild(){if(typeof renderGuildHub155==='function')renderGuildHub155();}

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
  for(const [name,panel] of [['settings',settingsPanel],['guild',guildPanel],['gallery',galleryPanel],['achievements',achievementsPanel],['changelog',changelogPanel]])panel.hidden=extraPanel!==name;
  changelogLaunch.setAttribute('aria-expanded',String(extraPanel==='changelog'));changelogHud.setAttribute('aria-pressed',String(extraPanel==='changelog'));
  if(extraPanel==='guild')renderGuild();if(extraPanel==='gallery')renderGallery();if(extraPanel==='achievements')renderAchievements();
  document.querySelector('.hud-map').hidden=!settings.minimap;
  bossBar.hidden=!nearestBoss;
  const participation=document.getElementById('boss-participation');if(participation && nearestBoss){const own=(multiplayer.contribution[nearestBoss.id] || 0)*100,team=multiplayer.squadContribution?.[nearestBoss.id];participation.textContent='Você: '+own.toFixed(1)+'%'+(team!==undefined ? ' · Squad: '+(team*100).toFixed(1)+'%' : '')+' · loot a partir de 5%';}
  if(nearestBoss){bossBar.querySelector('b').textContent=(nearestBoss.name || 'PEDRA')+' '+nearestBoss.rarity.name;bossBar.querySelector('i').style.width=Math.max(0,nearestBoss.hp/nearestBoss.maxHp*100)+'%';bossBar.querySelector('span').textContent=Math.ceil(nearestBoss.hp).toLocaleString('pt-BR')+' / '+nearestBoss.maxHp.toLocaleString('pt-BR');}
  if(lastAchievementNotice){achievementToast.textContent='★ '+lastAchievementNotice;achievementToast.hidden=false;lastAchievementNotice='';clearTimeout(renderSystems.notice);renderSystems.notice=setTimeout(()=>{achievementToast.hidden=true;},3500);}
}

// Public release notes. Earlier version groupings are reconstructed from project history.
const CHANGELOG_ENTRIES=[
{version:'1.5.5-session2',title:['Reserva de conta sem sessão fantasma','Account leases without ghost sessions'],groups:[{title:['Login','Login'],items:[['A reserva do save só é renovada enquanto o jogador estiver conectado, inclusive no menu. Uma falha de save ou liberação após sair não prende mais a conta indefinidamente.','Save leases are renewed only while the player is connected, including in the menu. A failed save or release after leaving no longer locks an account indefinitely.']]}]},
{version:'1.5.5-recovery1',title:['Contas recuperadas e novas evoluções','Account recovery & new evolutions'],groups:[{title:['Correções e novidades','Fixes & features'],items:[['Corrigido um bloqueio de login causado por saves de sessões antigas. O progresso mais recente do banco é preservado; erros de entrada não são mais escondidos ao clicar em Jogar.','Fixed a login blockage caused by stale session saves. The latest database progress is preserved; clicking Play no longer hides a login error.'],['Magneto Normal evolui até Magneto Cósmico em 12 raridades, com alcance de 500 até 35.000 unidades. Coleta apenas seus drops elegíveis no mesmo mapa, inclusive através de paredes.','Normal Magnet evolves into Cosmic Magnet across 12 rarities, with a 500 to 35,000-unit radius. Collect only your eligible drops on the same map, even through walls.'],['Projéteis hostis, incluindo as pedras lançadas pelos minérios, atingem invocações. O primeiro corpo na trajetória recebe o impacto; aliados derrotados voltam na recarga normal do ovo.','Hostile projectiles, including ore-fired stones, can hit summons. The first body in their path takes the hit; defeated allies return after their normal egg cooldown.'],['Invocações mostram o nome da espécie acima da vida e a raridade colorida abaixo. Biomas recebem caminhos próprios, mantendo suas regiões de raridade e o chão original.','Summons display the species name above health and colored rarity underneath. Biomes gain distinct paths while keeping their rarity territories and original ground.']]}]},
{version:'1.5.5-eggs1',title:['Ovos fortes, pedras móveis e feixe contínuo','Stronger eggs, movable ore & held beams'],groups:[{title:['Combate e mineração','Combat & mining'],items:[['Dano dos ovos acompanha vida, espécie e raridade dos mobs. Cada aliado tem 135% da massa original, mantendo 70% da vida e tamanho. Tooltips mostram dano e intervalo.','Egg damage now scales with mob health, species and rarity. Each ally has 135% of its original mass while retaining 70% health and size. Tooltips show damage and attack timing.'],['Aliados causam dano aos minérios ao encostar. Combate e mineração compartilham a recarga de ataque; o dano e as recompensas contam para o dono, respeitando os 5% de participação.','Allies damage ore on contact. Combat and mining share an attack cooldown; damage and rewards belong to the owner, respecting the 5% participation rule.'],['Minérios podem ser empurrados por players, mobs e aliados. Pedras maiores resistem mais; paredes, praça, outras pedras e portais limitam o deslocamento compartilhado.','Players, mobs and allies can push ore. Larger stones resist more; walls, the safe plaza, other stones and portals limit their shared movement.'],['Segure G ou o botão de magia para manter o Raio do Dossel: 38 mana/s, dano contínuo e 4 s de recarga ao soltar. O feixe para quando a mana acaba.','Hold G or the magic button to sustain Canopy Beam: 38 mana/s, continuous damage and a 4 s cooldown on release. The beam stops when mana runs out.']]}]},
{version:'1.5.5-arcana1',title:['Magia, invocações e clareiras','Magic, summons & clearings'],groups:[{title:['Novidades','New features'],items:[['O Sábio do Dossel, exclusivo da Jungle, entrega sua primeira Orbe Mágica. Mana, quatro magias e talentos até XI. Abra Magia com M e conjure com G ou pelo botão de toque.','The Jungle-only Canopy Sage grants your first Magic Orb. Mana, four spells and talents through XI. Open Magic with M and cast with G or the touch button.'],['Oito ovos invocam aliados laranja automaticamente, com 70% da vida e tamanho da espécie. Cada aliado renasce após uma recarga individual; eles atacam mobs e atravessam jogadores.','Eight eggs automatically summon orange allies with 70% of the species health and size. Each ally respawns on its own cooldown; they fight mobs and pass through players.'],['Clareiras e corredores voltaram aos mapas. Absolut fica em uma região específica; as cores continuam somente no atlas e minimapa, preservando os pisos originais.','Clearings and corridors return to the maps. Absolut has one dedicated territory; rarity colors remain confined to the atlas and minimap, preserving original floors.'],['Spawns de Super e Absolut não geram mais avisos no chat nem marcadores no mapa. Barras de vida de bosses próximos e anúncios de abates permanecem.','Super and Absolut spawns no longer trigger chat announcements or map markers. Nearby boss health bars and defeat announcements remain.']]}]},
{version:'1.5.5-walls1',title:['Paredes entre regiões','Regional walls'],groups:[{title:['Divisas e passagens','Borders & passages'],items:[['Paredes acompanham as divisas das regiões: cercas vivas no Jardim, vegetação na Jungle, falésias na Praia, gelo na Floresta de Gelo e rochas no Deserto.','Walls follow region borders: hedges in the Garden, vegetation in the Jungle, cliffs on the Beach, ice in the Ice Forest and rocks in the Desert.'],['Passagens largas ligam as áreas vizinhas e aparecem em dourado no minimapa e no atlas. As paredes bloqueiam jogadores, mobs e ataques.','Wide passages connect neighboring territories and appear in gold on the minimap and atlas. Walls block players, creatures and attacks.'],['A Caverna mantém o labirinto e também respeita as paredes regionais; câmaras de minérios não apagam essas divisas. A grama e os pisos originais permanecem; cores de raridade continuam apenas nos mapas.','The cave keeps its maze and respects regional walls; ore chambers cannot erase these borders. Original grass and floors remain; rarity colors stay confined to map views.']]}]},
{version:'1.5.5-maps2',title:['Correção das áreas','Territory correction'],groups:[{title:['Áreas contínuas e cenário original','Connected regions and original scenery'],items:[['O mapa inteiro agora é dividido em nove regiões contínuas que se encontram nas bordas. Absolut ocupa uma única parte do mapa e deixa de preencher as áreas restantes.','The entire map is now divided into nine connected regions that meet at their borders. Absolut occupies one part of the map instead of filling all remaining space.'],['As cores das raridades aparecem somente no minimapa e no atlas. A grama e os pisos originais de cada bioma foram restaurados, inclusive a Caverna.','Rarity colors appear only on the minimap and atlas. Original grass and biome floors are restored, including the cave.'],['Os spawns continuam obedecendo à região real onde aparecem. Refúgios continuam seguros.','Spawns still follow the actual region where they appear. Arrival areas remain safe.']]}]},
{version:'1.5.5-maps',title:['Patch dos Territórios','Territories Patch'],groups:[{title:['Mapas e exploração','Maps & exploration'],items:[['Seis mapas com territórios próprios, clareiras, corredores e barreiras. As cores no terreno e no minimapa indicam a raridade predominante.','Six maps with original territories, clearings, corridors and barriers. Ground and minimap colors identify the predominant rarity.'],['Mapas de superfície com 150 mil × 150 mil unidades: 2,25 vezes a área anterior. Caverna com 300 mil × 150 mil, mantendo o dobro da área da superfície.','Surface maps are now 150,000 × 150,000 units: 2.25 times their previous area. The cave is 300,000 × 150,000, still twice the area of one surface map.'],['Absolut é o maior território e tem chão branco. Seus sorteios permitem apenas Absolut, Super e raros Quantium. Mobs e minérios realmente nascem nas regiões, com espécies diferentes por área.','Absolut is the largest territory with white ground. Its rarity rolls allow only Absolut, Super and rare Quantium. Creatures and ores spawn in the territories, with different local species.'],['Clique ou toque no minimapa para abrir o atlas completo, consultar os nomes e a legenda das regiões, portais e aliados.','Click or tap the minimap to open the full atlas with region names, rarity legend, portals and allies.'],['Minérios gigantes respeitam espaço e barreiras. Criaturas distantes entram em repouso com vida e participação preservadas por até dez minutos, com limite de histórico.','Giant deposits respect clearance and barriers. Distant creatures sleep with health and contributions retained for up to ten minutes, within a bounded history.']]}]},
{version:'1.5.5-p1',title:['Patch de Craft e Biomas','Craft & Biomes Patch'],groups:[{title:['Melhorias','Improvements'],items:[['Craft por item, com raridades lado a lado; bordas, giros mais rápidos e duração conforme a chance.','Crafting by item with rarities side by side; borders, faster spinning and chance-based duration.'],['Lotes por clique ou botão segurado: 1, 2, 4, 8… Cada tentativa tem sua própria chance; cópias equipadas ficam protegidas.','Click or hold to select batches: 1, 2, 4, 8… Each attempt rolls separately; equipped copies remain protected.'],['Tornados sem olhos e com 70% menos sucção. Nas áreas externas, mobs SUPER ficam cerca de 5,7 vezes mais frequentes e ABSOLUT cerca de 4,1 vezes.','Eyeless tornadoes with 70% less pull. Outer-region Super mobs are about 5.7 times more frequent, and Absolut about 4.1 times.']]}]},
  {version:'1.5.5',title:['Mega atualização','Mega update'],groups:[{title:['Novidades','What’s new'],items:[['Novos jogadores começam com espada e picareta de madeira. Tutorial rápido de cinco passos para PC e celular: movimento, mineração, combate, equipamentos e salvamento. Pode pular ou rever em Como jogar / ?.','New players start with a wooden sword and pickaxe. Five-step desktop/mobile quick guide: movement, mining, combat, equipment and saving. Skip it or reopen it with How to play / ?.'],['Perfis renovados com retrato, XP, equipamentos, estatísticas e coleção por raridade. Fichas em Ubuntu mostram bônus de acessórios, origem/receitas dos drops e vida/dano/descrição das criaturas ao passar o mouse, focar ou tocar.','Refreshed profiles with portraits, XP, gear, statistics and rarity collections. Ubuntu information cards show accessory bonuses, drop sources/recipes and creature health, damage and descriptions on hover, focus or touch.'],['Chosen, 20 acessórios passivos e Relicário do Retorno, rankings e perfis, novo craft e galeria por abates.','Chosen, 20 passive accessories and the Revival Reliquary, rankings and profiles, reworked crafting and kill gallery.'],['Seis mapas separados: Jardim, Praia, Jungle, Floresta de Gelo, Deserto e Caverna. Portais ficam longe do spawn; o menu sorteia lugares automaticamente com fade e mobs animados, sem controles de câmera.','Six separate maps: Garden, Beach, Jungle, Ice Forest, Desert and Cave. Portals are far from spawn; the menu automatically picks random landmarks with fades and walking creatures, without camera controls.'],['Mobs do Jardim redesenhados com carapaças, olhos e pernas animadas. Acessórios ficam na mesma fileira horizontal dos equipamentos; Craft tem fundo preto e borda cinza. Guildas têm criação por /guild-create-Nome-SIGLA, convites do dono, ranking e busca por jogadores.','Garden creatures redesigned with shells, eyes and animated legs. Accessories share the horizontal equipment hotbar; crafting has a black background and gray border. Guilds add chat creation, owner invitations, total-level rankings and player search.']]}]},
  {version:'1.5.4',title:['Exploração mais leve','Smoother exploration'],groups:[
    {title:['Patch · Convidados','Patch · Guests'],items:[
      ['Agora é possível jogar como convidado, sem criar conta. O personagem começa do zero e só existe durante a sessão.','You can now play as a guest without creating an account. Each guest starts fresh and exists only for the current session.'],
      ['Criar uma conta guarda o nível, os itens e o progresso do convidado atual. Entrar em uma conta existente carrega o save dela, sem mesclar personagens.','Creating an account saves your current guest’s level, items and progress. Signing in to an existing account loads its save without merging characters.'],
      ['Fechar, recarregar ou trocar de servidor perde o convidado. Voltar ao menu mantém a sessão temporária. Guildas e backups exigem uma conta.','Closing, reloading or switching servers loses the guest. Returning to the menu keeps the temporary session. Guilds and backups require an account.']
    ]},
    {title:['Desempenho','Performance'],items:[
      ['Corrigido o acúmulo de minérios que deixava o jogo progressivamente mais lento conforme o mapa era explorado.','Fixed ore accumulation that made the game progressively slower as players explored the map.'],
      ['A geração de minérios agora consulta células próximas, em vez de percorrer repetidamente o mapa inteiro.','Ore generation now checks nearby cells instead of repeatedly scanning the entire explored world.'],
      ['Minérios parados deixam de ser reenviados em todos os pacotes. A lista é atualizada ao mudar de área, minerar ou alterar seu estado.','Stationary ores are no longer resent in every update. The list refreshes when the area or ore state changes.'],
      ['Efeitos distantes e registros de entidades já removidas deixam de acumular trabalho.','Distant effects and records of removed entities no longer accumulate unnecessary work.']
    ]},
    {title:['Changelog','Changelog'],items:[
      ['Novo painel de atualizações no menu e na HUD, com histórico da 1.5 à 1.5.4, navegação por versão, expansão e leitura em português ou inglês.','Added an update panel in the menu and HUD, with history from 1.5 to 1.5.4, version navigation, an expanded view and Portuguese or English notes.']
    ]},
    {title:['Mundo compartilhado','Shared world'],items:[
      ['Áreas sem jogadores entram em repouso. A área de outro jogador continua ativa, mesmo quando você se afasta.','Areas without players go dormant. Another player’s area stays active when you move away.'],
      ['Depósitos comuns a Ultra em repouso mantêm HP e participação no histórico por até 10 minutos, com limite de 4.000 por mapa.','Dormant Common–Ultra deposits retain HP and contribution for up to 10 minutes, with a limit of 4,000 per map.'],
      ['Bosses Super+ são preservados. Drops existentes mantêm seu tempo de duração e os jogadores que podem coletá-los.','Super+ bosses are preserved. Existing drops keep their lifetime and pickup eligibility.'],
      ['No teste local com 9 mil minérios antigos, a geração caiu de aproximadamente 1,08 s para 12 ms. Pacotes recorrentes caíram de cerca de 19,1 KB para 3,9 KB. Resultados variam conforme o cenário.','In a local test with 9,000 previously explored ores, generation fell from about 1.08 s to 12 ms. Recurring snapshots fell from roughly 19.1 KB to 3.9 KB. Results depend on the scene.']
    ]}
  ]},
  {version:'1.5.3',title:['Servidores e movimento','Servers & movement'],groups:[
    {title:['Servidores','Servers'],items:[
      ['Adicionado seletor BR / US acima dos mapas, com ping medido e indicação do servidor selecionado.','Added a BR / US selector above the maps, with measured latency and a selected-server indicator.'],
      ['A mesma conta, nível, moedas, inventário e equipamentos acompanham a troca entre servidores conectados ao mesmo banco.','The same account, level, coins, inventory and equipment carry over between servers connected to the same database.'],
      ['A troca confirma o save antes de sair. Servidores indisponíveis ou incompatíveis não recebem sua sessão.','Switching confirms the save before leaving. Unavailable or incompatible servers do not receive your session.'],
      ['Cada servidor possui seu próprio mundo, chat e squads. Para jogar junto, escolha a mesma região dos seus amigos. Regiões dependem das hospedagens disponíveis.','Each server has its own world, chat and squads. Choose the same region as your friends to play together. Regions depend on available hosting.']
    ]},
    {title:['Caminhada suave','Smoother movement'],items:[
      ['Cliente e servidor passaram a usar a mesma aceleração para mouse, WASD e joystick.','Client and server now use the same acceleration for mouse, WASD and joystick controls.'],
      ['Movimentos ainda não confirmados são reaplicados. Correções de posição e câmera são suavizadas para reduzir tremidas.','Unacknowledged movement is replayed. Position and camera corrections are smoothed to reduce shaking.'],
      ['Melhor tratamento de atraso variável, perda de pacotes, reconexões e movimentos enviados antes de uma troca de mapa.','Improved handling of variable delay, lost packets, reconnects and movement sent before a map transition.']
    ]}
  ]},
  {version:'1.5.2',title:['Mobile e grande rebalanceamento','Mobile & major rebalance'],groups:[
    {title:['Mobile e contas','Mobile & accounts'],items:[
      ['Adicionados joystick virtual, ataque ao segurar e botões de habilidades, utilidade e lanterna. Layout adaptado para celular na horizontal e vertical.','Added a virtual joystick, hold-to-attack and buttons for abilities, utilities and the lantern. The layout supports portrait and landscape mobile screens.'],
      ['Contas passaram a ser obrigatórias. Corrigido o acesso indevido ao progresso de outro jogador ao digitar seu nick.','Accounts became mandatory. Fixed access to another player’s progress by entering their nickname.'],
      ['Nomes vazios são recusados. Contas novas começam no nível 1, sem herdar o antigo perfil genérico “Player”.','Blank names are rejected. New accounts start at Level 1 without inheriting the old generic “Player” profile.'],
      ['Adicionado X para voltar ao menu mantendo a conta conectada, com transições circulares entre cenas.','Added an X button to return to the menu while staying signed in, with circular scene transitions.']
    ]},
    {title:['HUD, colisões e loot','HUD, collisions & loot'],items:[
      ['Prévia da coxinha com olhos acompanhando a direção do olhar, barras de vida abaixo das entidades e perda de vida suave.','Added a coxinha portrait with eyes following the aim direction, health bars below entities and smooth health loss.'],
      ['Melhorados os quadros dos itens por raridade, a cor da caixa da picareta e a textura do gramado.','Improved rarity item frames, pickaxe slot coloring and grass texture.'],
      ['Adicionadas colisões entre jogadores, criaturas e minérios.','Added collisions between players, creatures and ores.'],
      ['Minérios e todas as espécies naturais passaram a deixar itens físicos no chão, com animação de queda, coleta e desaparecimento. Drops duram 3 minutos.','Ores and every natural mob species now leave physical items on the ground, with spawn, pickup and fade effects. Drops last 3 minutes.'],
      ['Invocações de bosses continuam sem XP, moedas ou drops.','Boss summons continue to award no XP, coins or drops.']
    ]},
    {title:['Balanceamento','Balance'],items:[
      ['Chegar ao nível 300 passou a exigir 100 bilhões de XP acumulados desde o nível 1. O nível 300 não é o limite.','Reaching Level 300 now requires 100 billion total XP from Level 1. Level 300 is not the level cap.'],
      ['Mobs Comuns receberam 2,5× a vida anterior. Bosses Super receberam 6× a vida anterior, com variação por espécie.','Common mobs received 2.5× their previous HP. Super bosses received 6× their previous HP, depending on the species.'],
      ['Exemplos de vida Super: Abelha 3 milhões, Guardião 5,4 milhões e Besouro 10,2 milhões.','Super HP examples: Bee 3 million, Guardian 5.4 million and Beetle 10.2 million.'],
      ['Minérios: Super 12 milhões de HP, Absolut 60 milhões, Quantium 200 milhões e Aleph 1 bilhão.','Ore HP: Super 12 million, Absolut 60 million, Quantium 200 million and Aleph 1 billion.'],
      ['Bosses Super+ ganharam padrões mais densos de projéteis, ataques em sequência e mais invocações. Dano base de contato e das armas permaneceu igual ao da versão anterior.','Super+ bosses gained denser projectile patterns, follow-up attacks and more summons. Base contact and weapon damage stayed unchanged from the previous version.']
    ]}
  ]},
  {version:'1.5.1',historical:true,title:['Contas, menu e squads','Accounts, menu & squads'],groups:[
    {title:['Sua aventura','Your adventure'],items:[
      ['Introduzidas contas com nick e senha e botão da pequena coxinha branca para entrar.','Introduced nickname-and-password accounts and the small white coxinha sign-in button.'],
      ['Novo menu com seleção de Jardim e Caverna, prévia do personagem, nível e equipamentos.','Added a menu with Garden and Cave selection, character preview, level and equipment.'],
      ['Progresso associado ao perfil do jogador e integração com armazenamento persistente.','Player progress was associated with profiles and persistent storage integration.']
    ]},
    {title:['Jogue em grupo','Play together'],items:[
      ['Introduzidos squads para até quatro jogadores, com código de convite e gerenciamento do grupo.','Introduced squads for up to four players, with invite codes and group management.'],
      ['O dano do squad soma para atingir os 5% de participação. Cada integrante elegível recebe uma recompensa normal, uma única vez.','Squad damage combines toward the 5% contribution requirement. Each eligible member receives one normal reward, once.'],
      ['Recompensas do grupo exigem integrante vivo, fora do menu, no mesmo mapa e a até 2.500 unidades da borda do alvo.','Group rewards require a living member outside the menu, on the same map and within 2,500 units of the target’s edge.']
    ]}
  ]},
  {version:'1.5',historical:true,title:['Mundo multiplayer','Multiplayer world'],groups:[
    {title:['Exploração e combate','Exploration & combat'],items:[
      ['Jardim e caverna com mineração, criaturas, equipamentos, armaduras, utilidades e talentos de I a XI.','Garden and cave exploration with mining, creatures, equipment, armor, utilities and talents from I to XI.'],
      ['Espadas voltadas para criaturas e picaretas voltadas para minérios, com habilidades de equipamentos avançados.','Swords target creatures and pickaxes target ores, with abilities for advanced equipment.'],
      ['Adicionadas animações de caminhada, efeitos de equipamentos e melhorias visuais de raridades elevadas.','Added walking animations, equipment effects and visual improvements for high rarities.'],
      ['Melhorada a presença de minérios Ultra nas extremidades do jardim.','Improved Ultra ore availability at the garden’s outer edges.']
    ]},
    {title:['Mundo compartilhado','Shared world'],items:[
      ['Combate, criaturas e minérios passaram a ser controlados pelo servidor para que jogadores interajam com os mesmos alvos.','Combat, creatures and ores became server-controlled so players could interact with the same targets.'],
      ['Corrigidos personagens seguindo o mouse de outro jogador e diferenças de estado entre telas.','Fixed characters following another player’s mouse and inconsistent world state between screens.'],
      ['Adicionada participação mínima de 5% da vida real do alvo para qualificar o loot individual.','Added a minimum contribution of 5% of the target’s actual HP to qualify for individual loot.']
    ]}
  ]}
];

const changelogPanel=createSystemPanel('changelog','Changelog');
changelogPanel.id='changelog-panel';changelogPanel.setAttribute('aria-modal','false');changelogPanel.tabIndex=-1;
const changelogIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h15v17H5zM2 7h3v13H2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8 7h9M8 11h9M8 15h9" stroke="currentColor" stroke-width="2"/></svg>';
const changelogLaunch=document.createElement('button');changelogLaunch.type='button';changelogLaunch.id='changelog-launch';changelogLaunch.className='hud-button changelog-launch';changelogLaunch.innerHTML=changelogIcon;changelogLaunch.setAttribute('aria-label','Changelog');changelogLaunch.title='Changelog · atualizações';document.body.append(changelogLaunch);
const changelogHud=document.createElement('button');changelogHud.type='button';changelogHud.className='hud-button changelog-hud';changelogHud.dataset.panel='changelog';changelogHud.setAttribute('aria-label','Changelog');changelogHud.title='Changelog · atualizações';changelogHud.innerHTML=changelogIcon;document.querySelector('.hud-top').append(changelogHud);
const changelogHead=changelogPanel.querySelector('header'),changelogClose=changelogPanel.querySelector('.panel-close'),changelogExpand=document.createElement('button');
changelogExpand.type='button';changelogExpand.className='changelog-expand';changelogExpand.textContent='⤢';changelogExpand.setAttribute('aria-label','Expandir changelog');changelogHead.insertBefore(changelogExpand,changelogClose);
const changelogTools=document.createElement('div');changelogTools.className='changelog-tools';changelogTools.innerHTML='<span></span><div aria-label="Idioma das notas"><button type="button" data-news-lang="pt">PT</button><button type="button" data-news-lang="en">EN</button></div>';
const changelogVersions=document.createElement('nav');changelogVersions.className='changelog-versions';changelogVersions.setAttribute('aria-label','Versões');
const changelogScroll=document.createElement('div');changelogScroll.className='changelog-scroll';changelogScroll.tabIndex=0;changelogScroll.setAttribute('aria-label','Notas das atualizações');
changelogPanel.append(changelogTools,changelogVersions,changelogScroll);
let changelogLanguage=localStorage.getItem('coxinha_changelog_language')==='en' ? 'en' : 'pt',changelogReturnFocus=changelogLaunch;
function changelogText(pair){return pair[changelogLanguage==='en' ? 1 : 0];}
function renderChangelog(){
  const english=changelogLanguage==='en';changelogScroll.lang=changelogLanguage;
  changelogTools.querySelector('span').textContent=english ? 'UPDATE HISTORY' : 'HISTÓRICO DE ATUALIZAÇÕES';
  changelogTools.querySelectorAll('[data-news-lang]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.newsLang===changelogLanguage)));
  changelogVersions.replaceChildren();changelogScroll.replaceChildren();
  for(const [index,release] of CHANGELOG_ENTRIES.entries()){
    const jump=document.createElement('button');jump.type='button';jump.textContent=release.version;jump.setAttribute('aria-label',(english ? 'Read version ' : 'Ler versão ')+release.version);jump.dataset.release=release.version;jump.setAttribute('aria-pressed',String(index===0));changelogVersions.append(jump);
    const article=document.createElement('article');article.className='changelog-release';article.id='release-'+release.version.replaceAll('.','-');
    const tag=document.createElement('div');tag.className='changelog-release-tag';tag.textContent='v'+release.version;
    if(index===0){const latest=document.createElement('span');latest.textContent=english ? 'LATEST' : 'ATUAL';tag.append(latest);}
    const heading=document.createElement('h2');heading.textContent=changelogText(release.title);article.append(tag,heading);
    for(const group of release.groups){const title=document.createElement('h3'),list=document.createElement('ul');title.textContent=changelogText(group.title);for(const item of group.items){const line=document.createElement('li');line.textContent=changelogText(item);list.append(line);}article.append(title,list);}
    if(release.historical){const note=document.createElement('small');note.className='changelog-historical';note.textContent=english ? 'Summary reconstructed from project history.' : 'Resumo reconstruído a partir do histórico do projeto.';article.append(note);}
    changelogScroll.append(article);jump.onclick=()=>changelogScroll.scrollTo({top:Math.max(0,article.offsetTop-8),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  }
  changelogScroll.scrollTop=0;
}
function closeChangelog(){if(extraPanel==='changelog')extraPanel=null;changelogPanel.hidden=true;changelogLaunch.setAttribute('aria-expanded','false');changelogReturnFocus?.focus();}
function openChangelog(event){
  if(!changelogPanel.hidden){closeChangelog();return;}changelogReturnFocus=event?.currentTarget || changelogLaunch;
  toggleHudPanel('changelog');if(typeof accountPanel!=='undefined')accountPanel.hidden=true;if(typeof squadPanel!=='undefined')squadPanel.hidden=true;
  renderSystems();changelogLaunch.setAttribute('aria-expanded','true');localStorage.setItem('coxinha_changelog_seen',CHANGELOG_ENTRIES[0].version);changelogLaunch.classList.remove('has-news');changelogHud.classList.remove('has-news');changelogPanel.focus({preventScroll:true});
}
changelogLaunch.onclick=changelogHud.onclick=openChangelog;changelogClose.onclick=closeChangelog;
for(const button of [changelogLaunch,changelogHud]){button.setAttribute('aria-controls','changelog-panel');button.classList.toggle('has-news',localStorage.getItem('coxinha_changelog_seen')!==CHANGELOG_ENTRIES[0].version);}
changelogLaunch.setAttribute('aria-expanded','false');
changelogExpand.onclick=()=>{const expanded=changelogPanel.classList.toggle('expanded');changelogExpand.setAttribute('aria-label',expanded ? 'Reduzir changelog' : 'Expandir changelog');changelogExpand.setAttribute('aria-pressed',String(expanded));};
changelogTools.querySelectorAll('[data-news-lang]').forEach(button=>button.onclick=()=>{changelogLanguage=button.dataset.newsLang;localStorage.setItem('coxinha_changelog_language',changelogLanguage);renderChangelog();});
changelogScroll.addEventListener('scroll',()=>{let selected=0;[...changelogScroll.children].forEach((article,index)=>{if(article.offsetTop<=changelogScroll.scrollTop+24)selected=index;});if(changelogScroll.scrollTop+changelogScroll.clientHeight>=changelogScroll.scrollHeight-4)selected=CHANGELOG_ENTRIES.length-1;[...changelogVersions.children].forEach((button,index)=>button.setAttribute('aria-pressed',String(index===selected)));},{passive:true});
changelogPanel.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeChangelog();}});
document.addEventListener('keydown',event=>{if(event.key==='Escape' && !changelogPanel.hidden)closeChangelog();});
renderChangelog();
