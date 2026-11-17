# CoxinhaMine.io 1.5.4 — desempenho, servidores e caminhada suave

## Correção do lag crescente ao explorar

O servidor acumulava minérios das áreas percorridas. Ao gerar uma região, percorria repetidamente toda a lista antiga para contar depósitos e verificar sobreposições, bloqueando o processamento de movimento e respostas de ping.

Agora a geração consulta células e um índice espacial. Minérios comuns a Ultra fora da área de TODOS os jogadores ficam em repouso, fora da física e dos pacotes. Esse histórico guarda até 4.000 depósitos por mapa por até 10 minutos; ao retornar nesse intervalo, o depósito mantém seu ID, HP e contribuição. Histórico comum expirado pode ser regenerado. Bosses Super+ não são removidos por essa limpeza, e drops mantêm sua validade e elegibilidade originais. A limpeza não dá XP nem recompensas.

O cliente confirma a lista de minérios recebida. O servidor reaproveita essa lista e não a reenvia dez vezes por segundo quando nada mudou. Mudanças de área, HP, mineração, spawns e troca de mapa invalidam o cache. Pacotes não confirmados são reenviados; uma lista vazia remove os minérios antigos da tela. Criaturas e projéteis continuam recebendo atualizações normais. Eventos visuais distantes e registros temporários de entidades já removidas também deixam de acumular trabalho.

Testes locais sintéticos com 9.000 minérios de áreas antigas reduziram o custo médio de geração de aproximadamente 1.078 ms para 12 ms. O pacote recorrente da cena caiu de cerca de 19,1 KB para 3,9 KB, antes da compressão. São medições locais de carga/volume, não uma promessa de ping na internet. O benchmark completo está no arquivo entregue separadamente `benchmark-exploration.json`.

Foram aprovados 20 testes, incluindo exploração prolongada, volta a depósitos danificados, preservação da área de outro jogador e de bosses/drops, limite do histórico e confirmação/invalidação do cache. O teste de navegador utilizou um perfil isolado em memória, sem acessar o banco dos jogadores.

## Changelog dentro do jogo

Use o botão de jornal no canto superior esquerdo do menu ou na barra de menus durante a partida. O painel verde apresenta as versões 1.5, 1.5.1, 1.5.2, 1.5.3 e 1.5.4, da mais nova para a mais antiga, com rolagem própria, botões para pular à versão, PT/EN e expansão. Não exige login. As notas mais antigas são resumos reconstruídos do histórico, e as notas públicas não incluem funções restritas de administração.

## O que o patch faz

- Seletor BR / US acima dos mapas, com sigla, seleção e latência medida por requisição ao servidor. Dentro da partida, use X para voltar ao menu e escolher a região.
- O endereço do site pode continuar igual: apenas a conexão multiplayer muda. Senha e token de sessão não são enviados pela URL.
- Mesma conta, nível, moedas, equipamentos e inventário nas duas regiões quando usam o mesmo banco. A troca salva, confirma a gravação e libera a sessão antes de entrar no destino.
- Cada região tem seus próprios jogadores, mobs, minérios, chat e squads. Para jogar junto, todos devem escolher a mesma região. Guildas e contas ficam no banco comum.
- Servidor sem endereço configurado aparece indisponível. Falha de conexão, versão incompatível, identidade regional incorreta ou bancos diferentes impedem a troca.
- Movimento calculado com a mesma aceleração no cliente e servidor; reenvio e replay dos comandos não confirmados, limite de velocidade/tempo e suavização visual das correções. Funciona com mouse, WASD e joystick.
- Saves concorrentes são mesclados por registro e confirmados atomicamente no Redis. Uma conta ocupa uma região por vez. Após queda abrupta, sua sessão pode levar até 60 segundos para liberar.

## Primeiro: um servidor perto do Brasil sem criar uma segunda hospedagem

O Render oferece Oregon, Ohio, Virgínia, Frankfurt e Singapura. Não oferece São Paulo. Para começar com uma região no leste dos EUA, escolha **Virginia**. É uma opção a testar para brasileiros; o ping real depende da rota de cada conexão.

Se o serviço existente já fica em Virginia, use-o. Se fica em outra região, o Render exige criar um novo Web Service na região desejada: não basta trocar uma variável ou o nome do botão. Consulte https://render.com/docs/regions.

No novo serviço, selecione o mesmo repositório e branch `main`:

