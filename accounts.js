const crypto=require('crypto');
const derive=require('util').promisify(crypto.scrypt);
const PARAMETERS={N:32768,r:8,p:3,maxmem:64*1024*1024};
const keyFor=nick=>crypto.createHash('sha256').update(nick.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase()).digest('hex');
function nickname(value){
  const nick=String(value || '').normalize('NFKC').trim().replace(/\s+/g,' ');
  if(nick.length<3 || nick.length>24 || !/^[\p{L}\p{N}_. -]+$/u.test(nick) || ['__proto__','prototype','constructor'].includes(nick.toLowerCase()))throw Error('Use um nick de 3 a 24 letras, números, espaços, pontos, hífens ou _.');
  return nick;
}
function password(value){if(typeof value!=='string' || value.length<8 || value.length>128)throw Error('A senha deve ter de 8 a 128 caracteres.');return value;}
module.exports=function createAccounts(db,store){
  db.defaults({accounts:{},accountsByNick:{}}).write();
  const limits=new Map();let working=0;
  const dummy={salt:crypto.randomBytes(16).toString('hex'),hash:crypto.randomBytes(64).toString('hex')};
  function rate(ip,nick,register){
    const now=Date.now(),keys=[[`ip:${ip}`,30,300000],[`pair:${ip}:${keyFor(nick)}`,8,300000]];
    if(register)keys.push([`register:${ip}`,6,3600000]);
    for(const [key,max,period] of keys){let entry=limits.get(key);if(!entry || now>entry.until){entry={count:0,until:now+period};limits.set(key,entry);}if(entry.count>=max)throw Error('Muitas tentativas. Aguarde alguns minutos e tente novamente.');entry.count++;}
    if(limits.size>10000)for(const [key,entry] of limits)if(now>entry.until)limits.delete(key);
  }
  async function hashPassword(secret,salt){
    if(working>=2)throw Error('O servidor está ocupado. Tente novamente em instantes.');
    working++;try{return await derive(secret,Buffer.from(salt,'hex'),64,PARAMETERS);}finally{working--;}
  }
  function summary(profile){const account=profile.accountId && db.get(['accounts',profile.accountId]).value();return account ? {id:account.id,username:account.username} : null;}
  async function register(data={},currentProfile,ip='local'){
    const nick=nickname(data.nickname),secret=password(data.password);rate(ip,nick,true);
    const key=keyFor(nick);
    if(db.get(['accountsByNick',key]).value())throw Error('Esse nick já tem uma conta. Use Entrar.');
    let profile=currentProfile || store.verifyCredentials(data.credentials);
    if(profile?.accountId)throw Error('Este perfil já está vinculado a uma conta.');
    if(Object.values(db.get('profiles').value()).some(p=>p.id!==profile?.id && p.name.normalize('NFKC').toLowerCase()===nick.toLowerCase()))throw Error('Esse nick pertence a outro perfil. Entre pelo navegador original ou escolha outro nick.');
    const salt=crypto.randomBytes(16).toString('hex'),derived=await hashPassword(secret,salt);
    // Recheck after the asynchronous hash so parallel requests cannot claim a nick/profile twice.
    if(db.get(['accountsByNick',key]).value() || profile?.accountId)throw Error('Esse nick ou perfil acabou de ser vinculado a uma conta.');
    if(!profile){
      if(data.credentials?.id && store.find(data.credentials.id))throw Error('A sessão desse perfil expirou.');
      profile=store.create(nick).profile;
    }
    store.rename(profile,nick);
    const account={id:crypto.randomUUID(),username:nick,nickKey:key,profileId:profile.id,password:{algorithm:'scrypt',N:PARAMETERS.N,r:PARAMETERS.r,p:PARAMETERS.p,salt,hash:derived.toString('hex')},createdAt:Date.now()};
    profile.accountId=account.id;db.set(['accounts',account.id],account).set(['accountsByNick',key],account.id).write();
    return {profile,credentials:store.rotateToken(profile),account:summary(profile)};
  }
  async function login(data={},ip='local'){
    const nick=nickname(data.nickname);rate(ip,nick,false);
    let secret;try{secret=password(data.password);}catch{throw Error('Nick ou senha incorretos.');}
    const id=db.get(['accountsByNick',keyFor(nick)]).value(),account=id && db.get(['accounts',id]).value(),record=account?.password || dummy;
    const derived=await hashPassword(secret,record.salt),matches=crypto.timingSafeEqual(derived,Buffer.from(record.hash,'hex'));
    if(!account || !matches)throw Error('Nick ou senha incorretos.');
    const profile=store.find(account.profileId);if(!profile)throw Error('Não foi possível carregar o progresso desta conta.');
    return {profile,credentials:store.rotateToken(profile),account:summary(profile)};
  }
  function logout(profile){if(profile?.accountId)store.rotateToken(profile);}
  return {register,login,logout,summary};
};
