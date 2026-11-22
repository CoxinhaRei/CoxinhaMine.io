# Patch 1.5.5 — Checkpoints, mineração e ovos

Preparado localmente; não publicado automaticamente.

## Patch de checkpoints e mineração — release-155-cp1

- 60 acampamentos: um refúgio por região em cada um dos seis mapas, posicionados perto das passagens e em terreno livre. Cores do atlas continuam ilustrativas; o chão original é preservado.
- Entrar em uma região durante 1,5 segundo ativa automaticamente seu checkpoint. Morrer leva de volta a ele pelo botão Voltar, no mesmo mapa.
- O respawn mantém Jardim, Praia, Jungle, Floresta de Gelo, Deserto ou Caverna conforme o mapa da morte. Sem checkpoint avançado, usa o refúgio inicial daquele bioma; o recuo também permanece nele.
- Três mortes em até cinco minutos recuam para o checkpoint anterior. A região da qual houve recuo fica impedida de reativar o checkpoint por cinco minutos, evitando um ciclo imediato de mortes. Sem checkpoint anterior, permanece o refúgio inicial.
- O histórico é individual por mapa, salvo no perfil da conta. Convidados mantêm seu histórico somente durante a sessão temporária. Cliente não pode informar coordenadas de respawn.
- Acampamentos têm um pequeno espaço seguro, indicado por bandeira, barraca, fogueira e marcador no minimapa. Ataques e mineração não podem ser iniciados dentro do refúgio; invocações não farmam enquanto o dono está protegido. Minérios não podem nascer ou ser empurrados sobre o acampamento.
- Na Caverna, os acampamentos abrem uma clareira no labirinto. A chegada protegida continua ativando os minérios ao redor, preservando o espaço seguro.
- XP de minérios Comum–Ultra: 2× o valor anterior; Super: 4×; Absolut: 6×; Quantium: 8×; Aleph: 10×. São 8 milhões, 72 milhões, 640 milhões e 5 bilhões de XP base nos quatro últimos, respectivamente. Os bônus de equipamento, talentos e Caverna continuam.
- Mantidos os aumentos de XP dos mobs, a regra de participação de 5%, recompensas normais do squad, níveis, inventários e a curva de 100 bilhões de XP acumulado até o nível 300.

Extraia o ZIP e envie o conteúdo à raiz do repositório, preservando public/ e tests/. Se houver limite de 100 arquivos, envie public/ em um lote e os demais arquivos em outro. Após o deploy, /health deve indicar release-155-cp1.

Validação: 169 testes automatizados aprovados, incluindo respawn via rede nos seis biomas, recuo após três mortes, histórico individual, proteção dos acampamentos, XP e colisões das invocações. A prévia carregou o menu local, mas a conferência visual da partida não foi concluída porque o navegador deixou de responder à captura.

## Ovos: buff de força e corpo inteiro

- Todas as 20 espécies de ovos recebem 2× o dano e 2× a vida anteriores. A vida passa de 70% para 140% da vida do mob equivalente; o tamanho permanece em 70% e a massa em 135%.
- Velocidade de movimento multiplicada por quatro. A recarga entre golpes continua própria de cada espécie.
- O corpo inteiro da invocação atinge criaturas e pedras em contato, uma vez por alvo a cada recarga. Pode atingir várias pedras ao mesmo tempo, sem dano duplicado por parte do corpo.
- O deslocamento rápido verifica o trajeto contra pedras e para no contato. Pedras que bloqueiam o caminho recebem dano; após quebrá-las, a invocação consegue continuar. É permitido sair de uma sobreposição existente.
- Invocações continuam atravessando players, sem dano em aliados, e recebem projéteis pela hitbox do corpo inteiro. XP e loot seguem a participação do dono, sem recompensas para minions inimigos.