- Root Directory: vazio, pois a versão nova está na raiz do GitHub.
- Build Command: `npm install`.
- Start Command: `npm start`.
- Compute: Free, se deseja continuar no plano gratuito.
- Region: Virginia.

Copie privadamente as variáveis do banco do serviço atual para o novo serviço. Não publique tokens no GitHub.

```text
UPSTASH_REDIS_REST_URL=<a mesma URL REST do banco existente>
UPSTASH_REDIS_REST_TOKEN=<o mesmo token de escrita>
SAVE_KEY=coxinha:database:v2
SERVER_REGION=US
SERVER_LOCATION=Virgínia, EUA
PUBLIC_URL=<URL HTTPS real do novo serviço>
US_SERVER_URL=<a mesma URL HTTPS real do serviço US>
```

Mantenha o valor existente de SAVE_KEY se você já utiliza outro. Isso permite continuar no mesmo save, sem criar uma base vazia. Deixe BR_SERVER_URL vazio enquanto não houver um segundo servidor real.

## Ativar BR e US juntos

É necessário ter dois serviços Node/Socket.IO realmente publicados. O código não cria datacenters nem muda a localização física de uma hospedagem. Não contrate infraestrutura paga sem revisar o custo.

Em AMBOS os serviços:

```text
BR_SERVER_URL=<URL HTTPS real do serviço BR>
US_SERVER_URL=<URL HTTPS real do serviço US>
UPSTASH_REDIS_REST_URL=<mesmo banco nos dois>
UPSTASH_REDIS_REST_TOKEN=<mesmo token de escrita nos dois>
SAVE_KEY=<mesma chave existente nos dois>
```

No BR, configure SERVER_REGION=BR, PUBLIC_URL com seu endereço e SERVER_LOCATION com a localização verdadeira. No US, configure SERVER_REGION=US e a localização verdadeira (por exemplo Virgínia, EUA, perto de Washington, D.C.). Se usar BR para uma comunidade brasileira em infraestrutura fora do país, escreva isso em SERVER_LOCATION e BR_SERVER_LOCATION; não rotule como São Paulo.

As origens de BR e US já ficam autorizadas para a conexão multiplayer. Se usar um domínio extra para o site, adicione sua origem HTTPS a FRONTEND_ORIGINS nos dois.

Os dois serviços precisam usar este patch. Não mantenha um servidor antigo gravando no mesmo banco: as versões antigas salvam uma cópia inteira sem coordenação. Antes de ativar a segunda região, atualize ou desligue o serviço antigo.

## Publicar e verificar

O ZIP completo contém a raiz do projeto, `public`, `scripts` e `tests`. Extraia e envie esse conteúdo para a raiz do GitHub. Não coloque os arquivos de servidor dentro de public e não envie o ZIP fechado. O ZIP de patch 1.5.4 contém somente os arquivos alterados desde a versão 1.5.3 regions-smooth-v5. Para instalar sobre a 1.5.2, use a atualização completa.

Após o deploy, `/health` deve informar:

```json
{"version":"1.5.4","build":"guest-patch-v6","protocol":6,"region":"US","persistence":"redis","sharedSaves":true,"guests":true,"accountRequired":false,"durable":true,"saveError":false}
```

Haverá outros campos. `/servers` mostra os endereços públicos configurados e `/ping` confirma a região servida. Nenhum desses endpoints expõe senhas ou o token do Redis.

Teste entrando na conta, minerando algo, voltando com X e trocando de região. Confira nível, moedas e inventário. Use uma única região enquanto houver apenas um serviço.

## Limites e custos

O Render Free compartilha 750 horas mensais de instância entre os serviços do workspace. Dois servidores ligados continuamente podem ultrapassar essa franquia. A latência pode subir enquanto um serviço gratuito acorda. Consulte https://render.com/docs/free.

O seletor mede os serviços configurados enquanto o menu está aberto; essa consulta pode acordar uma instância gratuita. Banco e hospedagem têm franquias próprias. O patch não compra planos nem altera cobrança.

## Validação

Testes cobrem preservação de conta na transferência entre dois servidores Socket.IO, saves simultâneos de jogadores diferentes, unicidade global do nick, recusa de login em duas regiões, cancelamento da troca com save pendente e recuperação do estado mais recente. A movimentação é testada em 30/60/144 FPS, com duplicação/perda de pacotes, atraso variável, tentativas de teleporte e comandos de mapa antigo. O Redis usado nos testes é uma simulação local isolada, não o banco dos jogadores.
