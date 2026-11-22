# Patch 1.5.5 — Combate, equipamentos e Núcleo Quantium

Build: `release-155-titan1`. Preparado localmente em 22/11/2026. Não publicado automaticamente.

## Combate e vida

- Quantium usa a tabela canônica de vida, inclusive no carregamento das raridades adicionais. Pedras Quantium: 3,6 bilhões de HP, 12× os 300 milhões da tabela anterior. O valor antigo de 16 milhões deixava Quantium abaixo de Super e foi removido. Aleph passa a 18 bilhões para continuar acima de Quantium.
- Mobs Quantium recebem 12× a vida anterior. Aleph mantém sua posição acima de Quantium na progressão de vida.
- Mobs comuns também causam mais dano. Super+ começam com 20.000 de dano de contato, variando pela espécie; cada raridade seguinte multiplica esse dano por 1,5. Defesa e armaduras reduzem o dano recebido normalmente.
- Removida a invulnerabilidade global após impactos. Ataques de criaturas diferentes e projéteis podem atingir consecutivamente; cada criatura mantém sua própria cadência de ataque.
- O dano contínuo é calculado no servidor. O retorno visual de impactos e esquivas acompanha os pacotes do mundo, evitando bloquear a atualização do cenário quando o player sofre impactos contínuos.
- Vida base do jogador: 1.000. Vitalidade I acrescenta 1.000; o bônus total da árvore é `1.000 × nível²`, até XI. Acessórios de vida recebem bônus maiores e podem elevar o total até 400.000 de HP.
- Quatro acessórios concedem esquiva: Élitro da Esquiva, Passo de Seda, Olho Prismático e Véu de Neve. Cada golpe tem seu próprio sorteio no servidor; o total é limitado a 60%.

## Equipamentos e drops

- A bancada de Craft e o atalho C foram retirados. Pedidos antigos de criação/fusão são recusados pelo servidor sem consumir itens. Equipamentos na Loja e a forja especial de Chosen continuam disponíveis.
- 50 acessórios no catálogo: 20 ovos, Orbe e 29 outros acessórios. Há ovo e acessório passivo para cada uma das 20 espécies. Os itens existentes e seus níveis são preservados.
- Foram adicionados 12 ovos: Joaninha, Centopeia, Caranguejo, Ermitão, Tartaruga, Libélula, Sapo, Besouro Glacial, Mariposa da Neve, Escorpião, Escaravelho e Besouro Invertido.
- Oito novos passivos incluem os quatro itens de esquiva, Coração Titânico, Coração da Geada, Presa das Dunas e Coroa de Coral.
- Acessórios e ovos são obtidos nos drops da espécie correspondente, com as chances de raridade já existentes. O Relicário do Retorno continua garantido quando o Besouro Invertido gera itens.

## Habilidades

- Solar R: Sistema Solar, uma área de fogo com sol e planetas em órbita, que se expande durante três segundos e dura seis segundos, causando dano contínuo em minérios.
- Void Q: Tridente do Vazio, com raio de impacto de 650 unidades, deslocamento de 3.200 unidades/s e dano a criaturas, uma vez por alvo. O trajeto respeita paredes mesmo em velocidades altas.
- Void R: Domínio das Trevas, uma zona de seis segundos que minera em área e puxa parte dos depósitos menores. Pedras gigantes de Quantium/Aleph permanecem no lugar; paredes e outros depósitos continuam bloqueando o movimento.
- As habilidades são calculadas no servidor, compartilhadas com jogadores próximos e canceladas quando o dono morre ou sai do mapa. Espadas continuam atingindo criaturas; picaretas atingem minérios.

## Mapa e talentos

- Cada mapa recebe um Núcleo Quantium, uma pequena área contida em Absolut, com paredes e passagem. A grama/piso original continua igual; as cores são apenas ilustrativas no atlas e minimapa.
- Sorteio de raridade no Núcleo: 60% Quantium, 39,1% Absolut e 0,9% Aleph. Os sorteios continuam sujeitos a espaço, segurança e limites de população.
- Quantium não anuncia seu nascimento no chat. Absolut/Super também permanecem silenciosos; Aleph ainda pode anunciar.
- Núcleo limitado a um mob e dois minérios naturais por vizinhança, com reposição por setor após 30 segundos, contando entidades em repouso.
- Reset de talentos passa a funcionar também durante a exploração. O botão espera a confirmação do servidor e informa o resultado. Devolve exatamente os pontos gastos, preserva nível/itens e não duplica pontos em cliques repetidos.

## Instalação

Extraia o ZIP e envie os arquivos à raiz do repositório existente, preservando `public/` e `tests/`. Não envie o ZIP como um único arquivo ao repositório. Se o GitHub limitar o lote a 100 arquivos, envie primeiro os arquivos da raiz com `tests/`, e depois `public/`, preservando o caminho da pasta.

Após o deploy, `/health` deve indicar `release-155-titan1`. Recarregue o jogo para receber os scripts com cache `1.5.5-titan1`. Nenhum banco, conta real ou site publicado foi alterado durante a preparação deste patch.
