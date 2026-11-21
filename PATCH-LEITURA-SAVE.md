# CoxinhaMine.io 1.5.5 — leitura atrasada do save

Build: `release-155-read4`. Complemento para a versão `release-155-commit3`, confirmada no site pelo `/health`. Preparado localmente, ainda não publicado.

## Erro reproduzido

Com dois perfis ativos, uma atualização do catálogo podia ler a versão A do Redis e ficar esperando a resposta. Enquanto isso, um save normal gravava e confirmava a versão B. Quando a leitura de A finalmente chegava, ela substituía a referência de B na memória do servidor. Um save posterior, versão C, então falhava com `SAVE_CONFLICT` em `profiles`.

Isso podia bloquear o login de outra pessoa: o servidor precisava confirmar os saves pendentes dos jogadores ativos antes de aceitar a nova entrada. O build anterior tratava respostas de gravação perdidas, mas não impedia essa leitura atrasada de substituir uma gravação confirmada.

A sequência foi reproduzida localmente com HTTP real, atraso controlado na resposta do Redis, dois perfis e login por Socket.IO. Não houve acesso ao banco de produção.

## Correção

O servidor acompanha alterações na sua referência de armazenamento. Se um save começar ou terminar durante uma leitura do catálogo, a resposta antiga é descartada e a leitura é repetida. O mesmo cuidado é aplicado ao carregar um perfil depois de adquirir sua sessão, inclusive se o backup local precisar ser escrito antes.

O jogo continua recebendo movimentos e ataques durante as consultas. Alterações feitas pelos jogadores enquanto uma leitura está em andamento são preservadas. Saves realmente conflitantes continuam bloqueados; o código não escolhe entre duas versões desconhecidas nem força a posse de outra sessão.

Depois de oito tentativas sobrepostas, o servidor informa que está ocupado em vez de instalar uma leitura antiga. O diagnóstico mantém `saveErrorCode` e `saveConflictScope`.

## Publicar

1. Extraia o ZIP em uma pasta vazia.
2. Envie o conteúdo à raiz do repositório atual, preservando as pastas. Em especial, `regional-storage.js` e `server.js` precisam substituir os arquivos da raiz do projeto.
3. Aguarde o deploy e abra `/health`. O campo `build` deve ser `release-155-read4`.
4. Feche abas antigas; depois de o processo anterior encerrar, aguarde até 60 segundos por alguma reserva antiga. Reabra com Ctrl+F5 e entre normalmente.

Este pacote contém somente os arquivos alterados em relação ao `commit3`. Os demais arquivos permanecem no repositório. Não requer novas variáveis, alteração de Redis ou reset de contas. Preserve o banco existente. A correção mantém o último save confirmado; ela não recupera progresso que nunca chegou a ser confirmado.

Se continuar no build correto, copie a mensagem do login e os campos `saveErrorCode` e `saveConflictScope` imediatamente após a tentativa. Esses campos não contêm senhas nem tokens.
