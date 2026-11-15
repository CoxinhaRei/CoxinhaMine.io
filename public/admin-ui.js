let adminState={enabled:false,authorized:false};
const adminBox=document.createElement('section');adminBox.className='admin-settings';
adminBox.innerHTML='<h2>Administração</h2><p id="admin-status">Conectando ao servidor…</p><form id="admin-login"><label>Chave do servidor<input id="admin-token" type="password" autocomplete="off" maxlength="512"></label><button type="submit">Autenticar</button></form><button id="admin-spawn" hidden>Invocar PRIMORDIAL</button><small>Apenas uma por servidor. Diâmetro de metade do jardim. A chave fica somente na conexão atual.</small><p id="admin-result" role="status"></p>';
settingsPanel.querySelector('.settings-body').append(adminBox);
function renderAdminState(){
  document.getElementById('admin-status').textContent=adminState.authorized ? 'Administrador autenticado' : adminState.enabled ? 'Servidor com administração habilitada' : 'Admin desativado · configure ADMIN_TOKEN no servidor.';
  document.getElementById('admin-login').hidden=adminState.authorized || !adminState.enabled;
  document.getElementById('admin-spawn').hidden=!adminState.authorized;
}
socket.on('adminState',state=>{adminState=state;renderAdminState();});
socket.on('adminResult',result=>{document.getElementById('admin-result').textContent=result.message;});
socket.on('connect',()=>{adminState.authorized=false;renderAdminState();socket.emit('adminStatus');});
socket.on('disconnect',()=>{adminState.authorized=false;renderAdminState();});
document.getElementById('admin-login').onsubmit=event=>{event.preventDefault();const field=document.getElementById('admin-token');socket.emit('adminAuthenticate',field.value);field.value='';};
document.getElementById('admin-spawn').onclick=()=>socket.emit('adminSpawnPrimordial');
socket.emit('adminStatus');
