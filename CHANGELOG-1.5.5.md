# Patch 1.5.5-jungle1 — Canopy Workshop

- Meet the new Coxinha artisan, **Mestra das Raízes**, near the Absolut entrance in the Jungle. Her location is marked on the minimap and atlas.
- Equipment upgrades and ranged rarity evolution now require proximity to this NPC. Use E or tap Talk; the server checks distance, realm and line of sight before spending ingredients.
- All twelve ranged weapon models have been redrawn with distinct materials, silhouettes and details, used throughout the equipment UI and world.
- Ascension now appears beside the level below the HUD health bar, using Roman numerals. The ascension panel uses the same notation.
- Full details: `PATCH-OFICINA-JUNGLE.md`.

---

# Patch 1.5.5-ranged1 — Ranged weapons and upgrades

- Twelve ranged weapons with the requested base damage/cooldowns and 144 rarity variants, Common through Chosen.
- Z/X skills, separate mobile buttons, physical projectiles, returning discs, homing stars, poison, freezing fields, meteors and gravitational effects.
- Combat Workshop: weapon sources, visible ingredient costs, guaranteed rarity evolution and up to 20 upgrades per pickaxe/armor piece.
- Creature bodies −25%, base speed −30%, damage −40%. HP is preserved. Super/Absolut/Quantium lose bullet-hell rings; Aleph gains dense alternating-speed rings and rapid follow-up bursts.
- Caterpillars join the Garden with their own model, drops, egg and accessory. New weapon drops preserve normal loot eligibility.
- Server-authoritative cooldowns, collisions and shared effects. Weapon rarity/upgrades persist; ascension resets gear upgrades with equipment.
- Full details and installation: `PATCH-ARMAS-DISTANCIA.md`.

---

# Patch 1.5.5 — Titan combat

- Talent reset now works during exploration with an acknowledged, exact point refund. Repeated requests do not duplicate points.
- 1,000 starting HP, up to 400,000 through vitality and stronger health accessories.
- Stronger creatures: Super+ contact damage starts at 20,000 before mitigation and scales with species and rarity. No global post-hit invulnerability; dodge items roll independently per hit.
- Corrected Quantium ore HP to the shared catalog and increased it to 3.6 billion; Quantium creatures gain 12× health. Higher tiers retain their health progression.
- 50 accessories, including 20 automatic summon eggs. Normal crafting is removed; species drops, equipment purchases and the Chosen forge remain.
- Solar pickaxe: expanding fire solar system. Void sword: giant high-speed trident. Void pickaxe: dark mining area with selective ore attraction.
- Small Quantium inset within Absolut in each biome: 60% Quantium, 37% Absolut, 3% Aleph. Native floors remain unchanged; Quantium spawns are silent.
- Continuous damage feedback travels with world frames so getting hit cannot starve shared scene updates.

---

# CoxinhaMine.io — Update 1.5.5

- Six separate maps: Garden, Beach, Jungle, Ice Forest, Desert and Cave. Travel through distant portals or choose a map from the menu.
- Automatic menu tours with random landmarks, fades and animated creatures.
- Chosen rarity and the Desert Forger: compete for unique crafted items with Aleph offerings.
- 21 accessory designs with passive effects across 12 rarities. Begin with one slot, unlock another every 25 levels, and reach 20 slots at level 475.
- Unified horizontal equipment/accessory hotbar, redesigned crafting and inventory rarity totals.
- New biome creatures, drops and accessory ingredients; natural item models and high-rarity effects.
- Redesigned public profiles, player leaderboards and a gallery that records completed kills and mining by rarity.
- Guild creation through chat, owner invitations, member search and rankings based on the sum of member levels.
- Global, local, guild, squad and whisper chat channels, with individual filters.
- Squad/guild portraits and locations, readable Ubuntu labels, and a rare wearable revival accessory.
- Information cards for accessories, drops and creatures: rarity, real bonuses, materials, sources, health, damage and descriptions. Supports hover, keyboard focus and touch.
- New players receive a wooden sword and pickaxe. Existing stronger equipment stays equipped.
- Five-step desktop/mobile quick tutorial. Skip it or reopen How to play / ? at any time.
- Guest control preferences: open settings without logging in and select mouse, WASD or both. Preferences stay in the browser.

## Balance notes

