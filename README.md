# CoxinhaMine.io 1.5.5

Patch atual: `release-155-cp1`. Leia [PATCH-DROPS-COMBATE.md](PATCH-DROPS-COMBATE.md) para drops, balanceamento, talentos e Solar. Leia [PATCH-DENSIDADE.md](PATCH-DENSIDADE.md) para a redução de entidades nas regiões raras. Leia [PATCH-LEITURA-SAVE.md](PATCH-LEITURA-SAVE.md) para o conflito de leitura e gravação com jogadores ativos. Leia [PATCH-CONFIRMACAO-SAVE.md](PATCH-CONFIRMACAO-SAVE.md) para a recuperação de gravações sem resposta. Veja [PATCH-SESSOES.md](PATCH-SESSOES.md) para o bloqueio de conta reservada. Leia [PATCH-RECUPERACAO-MAGNETOS.md](PATCH-RECUPERACAO-MAGNETOS.md) para as correções de login e as novidades.

Pacote completo da atualização. Leia [DEPLOY.md](DEPLOY.md) para enviar ao GitHub/Render e [CHANGELOG-1.5.5.md](CHANGELOG-1.5.5.md) para as novidades.

- Instalar dependências: npm install
- Servidor de produção: npm start
- Prévia isolada no computador: npm run dev
- Testes: npm test
- Node: 24.x

O pacote não inclui contas, saves locais, credenciais ou node_modules. Preserve o banco e as variáveis existentes da hospedagem.

## Patch de combate — release-155-cp1

Vida base de 1.000, máximo de 400.000 com talentos/acessórios; Super+ causam ao menos 20.000 de dano de contato, por espécie e raridade, sem invulnerabilidade global após impactos. Quantium usa a vida canônica corrigida e ganha 12× a tabela anterior; Aleph mantém a progressão superior.

Reset de talentos funciona também durante a exploração, com confirmação e reembolso exato. Craft normal removido; Loja e forja Chosen preservadas. Catálogo ampliado para 50 acessórios, incluindo 20 ovos e itens de esquiva. Solar R cria um sistema solar de mineração; Void Q lança um tridente veloz e Void R cria uma zona escura que minera e puxa parte das pedras.

Núcleo Quantium dentro de Absolut em cada mapa: 60% Quantium, 39,1% Absolut, 0,9% Aleph, com população limitada. Quantium não anuncia spawn no chat. Consulte PATCH-TITAN-COMBATE.md para valores e instalação.

## Patch de talentos e recuperação — release-155-cp1

- Vampirismo: 1,5% do dano real por nível, de I a XI (antes 1%). Acessórios de vampirismo também curam 50% mais; limite conjunto dos acessórios: 12%.
- Minérios: contato de 1 a 12 HP/s antes das defesas, conforme raridade; projéteis naturais causam 8 de dano (antes 35). O dano dos mobs é preservado.
- Alcance pode receber pontos diretamente, sem exigir Agilidade I. Regeneração I–XI também é independente: por nível, 35 de vida + 0,1% da vida máxima por segundo. O antigo nome Recuperação migra para Regeneração sem perder níveis.
- Árvore reorganizada em Combate, Sobrevivência e Exploração. Cada talento mostra bônus atual, próximo bônus, requisitos, custos e botão de investir com confirmação do servidor. Pontos/níveis existentes são preservados.
- Forja normal restaurada para combinar 5 itens iguais e tentar a próxima raridade: minérios, drops e acessórios. Não existe criação de acessórios por receitas; os itens iniciais vêm dos drops. Chosen continua na Forjadora do Deserto.

## Patch de XP dos mobs — release-155-cp1

- Mobs de Comum a Ultra: 3× o XP anterior. Super: 6×. Absolut: 8×. Quantium: 10×. Aleph: 12×.
- XP base: Super 12 milhões, Absolut 96 milhões, Quantium 800 milhões, Aleph 6 bilhões, antes dos bônus de talentos, equipamentos e Caverna.
- Mantidos XP da mineração, curva de níveis, dano, vida, drops, limite de participação de 5% e pagamento normal por integrante elegível do squad. Invocações e minions sem recompensa não geram XP.
- A galeria mostra o novo XP base dos mobs. O multiplicador é calculado no servidor e vale também para abates feitos por habilidades e invocações do jogador.

## Patch de checkpoints e mineração — release-155-cp1

- 60 acampamentos: um refúgio por região em cada um dos seis mapas, posicionados perto das passagens e em terreno livre. Cores do atlas continuam ilustrativas; o chão original é preservado.
- Entrar em uma região durante 1,5 segundo ativa automaticamente seu checkpoint. Morrer leva de volta a ele pelo botão Voltar, no mesmo mapa.
- Três mortes em até cinco minutos recuam para o checkpoint anterior. A região da qual houve recuo fica impedida de reativar o checkpoint por cinco minutos, evitando um ciclo imediato de mortes. Sem checkpoint anterior, permanece o refúgio inicial.
- O histórico é individual por mapa, salvo no perfil da conta. Convidados mantêm seu histórico somente durante a sessão temporária. Cliente não pode informar coordenadas de respawn.
- Acampamentos têm um pequeno espaço seguro, indicado por bandeira, barraca, fogueira e marcador no minimapa. Ataques e mineração não podem ser iniciados dentro do refúgio; invocações não farmam enquanto o dono está protegido. Minérios não podem nascer ou ser empurrados sobre o acampamento.
- XP de minérios Comum–Ultra: 2× o valor anterior; Super: 4×; Absolut: 6×; Quantium: 8×; Aleph: 10×. São 8 milhões, 72 milhões, 640 milhões e 5 bilhões de XP base nos quatro últimos, respectivamente. Os bônus de equipamento, talentos e Caverna continuam.
- Mantidos os aumentos de XP dos mobs, a regra de participação de 5%, recompensas normais do squad, níveis, inventários e a curva de 100 bilhões de XP acumulado até o nível 300.

## Ovos: buff de força e corpo inteiro

- Todas as 20 espécies de ovos recebem 2× o dano e 2× a vida anteriores. A vida passa de 70% para 140% da vida do mob equivalente; o tamanho permanece em 70% e a massa em 135%.
- Velocidade de movimento multiplicada por quatro. A recarga entre golpes continua própria de cada espécie.
- O corpo inteiro da invocação atinge criaturas e pedras em contato, uma vez por alvo a cada recarga. Pode atingir várias pedras ao mesmo tempo, sem dano duplicado por parte do corpo.
- O deslocamento rápido verifica o trajeto contra pedras e para no contato. Pedras que bloqueiam o caminho recebem dano; após quebrá-las, a invocação consegue continuar. É permitido sair de uma sobreposição existente.
- Invocações continuam atravessando players, sem dano em aliados, e recebem projéteis pela hitbox do corpo inteiro. XP e loot seguem a participação do dono, sem recompensas para minions inimigos.
