# Patch 1.5.5 — Chat e drops

Preparado localmente; não publicado automaticamente.

## Chat recolhível e drops Aleph — release-155-kin1

- Botão × esconde todo o chat; Chat ou Enter reabre. Escape também recolhe enquanto se digita. Preferência local lembrada, inclusive para convidados; canais, mensagens e rascunho são preservados.
- Mobs Aleph: 60% de itens Absolut, 5% Quantium, 0,03% Aleph, 34,97% sem item. Super, Absolut e Quantium mantêm 60% duas raridades abaixo, 5% uma abaixo, 1% da própria raridade, 34% sem item.
- Um único sorteio de raridade por mob derrotado vale para os itens e integrantes elegíveis; acessórios/ovos continuam vindo da espécie. A participação mínima de 5%, XP, loot de minérios e a forja Chosen continuam. Invocações inimigas não dropam.

Pacote cumulativo: inclui checkpoints, buff dos ovos e correções anteriores. Envie o conteúdo à raiz do repositório, preservando a pasta public. Para o limite de 100 arquivos, envie public em um lote e os demais arquivos em outro. O /health deve mostrar release-155-kin1 depois do deploy.

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
