const fs=require('fs');
const path=require('path');
function resetGuilds(db){
  const data=db.getState(),count=Object.keys(data.guilds || {}).length;
  data.guilds={};
  for(const player of Object.values(data.players || {})){player.guildId=null;player.guildTag='';}
  for(const profile of Object.values(data.profiles || {})){if(profile.state){profile.state.guildId=null;profile.state.guildTag='';}}
  db.setState(data).write();return count;
}
module.exports=resetGuilds;
if(require.main===module)(async()=>{
  const storage=await require('../storage')();
  const count=Object.keys(storage.db.get('guilds').value() || {}).length;
  if(!process.argv.includes('--apply')){console.log(count+' guilda(s). Para limpar só as guildas, execute: npm run guilds:reset -- --apply');storage.close();return;}
  const backup=path.join(path.dirname(storage.file),'guild-reset-backup-'+Date.now()+'.json');
  fs.writeFileSync(backup,JSON.stringify(storage.db.getState(),null,2));
  resetGuilds(storage.db);await storage.flush();storage.close();console.log(count+' guilda(s) removida(s). Níveis, equipamentos e inventários preservados. Backup: '+backup);
})().catch(error=>{console.error(error.message);process.exitCode=1;});
