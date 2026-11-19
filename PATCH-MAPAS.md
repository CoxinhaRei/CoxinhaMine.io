# CoxinhaMine.io 1.5.5 — Patch dos Territórios

Build do servidor: `release-155-maps1`. Continua sendo um patch da 1.5.5.

## O que mudou

- Jardim, Praia, Jungle, Floresta de Gelo, Deserto e Caverna têm regiões desenhadas para este jogo. A imagem enviada serviu como referência do conceito; nenhum traçado ou arquivo dela foi copiado.
- Os mapas de superfície passaram de 100.000 × 100.000 para **150.000 × 150.000 unidades**, um aumento de **125% na área** (2,25 vezes a anterior). A Caverna passou para **300.000 × 150.000**, mantendo o dobro da área de um mapa de superfície.
- Os spawns de superfície ficam no novo centro, **75.000, 75.000**. A praça, os refúgios, a forjadora, a câmera do menu e os portais acompanham as novas posições. A Caverna mantém a entrada no início do labirinto.
- Foram criadas clareiras, corredores, ilhas de vegetação, recifes, gelo e rocha conforme o bioma. As barreiras no mapa de superfície têm colisão e bloqueiam ataques; a Caverna mantém o labirinto e a escuridão.
- Há nove faixas de região: Comum, Incomum, Raro, Épico, Lendário, Mítico, Ultra, Super e Absolut. **Absolut é branca e ocupa a maior área explorável** em todos os mapas. As cores dos territórios não alteram as cores dos itens ou suas raridades.
- Os nomes, lugares e espécies variam por bioma. Por exemplo: baías de ermitões e piscinas de coral na Praia; ruínas e pântanos na Jungle; geleiras e fendas na Floresta de Gelo; oásis e cânions no Deserto. Os locais também aparecem no passeio automático do menu.

## Spawns por território

| Região | Sorteio da raridade |
| --- | --- |
| Comum | 100% Comum |
| Incomum a Ultra | 84% da raridade da região; 16% da imediatamente anterior |
| Super | 84% Super; 16% Ultra |
| Absolut | **79% Absolut; 20% Super; 1% Quantium** |

Esses números são os pesos do sorteio de uma tentativa de spawn, não chances de drop. A posição precisa ter espaço, estar fora do refúgio e respeitar os obstáculos e os limites de população. A raridade é escolhida pela **posição em que a criatura nasce**, não pelo centro do mapa nem pelo navegador do jogador.

Os refúgios não geram mobs ou minérios. As espécies também mudam conforme o território: as regiões iniciais do Jardim favorecem joaninhas e formigas, enquanto outras favorecem abelhas, aranhas, besouros ou centopeias. Os demais biomas usam suas próprias espécies. A Caverna usa pedras e guardiões.

Entrar na área branca provoca tentativas de colocar um depósito Absolut nas proximidades, sem esperar pelo antigo evento global raro. Esses depósitos têm espaçamento próprio e não nascem sobre o jogador, os mobs ou outras pedras. Depósitos Quantium continuam raros; o sistema tenta colocá-los em uma área com espaço para seu tamanho. As invocações dos bosses continuam sem XP ou drops.

## Minimap e atlas

- As cores e as barreiras correspondem às mesmas regras que o servidor usa.
- Clique ou toque no minimapa para ampliar. O atlas mostra regiões, nomes, probabilidades, portais, refúgio, forjadora e marcadores dos aliados no mesmo mapa.
- O olhar do jogador indica sua direção. As marcações de guilda continuam roxas e as de squad usam sua cor própria.
- O mapa inteiro da Caverna respeita sua proporção retangular. Ao passar o mouse ou tocar no atlas, aparece o nome da região, sua raridade predominante e suas espécies.
- O atlas é uma consulta: não teleporta o jogador e não controla a câmera automática do menu.

## Desempenho e compartilhamento

O servidor e o navegador geram o mesmo terreno determinístico. A geração dos encontros continua próxima de jogadores ativos; o mapa maior não cria todos os mobs de uma vez. As imagens do minimapa ficam em cache e os pisos são desenhados apenas na área visível.

Criaturas distantes entram em repouso, mantendo HP e participação por até dez minutos, com até 256 registros por mapa. Jogadores próximos em outra parte do mesmo mapa mantêm seus encontros ativos. Minérios mantêm o histórico limitado já existente; os depósitos distantes de alta raridade também têm limite de retenção ativa. O patch amplia a consulta espacial de pedras para evitar sobreposição entre depósitos gigantes.

## Instalação

1. Extraia `patch-1.5.5-mapas.zip`.
2. Envie **todo o conteúdo extraído para a raiz do repositório do jogo**, junto de `package.json`. Preserve as pastas `public`, `tests` e `scripts`; os arquivos não ficam todos dentro de `public`.
3. Substitua os arquivos de mesmo caminho, mantendo os demais. O pacote reúne os arquivos alterados desde a versão 1.5.5 e inclui os patches anteriores de craft, conta DEV e diagnóstico do save. Não é necessário instalar os ZIPs anteriores novamente.
4. Faça o deploy do novo commit no Render. Preserve as variáveis de Upstash, `SAVE_KEY` e as configurações da conta DEV. Nenhuma senha ou banco real acompanha o pacote.
5. Recarregue o jogo com **Ctrl+F5**. No celular, feche e reabra a página se ela ainda usar os arquivos antigos. O `/health` deve mostrar `build: release-155-maps1`.

O patch não reseta contas, níveis, inventário, talentos ou guildas. O mundo temporário de mobs, pedras e drops é recriado no reinício do servidor, como nos demais deploys. A investigação da falha de gravação do Redis permanece separada: este patch mantém `saveError` e `saveErrorCode` no `/health`, mas não elimina uma falha externa do banco.

Os documentos dos patches anteriores são históricos; o build atual para conferir esta instalação é o informado acima.
