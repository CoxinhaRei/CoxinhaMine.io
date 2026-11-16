# CoxinhaMine.io 1.5.2 — mobile, contas seguras e mundo compartilhado

## Publicação na estrutura atual do GitHub

Abra **atualizacao-multiplayer/atualizacao-contas-squads** no repositório CoxinhaRei/CoxinhaMine.io. Envie o **conteúdo** da atualização dentro dessa pasta: arquivos da raiz e pastas public, scripts e tests. Inclua world-physics.js, os módulos do servidor e todos os arquivos novos de public. Atualizar apenas index.html não instala esta versão.

No Render mantenha:

- Root Directory: `atualizacao-multiplayer/atualizacao-contas-squads`
- Build Command: `npm install`
- Start Command: `npm start`
- Node 24 e uma única instância do servidor.

Espere o deploy Live e recarregue com Ctrl+F5. A rota `/health` deve informar `build: mobile-secure-v4`, `version: 1.5.2`, `protocol: 4` e `accountRequired: true`. Os arquivos JS/CSS têm uma versão no endereço para evitar misturar clientes antigos e novos. A tag de verificação do Google e robots.txt foram mantidos.

## Banco obrigatório para novos cadastros no Render

O disco do Render Free é temporário. Para impedir que uma conta seja anunciada como salva e desapareça num deploy, **novos cadastros no Render ficam bloqueados enquanto não houver Redis ou um disco persistente realmente montado**. Localmente o arquivo db.json continua funcionando no computador.

1. Abra https://console.upstash.com/ e crie um banco Redis. Escolha uma região próxima do servidor do jogo.
2. Na página do banco, copie o endpoint **HTTPS REST** e o **Token** com permissão de escrita.
3. No Render, abra o serviço → Environment → Add Environment Variable e adicione:

| Variável | Valor |
|---|---|
| UPSTASH_REDIS_REST_URL | Endpoint HTTPS REST do seu banco |
| UPSTASH_REDIS_REST_TOKEN | Token de escrita do banco |

4. Salve com deploy. Preserve a chave padrão `coxinha:database:v2`; mudar SAVE_KEY muda a base usada pelo jogo.
5. Confira `/health`: `persistence: redis`, `durable: true` e `saveError: false`.
6. Crie uma conta, jogue, saia pelo X, entre novamente e teste o mesmo nick/senha em outro navegador.

O servidor guarda contas, hashes de senhas, perfis e guildas no banco, sem prazo de expiração definido pelo jogo. Limpar cookies/dados do navegador encerra a sessão; o progresso permanece no banco e pode ser acessado novamente com nick e senha. A existência do banco e suas políticas de retenção continuam sendo responsabilidade da hospedagem escolhida.

Não coloque tokens no GitHub. `.env.example` é apenas um modelo vazio. Não envie `.env`, db.json, node_modules ou backups pessoais.

Alternativa: um disco persistente montado no Render com DATA_DIR apontando para ele. Uma pasta comum no disco temporário não é um disco persistente.

Documentação: https://upstash.com/docs/redis/overall/getstarted ; https://upstash.com/docs/redis/features/restapi ; https://render.com/docs/configure-environment-variables ; https://render.com/docs/free .

## Identidade e migração de perfis antigos

- Jogar exige uma conta. Nick vazio é recusado no cliente e no servidor.
- Digitar o nome de outra pessoa não seleciona a sessão dela. A identidade vem de uma chave aleatória validada pelo servidor ou de login por senha.
- Uma conta nova começa no nível 1, sem moedas nem itens herdados do save aberto no navegador. Saves enviados pelo cliente não alteram a economia do servidor.
- A opção de vincular um perfil antigo exige uma chave válida de um perfil que ainda exista no banco do servidor. Só aparece para perfis com comprovante salvo no navegador.
- Um perfil antigo que já desapareceu com o disco temporário do Render não pode ser comprovado só pelo nick. Backups antigos devem ser guardados para uma restauração administrativa; não são importados automaticamente como novos personagens.
- Entrar em outro dispositivo troca a chave de sessão e encerra a sessão anterior. O X volta ao menu mantendo a conta conectada. Sair da conta remove e revoga a sessão.
- Senhas usam scrypt com salt individual; há limite de tentativas e de hashes simultâneos. A senha não é guardada no navegador. Não há recuperação por e-mail nesta versão.

## Mobile, HUD e transições

