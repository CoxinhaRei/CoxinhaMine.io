// A short, skippable guide. Reading it never joins a server or changes a save.
const tutorialSeenKey155='coxinha_quick_tutorial_v155';
let tutorialAutoPending155=true,tutorialStep155=0,tutorialMode155=null,tutorialOpener155=null;
try{tutorialAutoPending155=!localStorage.getItem(tutorialSeenKey155);}catch{}
const tutorialBackdrop155=document.createElement('div');tutorialBackdrop155.className='tutorial-backdrop';tutorialBackdrop155.hidden=true;document.body.append(tutorialBackdrop155);
const tutorialPanel155=createSystemPanel('tutorial','Tutorial rápido');tutorialPanel155.setAttribute('aria-modal','true');tutorialPanel155.classList.add('quick-tutorial');
tutorialPanel155.insertAdjacentHTML('beforeend','<div class="tutorial-body"><div class="tutorial-progress"><span id="tutorial-counter"></span><span>Aprenda em menos de 1 minuto</span></div><div id="tutorial-dots" aria-hidden="true"></div><div class="tutorial-scene"><img id="tutorial-image" alt=""><img id="tutorial-eyes" src="sprites/player_eyes.png" alt="" hidden></div><div id="tutorial-copy" aria-live="polite" aria-atomic="true"><small id="tutorial-control"></small><h2 id="tutorial-title"></h2><p id="tutorial-text"></p><p id="tutorial-tip"></p></div><footer><button type="button" id="tutorial-skip">Pular tutorial</button><button type="button" id="tutorial-back">Voltar</button><button type="button" id="tutorial-next">Próximo →</button></footer></div>');
const tutorialMenu155=document.createElement('button');tutorialMenu155.type='button';tutorialMenu155.textContent='Como jogar';document.querySelector('.menu-tools').append(tutorialMenu155);
const tutorialHud155=document.createElement('button');tutorialHud155.type='button';tutorialHud155.className='hud-button';tutorialHud155.textContent='?';tutorialHud155.title='Como jogar';tutorialHud155.setAttribute('aria-label','Tutorial rápido');document.querySelector('.hud-top').append(tutorialHud155);
function openTutorial155(opener){tutorialOpener155=opener||document.activeElement;tutorialAutoPending155=false;tutorialStep155=0;tutorialMode155=null;inventoryOpen=shopOpen=craftOpen=talentsOpen=false;accountPanel.hidden=squadPanel.hidden=true;extraPanel='tutorial';heldKeys.clear();mouse.down=mouse.right=false;movementAimActive=false;resetMobileInput();hideItemTooltip155();renderTutorial155();document.getElementById('tutorial-next').focus();}
function closeTutorial155(){try{localStorage.setItem(tutorialSeenKey155,'1');}catch{}tutorialAutoPending155=false;if(extraPanel==='tutorial')extraPanel=null;tutorialPanel155.hidden=tutorialBackdrop155.hidden=true;tutorialOpener155?.focus?.();}
tutorialMenu155.onclick=()=>openTutorial155(tutorialMenu155);tutorialHud155.onclick=()=>openTutorial155(tutorialHud155);tutorialPanel155.querySelector('.panel-close').onclick=closeTutorial155;
document.getElementById('tutorial-skip').onclick=closeTutorial155;document.getElementById('tutorial-back').onclick=()=>{tutorialStep155=Math.max(0,tutorialStep155-1);tutorialMode155=null;renderTutorial155();};
document.getElementById('tutorial-next').onclick=()=>{if(tutorialStep155===QuickTutorial.steps().length-1){closeTutorial155();return;}tutorialStep155++;tutorialMode155=null;renderTutorial155();};
function renderTutorial155(){
  if(tutorialAutoPending155&&menuVisible()&&!extraPanel&&!inventoryOpen&&!shopOpen&&!talentsOpen&&!craftOpen&&!modalUiBlocking()){openTutorial155(tutorialMenu155);return;}
  const visible=extraPanel==='tutorial';tutorialPanel155.hidden=tutorialBackdrop155.hidden=!visible;if(!visible)return;
  const mode=!!mobileState.enabled,key=tutorialStep155+':'+mode;if(tutorialMode155===key)return;tutorialMode155=key;
  const steps=QuickTutorial.steps(mode),step=steps[tutorialStep155];document.getElementById('tutorial-counter').textContent='Passo '+(tutorialStep155+1)+' de '+steps.length;
  document.getElementById('tutorial-title').textContent=step.title;document.getElementById('tutorial-control').textContent=step.control;document.getElementById('tutorial-text').textContent=step.text;document.getElementById('tutorial-tip').textContent=step.tip;
  document.getElementById('tutorial-image').src=step.image;document.getElementById('tutorial-eyes').hidden=!['move','save'].includes(step.id);
  const dots=document.getElementById('tutorial-dots');dots.replaceChildren();steps.forEach((_,n)=>{const dot=document.createElement('i');dot.classList.toggle('active',n===tutorialStep155);dots.append(dot);});
  document.getElementById('tutorial-back').disabled=tutorialStep155===0;document.getElementById('tutorial-next').textContent=tutorialStep155===steps.length-1?'Pronto, vamos jogar!':'Próximo →';tutorialPanel155.dataset.step=step.id;
}
const systemsBeforeTutorial155=renderSystems;renderSystems=function(){systemsBeforeTutorial155();renderTutorial155();};
document.addEventListener('keydown',e=>{if(tutorialPanel155.hidden)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeTutorial155();return;}if(e.key==='Tab'){const controls=[...tutorialPanel155.querySelectorAll('button')].filter(b=>!b.disabled),first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}},true);
renderTutorial155();
