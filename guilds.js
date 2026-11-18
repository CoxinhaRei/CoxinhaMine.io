const {randomUUID}=require('crypto'),E=require('./public/expansion');
const normalize=value=>String(value||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
const INVITE_TTL=24*60*60*1000;
module.exports=function createGuildSystem(io,db,players,storage={}){
 db.defaults({guilds:{}}).write();
 const profiles=()=>Object.values(db.get('profiles').value()||{}).filter(p=>p.accountId&&!p.guest).map(p=>storage.getProfile?.(p.id)||p);
 const guilds=()=>Object.values(db.get('guilds').value()||{}).filter(g=>g&&Array.isArray(g.members));
 const activeInvites=g=>(g.invites||[]).filter(i=>i&&i.expiresAt>Date.now());
 const profileById=id=>profiles().find(p=>p.id===id),profileByName=name=>profiles().find(p=>normalize(p.name)===normalize(name));
 const memberGuild=name=>guilds().find(g=>g.members.some(n=>normalize(n)===normalize(name)));
 const isOwner=(guild,player)=>guild&&normalize(guild.owner)===normalize(player.name)&&(!guild.ownerId||guild.ownerId===player.profileId);
 function setMembership(profileId,guildId){if(storage.setMembership?.(profileId,guildId)===false)return;const profile=profileById(profileId);if(!profile)return;profile.state.guildId=guildId;db.set(['profiles',profileId,'state','guildId'],guildId).write();}
 function directory(){
  const byName=new Map(profiles().map(p=>[normalize(p.name),p])),online=new Set(Object.values(players).filter(p=>!p.guest).map(p=>p.profileId));
  return guilds().map(g=>{const roster=[...new Set(g.members)].map(name=>{const p=byName.get(normalize(name));return {name:p?.name||name,profileId:p?.id,level:p?Math.max(1,E.num(p.state.level,99999)):0,online:!!p&&online.has(p.id),owner:normalize(name)===normalize(g.owner)};});return {id:g.id,name:String(g.name||'Guilda'),tag:String(g.tag||'?'),owner:g.owner,ownerId:g.ownerId||byName.get(normalize(g.owner))?.id,members:roster.map(p=>p.name),roster,totalLevel:roster.reduce((n,p)=>n+p.level,0),online:roster.filter(p=>p.online).length,createdAt:g.createdAt||null,inviteOnly:true};}).sort((a,b)=>b.totalLevel-a.totalLevel||a.name.localeCompare(b.name));
 }
 function stateFor(player){
  const own=!player.guest&&memberGuild(player.name);player.guildId=own?.id||null;player.guildTag=own?.tag||'';
  if(!player.guest)storage.setMembership?.(player.profileId,player.guildId);
  const list=directory(),top=list.slice(0,100);if(own&&!top.some(g=>g.id===own.id))top.push(list.find(g=>g.id===own.id));
  return {guildId:player.guildId,directory:top,rankings:list.slice(0,100).map((g,n)=>({...g,rank:n+1})),totalGuilds:list.length,invitations:player.guest?[]:guilds().flatMap(g=>activeInvites(g).filter(i=>i.profileId===player.profileId).map(i=>({guildId:g.id,name:g.name,tag:g.tag,from:g.owner,expiresAt:i.expiresAt}))),outgoing:own&&isOwner(own,player)?activeInvites(own).map(i=>({profileId:i.profileId,name:i.name,expiresAt:i.expiresAt})):[],rankingMetric:'totalLevel',rankingDescription:'Soma dos níveis atuais de todos os membros. Equipamentos e força não contam.'};
 }
 function sync(socket){const player=players[socket.id];if(!player)return null;const state=stateFor(player);socket.emit('guildState',state);return state;}
 function publish(){for(const [id] of Object.entries(players)){const socket=io.sockets.sockets.get(id);if(socket)sync(socket);}}
 function notify(profileId,text){for(const [id,p] of Object.entries(players))if(p.profileId===profileId)io.sockets.sockets.get(id)?.emit('guildNotice',{text,channel:'guild',system:true});}
 function mutate(socket,data,source){
  const player=players[socket.id];if(!player||player.guest||!profileById(player.profileId))throw Error('Crie uma conta para participar de guildas.');
  if(!data||typeof data!=='object')throw Error('Pedido de guilda inválido.');
  const current=memberGuild(player.name);
  if(data.action==='create'){
   if(source!=='chat')throw Error('Crie pelo chat: /guild-create-Nome da Guilda-SIGLA');
   const name=String(data.name||'').normalize('NFKC').trim().replace(/\s+/g,' '),tag=String(data.tag||'').trim().toUpperCase();
   if(current)throw Error('Você já está em uma guilda.');if(name.length<3||name.length>24||/[\x00-\x1f\x7f]/.test(name)||!/^[A-Z0-9]{2,5}$/.test(tag))throw Error('Use nome de 3 a 24 caracteres e sigla de 2 a 5 letras ou números.');
   if(guilds().some(g=>normalize(g.name)===normalize(name)||String(g.tag||'').toUpperCase()===tag))throw Error('Esse nome ou sigla já está em uso.');
   const id=randomUUID();db.set(['guilds',id],{id,name,tag,owner:player.name,ownerId:player.profileId,members:[player.name],invites:[],createdAt:Date.now()}).write();setMembership(player.profileId,id);return 'Guilda ['+tag+'] '+name+' criada! Convide jogadores pelo painel da Guilda.';
  }
  if(data.action==='join')throw Error('A entrada é por convite do dono. Aceite um convite no painel da Guilda.');
  if(data.action==='invite'){
   if(!isOwner(current,player))throw Error('Só o dono da guilda pode convidar.');const target=profileByName(data.nickname);
   if(!target)throw Error('Conta não encontrada. Pesquise o nick completo do jogador.');if(target.id===player.profileId)throw Error('Você já é o dono desta guilda.');if(memberGuild(target.name))throw Error('Esse jogador já está em uma guilda.');if(current.members.length>=50)throw Error('A guilda está lotada (50 membros).');
   const invites=activeInvites(current);if(invites.some(i=>i.profileId===target.id))throw Error('Esse jogador já tem um convite pendente.');if(invites.length>=50)throw Error('Há 50 convites pendentes. Cancele um antes de convidar mais.');
   current.invites=[...invites,{profileId:target.id,name:target.name,fromId:player.profileId,createdAt:Date.now(),expiresAt:Date.now()+INVITE_TTL}];db.set(['guilds',current.id],current).write();notify(target.id,'Você recebeu um convite para ['+current.tag+'] '+current.name+'. Abra Guilda para aceitar ou recusar.');return 'Convite enviado para '+target.name+'. Válido por 24 horas.';
  }
  if(data.action==='accept'||data.action==='decline'){
   const invited=guilds().find(g=>g.id===data.id),invite=invited&&activeInvites(invited).find(i=>i.profileId===player.profileId);if(!invite)throw Error('Convite inexistente, cancelado ou expirado.');
   if(data.action==='accept'){if(current)throw Error('Saia da sua guilda antes de aceitar outro convite.');if(invited.members.length>=50)throw Error('A guilda ficou lotada.');invited.members.push(player.name);setMembership(player.profileId,invited.id);for(const g of guilds())if(g.invites?.some(i=>i.profileId===player.profileId)){g.invites=g.invites.filter(i=>i.profileId!==player.profileId);db.set(['guilds',g.id],g).write();}notify(invited.ownerId||profileByName(invited.owner)?.id,player.name+' entrou na sua guilda.');}
   invited.invites=(invited.invites||[]).filter(i=>i.profileId!==player.profileId);db.set(['guilds',invited.id],invited).write();return data.action==='accept'?'Você entrou em ['+invited.tag+'] '+invited.name+'.':'Convite recusado.';
  }
  if(data.action==='cancelInvite'){
   if(!isOwner(current,player))throw Error('Só o dono pode cancelar convites.');if(!current.invites?.some(i=>i.profileId===data.profileId))throw Error('Convite não encontrado.');current.invites=current.invites.filter(i=>i.profileId!==data.profileId);db.set(['guilds',current.id],current).write();return 'Convite cancelado.';
  }
  if(data.action==='kick'){
   if(!isOwner(current,player))throw Error('Só o dono pode remover membros.');const target=profileById(data.profileId);if(!target||!current.members.includes(target.name))throw Error('Membro não encontrado.');if(target.id===player.profileId)throw Error('Use Sair da guilda para deixar a liderança.');current.members=current.members.filter(n=>n!==target.name);db.set(['guilds',current.id],current).write();setMembership(target.id,null);notify(target.id,'Você foi removido da guilda ['+current.tag+'].');return target.name+' removido da guilda.';
  }
  if(data.action==='leave'){
   if(!current)throw Error('Você ainda não está em uma guilda.');current.members=current.members.filter(n=>normalize(n)!==normalize(player.name));setMembership(player.profileId,null);
   if(!current.members.length)db.unset(['guilds',current.id]).write();else{if(isOwner(current,player)){current.owner=current.members[0];current.ownerId=profileByName(current.owner)?.id;current.invites=[];}db.set(['guilds',current.id],current).write();}return 'Você saiu da guilda.';
  }
  throw Error('Ação de guilda desconhecida.');
 }
 async function execute(socket,data,source='panel'){
  const fail=message=>{const result={ok:false,message};socket.emit('guildResult',result);return result;};if(socket.data.guildBusy)return fail('Aguarde a operação anterior.');if(Date.now()-(socket.data.guildActionAt||0)<100)return fail('Aguarde um instante.');socket.data.guildActionAt=Date.now();socket.data.guildBusy=true;
  try{let result;const action=async()=>{const message=mutate(socket,data,source),committed=await storage.flush?.()!==false;result={ok:true,pending:!committed,message:message+(!committed?' O banco ainda não confirmou o save.':'')};publish();};if(storage.transact)await storage.transact(action);else await action();socket.emit('guildResult',result);return result;}catch(error){return fail(error.message||'Não foi possível atualizar a guilda.');}finally{socket.data.guildBusy=false;}
 }
 async function createFromChat(socket,text){const match=/^\/guild-create-(.+)-([A-Za-z0-9]{2,5})$/i.exec(text);if(!match)return {ok:false,message:'Use /guild-create-Nome da Guilda-SIGLA. Exemplo: /guild-create-Coxinhas Reais-CR'};return execute(socket,{action:'create',name:match[1],tag:match[2]},'chat');}
 function attach(socket){
  socket.on('guildList',async(_data,reply)=>{if(typeof _data==='function')reply=_data;if(Date.now()-(socket.data.guildListAt||0)<150){reply?.({ok:false,message:'Aguarde um instante.'});return;}socket.data.guildListAt=Date.now();try{let state;if(storage.transact&&!players[socket.id]?.guest)await storage.transact(()=>{state=sync(socket);});else state=sync(socket);reply?.({ok:!!state,state});}catch{reply?.({ok:false,message:'Banco indisponível. Tente novamente.'});}});
  socket.on('guildAction',async(data,reply)=>{const result=await execute(socket,data);reply?.(result);});
  socket.on('guildSearch',(request={},reply)=>{if(typeof reply!=='function')return;if(Date.now()-(socket.data.guildSearchAt||0)<200){reply({ok:false,message:'Aguarde um instante para pesquisar.'});return;}socket.data.guildSearchAt=Date.now();const query=normalize(request?.query);if(query.length<2||query.length>24){reply({ok:false,message:'Digite de 2 a 24 caracteres do nick.'});return;}const online=new Set(Object.values(players).filter(p=>!p.guest).map(p=>p.profileId)),rows=profiles().filter(p=>normalize(p.name).includes(query)).sort((a,b)=>Number(normalize(b.name).startsWith(query))-Number(normalize(a.name).startsWith(query))||a.name.localeCompare(b.name)).slice(0,20).map(p=>{const guild=memberGuild(p.name);return {profileId:p.id,name:p.name,level:p.state.level||1,online:online.has(p.id),guildId:guild?.id||null,guildTag:guild?.tag||null};});reply({ok:true,players:rows});});
 }
 return {attach,sync,directory,createFromChat};
};

