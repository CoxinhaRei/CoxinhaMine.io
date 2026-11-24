# 1.5.5 — Oficina do Dossel, armas e ascensão

Build: `release-155-jungle1`. Patch cumulativo preparado localmente, sem publicação automática.

- **Mestra das Raízes:** nova coxinha artesã na Jungle, em **116.500, 43.500**, antes da passagem para Absolut. O minimapa mostra **O** e o atlas mostra **Oficina do Dossel**. A oficina fica em um trecho aberto ligado às trilhas do mapa e possui uma pequena área segura.
- Aproxime-se e pressione **E**, ou toque em **Conversar**, para abrir a oficina. Os upgrades de picaretas e armaduras e a evolução de raridade das armas à distância agora exigem conversar perto dela. O servidor confere mapa, distância, estado do jogador e paredes antes de consumir qualquer material. Consultar receitas e obter as armas vendidas continua disponível pelo menu.
- **12 armas redesenhadas:** madeira entalhada e empunhaduras, metal com detalhes, arco de espinhos com folhas, cajado glacial com cristais, grimório com páginas e fogo, Stinger com asas e ferrões, chakram facetado, besta do vazio, Starfall com constelações e Event Horizon com anel de acreção. Os modelos aparecem na oficina, inventário, hotbar e no personagem. Materiais mantêm suas cores; a raridade continua indicada no cartão.
- **Ascensão na HUD:** o contador aparece ao lado do nível, abaixo da vida, em algarismos romanos: `Asc. I`, `Asc. IV`, `Asc. IX`, `Asc. XIV` etc. Quem ainda não ascendeu vê `Asc. —`. O painel de ascensão também usa o contador romano. Nível, requisito de ascensão e cálculos de progressão continuam numéricos.

Os efeitos e danos das armas, controles Z/X, custos, upgrades até +20 e regras de save do patch anterior são preservados. Os upgrades continuam salvos na conta e são apagados junto dos equipamentos ao ascender.

## Instalação

Substitua os arquivos do projeto pelos deste pacote, preservando a estrutura. O conteúdo de `public` entra no `public` existente; **não crie `public/public`**. Envie também os arquivos de servidor da raiz. Depois do deploy, atualize a página e confira `release-155-jungle1` em `/health`.
