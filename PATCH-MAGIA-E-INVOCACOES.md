# CoxinhaMine.io 1.5.5 — magia, invocações e mapas

Build: `release-155-arcana1`. Patch local, ainda não publicado.

## Mapas e avisos

- Clareiras de formatos diferentes e corredores ligam os territórios; paredes mantêm passagens entre raridades.
- Absolut ocupa uma região específica e é a maior área individual, sem virar o fundo do mapa inteiro.
- A região Absolut permite 79% Absolut, 20% Super e 1% Quantium. As outras áreas conservam suas próprias espécies e raridades.
- Grama e pisos dos biomas permanecem originais. Cores das raridades aparecem somente no minimapa e no atlas.
- Super e Absolut não geram mensagens de spawn no chat nem marcadores de spawn no mapa, para mobs e minérios. Quantium e raridades superiores mantêm seus avisos.
- Barras de vida de bosses próximos, anúncios de abates e mensagens de crafts continuam funcionando.

## Como começar a usar magia

1. Entre na Jungle e procure o **Sábio do Dossel** perto do refúgio (77400, 76000).
2. Aproxime-se e pressione **E**, ou toque no botão de conversar.
3. Receba sua primeira **Orbe Mágica Comum**, uma única vez. Ela equipa automaticamente se houver um slot livre; caso contrário, equipe pelo inventário de acessórios.
4. Abra **Magia** pelo menu, pelo botão de raio ou pela tecla **M**. Selecione a magia e use **G** ou o botão de conjuração para lançar na direção da mira.

Magias exigem despertar, talento aprendido, Orbe equipada, mana suficiente e recarga disponível. Na praça segura não é possível conjurar. As magias atacam criaturas, preservando o uso das picaretas na mineração.

| Magia | Mana | Recarga | Dano Comum no talento I |
|---|---:|---:|---:|
| Esfera Arcana | 14 | 0,65 s | 144 |
| Raio do Dossel | 38 | 4 s | 315 |
| Supernova | 52 | 7 s | 450 |
| Chuva de Cometas | 44 | 5 s | 234 por cometa |

A árvore oferece talentos até XI. O despertar ensina Esfera Arcana I; cada dez níveis acrescentam um ponto para distribuir. Melhorias de talento aumentam o dano em 15% por nível adicional.

Orbes têm todas as raridades, de Comum a Chosen. Poder e tamanho crescem com a raridade; a Orbe Chosen tem escala de poder 40000× e o feixe alcança 2400 unidades de largura. Mana máxima vai de 100 a 364 e regenera automaticamente. Orbes adicionais podem ser criadas com minérios Comuns e Gotas de Orvalho; a fusão e a forja Chosen usam o sistema existente.

## Ovos e aliados

Ovos são acessórios ofensivos criados com minérios e drops da espécie correspondente. Possuem todas as raridades e podem passar pela fusão e pela forja Chosen.

| Ovo | Aliados | Recarga individual após morte |
|---|---:|---:|
| Formiga | 4 | 14 s |
| Besouro | 1 | 24 s |
| Tornado de Areia | 4 | 22 s |
| Tornado de Gelo | 4 | 22 s |
| Abelha | 3 | 18 s |
| Aranha | 2 | 20 s |
| Louva-a-deus | 2 | 20 s |
| Guardião | 1 | 28 s |

- Basta equipar: a invocação acontece automaticamente, sem gastar mana.
- Aliados são laranja, atacam mobs e acompanham o dono. Cada aliado possui 70% da vida e do tamanho do mob normal da mesma raridade.
- Possuem contato com inimigos e atravessam jogadores. Não causam dano a players, não dão XP nem drops e não viram inimigos naturais.
- Dano de aliados conta para seu dono. A regra de participação mínima de 5% e as recompensas de squad continuam valendo.
- Até 24 aliados ficam ativos por jogador; espaços adicionais aguardam vaga. Retirar um ovo, morrer, sair do mapa ou voltar ao menu desfaz as invocações daquele grupo.
- Ícones dos ovos mostram a espécie e tooltips descrevem quantidade, recarga e atributos.

## Instalação

Extraia o patch e envie os arquivos para a **raiz do mesmo repositório** no GitHub, preservando as pastas `public`, `tests` e `scripts`. O conteúdo do ZIP inteiro não deve ser colocado dentro de `public`.

Após o deploy do Render, use Ctrl+F5 e confira `/health`: o campo `build` deve mostrar `release-155-arcana1`. Não há novas variáveis de ambiente. Contas registradas continuam usando o banco persistente já configurado; convidados permanecem temporários. O patch não modifica senhas nem credenciais do banco.

Mana, talentos, dano e invocações são validados pelo servidor e compartilhados entre jogadores. O limite de aliados e a limpeza de efeitos e grupos evitam acumular entidades após a saída do dono. Este patch não diagnostica falhas externas do Redis.