O modo touch é detectado automaticamente. Joystick à esquerda; ataque/mineração ao segurar à direita; botões de habilidade da espada, picareta, utilidade e lanterna. Os quatro slots continuam selecionáveis. Toques de movimento e ataque podem usar dedos diferentes. O layout se adapta a telas horizontais e verticais. No computador, WASD/mouse e atalhos continuam disponíveis.

A HUD tem uma prévia 2D com olhos seguindo o olhar do personagem, vida abaixo dos jogadores e criaturas, redução de vida suave e rastro de dano. O X fica no topo. Entrada, troca de mapa, retorno e saída da conta durante a partida usam uma transição circular. Os itens têm moldura de raridade e modelo no centro, inclusive as picaretas.

O gramado usa uma textura procedural repetível gerada uma vez e reaproveitada. Colisões entre jogadores, criaturas e minérios são resolvidas no servidor; o cliente recebe correções de posição e ignora movimentos de uma cena antiga depois de atravessar um portal.

## Drops e squads

Toda criatura natural dá um drop da própria espécie: fragmento do guardião, élitro rubro, ferrão, mandíbula, seda, carapaça ou glândula de veneno. Minérios deixam material no chão. Drops têm animação de aparecimento, flutuação, coleta e desaparecimento; duram três minutos.

Só quem se qualificou pelo dano real pode recolher o prêmio. O squad soma para os 5%; cada integrante vivo e próximo, fora do menu e no mesmo mapa, recebe sua recompensa normal uma vez. A coleta de uma pessoa não rouba a cota da outra. XP e moedas são creditados na derrota; o item precisa ser recolhido. Um mesmo drop não pode ser coletado duas vezes pelo mesmo perfil. Drops de criaturas podem ser vendidos no inventário.

Invocações dos bosses continuam sem XP, moedas e drops, para impedir uma fonte infinita de recompensas. Squads encerram ao reiniciar o servidor; contas e guildas usam o banco.

## Progressão e bosses

Do nível 1 ao 300 são exatamente **100.000.000.000 XP acumulados**. O nível 300 é um marco, não um limite.

| Nível | XP acumulados desde o nível 1 |
|---|---:|
| 50 | 72.132.160 |
| 100 | 1.201.875.473 |
| 200 | 19.621.303.839 |
| 300 | 100.000.000.000 |
| 301 | 101.344.518.651 |

Níveis existentes são preservados. O progresso parcial dentro do nível é convertido proporcionalmente para a nova curva; os níveis seguintes usam o novo custo.

Mobs comuns receberam mais vida. Mobs Super começam em 3 milhões e variam por espécie; cada raridade seguinte multiplica sua vida por 4,5. Minérios Super têm 12 milhões, Absolut 60 milhões, Quantium 200 milhões e Aleph 1 bilhão. Primordial continua restrito ao administrador.

Bosses Super+ usam anéis, leques, rajadas em sequência e habilidades da espécie, com avisos antes dos ataques. Aranhas/formigas invocam pelo menos oito ajudantes, com máximo de 24 por boss e 96 no mundo. Os ajudantes são menores para manter as rotas de fuga visíveis. Há limite global de 600 projéteis e 64 áreas perigosas. Picaretas atingem minérios; espadas atingem criaturas. Habilidades de utilidades mantêm seus próprios alvos.

## Multiplayer e verificação

O servidor simula a 20 ciclos por segundo usando o tempo real decorrido. Envia até dez estados por segundo, filtrados pela região vista pelo jogador, com compressão e descarte de estados antigos quando a conexão acumula atraso. O cliente interpola criaturas, jogadores e projéteis. O mapa da caverna é reenviado quando muda e confirmado pelo cliente. Gravações locais/remotas são agrupadas e feitas fora do ciclo de movimento. A HUD mostra o tempo de ida e volta medido.

`npm test` cobre autenticação, rejeição de nick vazio/nome alheio/save forjado, sessão, persistência simulada, squads, drops, colisões, invocações, combate, progressão e mapas compartilhados. Os testes usam bases isoladas e não alteram os jogadores do servidor online.

O benchmark local com 8 jogadores, 120 criaturas, 700 minérios e 300 projéteis reduziu o JSON de um estado de aproximadamente 197 KB para 104 KB (47,2%) antes da compressão. É uma medição sintética; não é uma promessa de ping na internet.

Guarde backups regulares do banco. As instruções de reset de guildas permanecem em ADMIN.md e no script scripts/reset-guilds.js; execute alterações administrativas apenas com backup e autorização do dono do jogo.
