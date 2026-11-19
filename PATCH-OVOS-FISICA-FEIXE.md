# CoxinhaMine.io 1.5.5 — ovos, física e feixe contínuo

Build: `release-155-eggs1`. Este pacote ainda não foi publicado e inclui as correções anteriores de mapas, magia e invocações.

## Ovos mais fortes

O dano das invocações agora acompanha a vida da espécie e sua raridade, incluindo o salto de vida dos bosses Super+. Cada ovo distribui seu dano de grupo entre a quantidade de aliados que invoca. Cada espécie possui seu próprio intervalo de ataque.

Exemplo do **Ovo de Besouro**, com um único besouro:

| Raridade | Dano anterior por golpe | Novo dano por golpe | Intervalo |
|---|---:|---:|---:|
| Comum | 12 | 144 | 1 s |
| SUPER | 347,86 | 1.234.200 | 1 s |
| ABSOLUT | 531,28 | 5.691.600 | 1 s |

Os valores são calculados pelas definições atuais do jogo. Os outros ovos usam as estatísticas das suas próprias espécies. Os tooltips mostram dano por golpe, intervalo, dano por segundo do grupo, massa e recarga.

- Invocações mantêm **70% da vida e do tamanho** do mob normal da mesma raridade.
- A massa de cada invocação passa a ser **135% da massa do mob original**, em vez de diminuir junto com o desenho.
- Aliados empurram inimigos e minérios, mas continuam atravessando todos os jogadores.
- Os ovos continuam invocando automaticamente, com recarga individual após cada morte e limite de 24 aliados ativos por jogador.

## Mineração por contato

As invocações também causam dano aos minérios quando encostam neles. O dano usa o mesmo intervalo de ataque do aliado: bater em um mob e tocar várias pedras não multiplica seu orçamento de dano.

Elas continuam perseguindo mobs; as pedras recebem dano por contato durante esse movimento ou ao acompanhar o dono. Pedras distantes e pedras atrás de paredes não são mineradas.

O dano e a participação pertencem ao dono do ovo. A regra de 5% para loot, os squads, a XP de mineração, a galeria e os drops no chão continuam usando as regras normais do servidor. Retirar o ovo interrompe as invocações e a mineração.

## Minérios empurráveis

- Players, criaturas e invocações podem deslocar os minérios por contato.
- Pedras maiores possuem mais massa e resistem mais ao empurrão.
- Paredes, outras pedras, a praça segura e as entradas dos portais limitam o deslocamento.
- A posição real da pedra muda no servidor e é enviada aos demais jogadores, mantendo a mesma vida, identidade, participação e loot.
- O índice de colisão e o cache de rede acompanham o deslocamento para evitar colisões e posições antigas.

## Segurar o feixe

Com **Raio do Dossel** selecionado e Orbe equipada:

- **PC:** segure **G** para manter o feixe. Solte para parar.
- **Celular:** mantenha pressionado o botão de magia. Soltar ou cancelar o toque interrompe o feixe.
- O feixe acompanha a mira e causa dano contínuo, escalado pela raridade da Orbe e pelo talento.
- Consome **38 mana por segundo**, sem regeneração de mana enquanto está sendo mantido.
- Para automaticamente quando a mana acaba, o player morre, entra no menu, retira a Orbe, troca de magia ou perde a conexão.
- Depois de interromper o feixe, há **4 segundos de recarga**. A mana volta a regenerar normalmente.

Os avisos visuais de dano do feixe e das invocações viajam junto com o estado do mundo, para que ataques contínuos não impeçam o recebimento das atualizações no multiplayer.

## Instalação

Extraia o ZIP e envie o conteúdo para a **raiz do repositório existente** no GitHub. Preserve as pastas `public`, `tests` e `scripts`; não coloque o ZIP inteiro dentro de `public`.

Após o deploy do Render, pressione **Ctrl+F5**. Em `/health`, o campo `build` deve mostrar `release-155-eggs1`.

Não são necessárias novas variáveis de ambiente. Contas e progresso continuam usando o banco já configurado. Os arquivos de versões entregues anteriormente foram preservados.
