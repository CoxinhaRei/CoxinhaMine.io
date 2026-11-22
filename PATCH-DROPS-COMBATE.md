# CoxinhaMine.io 1.5.5 — drops, bosses, talentos e Solar

Build: `release-155-combat2`. Pacote cumulativo preparado localmente; ainda não publicado.

## Drops de mobs

Cada mob natural pode deixar um acessório ligado à sua espécie, junto do componente correspondente. O resultado usa uma única rolagem de raridade por abate, compartilhada pelos jogadores com direito ao loot. Quando há mais de um acessório da espécie, um deles é sorteado. Os itens aparecem no chão e usam a coleta e os efeitos existentes.

| Mob derrotado | 60% de chance | 5% de chance | 1% de chance | Sem item |
|---|---|---|---|---|
| SUPER | Mítico | ULTRA | SUPER | 34% |
| ABSOLUT | ULTRA | SUPER | ABSOLUT | 34% |
| QUANTIUM | SUPER | ABSOLUT | QUANTIUM | 34% |
| ALEPH | ABSOLUT | QUANTIUM | ALEPH | 34% |

Mobs de raridades inferiores deixam itens da própria raridade. Acessório e componente usam a mesma raridade sorteada. A variante rara do besouro continua podendo deixar o Relicário do Retorno.

XP, moedas, galeria e participação no abate são calculados normalmente, inclusive quando não cai item. Continua necessário atingir a participação mínima de 5%, individualmente ou pelas regras de squad. Invocações de bosses não concedem itens ou XP.

## Vida e dano

- Mobs SUPER: **2× a vida anterior**.
- Mobs ABSOLUT, QUANTIUM e ALEPH: **12× a vida anterior**.
- Espadas: **3× o dano base anterior**, incluindo equipamentos já existentes ao carregar o personagem.

Os multiplicadores são definidos nas tabelas canônicas, não aplicados repetidamente aos dados da conta. O dano de contato dos mobs permanece no cálculo existente. As armaduras avançadas também receberam os bônus passivos solicitados.

## Reset de talentos

O botão **Resetar talentos** aparece na árvore. Pode ser usado gratuitamente no menu ou em um refúgio. Ele devolve exatamente os pontos investidos: um talento no nível III devolve 1 + 2 + 3 = 6 PT.

O reset mantém nível e inventário. A vida atual é limitada à nova vida máxima, sem cura por reset. Depois de zerar os talentos, repetir o pedido não gera novos pontos. O servidor calcula a devolução, ignorando valores enviados pelo navegador.

## Visão e zoom

O novo talento **Visão ampliada I–XI** aumenta o campo de visão máximo em 8% por nível, até 88% antes de combinar com acessórios. A Visão noturna existente continua sendo o talento de iluminação na Caverna.

- Scroll para baixo: afasta a câmera até o máximo desbloqueado.
- Scroll para cima: aproxima a câmera.
- Configurações → **Zoom**: controle deslizante que também funciona por toque.

O limite combina talentos e acessórios; remover os bônus ou resetar a árvore limita novamente o afastamento. A preferência de zoom fica neste navegador. Rolar um painel de interface não muda a câmera.

## Vampirismo e Sol da Aurora

Vampirismo passa a considerar o dano real causado por golpes, habilidades, magia e ataques creditados ao jogador. Dano excedente à vida restante do alvo não gera cura extra; a cura respeita a vida máxima.

A habilidade da **espada Solar** lança o **Sol da Aurora** na direção da mira:

- Um sol móvel com núcleo luminoso, halo, coroa e arcos animados.
- Duração de 4,5 segundos, raio de dano em área de 650 unidades e recarga base de 16 segundos.
- Dano contínuo aos mobs próximos, com vampirismo aplicado aos acertos.
- Paredes interrompem o avanço; o sol continua queimando no ponto alcançado até expirar.
- A posição e o dano são calculados no servidor, e o efeito é compartilhado com os jogadores próximos.

## Publicar

Extraia o ZIP em uma pasta vazia e envie todo o conteúdo à raiz do repositório, preservando as pastas. Depois do deploy, confira `/health`: `build` deve ser `release-155-combat2`. Recarregue com Ctrl+F5.

O pacote inclui as correções anteriores de save e a redução de entidades nas regiões SUPER e ABSOLUT. Preserve o Redis e as variáveis existentes; não é necessário resetar contas.

O Sol da Aurora, o controle de zoom e o reset foram verificados no navegador em uma sessão local de teste. Os testes automáticos cobrem probabilidades, fórmulas, inventário, cura real, limites da câmera, autoridade do servidor e proteção contra devolução duplicada de pontos.