- Reaching level 300 requires 100 billion cumulative XP from level 1; leveling continues afterward.
- Ore base HP: Super 18 million, Absolut 90 million, Quantium 300 million and Aleph 1.5 billion.
- Super+ creature health depends on species and rarity. Ore gathering, equipment choice and passive builds matter.

## Patch — account recovery, magnets and biome layouts

- Recover from stale, fenced-out session saves while preserving the latest database record. Login acknowledgements now carry the account inventory; Play waits for authentication and keeps errors visible.
- Twelve magnet evolutions with distinct models, names and a collection radius from 500 to 35,000 units. Collect eligible same-map loot through walls; multiple magnets use the largest radius.
- Hostile projectiles hit egg summons with swept collision checks. Defeated summons keep their normal individual respawn cooldown.
- Original summoned mob names appear above their health bars, with colored rarity below.
- Distinct biome room and corridor shapes, keeping rarity territories, native floors and connected passages.

## Session lease hotfix

- Renew account save leases only for connected players, including authenticated menu users.
- Disconnected accounts with a failed save/release no longer keep a lease alive indefinitely. Active sessions remain protected against simultaneous writes.

## Save acknowledgement recovery

- Recognize a previously submitted database write when its network reply was lost, allowing newer progress to save without duplicating inventory.
- Preserve other players records and reject unknown same-record conflicts. Delayed requests cannot apply after a confirmed retry.

## Delayed database reads

- Discard and repeat a catalogue/profile read when a concurrent save overtakes it. A delayed read can no longer replace the reference of a newer confirmed write.
- Preserve changes made during a read and keep independent active player inventories intact. Real unknown-version conflicts still block unsafe writes.

## Rare-region population nerf

- SUPER regions use local budgets of 2 natural mobs and 3 ores; ABSOLUT uses 1 natural mob and 2 ores. Natural replenishment has shared sector cooldowns of 10 and 20 seconds.
- Apply the budgets to surface/cave generation, special deposits and ore guardians. Sleeping entities count toward the budget.
- Keep at most 12 distant boss deposits awake instead of 64, preserving health and contribution while others sleep.

## Combat, loot and talent update

- Natural mobs drop species accessories and components. SUPER+ loot rolls: 60% two tiers lower, 5% one tier lower, 1% same tier, 34% no item; qualifying players still earn kill XP and coins.
- SUPER mob health is doubled. ABSOLUT and higher have 12x health; sword base damage is tripled.
- Free talent refunds in menus and safe refuges, with exact point recovery and no duplicate refunds.
- Expanded Vision I–XI, wheel zoom within earned limits, and a touch-compatible Zoom control in settings.
- Ability and magic vampirism uses actual damage. The Solar sword launches Dawn Sun, a moving sustained area attack with shared visuals.

## Patch de talentos e recuperação — release-155-vamp1

- Vampirismo: 1,5% do dano real por nível, de I a XI (antes 1%). Acessórios de vampirismo também curam 50% mais; limite conjunto dos acessórios: 12%.
- Minérios: contato de 1 a 12 HP/s antes das defesas, conforme raridade; projéteis naturais causam 8 de dano (antes 35). O dano dos mobs é preservado.
- Alcance pode receber pontos diretamente, sem exigir Agilidade I. Regeneração I–XI também é independente: por nível, 35 de vida + 0,1% da vida máxima por segundo. O antigo nome Recuperação migra para Regeneração sem perder níveis.
- Árvore reorganizada em Combate, Sobrevivência e Exploração. Cada talento mostra bônus atual, próximo bônus, requisitos, custos e botão de investir com confirmação do servidor. Pontos/níveis existentes são preservados.
- Forja normal restaurada para combinar 5 itens iguais e tentar a próxima raridade: minérios, drops e acessórios. Não existe criação de acessórios por receitas; os itens iniciais vêm dos drops. Chosen continua na Forjadora do Deserto.

## Patch de XP dos mobs — release-155-xp1

- Mobs de Comum a Ultra: 3× o XP anterior. Super: 6×. Absolut: 8×. Quantium: 10×. Aleph: 12×.
- XP base: Super 12 milhões, Absolut 96 milhões, Quantium 800 milhões, Aleph 6 bilhões, antes dos bônus de talentos, equipamentos e Caverna.
- Mantidos XP da mineração, curva de níveis, dano, vida, drops, limite de participação de 5% e pagamento normal por integrante elegível do squad. Invocações e minions sem recompensa não geram XP.
- A galeria mostra o novo XP base dos mobs. O multiplicador é calculado no servidor e vale também para abates feitos por habilidades e invocações do jogador.

