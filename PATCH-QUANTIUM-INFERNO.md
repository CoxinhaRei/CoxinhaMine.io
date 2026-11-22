# Patch 1.5.5 — Inferno Quantium

Build: release-155-swarm1. Preparado localmente; ainda não publicado.

- O Núcleo Quantium passa de 8 para até 64 mobs naturais vivos por mapa (8 vezes a meta anterior).
- Reposição em ondas de até 16 mobs por chamada de spawn, sem o antigo intervalo de 30 segundos para mobs. O ciclo natural verifica a população a cada segundo enquanto há jogadores na região. Paredes, espaço disponível e limites globais podem atrasar o preenchimento.
- Pontos de spawn espalhados dentro do núcleo comportam criaturas gigantes sem invadir as regiões vizinhas ou os refúgios.
- Todos os jogadores compartilham a mesma população. Criaturas adormecidas e criaturas que saíram do núcleo continuam contando no limite; trocar de posição ou trazer outro jogador não duplica a população.
- Minérios continuam ocasionais (12% por tentativa de geração, até 2 depósitos naturais no núcleo). Super e Absolut fora do núcleo mantêm sua densidade reduzida.
- A composição dos sorteios continua em 60% Quantium, 37% Absolut e 3% Aleph. Drops, recompensas, buffs de acessórios e talentos do patch anterior permanecem.
- Mantidos os limites de projéteis e invocações dos bosses e o processamento de combate próximo dos jogadores.

Envie o conteúdo do pacote na raiz do repositório. Atualize a public existente; não crie public/public. Após o deploy, confira build release-155-swarm1 em /health.
