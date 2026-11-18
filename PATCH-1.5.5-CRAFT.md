# CoxinhaMine.io 1.5.5 — Patch de Craft, Tornados e Mobs

18/11/2026 · build `release-155-patch1`

## Aplicar

Este ZIP é um patch para a atualização completa 1.5.5 entregue anteriormente. Extraia e envie todos os arquivos do patch para a raiz do mesmo repositório no GitHub, preservando as pastas `public` e `tests`. Substitua arquivos de mesmo caminho; mantenha os outros arquivos que já estão no projeto. Os arquivos de servidor da raiz e os arquivos de `public` devem ser atualizados juntos.

Não envie apenas o ZIP ao GitHub. Não coloque `server.js`, `shared-world.js` ou `game-runtime.js` dentro de `public`. Nenhuma dependência nova é necessária; mantenha o build/start que já funciona. As variáveis de Upstash e a chave do banco permanecem iguais. Este pacote não contém saves, senhas, contas reais, `.env` ou `node_modules`.

Depois do deploy, `/health` deve mostrar `version: 1.5.5` e `build: release-155-patch1`. Atualize a página com Ctrl+F5 para carregar os novos scripts. Atualize todos os serviços regionais em uso.

## Craft

- Uma linha por item, com as raridades sempre nas mesmas colunas. Vale para minérios, drops e acessórios. Modelos mantêm as cores naturais e as caixas mostram a raridade e a quantidade.
- Selecione a célula desejada ou troque a raridade da seleção no seletor. Na aba Criar acessório, a célula Comum usa a receita base; as outras raridades mostram as cópias existentes para fusão. ALEPH → Chosen continua exclusivo da Coxinha Forjadora no Deserto.
- As cinco cartas da animação agora têm bordas, giram mais rápido e se unem no sucesso. Receitas de 100% terminam em cerca de 0,7 s; chances muito baixas levam cerca de 7,9 s por animação simples. Lotes maiores ampliam um pouco a animação. As chances de sucesso não foram aumentadas.
- Clique ou segure ×2 para selecionar 1, 2, 4, 8, 16… tentativas. ÷2 reduz, Máx. seleciona o limite e o campo aceita uma quantidade exata. Com 1.000 itens livres, são até 200 tentativas. Cada lote aceita até 10.000 tentativas.
- Cada tentativa é calculada separadamente no servidor. Sucesso consome 5 cópias; falha continua consumindo 1–4. O limite reserva o custo máximo, então nenhum lote usa cópias equipadas nem depende de falhas para conseguir pagar a tentativa seguinte.
- Criar acessórios em lote paga a receita completa por unidade: 8 minérios Comum e 3 drops da espécie. Drops Chosen não são usados nas receitas base. As estatísticas registram os resultados reais do lote.
- Há bloqueio contra lotes simultâneos e quantidade inválida. O servidor define chance, resultados e duração; as informações enviadas pelo navegador não substituem essas regras. Crafts antigos salvos sem duração explícita continuam com 2,4 s.

## Tornados e spawns

- Tornados de Areia e de Gelo não têm olhos, inclusive nas prévias e galeria. A sucção ficou em 30% da força anterior, ou seja, 70% menor. Dano e lentidão do gelo não foram alterados.
- Nos biomas ao ar livre, a mais de 14.000 unidades do refúgio, a rolagem de novos mobs SUPER passou de 3,5% para 20% (aproximadamente 5,7×), e ABSOLUT de 0,48% para 1,98% (aproximadamente 4,1×).
- Essas taxas são por rolagem de novo mob; posicionamento e limites de população continuam valendo. A praça inicial permanece protegida. Quantium, Aleph, raridades exclusivas e chances de minérios não foram alteradas.

## Verificação

- 56 testes passaram na execução completa em série. Depois foram adicionadas/verificadas mais duas regressões, incluídas em nove testes direcionados de craft: 58 testes diferentes verificados ao todo.
- Cobertura: consumo exato, resultados independentes, receitas em lote, equipados protegidos, quantidades inválidas, envio repetido, duração persistente, servidor Socket.IO, grade por raridade, clique/segurar/cancelar, edição manual, taxas de mobs e modelos sem olhos.
- Conferência real no navegador: clique 1 → 2 → 4 → 8, botão segurado até 128, lote de oito tentativas Quantium, criação de dois acessórios Comum, resultados e estoques, seleção de raridade e grade em 390 pixels. Nenhum erro no console; a rolagem horizontal da grade fica dentro do painel.
- QA usou somente dados fictícios em memória. O banco do jogo e o ZIP completo anterior foram preservados. Este patch ainda precisa ser enviado por você ao GitHub para chegar ao site.