## Patch de checkpoints e mineração — release-155-cp1

- 60 acampamentos: um refúgio por região em cada um dos seis mapas, posicionados perto das passagens e em terreno livre. Cores do atlas continuam ilustrativas; o chão original é preservado.
- Entrar em uma região durante 1,5 segundo ativa automaticamente seu checkpoint. Morrer leva de volta a ele pelo botão Voltar, no mesmo mapa.
- Três mortes em até cinco minutos recuam para o checkpoint anterior. A região da qual houve recuo fica impedida de reativar o checkpoint por cinco minutos, evitando um ciclo imediato de mortes. Sem checkpoint anterior, permanece o refúgio inicial.
- O histórico é individual por mapa, salvo no perfil da conta. Convidados mantêm seu histórico somente durante a sessão temporária. Cliente não pode informar coordenadas de respawn.
- Acampamentos têm um pequeno espaço seguro, indicado por bandeira, barraca, fogueira e marcador no minimapa. Ataques e mineração não podem ser iniciados dentro do refúgio; invocações não farmam enquanto o dono está protegido. Minérios não podem nascer ou ser empurrados sobre o acampamento.
- XP de minérios Comum–Ultra: 2× o valor anterior; Super: 4×; Absolut: 6×; Quantium: 8×; Aleph: 10×. São 8 milhões, 72 milhões, 640 milhões e 5 bilhões de XP base nos quatro últimos, respectivamente. Os bônus de equipamento, talentos e Caverna continuam.
- Mantidos os aumentos de XP dos mobs, a regra de participação de 5%, recompensas normais do squad, níveis, inventários e a curva de 100 bilhões de XP acumulado até o nível 300.

## Ovos: buff de força e corpo inteiro

- Todas as 20 espécies de ovos recebem 2× o dano e 2× a vida anteriores. A vida passa de 70% para 140% da vida do mob equivalente; o tamanho permanece em 70% e a massa em 135%.
- Velocidade de movimento multiplicada por quatro. A recarga entre golpes continua própria de cada espécie.
- O corpo inteiro da invocação atinge criaturas e pedras em contato, uma vez por alvo a cada recarga. Pode atingir várias pedras ao mesmo tempo, sem dano duplicado por parte do corpo.
- O deslocamento rápido verifica o trajeto contra pedras e para no contato. Pedras que bloqueiam o caminho recebem dano; após quebrá-las, a invocação consegue continuar. É permitido sair de uma sobreposição existente.
- Invocações continuam atravessando players, sem dano em aliados, e recebem projéteis pela hitbox do corpo inteiro. XP e loot seguem a participação do dono, sem recompensas para minions inimigos.

## Chat recolhível e drops Aleph — release-155-kin1

- Botão × esconde todo o chat; Chat ou Enter reabre. Escape também recolhe enquanto se digita. Preferência local lembrada, inclusive para convidados; canais, mensagens e rascunho são preservados.
- Mobs Aleph: 60% de itens Absolut, 5% Quantium, 0,03% Aleph, 34,97% sem item. Super, Absolut e Quantium mantêm 60% duas raridades abaixo, 5% uma abaixo, 1% da própria raridade, 34% sem item.
- Um único sorteio de raridade por mob derrotado vale para os itens e integrantes elegíveis; acessórios/ovos continuam vindo da espécie. A participação mínima de 5%, XP, loot de minérios e a forja Chosen continuam. Invocações inimigas não dropam.

### Spawn e participação do squad

- Aleph: 3% por sorteio no Núcleo Quantium de todos os biomas, com 60% Quantium e 37% Absolut. Mantidos limites de população, espaço livre e raridade restrita à região. Spawn e drop são sorteios diferentes: itens Aleph continuam com 0,03% apenas nos mobs Aleph.
- Um integrante precisa causar sozinho pelo menos 5% da vida real do alvo enquanto você está no squad. Só somar 3% de uma pessoa e 2% de outra não libera recompensa. Cada integrante vivo e próximo no mesmo mapa recebe uma recompensa normal, sem pagamento duplicado. Não há crédito retroativo ao entrar depois do dano. A regra vale para mobs e minérios.

## Invocações, gigantismo e visão — release-155-kin1

