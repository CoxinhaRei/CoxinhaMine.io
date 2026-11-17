function openAccountRequired(message='Entre na sua conta ou crie uma para guardar seu progresso.'){
  accountState=multiplayer.account || null;accountPanel.hidden=false;squadPanel.hidden=true;renderAccount();authResult.textContent=message;
  if(!accountState){document.getElementById('account-nick').value=nickInput.value.trim();setTimeout(()=>document.getElementById('account-nick').focus(),0);}
}
const guestNotice=document.createElement('div');guestNotice.className='guest-notice';
guestNotice.innerHTML='<span>Jogue como convidado. Seu progresso é temporário: crie uma conta antes de fechar ou recarregar.</span><button type="button">Criar conta e salvar</button>';
document.querySelector('.menu-tools').after(guestNotice);
const guestSaveButton=document.createElement('button');guestSaveButton.type='button';guestSaveButton.className='guest-save-button';guestSaveButton.textContent='Convidado · salvar progresso';document.body.append(guestSaveButton);
function openGuestSignup(){accountPanel.hidden=false;squadPanel.hidden=true;accountPanel.querySelector('[data-auth=register]').click();renderAccount();document.getElementById('account-nick').value=multiplayer.guest && player.name!=='Convidado' ? player.name : nickInput.value==='Convidado' ? '' : nickInput.value;authResult.textContent='Criar conta salva esta coxinha. Entrar carrega outra conta.';document.getElementById('account-nick').focus();}
guestNotice.querySelector('button').onclick=openGuestSignup;guestSaveButton.onclick=openGuestSignup;
let guestNoticeKey='';
function renderGuestNotice(){const key=[!!accountState,!!multiplayer.guest,menuVisible(),authMode].join(':');if(key===guestNoticeKey)return;guestNoticeKey=key;guestNotice.hidden=!!accountState;guestSaveButton.hidden=!multiplayer.guest || menuVisible();document.getElementById('menu-play').setAttribute('aria-label',accountState ? 'Jogar' : 'Jogar como convidado');migration.hidden=authMode!=='register' || !!multiplayer.guest || !legacyNames.length;document.getElementById('export-player-save').disabled=!accountState;}
const oldRenderAccount=renderAccount;
const oldRenderMenu=renderMenu;renderMenu=function(){oldRenderMenu();renderGuestNotice();if(menuVisible() && multiplayer.durable===false)document.getElementById('menu-connection').textContent='Convidados liberados · cadastros aguardam o banco persistente';};
renderAccount=function(){oldRenderAccount();renderGuestNotice();};
accountPanel.querySelector('.account-help').textContent='Criar conta guarda o progresso do convidado atual. Entrar carrega o save da conta existente, sem juntar os dois personagens. Use um nick de 3 a 24 caracteres e senha de 8 a 128.';
const migration=document.createElement('div');migration.className='legacy-migration';
migration.hidden=true;accountPanel.querySelectorAll('[data-auth]').forEach(button=>button.addEventListener('click',()=>{migration.hidden=authMode!=='register' || !!multiplayer.guest;}));
const legacyKeys=profileKeys(),legacyNames=Object.keys(legacyKeys).filter(name=>/^[a-f0-9-]{36}$/.test(legacyKeys[name]?.id || ''));
if(legacyNames.length){
  const label=document.createElement('label'),check=document.createElement('input'),select=document.createElement('select');check.type='checkbox';check.id='migrate-owned-profile';label.append(check,document.createTextNode(' Vincular um perfil antigo salvo neste navegador'));select.id='legacy-profile-choice';select.setAttribute('aria-label','Perfil antigo para vincular');
  for(const name of legacyNames){const option=document.createElement('option');option.value=name;option.textContent=name;select.append(option);}migration.append(label,select);authForm.querySelector('button').before(migration);
}
authForm.onsubmit=async event=>{
  event.preventDefault();if(authBusy)return;
  const nickname=document.getElementById('account-nick').value.trim(),secret=document.getElementById('account-password');
  if(nickname.length<3){authResult.textContent='Informe um nick de pelo menos 3 caracteres.';return;}
  if(multiplayer.durable===false && authMode==='register'){authResult.textContent='O dono do servidor precisa conectar o banco persistente para liberar cadastros.';return;}
  authBusy=true;authForm.querySelector('button').disabled=true;authResult.textContent=authMode==='login' ? 'Entrando…' : 'Salvando sua conta…';
  const migrate=document.getElementById('migrate-owned-profile')?.checked,legacyName=document.getElementById('legacy-profile-choice')?.value;
  const credentials=authMode==='register' ? (guestCredentials || (migrate ? legacyKeys[legacyName] : undefined)) : undefined;
  try{const result=await callServer(authMode==='login' ? 'accountLogin' : 'accountRegister',{nickname,password:secret.value,credentials,lobby:menuVisible(),realm:selectedMenuRealm});authResult.textContent=result.message || '';if(result.ok){multiplayer.started=!menuVisible();renderAccount();renderMenu();}}finally{secret.value='';authBusy=false;authForm.querySelector('button').disabled=false;}
};
const oldLogout=document.getElementById('account-logout').onclick;
document.getElementById('account-logout').onclick=async()=>{const leave=async()=>{await oldLogout();if(!accountState){localStorage.removeItem(SESSION_KEY);multiplayer.account=null;window.accountProgressEnabled=false;multiplayer.drops=[];renderNetworkStatus();renderAccount();}};if(!menuVisible() && typeof irisTransition==='function')await irisTransition(leave);else await leave();};
socket.on('sessionReplaced',()=>{localStorage.removeItem(SESSION_KEY);multiplayer.account=null;window.accountProgressEnabled=false;multiplayer.ready=false;multiplayer.started=false;});
socket.on('init',data=>{if(data.durable===false)document.getElementById('menu-connection').textContent='Convidados liberados · banco persistente pendente';});
const saveDescription=saveTools.querySelector('p');saveDescription.textContent='Convidados têm progresso temporário: crie uma conta antes de fechar, recarregar ou trocar de servidor. O progresso pertence à sua conta no servidor. Limpar os dados do navegador encerra a sessão; use seu nick e senha para voltar. O backup não permite alterar nível ou itens.';
try{
  // One-time migration of a previously authenticated session, never a name-field lookup.
  const previous=JSON.parse(localStorage.getItem('coxinha_active_account') || 'null');
  if(!activeSession() && previous?.profileId && legacyKeys[previous.username]?.id===previous.profileId)localStorage.setItem(SESSION_KEY,JSON.stringify({...legacyKeys[previous.username],username:previous.username}));
  const session=activeSession();if(session){nickInput.value=session.username || '';multiplayer.inLobby=true;if(socket.connected)beginSharedSession({lobby:true});}
}catch{}
renderAccount();
setInterval(renderGuestNotice,500);
