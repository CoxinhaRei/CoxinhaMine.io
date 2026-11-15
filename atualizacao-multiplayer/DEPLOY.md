# Atualização de multiplayer e salvamento

## Publicar no GitHub e no Render

Envie o conteúdo completo do pacote para a raiz do repositório. Ele deve conter `package.json`, `server.js`, `game-runtime.js`, `shared-world.js`, `player-store.js`, `storage.js`, `guilds.js`, `admin.js` e as pastas `public`, `scripts` e `tests`. Os módulos novos do servidor são necessários para o jogo abrir.

No Render use **Web Service**, branch `main`, Root Directory vazio, Build Command `npm install`, Start Command `npm start` e Node 24. Publique a nova versão e atualize as páginas do jogo com **Ctrl+F5**. Para testar dois jogadores no mesmo navegador, use nomes diferentes. O mesmo perfil só mantém uma sessão ativa por vez.

O mundo é calculado por uma única instância do servidor: minérios, mobs, vida, habilidades, invocações e contribuições de loot. Cada navegador mostra uma região desse mesmo mundo. Execute uma instância; réplicas independentes exigiriam uma camada adicional de coordenação do mundo.

## Progresso dos jogadores

O primeiro login nesta versão importa o save antigo do navegador, preservando nível, inventário, moedas e talentos. Depois da importação, o servidor controla a progressão, os equipamentos e as recompensas. Um perfil tem uma chave gerada automaticamente e guardada no navegador; conhecer só o nome de outro jogador não dá acesso ao perfil dele.

Os dados ficam em `db.json`, fora de `public`. **Configurações → Seu progresso → Baixar backup** exporta também a chave de acesso ao perfil. Guarde o arquivo fora do GitHub. Em outro navegador, use **Restaurar backup** e entre no jogo. Não limpe os dados do navegador antes de guardar um backup.

O Render Free tem disco temporário. O backup do navegador recupera seu perfil se o arquivo do servidor desaparecer, mas isso não substitui armazenamento persistente para guildas ou para um jogo público. Há duas opções:

- Disco persistente: configure `DATA_DIR` com o caminho do disco montado no Render.
- Banco Redis compatível com a API REST do Upstash: configure `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` nas variáveis privadas do Render. Use a URL HTTPS e o token de escrita fornecidos pelo seu banco. Não coloque essas chaves no GitHub.

Com Redis configurado, o servidor recupera a base ao iniciar e agrupa gravações em intervalos curtos. Ele mantém uma cópia local e tenta novamente se uma gravação remota falhar. Se o banco configurado estiver inacessível durante a inicialização, o serviço falha em vez de iniciar com uma base vazia. A chave padrão do banco é `coxinha:database:v2`; `SAVE_KEY` pode alterar esse nome. A rota `/health` informa o tipo de armazenamento e a revisão do mundo, sem expor chaves.

Documentação: https://render.com/docs/free e https://upstash.com/docs/redis/features/restapi.

## Resetar só as guildas

Os scripts não foram executados nos dados do seu jogo online. Eles preservam níveis, moedas, inventários e equipamentos.

No computador, **pare o servidor primeiro** para ele não regravar a base antiga. Confira a quantidade de guildas:

```powershell
npm run guilds:reset
```

Para executar o reset e criar um backup da base antes:

```powershell
npm run guilds:reset -- --apply
```

No Render, uma alternativa que funciona sem terminal é criar a variável `RESET_GUILDS_ON_START` com um marcador, por exemplo `reset-guildas-1`, e fazer um deploy. O reset acontece uma vez para aquele marcador e fica registrado na base. Para outro reset, use outro marcador. Com banco externo configurado, o reset também é salvo nele.

## Balanceamento

| Equipamento | Picareta | Espada |
|---|---:|---:|
| Madeira | 30 | 45 |
| Pedra | 100 | 150 |
| Ferro | 400 | 600 |
| Ouro | 1.600 | 2.400 |
| Matéria Vermelha | 10.000 | 18.000 |
| Diamante | 45.000 | 60.000 |
| Void | 120.000 | 170.000 |
| Solar | 280.000 | 360.000 |

São valores base, antes de talentos, críticos e utilidades. Espadas e habilidades de espada atingem mobs; picaretas e habilidades de picareta atingem minérios. Utilidades com habilidades próprias podem atingir ambos.

Mobs Super+ têm o triplo do tamanho anterior. Super começa em 500 mil de vida e varia por espécie: abelha/formiga 500 mil, joaninha 680 mil, aranha 800 mil, guardião 900 mil, centopeia 1,2 milhão e besouro 1,7 milhão. Cada raridade acima multiplica essa vida por quatro. O dano de contato dos mobs foi mantido. Os mobs de raridades menores também receberam mais vida.

Minérios Super têm 2 milhões de vida; Absolut 8 milhões; Quantium 16 milhões; Aleph 64 milhões. A faixa dos últimos 8.000 pontos de cada borda do jardim tem 70% de chance de Ultra nos spawns comuns.

## Loot compartilhado

O servidor registra o dano real causado por cada perfil, sem contar dano excedente depois da morte. Para receber XP, moedas e minério, é necessário tirar **pelo menos 5% da vida máxima** do alvo. O último golpe não dá prioridade e a mesma conta recebe a recompensa uma vez. A barra do boss mostra sua participação. Invocações continuam sem XP, moedas, drops ou conquistas.

## Verificação

```powershell
npm test
```

Os testes usam dois clientes Socket.IO reais e bases de teste. Cobrem vida compartilhada, limite exato de 5%, bloqueio de espada/picareta em alvos errados, mira independente, restauração após reiniciar o servidor, migração do nível 231, reset de guildas sem perda de inventário, animação, invocações, frequência de Ultras e persistência local/remota simulada. A conexão com uma conta real do banco externo depende das suas variáveis de ambiente.
