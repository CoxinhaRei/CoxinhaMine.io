# Patch 1.5.5 — Titãs, montarias e ascensão

Build: release-155-ascend1. Preparado localmente; ainda não publicado.

## Bosses e Núcleo Quantium

- Mobs Quantium recebem exatamente 40 vezes a vida que tinham no patch Quantium Inferno, antes dos escudos, e ficam 25% maiores. Os minérios mantêm seus atributos.
- Todos os mobs Aleph têm 10.000.000.000.000 de vida (10 T). Seu raio é quatro vezes o de um Quantium da mesma espécie e mapa; a área do corpo é 16 vezes maior.
- Chosen pode nascer como mob natural no Núcleo Quantium: 1% por sorteio. Tem 150.000.000.000.000 de vida (150 T), cor cinza e raio cinco vezes o do Quantium.
- Sorteios de mobs no Núcleo: 60% Quantium, 36% Absolut, 3% Aleph e 1% Chosen. O spawn exige espaço livre; paredes, refúgios e corpos gigantes continuam sendo respeitados. Os sorteios de minérios permanecem iguais.
- A população continua compartilhada, com meta de até 64 mobs naturais e ondas de até 16, contando criaturas adormecidas e as que saíram do núcleo. Outras regiões preservam sua densidade.
- Chosen usa um único sorteio de raridade de loot: 50% Quantium, 20% Absolut, 1% Aleph, 0,0001% Chosen e 28,9999% sem item. Componentes e acessórios da espécie seguem esse resultado; continuam valendo participação de 5% e as regras do squad.
- Chosen de drop possui identidade própria e persiste no save. Não disputa a posse exclusiva de Chosen criado pela forja; as ofertas da forja continuam funcionando separadamente.

## Invocações e montaria

- A velocidade básica dos mobs de ovos cai de 6× para 3×, antes dos talentos e acessórios. Dano, vida, recarga, quantidade e massa continuam como no patch anterior.
- Botão Recolher mobs / Invocar mobs para desativar e reativar o grupo inteiro sem retirar ovos dos slots. A preferência é salva. Recolher não elimina a recarga de uma invocação que morreu.
- Monte uma invocação própria Super ou superior com H ou pelo botão Montar; o mesmo controle permite desmontar. Apenas uma invocação pode ser montada por jogador, mesmo em um grupo de um único aliado.
- O jogador conduz a montaria com seus controles normais. As outras invocações continuam agindo por conta própria. A montaria mantém vida, hitbox, colisão, dano de contato e vulnerabilidade a projéteis.
- O servidor valida dono, raridade e proximidade. Montarias não atravessam paredes ou pedras. Morte do aliado, recolhimento, saída do mapa, saída do jogo e remoção do ovo desfazem a montaria.
- A transição de montar atualiza a época de movimento para descartar comandos antigos. O corpo e movimento são compartilhados para os outros jogadores.

## Ascensão

- Primeiro requisito: nível 1.000. Próximos: 1.250, 1.500, 1.750... (+250 por ascensão).
- O personagem volta ao nível 1 e XP zero. Talentos, seus pontos e as melhorias de magia recomeçam. O despertar da magia é mantido, com Esfera Arcana inicial. Acessórios saem dos slots; habilidades em andamento são interrompidas.
- Itens, moedas, conta, guilda, histórico e estatísticas são preservados. Não há exclusão de itens.
- Depois da primeira ascensão, equipamentos e acessórios só podem ser usados no nível correspondente. Guardá-los no inventário não concede bônus. Os personagens que ainda não ascenderam mantêm o uso de seus equipamentos atuais.
- Níveis: Comum/Madeira 1, Incomum/Pedra 10, Raro/Ferro 25, Épico/Ouro 50, Lendário/Matéria Vermelha 90, Mítico/Diamante 150, Ultra/Void 225, Super/Solar 325, Absolut 450, Quantium 600, Aleph 800, Chosen 1.000.
- Cada ascensão soma +25% ao multiplicador de dano/vida e +10% ao ganho de XP. O custo da curva de XP também sobe 25% por ascensão. A vida máxima permanece limitada a 400.000.
- A tela explica as consequências e pede marcar uma caixa antes de Renascer. O servidor confere nível e requisito; não confia em valores enviados pelo navegador.

## Receitas da loja

Picaretas, espadas e armaduras novas exigem moedas, minérios e componentes de espécies. Equipamentos já possuídos continuam disponíveis sem cobrar a receita de novo. Madeira inicial permanece acessível.

Drops-base das picaretas (espadas usam 1,2× e armaduras 1,5×, arredondando para cima):

- Pedra: 3 Fragmentos do Guardião.
- Ferro: 8 Mandíbulas de Formiga e 5 Élitros Rubros.
- Ouro: 12 Ferrões e 8 Carapaças de Besouro.
- Matéria Vermelha: 20 Sedas de Aranha e 12 drops de Escorpião.
- Diamante: 25 drops de Tornado de Gelo e 18 de Besouro Glacial.
- Void: 35 drops de Centopeia, 25 de Louva-a-deus e 40 de Guardião.
- Solar: 45 drops de Tornado de Areia, 35 de Escaravelho e 30 de Libélula.

Componentes comuns até Aleph são aceitos, somando pilhas. Chosen não é consumido nessas receitas. A loja mostra o que você tem e o que falta; faltando qualquer ingrediente, nada é descontado.

## Instalação

Atualize os arquivos na raiz do repositório. A pasta public do pacote atualiza a public existente; não crie public/public. O ZIP é cumulativo sobre os patches anteriores. Após o deploy, confira build release-155-ascend1 em /health.
