# CoxinhaMine.io 1.5.5 — menos entidades em SUPER e ABSOLUT

Build: `release-155-density1`. Patch cumulativo preparado localmente, incluindo as correções anteriores de salvamento e login.

## Densidade reduzida

A geração natural usa um orçamento por vizinhança e uma recarga compartilhada por setor:

| Região | Mobs naturais | Minérios | Raio da verificação de vizinhança | Intervalo de reposição por setor |
|---|---:|---:|---:|---:|
| SUPER | 2 | 3 | 8.000 unidades | 10 segundos |
| ABSOLUT | 1 | 2 | 10.000 unidades | 20 segundos |

Antes, o alvo de população perto de cada jogador nessas regiões era de 8 mobs. Ele passa a 2 na SUPER e 1 na ABSOLUT, reduções de 75% e 87,5% nesse alvo. Os minérios agora também obedecem a limites locais, em vez de dependerem apenas da quantidade por célula e da distância entre pedras.

Os limites são locais, não o total do bioma inteiro. A recarga é separada para mobs e minérios e compartilhada entre jogadores no mesmo setor de 8.000 × 8.000 unidades. Para permitir um novo spawn, tanto o orçamento de vizinhança quanto a recarga do setor precisam estar livres. Entidades grandes também contam quando sua borda alcança a vizinhança.

## Caminhos de geração cobertos

- Mobs naturais das regiões, incluindo todos os biomas e a Caverna.
- Minérios gerados por células, cavernas e depósitos especiais.
- Depósitos ABSOLUT gerados perto do jogador e as tentativas de geração de bosses.
- Guardiões que podem sair de minérios: também precisam de espaço no orçamento local de mobs.
- Entidades adormecidas: continuam contando, evitando duplicação ao sair e voltar.

As regiões inferiores mantêm sua geração normal. As tabelas de raridade e as estatísticas de combate continuam usando as definições existentes. Invocações dos ovos e os auxiliares de ataques dos bosses seguem suas próprias regras de combate; os limites acima tratam da geração natural das regiões.

## Menos processamento à distância

O máximo de depósitos especiais distantes mantidos ativos foi reduzido de 64 para 12 por mapa. Os demais entram em dormência, mantendo vida e participação no dano, e podem acordar quando um jogador se aproxima. Isso reduz trabalho desnecessário ao explorar sem apagar recompensas ou curar pedras danificadas.

Na Caverna, a filtragem afeta somente entidades recém-geradas. Depósitos existentes e seu dano são preservados. Posições recusadas ficam disponíveis para uma tentativa futura quando houver espaço.

## Publicação

Extraia o ZIP em uma pasta vazia e envie o conteúdo à raiz do repositório conectado ao Render, preservando as pastas. O arquivo `shared-world.js` precisa substituir o arquivo da raiz. O pacote é cumulativo e inclui as correções anteriores.

Depois do deploy, confira `/health`: `build` deve ser `release-155-density1`. Recarregue o jogo com Ctrl+F5. Preserve o Redis e as variáveis existentes; não é necessário resetar contas.

As verificações locais cobrem dois jogadores compartilhando o orçamento, recargas independentes de mobs/minérios, populações adormecidas, Caverna, preservação de dano e spawn real em todos os biomas.
