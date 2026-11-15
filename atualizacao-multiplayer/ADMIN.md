# Administrador e PRIMORDIAL

No PowerShell, na pasta do jogo, configure uma chave privada antes de iniciar:

```powershell
$env:ADMIN_TOKEN = Read-Host 'Digite sua chave privada de administrador'
node server.js
```

Abra Configurações no jogo e autentique com essa chave. O botão **Invocar PRIMORDIAL** aparece apenas após autenticação aceita pelo servidor. Ela nasce no noroeste, aparece no minimapa e tem diâmetro de 50.000 unidades: metade da largura de 100.000 do jardim. Só existe uma por servidor. Todos os jogadores podem enfrentá-la.

Sem `ADMIN_TOKEN`, a invocação fica desativada. A chave não é enviada nos arquivos públicos nem salva no navegador. Reiniciar o servidor remove os minérios temporários e exige nova autenticação. Em hospedagem pública, use HTTPS/WSS para proteger a chave durante a conexão.

As raridades naturais terminam em ALEPH. PRIMORDIAL não sai no spawn aleatório nem na fusão. O sistema de talentos continua com onze níveis, de I (Comum) a XI (Aleph).

O combate e a progressão deste protótipo continuam sendo simulados pelo cliente. A permissão de invocar a PRIMORDIAL é conferida no servidor; autenticação de contas e combate autoritativo completo ainda não fazem parte do projeto.
