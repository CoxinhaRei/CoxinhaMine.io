# CoxinhaMine.io 1.5.5 — Correção das áreas

Build: release-155-maps2. Este pacote substitui o patch anterior dos mapas.

## Correção solicitada

- O mapa inteiro é dividido em nove regiões: Comum, Incomum, Raro, Épico, Lendário, Mítico, Ultra, Super e Absolut.
- Uma região termina onde outra começa. Não há corredores vazios entre ilhas de raridade e Absolut não é o fundo padrão das áreas restantes.
- Cada raridade tem uma única região contínua em cada mapa. A Absolut continua sendo a maior região individual, mas ocupa aproximadamente 16% a 21% do mapa, em vez de se espalhar por quase todo ele.
- **As cores são apenas uma representação das áreas no minimapa e no atlas. Elas não pintam o chão do jogo.** O Jardim mantém a grama verde original; Praia, Jungle, Floresta de Gelo e Deserto mantêm seus terrenos próprios; a Caverna mantém o piso cinza e a escuridão.
- Os spawns continuam seguindo a região em que nascem. A ilustração das cores é separada da aparência do cenário, sem desligar as regras de raridade.
- Cada mapa possui uma distribuição própria das regiões. Elas cobrem toda a área geográfica; paredes do labirinto, bordas e pequenas pedras continuam sendo obstáculos físicos.

## Spawns

Comum: 100% Comum. Incomum a Ultra: 84% da raridade da região e 16% da anterior. Super: 84% Super e 16% Ultra. Absolut: 79% Absolut, 20% Super e 1% Quantium.

São pesos do sorteio das tentativas de spawn, sujeitos a espaço livre e limites de população. Super/Absolut não são usados como fallback nas regiões inferiores. Os refúgios continuam sem spawn. A região é conferida no servidor, pela posição real da entidade.

## O que foi mantido

Os mapas de superfície continuam com 150.000 × 150.000 unidades e a Caverna com 300.000 × 150.000. Praça central, refúgios, portais distantes, espécies próprias dos biomas, atlas ampliável, guarda de encontros distantes e contas continuam disponíveis. O centro dos mapas de superfície é 75.000, 75.000.

## Instalar

1. Extraia patch-1.5.5-mapas-corrigido.zip.
2. Envie todo o conteúdo para a raiz do repositório, junto de package.json, preservando public, tests e scripts. Substitua os arquivos com o mesmo caminho e mantenha os demais.
3. Faça deploy do commit no Render. Preserve Upstash, SAVE_KEY e as variáveis da conta DEV.
4. Recarregue com Ctrl+F5 para obter o cliente novo. O /health deve mostrar build: release-155-maps2.

O ZIP é cumulativo sobre a 1.5.5: inclui os arquivos dos patches anteriores necessários, então não é preciso instalar o ZIP incorreto dos mapas antes. Documentos antigos descrevem versões anteriores; estas instruções e o build acima identificam a correção atual.

Nenhuma conta, nível, inventário ou guilda é resetada por este patch. O mundo temporário é recriado no deploy, como nos reinícios anteriores. A falha de save do Redis continua sendo uma investigação separada; saveError e saveErrorCode permanecem no diagnóstico. Nenhuma credencial ou banco de produção acompanha este pacote.

Verificação: 74 testes automatizados passaram, incluindo cobertura integral das áreas, uma única região por raridade em todos os mapas, spawns por posição, fundo original e mapas iguais no cliente/servidor. A revisão visual confirmou a grama original dentro da região Absolut e as cores restritas ao atlas e minimapa.
