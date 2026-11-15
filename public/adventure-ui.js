const deathCurtain=document.createElement('section');deathCurtain.className='death-curtain';deathCurtain.hidden=true;deathCurtain.setAttribute('role','dialog');deathCurtain.setAttribute('aria-label','Você morreu');
deathCurtain.innerHTML='<div><h1>Você morreu</h1><p id="death-cause"></p><button id="return-from-death">Voltar</button></div>';document.body.append(deathCurtain);document.getElementById('return-from-death').onclick=returnFromDeath;
const caveDialog=createSystemPanel('cave-warning','Caverna profunda');caveDialog.classList.add('cave-warning');caveDialog.insertAdjacentHTML('beforeend','<div class="cave-warning-body"><p>Um labirinto escuro com guardiões e minérios de raridade elevada.</p><strong>Recomendado nível 90 e Matéria Vermelha ou superior.</strong><p>Leve uma lanterna ou desenvolva Visão noturna.</p><div id="cave-equipment-status"></div><button id="enter-cave" class="craft-pickaxe">Entrar na caverna</button></div>');
caveDialog.querySelector('.panel-close').onclick=()=>{cavePromptOpen=false;};document.getElementById('enter-cave').onclick=()=>switchRealm('cave');
const adventureControls=document.createElement('nav');adventureControls.className='adventure-controls';adventureControls.setAttribute('aria-label','Habilidades e exploração');
adventureControls.innerHTML='<button id="ability-weapon"><kbd>Q</kbd><span>Espada</span></button><button id="ability-pickaxe"><kbd>R</kbd><span>Picareta</span></button><button id="toggle-lantern"><kbd>F</kbd><span>Lanterna</span></button>';document.body.append(adventureControls);
document.getElementById('ability-weapon').onclick=()=>useEquipmentAbility('weapon');document.getElementById('ability-pickaxe').onclick=()=>useEquipmentAbility('pickaxe');document.getElementById('toggle-lantern').onclick=toggleLantern;
const portalHint=document.createElement('button');portalHint.id='portal-hint';portalHint.hidden=true;portalHint.onclick=interactPortal;document.body.append(portalHint);
const utilityControl=document.createElement('button');utilityControl.id='ability-utility';utilityControl.innerHTML='<kbd>Z</kbd><span>Utilidade</span>';utilityControl.onclick=useUtilityAbility;adventureControls.append(utilityControl);
function renderAdventureUi(){
  const inGame=document.getElementById('menu').style.display==='none';
  deathCurtain.hidden=!player.dead;document.getElementById('death-cause').textContent='Você morreu para '+player.deathCause+'.';
  caveDialog.hidden=!cavePromptOpen;
  if(cavePromptOpen){const ready=player.level>=90 && Math.max(PICKAXE_RECIPES.findIndex(r=>r.name===player.equipment.pickaxe?.name),SWORDS.findIndex(r=>r.name===player.equipment.weapon?.name))>=4;document.getElementById('cave-equipment-status').textContent=ready ? 'Seu nível e armamento atendem à recomendação.' : 'Você pode entrar agora, mas os inimigos são muito mais fortes.';}
  adventureControls.hidden=!inGame || player.dead;
  const utility=equippedUtility(),utilityRemaining=Math.max(0,Math.ceil(((player.abilityReadyAt?.utility || 0)-Date.now())/1000));
  utilityControl.hidden=!utility?.active;utilityControl.disabled=utilityRemaining>0 || isUiBlocking();utilityControl.querySelector('span').textContent=(utility?.name || 'Utilidade')+(utilityRemaining ? ' '+utilityRemaining+'s' : '');utilityControl.title=utility?.description || '';
  for(const type of ['weapon','pickaxe']){
    const button=document.getElementById('ability-'+type),ability=equipmentAbility(player.equipment[type]),remaining=Math.max(0,Math.ceil(((player.abilityReadyAt?.[type] || 0)-Date.now())/1000));
    button.disabled=!ability || remaining>0 || isUiBlocking();button.querySelector('span').textContent=ability ? remaining ? ability.name+' '+remaining+'s' : ability.name : type==='weapon' ? 'Espada Diamante+' : 'Picareta Diamante+';
    button.title=ability ? ability.name+' · '+ability.cooldown+'s de recarga' : 'Desbloqueia em equipamentos Diamante ou superiores.';
  }
  const lantern=document.getElementById('toggle-lantern');lantern.disabled=!ownsLantern();lantern.setAttribute('aria-pressed',String(!!player.lanternOn));lantern.querySelector('span').textContent=player.lanternOn ? 'Lanterna ligada' : 'Lanterna';
  const distance=currentRealm==='garden' ? Math.hypot(player.x-CAVE_ENTRANCE.x,player.y-CAVE_ENTRANCE.y) : Math.hypot(player.x-750,player.y-750);
  portalHint.hidden=!inGame || player.dead || distance>360 || cavePromptOpen;portalHint.textContent=currentRealm==='cave' ? '[E] Sair da caverna' : '[E] Entrar na caverna';
}
function renderBestiary(content){
  const grid=document.createElement('div');grid.className='gallery-grid';content.append(grid);
  for(const definition of CREATURES){
    const card=document.createElement('article');card.className='gallery-card';card.style.setProperty('--card-color',definition.color);
    const image=document.createElement('canvas');image.width=100;image.height=90;drawCreatureModel(definition.kind,image.getContext('2d'),50,45,definition.kind==='centipede' ? 24 : 30,0);
    const name=document.createElement('b');name.textContent=definition.name;
    const count=Object.entries(player.journal?.species || {}).filter(([key])=>key.startsWith(definition.kind+':')).reduce((sum,entry)=>sum+entry[1],0);
    const info=document.createElement('small');info.textContent=count ? count+' encontro(s) registrado(s)' : 'Ainda não encontrado';
    const tiers=document.createElement('small');tiers.textContent=definition.temperament==='hostile' ? 'Hostil · persegue o jogador' : 'Neutro · persegue e revida ao ser atacado';
    const ability=document.createElement('small');ability.textContent='SUPER+ · '+SPECIAL_MOB_ABILITIES[definition.kind].name+': '+SPECIAL_MOB_ABILITIES[definition.kind].description;
    card.append(image,name,info,tiers,ability);grid.append(card);
  }
}
