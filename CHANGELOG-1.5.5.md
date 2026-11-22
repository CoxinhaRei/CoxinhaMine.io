# Patch 1.5.5 — Titan combat

- Talent reset now works during exploration with an acknowledged, exact point refund. Repeated requests do not duplicate points.
- 1,000 starting HP, up to 400,000 through vitality and stronger health accessories.
- Stronger creatures: Super+ contact damage starts at 20,000 before mitigation and scales with species and rarity. No global post-hit invulnerability; dodge items roll independently per hit.
- Corrected Quantium ore HP to the shared catalog and increased it to 3.6 billion; Quantium creatures gain 12× health. Higher tiers retain their health progression.
- 50 accessories, including 20 automatic summon eggs. Normal crafting is removed; species drops, equipment purchases and the Chosen forge remain.
- Solar pickaxe: expanding fire solar system. Void sword: giant high-speed trident. Void pickaxe: dark mining area with selective ore attraction.
- Small Quantium inset within Absolut in each biome: 60% Quantium, 39.1% Absolut, 0.9% Aleph. Native floors remain unchanged; Quantium spawns are silent.
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
