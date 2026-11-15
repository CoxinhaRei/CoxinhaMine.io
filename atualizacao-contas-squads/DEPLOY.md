# Atualização de contas, menu e squads

## Publicar no GitHub e no Render

No repositório atual, abra a pasta **atualizacao-multiplayer** e envie **o conteúdo** do pacote dentro dela. Atualize os arquivos existentes e inclua os novos. Não envie o ZIP e não crie outra pasta dentro dessa. O mesmo diretório deve conter `package.json`, `server.js`, `accounts.js`, `squads.js`, `game-runtime.js`, `shared-world.js`, `player-store.js`, `storage.js`, `guilds.js`, `admin.js` e as pastas `public`, `scripts` e `tests`. Os módulos novos do servidor são necessários para o jogo abrir.

Mantenha no Render **Web Service**, branch `main`, **Root Directory `atualizacao-multiplayer`**, Build Command `npm install`, Start Command `npm start` e Node 24. Publique a nova versão e atualize as páginas do jogo com **Ctrl+F5**. A rota `/health` deve mostrar `build: accounts-squads-v3` e `protocol: 3`. Para testar dois jogadores, use contas ou convidados diferentes. A mesma conta só mantém uma sessão ativa por vez.

## Contas e novo menu

A coxinha branca no canto superior esquerdo abre **Entrar / Criar conta**. Só são necessários nick (3–24 caracteres) e senha (8–128 caracteres). Criar uma conta vincula o progresso do convidado atual: nível, moedas, inventário e talentos. Para recuperar o mesmo personagem em outro navegador ou dispositivo, use **Entrar** com o mesmo nick e senha. A caixa de nick do menu fica travada enquanto a conta estiver conectada.

As senhas recebem hash scrypt com salt individual; o servidor limita tentativas e hashes simultâneos. O navegador guarda uma chave de sessão, nunca a senha. Entrar em outro dispositivo troca a chave de sessão e desconecta a sessão anterior. Sair remove a sessão deste navegador e volta ao menu como convidado, preservando o perfil salvo no servidor. Não existe recuperação por e-mail nesta versão.

O menu oferece **Jardim** e **Caverna** no topo, equipamentos e XP, e acesso ao inventário, talentos e configurações antes de jogar. No Jardim o spawn continua na praça central; na Caverna, na entrada segura. Nível 90 e Matéria Vermelha+ são uma recomendação para a caverna, não um bloqueio.

## Squads

Abra **Squad** no menu ou pelo botão de squad da HUD. Crie um grupo e compartilhe seu código com até três amigos. O líder pode remover integrantes e passar a liderança. Ao sair, a liderança passa automaticamente a outro integrante. Uma queda de conexão mantém a vaga por 20 segundos. Os squads são temporários e terminam quando o servidor reinicia; contas e guildas são independentes deles.

O dano real do grupo soma para atingir os **5% da vida máxima** do alvo. Cada integrante conectado, vivo, fora do menu, no mesmo mapa e até **2.500 unidades da borda do alvo**, recebe XP, moedas e um material na quantidade normal. Seus talentos individuais continuam aplicáveis. Quem também atingiu os 5% sozinho recebe apenas um prêmio. Não há multiplicação nem divisão da recompensa. Dano anterior à entrada no grupo não conta para o novo integrante. Invocações não dão prêmio.

O mundo é calculado por uma única instância do servidor: minérios, mobs, vida, habilidades, invocações e contribuições de loot. Cada navegador mostra uma região desse mesmo mundo. Execute uma instância; réplicas independentes exigiriam uma camada adicional de coordenação do mundo.

## Progresso dos jogadores

O primeiro login nesta versão importa o save antigo do navegador, preservando nível, inventário, moedas e talentos. Depois da importação, o servidor controla a progressão, os equipamentos e as recompensas. Um perfil tem uma chave gerada automaticamente e guardada no navegador; conhecer só o nome de outro jogador não dá acesso ao perfil dele.

Os dados ficam em `db.json`, fora de `public`. **Configurações → Seu progresso → Baixar backup** exporta também a chave de acesso ao perfil. Guarde o arquivo fora do GitHub. Em outro navegador, use **Restaurar backup** e entre no jogo. Não limpe os dados do navegador antes de guardar um backup.

O Render Free tem disco temporário. O backup do navegador recupera seu perfil se o arquivo do servidor desaparecer, mas isso não substitui armazenamento persistente para guildas ou para um jogo público. Há duas opções:

**Para manter o cadastro e permitir login por senha depois de um reinício/deploy, configure uma das opções abaixo.** O backup do personagem não contém o hash da senha nem substitui o banco de contas.

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

Os seis testes usam clientes Socket.IO reais e bases de teste. Cobrem cadastro, hash sem senha em texto puro, nick sem distinção de maiúsculas, senha errada, troca/revogação da sessão, migração de convidado nível 231, acesso em outro dispositivo, limite e liderança do squad, soma de 5%, exclusão de membros distantes ou em outro mapa, ausência de prêmio duplicado e de crédito retroativo. Também cobrem vida compartilhada, espada/picareta em alvos corretos, mira independente, restauração, reset de guildas, animação, invocações, frequência de Ultras e persistência local/remota simulada. A conexão com uma conta real do banco externo depende das suas variáveis de ambiente.
