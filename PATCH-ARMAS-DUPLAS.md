# Patch 1.5.5 — combate duplo e criaturas enraizadas

Build: release-155-dual1. Patch cumulativo, preparado localmente para envio posterior.

## Combate e equipamentos

- Espada, armadura, picareta e arma à distância têm slots próprios (1, 2, 3 e 4). Acessórios começam no 5. Saves antigos migram a arma à distância do primeiro slot sem perder a espada.
- Com a espada selecionada, clique esquerdo usa a espada e segure o direito para disparar. No slot 4, o esquerdo também dispara. Z/X ativam habilidades da arma à distância. Q/R continuam para espada e picareta. Celular possui botões separados para atacar e disparar.
- Todas as 12 armas à distância têm receitas na Loja, com o mesmo catálogo e ingredientes dos outros equipamentos. Suas fontes de drop anteriores continuam disponíveis.
- Upgrades de espada chegam a +20 com a Mestra das Raízes na Jungle. Cada nível adiciona 25% ao dano de golpes e habilidades; picaretas e armaduras mantêm os upgrades anteriores. Upgrades são salvos e resetam na ascensão.
- Uma cópia por arma e raridade. Recomprar apenas equipa e não consome materiais nem moedas. Duplicatas antigas são normalizadas.
- As caixas da hotbar de espadas e armaduras usam a cor da raridade; os modelos mantêm as cores originais. Itens segurados Aleph e Chosen recebem partículas da cor da raridade, visíveis também nos outros jogadores.
- Projéteis das 12 famílias possuem formas próprias, rastros, saída e impactos compartilhados. Partículas têm limites e respeitam a configuração visual.
- Nerf dos ovos existentes: dano −30% e vida −25%; velocidade e recarga de invocação preservadas. Vida base atual: 157,5% do mob natural antes dos bônus.

## Criaturas enraizadas

- Jungle: Cogumelo Venenoso; drop Esporo Violeta.
- Deserto: Duna Viva; drop Núcleo de Arenito.
- Praia: Coral Sentinela; drop Ramo de Coral Vivo.
- Floresta de Gelo: Cristal da Geada; drop Fragmento da Geada.
- Permanecem imóveis mesmo após ataques ou colisões. Entram nos pools das regiões de raridade do próprio bioma, sem aumentar os limites de população.
- Cogumelos avisam antes de liberar esporos. O veneno dura quatro segundos, causa dano gradual e deixa a coxinha roxa no mundo e no retrato. Não acumula indefinidamente; desaparece ao morrer, sair do mapa ou entrar em área segura.
- Dunas, corais e cristais preparam ataques à distância. Cristais também podem causar lentidão.
- Novos acessórios passivos: Amuleto de Esporos, Coração de Arenito, Broche de Coral Vivo e Prisma da Geada.
- Todos possuem galeria, componentes e ovos em todas as raridades, usando as regras normais de loot e participação.
- Ovos de Cogumelo e Coral invocam dois aliados; Duna e Cristal invocam um. São torres imóveis, laranja, com projéteis contra mobs e minérios. Não atingem jogadores, não dão XP/drop e não podem ser montadas. Recarga após morte: 24, 26, 28 e 30 segundos, respectivamente. Limite de 24 aliados por jogador mantido.

## Instalação

Extraia o ZIP e substitua os arquivos de mesmo caminho na raiz do projeto. A pasta public vai dentro da raiz, mesclando com a public existente, sem criar public/public. Envie também os arquivos de servidor da raiz e faça o deploy do conjunto. Preserve o banco e as variáveis de ambiente.