- Novo ramo de talentos Invocações, com quatro progressões I–XI: Fúria da Ninhada (+15% de dano por nível), Vigor da Ninhada (+20% de vida), Marcha do Enxame (+12% de movimento) e Frenesi do Enxame (+10% de frequência de ataque). Usa os mesmos pontos e o reset existente.
- Cinco novos acessórios: Presa da Ninhada, Ferrão do Enxame, Coração da Ninhada, Asas do Enxame e Tambor de Seda. Fortalecem as invocações dos ovos equipados, sem aumentar atributos de mobs inimigos. Têm todas as raridades, drops por espécie e suporte à fusão/Chosen.
- Duas novas peças de gigantismo: Carapaça Colossal (Besouro) e Couraça do Titã (Tartaruga). Conferem tamanho, vida e defesa, com penalidade de velocidade. Tamanho máximo: 3× o raio normal; penalidade máxima de movimento: 75%. A vida total continua limitada a 400.000.
- O tamanho é real no servidor: altera colisões, massa e hitbox de projéteis; aparece para os outros jogadores. O corpo maior também reposiciona arma, armadura, nomes e barras de vida. Crescer junto de uma parede procura uma posição livre próxima.
- Os bônus de velocidade dos acessórios existentes foram triplicados; os de campo de visão e iluminação foram quadruplicados. Visão ampliada passa a +30% por nível (4,3× de alcance linear no XI sem acessórios). Visão noturna passa a +100 de iluminação por nível. Com a build apropriada, o zoom pode chegar a 0,08 (12,5× o alcance linear da câmera normal); ajuste pelo scroll.
- Bônus de invocação se aplicam também aos aliados já vivos, preservando sua fração de vida. Equipar/retirar buffs não restaura a vida perdida. Contagem de aliados, colisão de corpo inteiro, raridade, recargas após morrer e regras de loot são preservadas.
- Controles, campos de visão e tamanho usam regras comuns no cliente e no servidor. O chat recolhível, drop Aleph de 0,03%, spawn Aleph de 3% no Núcleo Quantium e a participação individual de 5% para o squad fazem parte deste mesmo pacote.

### Buff geral de todos os acessórios

Todos os bônus positivos de acessórios recebem +50% sobre os valores preparados neste patch, antes dos limites globais. A penalidade de movimento do gigantismo não aumenta. Assim, os passivos antigos de velocidade ficam em 4,5× a base anterior e os de iluminação/campo de visão em 6×. O limite de vida do player continua em 400.000.

O reforço também vale para os efeitos especiais: ovos passam a 210% da vida do mob equivalente, 3× o dano original e 6× a velocidade original (antes dos talentos e acessórios de suporte); Orbes ganham +50% de dano mágico, mana máxima e regeneração de mana; cada evolução do Magneto recebe +50% de alcance, com o Cósmico chegando a 52.500 unidades. Invocações continuam com 70% do tamanho natural e massa de 135%. Os bônus de raridade, fusão e forja continuam.

### Núcleo Quantium focado em mobs

Meta restaurada para 8 mobs próximos, como antes da redução de densidade. A reposição de mobs no Núcleo não espera o antigo intervalo de 30 segundos. Os pontos de spawn ficam mais espalhados para comportar criaturas grandes, mantendo colisões, paredes e os refúgios livres. A população é compartilhada entre jogadores e conta também criaturas adormecidas.

Minérios ficam ocasionais: cada tentativa de geração local tem 12% de chance de procurar depósitos, com limite de 2 e intervalo de reposição de 30 segundos por setor. A regra também vale na Caverna, sem apagar pedras já existentes ou danificadas. A composição da região continua 60% Quantium, 37% Absolut e 3% Aleph por sorteio.

### Confirmação de save concorrente

Corrigida uma corrida em que uma chamada aguardando save podia confirmar a gravação anterior enquanto a gravação mais recente ainda esperava resposta do banco. Agora aguarda também o commit seguinte que já estiver em andamento, preservando as proteções contra conflitos e sessões antigas. Um teste com respostas HTTP deliberadamente pausadas reproduziu o erro antes da correção.

Validação final: 182 testes distintos aprovados entre a checagem geral e a regressão da correção de save (25 testes de armazenamento, sessão e recuperação). A prévia local confirmou o chat recolhido, a coxinha grande com aliado, o ramo de invocações e uma compra de talento reconhecida pelo servidor. Nenhuma publicação automática.
