const {randomUUID} = require('crypto');

module.exports = function createGuildSystem(io, db, players, storage={}) {
  db.defaults({guilds:{}}).write();
  const playerPath=player=>player.profileId ? ['profiles',player.profileId,'state'] : ['players',player.name];
  function directory() {
    return Object.values(db.get('guilds').value()).map(guild => ({
      id:guild.id,name:guild.name,tag:guild.tag,owner:guild.owner,members:[...guild.members]
    }));
  }
  function sync(socket) {
    const player=players[socket.id];
    if(!player)return;
    const saved=db.get(playerPath(player)).value();
    const guild=db.get(['guilds',saved?.guildId]).value();
    player.guildId=guild?.members.includes(player.name) ? guild.id : null;
    player.guildTag=player.guildId ? guild.tag : '';
    socket.emit('guildState',{guildId:player.guildId,directory:directory()});
  }
  function publish() {
    for(const player of Object.values(players)) {
      const guild=db.get(['guilds',player.guildId]).value();
      player.guildTag=guild?.tag || '';
      if(!guild)player.guildId=null;
    }
    io.emit('guildDirectory',directory());
  }
  function attach(socket) {
    socket.on('guildList',async()=>{try{if(storage.transact && !players[socket.id]?.guest)await storage.transact(()=>sync(socket));else sync(socket);}catch{socket.emit('guildResult',{ok:false,message:'Banco indisponível. Tente novamente.'});}});
    const action=async data=>{
      const player=players[socket.id];
      if(!player || !data || typeof data!=='object')return;
      sync(socket);
      const current=db.get(['guilds',player.guildId]).value();
      const fail=message=>socket.emit('guildResult',{ok:false,message});
      if(data.action==='create') {
        const name=String(data.name || '').trim().slice(0,24);
        const tag=String(data.tag || '').trim().toUpperCase();
        if(current)return fail('Saia da sua guilda antes de criar outra.');
        if(name.length<3 || !/^[A-Z0-9]{2,5}$/.test(tag))return fail('Use um nome com 3 a 24 caracteres e uma sigla de 2 a 5 letras ou números.');
        if(directory().some(g=>g.tag===tag || g.name.toLowerCase()===name.toLowerCase()))return fail('Esse nome ou sigla já está em uso.');
        const id=randomUUID();
        db.set(['guilds',id],{id,name,tag,owner:player.name,members:[player.name]}).write();
        db.set([...playerPath(player),'guildId'],id).write();
      } else if(data.action==='join') {
        const guild=db.get(['guilds',String(data.id)]).value();
        if(current)return fail('Você já está em uma guilda.');
        if(!guild || guild.members.length>=50)return fail('Guilda indisponível ou lotada.');
        if(!guild.members.includes(player.name))guild.members.push(player.name);
        db.set(['guilds',guild.id],guild).set([...playerPath(player),'guildId'],guild.id).write();
      } else if(data.action==='leave') {
        if(!current)return fail('Você ainda não está em uma guilda.');
        current.members=current.members.filter(name=>name!==player.name);
        if(!current.members.length)db.unset(['guilds',current.id]).write();
        else {
          if(current.owner===player.name)current.owner=current.members[0];
          db.set(['guilds',current.id],current).write();
        }
        db.set([...playerPath(player),'guildId'],null).write();
      } else return fail('Ação de guilda desconhecida.');
      if(await storage.flush?.()===false)return fail('Save da guilda pendente. Aguarde e tente novamente.');
      sync(socket);publish();
      socket.emit('guildResult',{ok:true,message:'Guilda atualizada.'});
    };
    socket.on('guildAction',async data=>{if(players[socket.id]?.guest){socket.emit('guildResult',{ok:false,message:'Crie uma conta para participar de guildas.'});return;}if(socket.data.guildBusy)return;socket.data.guildBusy=true;try{if(storage.transact)await storage.transact(()=>action(data));else await action(data);}catch{socket.emit('guildResult',{ok:false,message:'Não foi possível salvar a guilda. Tente novamente.'});}finally{socket.data.guildBusy=false;}});
  }
  return {attach,sync};
};
