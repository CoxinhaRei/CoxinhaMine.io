const crypto=require('crypto');
const CHANNELS=new Set(['global','local','guild','squad','whisper']);
const ALIASES={global:'global',local:'local',guild:'guild',guilda:'guild',squad:'squad',susurro:'whisper',sussurro:'whisper',whisper:'whisper',w:'whisper'};
module.exports=function attachChat(socket,{actors,publicPlayer,squads,persistence,guilds}){
 const guild=a=>{if(a.profile.guest)return null;const g=persistence.db.get(['guilds',a.state.guildId]).value();return g?.members.includes(a.name)?g:null;};
 socket.on('chat',async(message,reply)=>{
  const a=actors[socket.id];if(!a)return;const fail=text=>{reply?.({ok:false,message:text});socket.emit('chatError',text);};
  if(Date.now()-(a.lastChat||0)<600){fail('Aguarde um instante entre mensagens.');return;}
  let text=typeof message==='string'?message:message?.text,channel=message&&typeof message==='object'?message.channel||'global':'global',target=message&&typeof message==='object'?message.target:null;
  if(typeof text!=='string'||text.length>1000)return;text=text.trim();
  if(/^\/guild-create(?:-|\s|$)/i.test(text)){a.lastChat=Date.now();const result=await guilds.createFromChat(socket,text);reply?.({...result,guildCommand:true});return;}
  if(text.startsWith('/')){const match=/^\/(\S+)(?:\s+([\s\S]*))?$/.exec(text),command=match?.[1]?.toLowerCase();channel=ALIASES[command];if(!channel){fail('Use /global, /local, /guild, /squad ou /susurro "Nick" mensagem.');return;}text=match[2]||'';if(channel==='whisper'){const parts=/^(?:"([^"]{1,24})"|(\S{1,24}))\s+([\s\S]+)$/.exec(text);if(!parts){fail('Use /susurro "Nick com espaços" mensagem.');return;}target=parts[1]||parts[2];text=parts[3];}}
  if(!CHANNELS.has(channel)||!text.trim()){fail('Digite uma mensagem para o canal selecionado.');return;}
  let recipients=[];const all=Object.values(actors);
  if(channel==='global')recipients=all;
  if(channel==='local')recipients=all.filter(b=>b.state.realm===a.state.realm&&b.inLobby===a.inLobby&&Math.hypot(b.state.x-a.state.x,b.state.y-a.state.y)<=2000);
  if(channel==='guild'){const own=guild(a);if(!own){fail('Você precisa estar em uma guilda para falar neste canal.');return;}recipients=all.filter(b=>guild(b)?.id===own.id);}
  if(channel==='squad'){const own=squads.groupFor(a.profile.id);if(!own){fail('Você precisa estar em um squad para falar neste canal.');return;}recipients=all.filter(b=>own.members.has(b.profile.id));}
  let recipient;
  if(channel==='whisper'){if(typeof target!=='string'){fail('Escolha o destinatário do sussurro.');return;}const normalized=target.normalize('NFKC').trim().toLowerCase(),matches=all.filter(b=>b.profile.id===target||b.socket.id===target||b.name.normalize('NFKC').toLowerCase()===normalized),registered=matches.filter(b=>!b.profile.guest);recipient=registered.length===1?registered[0]:matches.length===1?matches[0]:null;if(!recipient){fail('Jogador desconectado ou nick ambíguo.');return;}recipients=[a,recipient];}
  a.lastChat=Date.now();const p=publicPlayer(a),packet={id:crypto.randomUUID(),time:Date.now(),channel,name:p.name,guest:!!p.guest,guildTag:p.guildTag,text:text.trim().slice(0,220),level:p.level,rarityIndex:p.rarityIndex,recipient:recipient?.name};
  for(const b of new Set(recipients))b.socket.emit('chatMessage',packet);reply?.({ok:true});
 });
};
