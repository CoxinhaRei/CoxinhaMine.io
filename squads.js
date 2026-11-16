const crypto=require('crypto');
module.exports=function createSquads(actors,store){
  const groups=new Map(),memberships=new Map(),disconnects=new Map();
  function groupFor(profileId){return groups.get(memberships.get(profileId)) || null;}
  function actorFor(id){return Object.values(actors).find(a=>a.profile.id===id);}
  function snapshot(id){
    const group=groupFor(id);if(!group)return {id:null,code:null,members:[],maxMembers:4};
    return {id:group.id,code:group.code,leaderId:group.leaderId,maxMembers:4,members:[...group.members].map(profileId=>{const actor=actorFor(profileId),profile=store.find(profileId);return {profileId,name:profile?.name || 'Jogador',level:profile?.state.level || 1,online:!!actor,inLobby:actor?.inLobby ?? true,realm:actor?.state.realm || null,leader:profileId===group.leaderId};})};
  }
  function send(profileId){actorFor(profileId)?.socket.emit('squadState',snapshot(profileId));}
  function publish(group){if(group)for(const id of group.members)send(id);}
  function leave(profileId){
    const group=groupFor(profileId);if(!group)return;
    group.members.delete(profileId);memberships.delete(profileId);clearTimeout(disconnects.get(profileId));disconnects.delete(profileId);
    if(!group.members.size)groups.delete(group.code);else{if(group.leaderId===profileId)group.leaderId=group.members.values().next().value;publish(group);}
    send(profileId);
  }
  function action(actor,data={}){
    if(!data || typeof data!=='object')throw Error('Ação de squad inválida.');
    const id=actor.profile.id,current=groupFor(id);
    if(data.action==='create'){
      if(current)throw Error('Você já está em um squad.');
      const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let code;
      do{code=Array.from({length:6},()=>alphabet[crypto.randomInt(alphabet.length)]).join('');}while(groups.has(code));
      const group={id:crypto.randomUUID(),code,leaderId:id,members:new Set([id])};groups.set(code,group);memberships.set(id,code);publish(group);return snapshot(id);
    }
    if(data.action==='join'){
      if(current)throw Error('Saia do squad atual antes de entrar em outro.');
      const code=String(data.code || '').trim().toUpperCase(),group=groups.get(code);
      if(!group)throw Error('Código de squad não encontrado.');if(group.members.size>=4)throw Error('Esse squad já tem quatro jogadores.');
      group.members.add(id);memberships.set(id,code);publish(group);return snapshot(id);
    }
    if(data.action==='leave'){leave(id);return snapshot(id);}
    if(data.action==='kick' || data.action==='promote'){
      if(!current || current.leaderId!==id)throw Error('Só o líder pode fazer isso.');
      if(!current.members.has(data.profileId) || data.profileId===id)throw Error('Escolha outro integrante do squad.');
      if(data.action==='kick')leave(data.profileId);else{current.leaderId=data.profileId;publish(current);}return snapshot(id);
    }
    throw Error('Ação de squad desconhecida.');
  }
  function connected(id){clearTimeout(disconnects.get(id));disconnects.delete(id);send(id);publish(groupFor(id));}
  function disconnected(id){
    if(!groupFor(id))return;publish(groupFor(id));
    const timer=setTimeout(()=>{disconnects.delete(id);if(!actorFor(id))leave(id);},20000);timer.unref?.();disconnects.set(id,timer);
  }
  function refresh(){for(const group of groups.values())publish(group);}
  return {groupFor,action,snapshot,leave,connected,disconnected,refresh,close(){for(const timer of disconnects.values())clearTimeout(timer);}};
};
