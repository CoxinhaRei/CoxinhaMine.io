# Patch 1.5.5 — Invocações, gigantismo e visão

Preparado localmente; ainda não publicado.

## Invocações, gigantismo e visão — release-155-kin1

- Novo ramo de talentos Invocações, com quatro progressões I–XI: Fúria da Ninhada (+15% de dano por nível), Vigor da Ninhada (+20% de vida), Marcha do Enxame (+12% de movimento) e Frenesi do Enxame (+10% de frequência de ataque). Usa os mesmos pontos e o reset existente.
- Cinco novos acessórios: Presa da Ninhada, Ferrão do Enxame, Coração da Ninhada, Asas do Enxame e Tambor de Seda. Fortalecem as invocações dos ovos equipados, sem aumentar atributos de mobs inimigos. Têm todas as raridades, drops por espécie e suporte à fusão/Chosen.
- Duas novas peças de gigantismo: Carapaça Colossal (Besouro) e Couraça do Titã (Tartaruga). Conferem tamanho, vida e defesa, com penalidade de velocidade. Tamanho máximo: 3× o raio normal; penalidade máxima de movimento: 75%. A vida total continua limitada a 400.000.
- O tamanho é real no servidor: altera colisões, massa e hitbox de projéteis; aparece para os outros jogadores. O corpo maior também reposiciona arma, armadura, nomes e barras de vida. Crescer junto de uma parede procura uma posição livre próxima.
- Os bônus de velocidade dos acessórios existentes foram triplicados; os de campo de visão e iluminação foram quadruplicados. Visão ampliada passa a +30% por nível (4,3× de alcance linear no XI sem acessórios). Visão noturna passa a +100 de iluminação por nível. Com a build apropriada, o zoom pode chegar a 0,08 (12,5× o alcance linear da câmera normal); ajuste pelo scroll.
- Bônus de invocação se aplicam também aos aliados já vivos, preservando sua fração de vida. Equipar/retirar buffs não restaura a vida perdida. Contagem de aliados, colisão de corpo inteiro, raridade, recargas após morrer e regras de loot são preservadas.
- Controles, campos de visão e tamanho usam regras comuns no cliente e no servidor. O chat recolhível, drop Aleph de 0,03%, spawn Aleph de 3% no Núcleo Quantium e a participação individual de 5% para o squad fazem parte deste mesmo pacote.

Envie o conteúdo do pacote na raiz do repositório. A pasta public deve atualizar a public existente; não crie public/public. No limite de 100 arquivos do GitHub, envie public em um lote e os demais arquivos em outro. Após o deploy, confira build: release-155-kin1 em /health.

### Buff geral de todos os acessórios

Todos os bônus positivos de acessórios recebem +50% sobre os valores preparados neste patch, antes dos limites globais. A penalidade de movimento do gigantismo não aumenta. Assim, os passivos antigos de velocidade ficam em 4,5× a base anterior e os de iluminação/campo de visão em 6×. O limite de vida do player continua em 400.000.

O reforço também vale para os efeitos especiais: ovos passam a 210% da vida do mob equivalente, 3× o dano original e 6× a velocidade original (antes dos talentos e acessórios de suporte); Orbes ganham +50% de dano mágico, mana máxima e regeneração de mana; cada evolução do Magneto recebe +50% de alcance, com o Cósmico chegando a 52.500 unidades. Invocações continuam com 70% do tamanho natural e massa de 135%. Os bônus de raridade, fusão e forja continuam.

### Núcleo Quantium focado em mobs

Meta restaurada para 8 mobs próximos, como antes da redução de densidade. A reposição de mobs no Núcleo não espera o antigo intervalo de 30 segundos. Os pontos de spawn ficam mais espalhados para comportar criaturas grandes, mantendo colisões, paredes e os refúgios livres. A população é compartilhada entre jogadores e conta também criaturas adormecidas.

Minérios ficam ocasionais: cada tentativa de geração local tem 12% de chance de procurar depósitos, com limite de 2 e intervalo de reposição de 30 segundos por setor. A regra também vale na Caverna, sem apagar pedras já existentes ou danificadas. A composição da região continua 60% Quantium, 37% Absolut e 3% Aleph por sorteio.

### Confirmação de save concorrente

Corrigida uma corrida em que uma chamada aguardando save podia confirmar a gravação anterior enquanto a gravação mais recente ainda esperava resposta do banco. Agora aguarda também o commit seguinte que já estiver em andamento, preservando as proteções contra conflitos e sessões antigas. Um teste com respostas HTTP deliberadamente pausadas reproduziu o erro antes da correção.

Validação final: 182 testes distintos aprovados entre a checagem geral e a regressão da correção de save (25 testes de armazenamento, sessão e recuperação). A prévia local confirmou o chat recolhido, a coxinha grande com aliado, o ramo de invocações e uma compra de talento reconhecida pelo servidor. Nenhuma publicação automática.
