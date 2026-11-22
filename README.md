# CoxinhaMine.io 1.5.5

Patch atual: `release-155-titan1`. Leia [PATCH-DROPS-COMBATE.md](PATCH-DROPS-COMBATE.md) para drops, balanceamento, talentos e Solar. Leia [PATCH-DENSIDADE.md](PATCH-DENSIDADE.md) para a redução de entidades nas regiões raras. Leia [PATCH-LEITURA-SAVE.md](PATCH-LEITURA-SAVE.md) para o conflito de leitura e gravação com jogadores ativos. Leia [PATCH-CONFIRMACAO-SAVE.md](PATCH-CONFIRMACAO-SAVE.md) para a recuperação de gravações sem resposta. Veja [PATCH-SESSOES.md](PATCH-SESSOES.md) para o bloqueio de conta reservada. Leia [PATCH-RECUPERACAO-MAGNETOS.md](PATCH-RECUPERACAO-MAGNETOS.md) para as correções de login e as novidades.

Pacote completo da atualização. Leia [DEPLOY.md](DEPLOY.md) para enviar ao GitHub/Render e [CHANGELOG-1.5.5.md](CHANGELOG-1.5.5.md) para as novidades.

- Instalar dependências: npm install
- Servidor de produção: npm start
- Prévia isolada no computador: npm run dev
- Testes: npm test
- Node: 24.x

O pacote não inclui contas, saves locais, credenciais ou node_modules. Preserve o banco e as variáveis existentes da hospedagem.

## Patch de combate — release-155-titan1

Vida base de 1.000, máximo de 400.000 com talentos/acessórios; Super+ causam ao menos 20.000 de dano de contato, por espécie e raridade, sem invulnerabilidade global após impactos. Quantium usa a vida canônica corrigida e ganha 12× a tabela anterior; Aleph mantém a progressão superior.

Reset de talentos funciona também durante a exploração, com confirmação e reembolso exato. Craft normal removido; Loja e forja Chosen preservadas. Catálogo ampliado para 50 acessórios, incluindo 20 ovos e itens de esquiva. Solar R cria um sistema solar de mineração; Void Q lança um tridente veloz e Void R cria uma zona escura que minera e puxa parte das pedras.

Núcleo Quantium dentro de Absolut em cada mapa: 60% Quantium, 39,1% Absolut, 0,9% Aleph, com população limitada. Quantium não anuncia spawn no chat. Consulte PATCH-TITAN-COMBATE.md para valores e instalação.
