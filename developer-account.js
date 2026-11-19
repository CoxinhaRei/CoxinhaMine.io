const crypto=require('node:crypto'),derive=require('node:util').promisify(crypto.scrypt),E=require('./public/expansion'),createAccounts=require('./accounts');
const normalize=value=>String(value||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
function settings(env){return {enabled:env.DEV_ACCOUNT_ENABLED==='true'||env.DEV_ACCOUNT_ENABLED==='1',nickname:String(env.DEV_ACCOUNT_NICK||'DevTeste').normalize('NFKC').trim().replace(/\s+/g,' '),password:env.DEV_ACCOUNT_PASSWORD};}
function assertAvailable(profile,status){if(profile?.developerTest&&!status.ready)throw Error('A conta de testes está desativada ou aguardando configuração pelo dono do servidor.');}
function grant(profile,game,store){
  if(profile.developerTest!==true)throw Error('Este perfil não é uma conta de testes.');
  const inventory=[],amount=1000000;
  for(const [type,list] of Object.entries({weapon:game.swords,pickaxe:game.pickaxes,armor:game.armors}))for(const def of list)inventory.push({...def,type,amount:1});
  for(const rarity of game.rarities){inventory.push({type:'material',name:rarity.name,oreRarity:rarity.name,amount});for(const mob of game.creatures)inventory.push({type:'component',kind:mob.kind,name:game.lootName(mob.kind),rarity:rarity.name,amount});}
  for(const def of E.ACCESSORIES)for(const rarity of E.RARITIES)inventory.push(E.accessory(def.id,rarity,amount));
  const old=profile.state,first=profile.developerLoadoutVersion!==1,journal={...old.journal,killTiers:{...old.journal?.killTiers},oreTiers:{...old.journal?.oreTiers}};
  for(const mob of game.creatures)for(const rarity of E.RARITIES)journal.killTiers[mob.kind+':'+rarity]=Math.max(1,journal.killTiers[mob.kind+':'+rarity]||0);
  for(const rarity of E.RARITIES)journal.oreTiers[rarity]=Math.max(1,journal.oreTiers[rarity]||0);
  journal.unlocked=[...new Set([...(journal.unlocked||[]),...game.achievementsList.map(a=>a.id)])];
  const raw={...old,inventory,level:Math.max(475,old.level||1),progressionVersion:3,coins:Math.max(1e9,old.coins||0),talentPoints:Math.max(1000000,old.talentPoints||0),talentRanks:Object.fromEntries(game.talentsList.map(t=>[t.id,11])),talents:{speed:11},accessoryVersion:1,journal,guildId:null,pendingCraft:null};
  raw.magic={awakened:true,ranks:Object.fromEntries(require('./public/arcana-catalog').SPELLS.map(s=>[s.id,11])),selected:'beam'};raw.mana=364;
  if(first){raw.equipment={weapon:'Solar',armor:'Solar',pickaxe:'Solar'};raw.accessories=[];raw.xp=0;}
  profile.state=store.sanitize(raw);profile.state.guildId=null;profile.developerLoadoutVersion=1;store.save(profile);return profile;
}
async function provision({env,db,store,game,persistence,durable,transact}){
  const config=settings(env),status={enabled:config.enabled,ready:false,code:config.enabled?'pending':'disabled'};
  if(!config.enabled)return status;
  let claimed=null;
  try{
    if(!durable)throw Error('Configure o banco persistente antes de habilitar a conta de testes.');
    if(typeof config.password!=='string'||config.password.length<16||config.password.length>128)throw Error('DEV_ACCOUNT_PASSWORD deve ter de 16 a 128 caracteres.');
    if(config.nickname.length<3||config.nickname.length>24||!/^[-\p{L}\p{N}_. ]+$/u.test(config.nickname))throw Error('DEV_ACCOUNT_NICK é inválido.');
    await transact(async()=>{
      const key=crypto.createHash('sha256').update(normalize(config.nickname)).digest('hex'),accountId=db.get(['accountsByNick',key]).value(),account=accountId&&db.get(['accounts',accountId]).value();
      if(account){
        const profile=store.find(account.profileId);if(profile?.developerTest!==true)throw Error('Esse nick pertence a uma conta normal. Ela não será alterada. Escolha outro DEV_ACCOUNT_NICK.');
        const record=account.password;if(record?.algorithm!=='scrypt')throw Error('O registro da conta de testes é inválido.');
        const hash=await derive(config.password,Buffer.from(record.salt,'hex'),64,{N:record.N,r:record.r,p:record.p,maxmem:64*1024*1024});
        if(!crypto.timingSafeEqual(hash,Buffer.from(record.hash,'hex'))){
          // Only an account already marked DEV may follow the owner's server secret.
          // Acquire its regional lease before writing credentials or revoking bearers.
          claimed=profile.id;await persistence.claim?.(claimed);
          const salt=crypto.randomBytes(16).toString('hex'),parameters={N:32768,r:8,p:3,maxmem:64*1024*1024},next=await derive(config.password,Buffer.from(salt,'hex'),64,parameters);
          account.password={algorithm:'scrypt',N:parameters.N,r:parameters.r,p:parameters.p,salt,hash:next.toString('hex')};account.passwordUpdatedAt=Date.now();
          db.set(['accounts',account.id],account).write();store.rotateToken(profile);
          if(await persistence.flush()===false)throw Error('O banco ainda não confirmou a atualização da senha da conta de testes.');
          status.passwordUpdated=true;
        }
      }else{
        const service=createAccounts(db,store,{beforeSession:async profile=>{claimed=profile.id;await persistence.claim?.(claimed);}});
        const result=await service.register({nickname:config.nickname,password:config.password},null,'developer-provision');result.profile.developerTest=true;grant(result.profile,game,store);
        if(await persistence.flush()===false)throw Error('O banco ainda não confirmou a criação da conta de testes.');
      }
    });
    status.ready=true;status.code='ready';
  }catch(error){status.code='configuration_error';console.warn('Conta de testes indisponível: '+error.message);}
  finally{if(claimed)try{await persistence.release?.(claimed);}catch{status.ready=false;status.code='save_pending';}}
  return status;
}
module.exports={settings,assertAvailable,grant,provision};
