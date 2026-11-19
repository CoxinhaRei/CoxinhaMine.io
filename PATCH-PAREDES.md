# CoxinhaMine.io 1.5.5 — Paredes nas divisas

Build atual: `release-155-walls1`.

As paredes agora acompanham as divisas reais das regiões: onde uma cor termina e a outra começa no minimapa. Os nove territórios continuam definidos como no patch corrigido, com apenas uma região Absolut. O cenário mantém os pisos originais; as cores de raridade aparecem somente no minimapa e no atlas.

## Visual e circulação

- Jardim: paredes de cerca viva, com folhas e bordas naturais.
- Jungle: barreiras de vegetação mais escura e densa.
- Praia: paredões de pedra costeira.
- Floresta de Gelo: paredes de gelo e rochas glaciais.
- Deserto: paredes de rocha e arenito.
- Caverna: paredes regionais integradas ao labirinto já existente.

Cada par de regiões vizinhas tem pelo menos uma passagem larga. Divisas longas podem ter duas, e os pontos importantes mantêm acesso. As aberturas têm espaço para jogadores e os mobs naturais grandes. A praça central, a forjadora e os portais continuam acessíveis.

Pontos dourados no minimapa e no atlas indicam as passagens. No cenário de superfície, a abertura tem uma marca discreta de “Passagem”. Não é um portal ou um teleporte: o jogador atravessa andando.

## Colisão e compartilhamento

As paredes bloqueiam movimento de jogadores e mobs, mineração e ataques através delas, além dos projéteis que as atingem. As regras do terreno são geradas da mesma forma no servidor e no navegador.

Na Caverna, o labirinto é construído respeitando as divisas, e as passagens têm câmaras transitáveis. Câmaras de bosses e minérios gigantes não apagam paredes regionais. As entidades só são colocadas quando cabem no espaço livre.

## Instalar

1. Extraia `patch-1.5.5-paredes.zip`.
2. Envie todo o conteúdo para a raiz do repositório, junto de `package.json`, preservando `public`, `tests` e `scripts`.
3. Substitua os arquivos de mesmo caminho e mantenha os demais. O pacote é cumulativo e inclui as correções anteriores necessárias, inclusive a restauração dos pisos originais.
4. Faça deploy no Render e recarregue o jogo com Ctrl+F5. No `/health`, confira `build: release-155-walls1`.

Preserve as variáveis do Upstash, `SAVE_KEY` e da conta DEV. Nenhuma senha ou banco real acompanha o pacote. Contas, inventários, níveis e guildas não são resetados. O mundo temporário de encontros é recriado no deploy, como nos demais reinícios.

O erro de save do Redis continua sendo uma investigação separada. Os campos `saveError` e `saveErrorCode` permanecem disponíveis no diagnóstico. Os documentos de patches anteriores são históricos; o build acima identifica este pacote.

Verificação: 76 testes passaram. Os testes cobrem todas as regiões, passagens entre cada par vizinho, colisão de movimento e ataques, labirinto conectado, proteção das paredes contra câmaras gigantes e a preservação dos pisos originais. A revisão no navegador confirmou a parede de cerca viva, o jogador parando na colisão e os pontos das passagens no atlas.
