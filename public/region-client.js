(function(){
 'use strict';
 class RegionSocket{
  constructor(){this.handlers=new Map();this.raw=null;this.generation=0;this.current=location.origin;this.ready=this.discover();}
  get connected(){return !!this.raw?.connected;}
  get id(){return this.raw?.id;}
  get io(){return this.raw?.io;}
  get volatile(){return {emit:(...args)=>this.send(true,0,args)};}
  on(event,handler){if(!this.handlers.has(event)){this.handlers.set(event,new Set());this.watch(event);}this.handlers.get(event).add(handler);return this;}
  off(event,handler){this.handlers.get(event)?.delete(handler);return this;}
  once(event,handler){const once=(...args)=>{this.off(event,once);handler(...args);};return this.on(event,once);}
  emit(...args){return this.send(false,0,args);}
  timeout(ms){return {emit:(...args)=>this.send(false,ms,args)};}
  send(volatile,timeout,args){
   const generation=this.generation,last=args.at(-1);
   if(typeof last==='function')args[args.length-1]=(...values)=>{if(generation===this.generation)last(...values);};
   if(!this.raw){if(timeout && typeof last==='function')queueMicrotask(()=>last(Error('Servidor desconectado.')));return this;}
   let target=volatile ? this.raw.volatile : this.raw;if(timeout)target=target.timeout(timeout);target.emit(...args);return this;
  }
  watch(event){if(!this.raw)return;const generation=this.generation;this.raw.on(event,(...args)=>{if(generation===this.generation)for(const handler of [...(this.handlers.get(event) || [])])handler(...args);});}
  use(url){
   if(this.raw){this.raw.disconnect();this.raw.removeAllListeners();}
   this.generation++;this.current=url;this.raw=io(url,{autoConnect:false,auth:{oreCache:true},transports:['websocket','polling'],tryAllTransports:true,reconnectionDelay:750,reconnectionDelayMax:4000,timeout:12000});
   for(const event of this.handlers.keys())this.watch(event);this.raw.connect();
  }
  async discover(){
   try{const response=await fetch('/servers',{cache:'no-store',signal:AbortSignal.timeout(5000)});if(!response.ok)throw Error();this.config=await response.json();}catch{this.config={current:{id:'GLOBAL',location:'Servidor atual',url:location.origin},servers:[],sharedSaveId:null};}
   let initial=location.origin;
   try{const id=localStorage.getItem('coxinha_region_v5'),entry=this.config.servers.find(server=>server.id===id && server.url);if(entry && entry.url!==initial){const status=await probe(entry.url);if(validRegion(entry,status,this.config))initial=entry.url;}}catch{}
   if(document.readyState==='loading')await new Promise(resolve=>window.addEventListener('DOMContentLoaded',resolve,{once:true}));
   this.use(initial);return this.config;
  }
 }
 async function probe(url){const start=performance.now(),response=await fetch(new URL('/ping?t='+Date.now(),url),{cache:'no-store',signal:AbortSignal.timeout(7000)});if(!response.ok)throw Error('Servidor indisponível.');const status=await response.json();return {...status,ping:Math.round(performance.now()-start)};}
 function validRegion(entry,status,config){return status.ok && status.region===entry.id && status.protocol>=5 && status.sharedSaves && config.sharedSaves && !!config.sharedSaveId && status.sharedSaveId===config.sharedSaveId;}
 window.createRegionSocket=()=>new RegionSocket();
 window.addEventListener('DOMContentLoaded',async()=>{
  const connection=socket;if(!(connection instanceof RegionSocket))return;
  const config=await connection.ready,statuses=new Map();let busy=false,probing=false;
  const selector=document.createElement('nav');selector.className='region-selector';selector.setAttribute('aria-label','Escolher servidor');
  selector.innerHTML='<b>Servidores</b><div class="region-buttons"></div><small class="region-message" role="status"></small>';
  document.getElementById('menu').append(selector);const row=selector.querySelector('.region-buttons'),message=selector.querySelector('.region-message');
  const entries=['BR','US'].map(id=>config.servers.find(entry=>entry.id===id) || {id,url:null,location:id==='BR' ? 'Brasil' : 'Estados Unidos'});
  function render(){
   for(const button of row.children){const entry=entries.find(item=>item.id===button.dataset.region),status=statuses.get(entry.id),selected=(entry.url || location.origin)===connection.current && !!entry.url;
    button.disabled=busy || !entry.url;button.classList.toggle('selected',selected);button.classList.toggle('region-offline',status?.error);button.setAttribute('aria-pressed',String(selected));button.querySelector('small').textContent=!entry.url ? '—' : status?.error ? 'offline' : status?.ping!==undefined ? status.ping+' ms' : '…';
    button.title=entry.url ? entry.location+(status?.error ? ' · indisponível; clique para tentar novamente' : '') : 'Ainda não há servidor configurado para esta região';
   }
   if(!busy && !message.dataset.error){const current=entries.find(entry=>entry.url===connection.current);message.textContent=current?.location || config.current.location || 'Servidor atual';}
  }
  for(const entry of entries){const button=document.createElement('button');button.type='button';button.dataset.region=entry.id;const label=document.createElement('span'),ping=document.createElement('small');label.textContent=entry.id;button.append(label,ping);button.onclick=()=>choose(entry);row.append(button);}
  async function measure(){
   if(probing || busy || !menuVisible())return;probing=true;
   try{await Promise.all(entries.filter(entry=>entry.url).map(async entry=>{try{const status=await probe(entry.url);if(status.region!==entry.id)throw Error();statuses.set(entry.id,status);}catch{statuses.set(entry.id,{error:true});}}));render();}finally{probing=false;}
  }
  function resetWorld(){
   if(multiplayer.guest)resetGuestSession();
   multiplayer.ready=false;multiplayer.started=false;multiplayer.inLobby=!!activeSession();multiplayer.pendingJoin=false;multiplayer.lastSent=null;multiplayer.drops=[];multiplayer.contribution={};multiplayer.squadContribution={};multiplayer.ping=undefined;
   players={};ores=[];mobs=[];projectiles=[];particles=[];abilityEffects=[];nearestBoss=null;pendingMovement.clear();multiplayer.correctedSeq=0;window.networkMovement?.reset();
   squadState={members:[]};renderSquad();accountPanel.hidden=true;squadPanel.hidden=true;inventoryOpen=shopOpen=craftOpen=talentsOpen=false;extraPanel=null;heldKeys.clear();movementAimActive=false;resetMobileInput();clearBossMobEffects();
  }
  function connectTo(url){return new Promise((resolve,reject)=>{
   const event=activeSession() ? 'profileReady' : 'init',timer=setTimeout(()=>finish(Error('O servidor demorou a responder.')),20000);
   const ready=()=>finish(),error=()=>finish(Error('Não foi possível conectar ao servidor.'));
   function finish(problem){clearTimeout(timer);connection.off(event,ready);connection.off('connect_error',error);problem ? reject(problem) : resolve();}
   connection.on(event,ready);connection.on('connect_error',error);connection.use(url);
  });}
  async function choose(entry){
   if(busy || !entry.url || entry.url===connection.current)return;
   if(multiplayer.guest && selector.dataset.guestTarget!==entry.id){selector.dataset.guestTarget=entry.id;message.dataset.error='true';message.textContent='O convidado recomeça ao trocar de servidor. Crie uma conta para guardar o progresso ou clique novamente em '+entry.id+' para recomeçar.';return;}
   if(authBusy || multiplayer.pendingJoin){message.textContent='Aguarde a entrada na conta terminar.';return;}
   busy=true;window.regionSwitching=true;message.dataset.error='';message.textContent='Verificando '+entry.id+'…';render();const previous=connection.current;let left=false;
   try{
    const status=await probe(entry.url);statuses.set(entry.id,status);
    if(status.region!==entry.id)throw Error('O endereço configurado pertence a outra região.');
    if(!validRegion(entry,status,config))throw Error('Os servidores precisam usar o mesmo banco e a versão nova para compartilhar seu save.');
    if(activeSession() || multiplayer.guest){
     if(!connection.connected)throw Error('Reconecte ao servidor atual para confirmar o save antes de trocar.');
     message.textContent=multiplayer.guest ? 'Encerrando o convidado temporário…' : 'Salvando sua conta…';const result=await callServer('leaveServer',{});if(!result.ok)throw Error(result.message || 'O save ainda não foi confirmado.');
    }
    left=true;
    await irisTransition(async()=>{resetWorld();message.textContent='Conectando a '+entry.id+'…';await connectTo(entry.url);});
    localStorage.setItem('coxinha_region_v5',entry.id);message.textContent=entry.location;message.removeAttribute('data-error');
   }catch(error){
    if(left){try{resetWorld();await connectTo(previous);}catch{}}
    message.dataset.error='true';message.textContent=error.message;sharedNotice(error.message);
   }finally{busy=false;window.regionSwitching=false;render();renderMenu();}
  }
  connection.on('init',data=>{multiplayer.region=data.region;multiplayer.serverLocation=data.location;});
  connection.on('serverSessionLost',text=>{multiplayer.ready=false;multiplayer.started=false;multiplayer.inLobby=true;canvas.style.display='none';gameHud.hidden=true;menuElement.style.display='flex';heldKeys.clear();resetMobileInput();sharedNotice(text);});
  const previousRender=renderMenu;renderMenu=function(){previousRender();if(window.regionSwitching)document.getElementById('menu-play').disabled=true;};
  render();measure();setInterval(measure,30000);
 });
})();
