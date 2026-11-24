# CoxinhaMine.io 1.5.5 — Armas à distância e upgrades

Build: `release-155-ranged1`. Patch cumulativo, preparado localmente, sem publicação automática.

## Controles

Equipe a arma no primeiro slot e clique para disparar. As habilidades novas usam **Z e X**, com recargas independentes. Q/R continuam nos equipamentos anteriores. No celular, o botão de ataque dispara e os botões Z/X aparecem separados acima dos controles existentes.

## As 12 armas

| Arma | Dano base | Recarga | Obtenção inicial |
|---|---:|---:|---|
| Estilingue | 10 | 0,4 s | Oficina / loja inicial |
| Arco de Madeira | 25 | 0,8 s | Oficina com materiais |
| Bumerangue | 18 por impacto, ida e volta | 1 s | Oficina / loja inicial |
| Revólver Enferrujado | 45 | 0,9 s | Oficina / loja |
| Arco de Espinhos | 100 | 0,7 s | Lagartas: 12% |
| Cajado Glacial | 180 | 1 s | Oficina com materiais |
| Grimório de Fogo | 250 | 1,2 s | Oficina com materiais |
| Stinger | 350 | 0,5 s | Abelhas: 6% |
| Diamond Chakram | 3.000 por impacto, ida e volta | 2 s | Veios de diamante: 8% |
| Void Crossbow | 8.000 | 2 s | Oficina com materiais Void |
| Starfall | 15.000 | 0,8 s | Oficina avançada |
| Event Horizon | 25.000 | 1,2 s | Bosses Super+: 0,05% |

Veios de diamante têm um símbolo azul claro e aparecem em 10% dos depósitos Lendário a Aleph. As chances de armas são sorteios separados dos drops anteriores e exigem participação normal de loot. Invocações de bosses não dão armas. Drops ficam no chão para os jogadores elegíveis.

Todas as armas possuem versões Comum a Chosen: 144 variantes. A evolução é garantida, exige a versão anterior, moedas, minérios da raridade atual e drops específicos. A oficina mostra todos os custos antes da confirmação. Armas de drop não podem ser compradas pelo preço de uma arma inicial.

Multiplicadores de dano por raridade, na ordem Comum → Chosen: **1, 3, 10, 35, 120, 450, 1.800, 9.000, 50.000, 300.000, 3.000.000, 20.000.000**. Alcance e tamanho dos efeitos também aumentam, com limites. Exemplo: Starfall Raro dá 150.000 de dano base; Event Horizon Aleph dá 75 bilhões antes dos bônus.

## Habilidades Z / X

- Arco de Espinhos: leque de sete espinhos / raízes que causam dano contínuo e lentidão.
- Cajado Glacial: três cristais congelantes / tempestade glacial em área.
- Grimório de Fogo: bola de fogo gigante com explosão / chuva de oito meteoros.
- Stinger: seis ferrões venenosos / enxame temporário de seis abelhas de energia.
- Diamond Chakram: seis fragmentos / quatro discos em órbita.
- Void Crossbow: flecha com atração / explosão do vazio.
- Starfall: cinco estrelas perseguidoras / chuva celestial. Seus ataques básicos também perseguem alvos.
- Event Horizon: campo de atração / singularidade que concentra inimigos e explode após 3,4 segundos. Impactos básicos atraem criaturas menores.

Z recarrega em 8 segundos e X em 16 segundos; Event Horizon usa 12 e 24 segundos. As quatro armas iniciais possuem apenas ataque básico. Os projéteis atingem mobs, respeitam paredes, alcance, recarga e colisão calculados no servidor; não mineram pedras nem causam dano a outros jogadores. As habilidades usam os bônus de dano e o vampirismo existentes.

## Upgrades

A nova **Oficina de Combate** aparece no menu e no botão de arco no HUD. Ela reúne obtenção de armas, evolução de raridade e upgrades.

Picaretas e armaduras possuem até **20 upgrades por equipamento**. Cada upgrade da picareta soma 25% ao bônus de mineração e aumenta suas habilidades. Armaduras ganham um ponto percentual adicional de defesa por upgrade, aplicado junto aos acessórios antes da defesa base da armadura, respeitando o limite de defesa adicional de 85%. Os custos crescem e usam moedas, minérios e componentes. Trocar de equipamento mantém seu próprio nível de upgrade; entrar novamente não acumula o bônus duas vezes. Ascender apaga os upgrades junto com os equipamentos antigos.

## Mobs e bosses

- Tamanho dos corpos: **−25%**.
- Velocidade base de movimento: **−30%**.
- Dano dos mobs: **−40%**. A vida não é alterada por este patch.
- Super, Absolut e Quantium deixam de gerar anéis e rajadas repetidas de bullet hell. Bosses que atiram usam leques pequenos de três, quatro ou cinco projéteis; cada espécie mantém sua habilidade especial.
- Aleph continua com bullet hell e fica bem mais difícil: anéis de 96 projéteis, velocidades alternadas, rajadas sucessivas a cada 0,18 segundo e recargas menores. Chosen usa padrões ainda mais densos. O limite global de projéteis inimigos permanece 600.
- Lagartas entram no Jardim com modelo próprio, galeria, drops, acessório e ovo.

O servidor limita os novos projéteis das armas a 384 e os campos/enxames a 96 de cada tipo. Efeitos terminam ao morrer ou sair da partida. Novas armas e upgrades são salvos na conta pelo sistema persistente existente.

## Instalação

Substitua os arquivos do projeto pelos arquivos deste patch, preservando as pastas. O conteúdo de `public` vai no `public` existente; não crie `public/public`. Envie também os arquivos de servidor da raiz. Não envie credenciais, `.env`, bancos locais ou `node_modules` ao GitHub. Aguarde o deploy e atualize a página; `/health` deve mostrar `release-155-ranged1`.
