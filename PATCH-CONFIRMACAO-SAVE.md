# CoxinhaMine.io 1.5.5 — confirmação de save e SAVE_CONFLICT

Build: `release-155-commit3`. Patch cumulativo preparado localmente. Ainda não publicado no GitHub/Render.

## Caso reproduzido

Um teste com Redis simulado e HTTP real reproduziu esta sequência:

1. O servidor envia o progresso ao Redis.
2. O Redis grava, mas a conexão HTTP termina antes de devolver a confirmação.
3. O jogador continua, alterando moedas e inventário.
4. O servidor tenta salvar esse progresso novo usando a versão anterior como referência.

Antes, isso provocava `SAVE_CONFLICT` mesmo com a sessão pertencendo ao próprio servidor: a gravação anterior dele já estava no banco, mas ele não sabia que ela tinha sido concluída. A recuperação anterior tratava sessões antigas sem posse; este caso é diferente.

Esse caso foi confirmado localmente. Sem acesso ao banco e aos logs de produção, não é possível afirmar que ele seja a única causa do aviso no site publicado.

## Correção

- O servidor mantém um histórico limitado de gravações cuja resposta não chegou.
- Antes de salvar novamente, compara os registros do Redis com os valores exatos enviados nessas tentativas.
- Só atualiza sua referência quando o registro remoto corresponde a uma gravação conhecida. Depois salva o progresso mais recente sem somar os itens novamente.
- As comparações são por registro: uma alteração independente de outro jogador é preservada.
- Cada gravação recebe um identificador interno novo. Isso impede que uma requisição antiga atrasada seja aplicada depois de uma nova gravação confirmada, inclusive quando o estado do jogador voltou ao valor anterior.
- Perder a posse da sessão continua impedindo qualquer gravação do perfil. Uma versão desconhecida do mesmo registro continua bloqueada.
- Em `/health`, `saveConflictScope` informa somente a categoria do conflito: por exemplo, `profiles`, `accounts` ou `guilds`. Nunca inclui nick, identificador da conta, senha ou token.

## Verificação

Os testes cobrem resposta perdida após gravar, falha antes de gravar, várias respostas perdidas consecutivas, progresso de outro servidor, requisição atrasada após uma reversão local, bloqueio de versões desconhecidas e login real por Socket.IO carregando o inventário mais recente.

O pacote também inclui os patches anteriores de reserva de sessão, teclado e mensagens de erro. O histórico público de mudanças foi atualizado.

## Instalação

1. Extraia o ZIP em uma pasta vazia e envie todo o conteúdo à raiz do repositório conectado ao Render. Preserve as pastas; os arquivos do servidor ficam na raiz e os arquivos do cliente em `public`.
2. Aguarde o deploy terminar e confira `/health`: `build` deve ser `release-155-commit3`.
3. Feche abas antigas e, após o processo anterior do servidor encerrar, aguarde até 60 segundos pela expiração de uma reserva antiga. Reabra com Ctrl+F5 e entre na conta existente.
4. Se houver mais de um serviço regional usando o mesmo banco, publique a atualização em todos.

Mantenha o mesmo Redis e as mesmas variáveis. Não é necessário apagar o banco, os saves ou a conta. O pacote não contém dados privados de produção.

Se o aviso persistir no build correto, copie `saveErrorCode` e `saveConflictScope` de `/health` logo após a tentativa, junto da mensagem exibida no login. O aviso de uma tentativa passada pode continuar no formulário mesmo após o banco se recuperar.
