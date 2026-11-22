# Publicar CoxinhaMine.io 1.5.5

## Enviar os arquivos

1. Extraia o ZIP no computador. Envie o conteúdo extraído para a raiz do repositório conectado ao Render: package.json, package-lock.json, server.js e os demais arquivos da raiz, junto das pastas public, scripts e tests.
2. Mantenha public como pasta: index.html, arquivos JS/CSS, sprites e fonts continuam dentro dela. Os arquivos do servidor ficam fora de public. Não envie o ZIP como um único arquivo ao repositório e não coloque o projeto inteiro dentro de public.
3. Confirme a substituição dos arquivos de mesmo caminho. Os arquivos de outros caminhos já existentes no GitHub não são apagados por esse envio. Os arquivos novos desta atualização também precisam ser enviados.
4. Faça o commit e aguarde o deploy automático no Render, ou use o deploy manual do último commit.

## Configuração do serviço

- Root Directory: raiz do repositório, se package.json estiver nela.
- Build Command: npm install
- Start Command: npm start
- Node 24.x; mantenha a configuração existente que já funciona.
- Preserve UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN e SAVE_KEY. Se SAVE_KEY não estava definida, o padrão continua coxinha:database:v2. Trocar a chave seleciona outra base de saves.
- Não envie .env, db.json, data, dev-data ou node_modules. Este pacote não contém esses dados. .env.example contém somente campos vazios de exemplo.
- Se houver dois serviços regionais, atualize os dois. Preserve os endereços e a região física configurados. Leia REGIONS.md para os detalhes de configuração.

## Conferir depois do deploy

Abra /health no endereço do jogo. A resposta deve conter version: 1.5.5, build: release-155-cp1, protocol: 6, guests: true e accountRequired: false. Se o banco Redis estiver configurado, confira também sharedSaves: true, durable: true e saveError: false.

Recarregue com Ctrl+F5. O aviso de desenvolvimento local foi retirado. Confira o changelog 1.5.5, o botão Como jogar, a espada inicial, as configurações do convidado e o login de uma conta existente. Teste dois convidados em abas diferentes para conferir o mundo compartilhado.

As contas existentes continuam no banco configurado; este ZIP não reseta contas nem guildas. Convidados têm progresso temporário e precisam criar uma conta para guardá-lo.

## Testar antes no computador

Execute npm install e depois npm run dev. A prévia abre em http://127.0.0.1:3000, usa dados isolados em dev-data e não acessa o Redis de produção. A hospedagem deve usar npm start.

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
