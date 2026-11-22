# CoxinhaMine.io 1.5.5

Patch atual: `release-155-kin1`. Leia [PATCH-INVOCACOES-VISAO.md](PATCH-INVOCACOES-VISAO.md) para o buff geral, novos acessórios, invocações, visão e população Quantium. Leia [PATCH-CHAT-DROPS.md](PATCH-CHAT-DROPS.md) para o chat recolhível e os drops Aleph. Leia [PATCH-DROPS-COMBATE.md](PATCH-DROPS-COMBATE.md) para drops, balanceamento, talentos e Solar. Leia [PATCH-DENSIDADE.md](PATCH-DENSIDADE.md) para a redução de entidades nas regiões raras. Leia [PATCH-LEITURA-SAVE.md](PATCH-LEITURA-SAVE.md) para o conflito de leitura e gravação com jogadores ativos. Leia [PATCH-CONFIRMACAO-SAVE.md](PATCH-CONFIRMACAO-SAVE.md) para a recuperação de gravações sem resposta. Veja [PATCH-SESSOES.md](PATCH-SESSOES.md) para o bloqueio de conta reservada. Leia [PATCH-RECUPERACAO-MAGNETOS.md](PATCH-RECUPERACAO-MAGNETOS.md) para as correções de login e as novidades.

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

Núcleo Quantium dentro de Absolut em cada mapa: 60% Quantium, 37% Absolut, 3% Aleph, com população limitada. Quantium não anuncia spawn no chat. Consulte PATCH-TITAN-COMBATE.md para valores e instalação.

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

## Chat recolhível e drops Aleph — release-155-kin1

- Botão × esconde todo o chat; Chat ou Enter reabre. Escape também recolhe enquanto se digita. Preferência local lembrada, inclusive para convidados; canais, mensagens e rascunho são preservados.
- Mobs Aleph: 60% de itens Absolut, 5% Quantium, 0,03% Aleph, 34,97% sem item. Super, Absolut e Quantium mantêm 60% duas raridades abaixo, 5% uma abaixo, 1% da própria raridade, 34% sem item.
- Um único sorteio de raridade por mob derrotado vale para os itens e integrantes elegíveis; acessórios/ovos continuam vindo da espécie. A participação mínima de 5%, XP, loot de minérios e a forja Chosen continuam. Invocações inimigas não dropam.

### Spawn e participação do squad

- Aleph: 3% por sorteio no Núcleo Quantium de todos os biomas, com 60% Quantium e 37% Absolut. Mantidos limites de população, espaço livre e raridade restrita à região. Spawn e drop são sorteios diferentes: itens Aleph continuam com 0,03% apenas nos mobs Aleph.
- Um integrante precisa causar sozinho pelo menos 5% da vida real do alvo enquanto você está no squad. Só somar 3% de uma pessoa e 2% de outra não libera recompensa. Cada integrante vivo e próximo no mesmo mapa recebe uma recompensa normal, sem pagamento duplicado. Não há crédito retroativo ao entrar depois do dano. A regra vale para mobs e minérios.

## Invocações, gigantismo e visão — release-155-kin1

- Novo ramo de talentos Invocações, com quatro progressões I–XI: Fúria da Ninhada (+15% de dano por nível), Vigor da Ninhada (+20% de vida), Marcha do Enxame (+12% de movimento) e Frenesi do Enxame (+10% de frequência de ataque). Usa os mesmos pontos e o reset existente.
- Cinco novos acessórios: Presa da Ninhada, Ferrão do Enxame, Coração da Ninhada, Asas do Enxame e Tambor de Seda. Fortalecem as invocações dos ovos equipados, sem aumentar atributos de mobs inimigos. Têm todas as raridades, drops por espécie e suporte à fusão/Chosen.
- Duas novas peças de gigantismo: Carapaça Colossal (Besouro) e Couraça do Titã (Tartaruga). Conferem tamanho, vida e defesa, com penalidade de velocidade. Tamanho máximo: 3× o raio normal; penalidade máxima de movimento: 75%. A vida total continua limitada a 400.000.
- O tamanho é real no servidor: altera colisões, massa e hitbox de projéteis; aparece para os outros jogadores. O corpo maior também reposiciona arma, armadura, nomes e barras de vida. Crescer junto de uma parede procura uma posição livre próxima.
- Os bônus de velocidade dos acessórios existentes foram triplicados; os de campo de visão e iluminação foram quadruplicados. Visão ampliada passa a +30% por nível (4,3× de alcance linear no XI sem acessórios). Visão noturna passa a +100 de iluminação por nível. Com a build apropriada, o zoom pode chegar a 0,08 (12,5× o alcance linear da câmera normal); ajuste pelo scroll.
- Bônus de invocação se aplicam também aos aliados já vivos, preservando sua fração de vida. Equipar/retirar buffs não restaura a vida perdida. Contagem de aliados, colisão de corpo inteiro, raridade, recargas após morrer e regras de loot são preservadas.
- Controles, campos de visão e tamanho usam regras comuns no cliente e no servidor. O chat recolhível, drop Aleph de 0,03%, spawn Aleph de 3% no Núcleo Quantium e a participação individual de 5% para o squad fazem parte deste mesmo pacote.

### Buff geral de todos os acessórios

Todos os bônus positivos de acessórios recebem +50% sobre os valores preparados neste patch, antes dos limites globais. A penalidade de movimento do gigantismo não aumenta. Assim, os passivos antigos de velocidade ficam em 4,5× a base anterior e os de iluminação/campo de visão em 6×. O limite de vida do player continua em 400.000.

O reforço também vale para os efeitos especiais: ovos passam a 210% da vida do mob equivalente, 3× o dano original e 6× a velocidade original (antes dos talentos e acessórios de suporte); Orbes ganham +50% de dano mágico, mana máxima e regeneração de mana; cada evolução do Magneto recebe +50% de alcance, com o Cósmico chegando a 52.500 unidades. Invocações continuam com 70% do tamanho natural e massa de 135%. Os bônus de raridade, fusão e forja continuam.

### Núcleo Quantium focado em mobs

Meta restaurada para 8 mobs próximos, como antes da redução de densidade. A reposição de mobs no Núcleo não espera o antigo intervalo de 30 segundos. Os pontos de spawn ficam mais espalhados para comportar criaturas grandes, mantendo colisões, paredes e os refúgios livres. A população é compartilhada entre jogadores e conta também criaturas adormecidas.

Minérios ficam ocasionais: cada tentativa de geração local tem 12% de chance de procurar depósitos, com limite de 2 e intervalo de reposição de 30 segundos por setor. A regra também vale na Caverna, sem apagar pedras já existentes ou danificadas. A composição da região continua 60% Quantium, 37% Absolut e 3% Aleph por sorteio.

### Confirmação de save concorrente

Corrigida uma corrida em que uma chamada aguardando save podia confirmar a gravação anterior enquanto a gravação mais recente ainda esperava resposta do banco. Agora aguarda também o commit seguinte que já estiver em andamento, preservando as proteções contra conflitos e sessões antigas. Um teste com respostas HTTP deliberadamente pausadas reproduziu o erro antes da correção.

Validação final: 182 testes distintos aprovados entre a checagem geral e a regressão da correção de save (25 testes de armazenamento, sessão e recuperação). A prévia local confirmou o chat recolhido, a coxinha grande com aliado, o ramo de invocações e uma compra de talento reconhecida pelo servidor. Nenhuma publicação automática.
