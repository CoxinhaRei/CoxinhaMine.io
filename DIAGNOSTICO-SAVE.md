# Diagnóstico do save — CoxinhaMine.io 1.5.5

O diagnóstico publicado confirmou que a correção da senha chegou ao site e a conta DEV está habilitada, mas a gravação está sinalizando falha (`saveError: true`). Esse sinal sozinho não identifica o motivo nem confirma perda de progresso.

Este pacote **acrescenta um diagnóstico; não promete corrigir uma causa ainda desconhecida**. Os testes locais de entrada, save, retorno ao menu, saída e nova entrada da DevTeste com Redis simulado passaram sem reproduzir a falha do site.

## Instalar sobre a correção da conta DEV

Extraia o ZIP e envie seus arquivos para a mesma raiz do repositório, preservando a pasta `tests`. Substitua os arquivos com o mesmo caminho, mantendo os demais. `save-diagnostics.js`, `regional-storage.js`, `storage.js` e `server.js` ficam ao lado de `package.json`. O pacote depende do patch da conta DEV e da correção de senha já instalados. Não altere a senha, as variáveis do Upstash, `SAVE_KEY` ou o conteúdo do banco para instalar este diagnóstico.

Faça deploy do commit e abra `https://coxinhamine-io.onrender.com/health`. O build deve ser `release-155-savecheck1`. Tente novamente a ação que apresentou o aviso e consulte o diagnóstico enquanto a falha estiver ocorrendo. Se um save estiver pendente na sessão atual, não force um reinício apenas para tentar apagar o aviso: um deploy reinicia o processo e pode descartar alterações ainda não confirmadas.

Envie apenas o valor de **`saveErrorCode`** e informe se o aviso ocorreu ao entrar, jogar, voltar ao menu ou sair. Nenhuma senha ou token precisa ser compartilhado. Os códigos são de uma lista fixa; mensagens do Upstash e credenciais não são publicadas.

| Código | Indicação |
| --- | --- |
| REDIS_AUTH_FAILED | O Redis recusou a autenticação. |
| REDIS_WRITE_DENIED | O Redis negou a operação/permissão de escrita. |
| REDIS_RATE_LIMITED | Limite de frequência de solicitações. |
| REDIS_QUOTA_EXCEEDED | O Redis informou limite de cota/recursos. |
| SAVE_TOO_LARGE | Limite de tamanho da requisição ou valor. |
| REDIS_UNAVAILABLE | Resposta de indisponibilidade do serviço Redis. |
| REDIS_RESPONSE_INVALID | O serviço respondeu sem o JSON esperado. |
| NETWORK_TIMEOUT / NETWORK_ERROR | Falha ou demora na comunicação com o banco. |
| SAVE_CONFLICT | Conflito entre a alteração local e o registro remoto. |
| SESSION_LOST | O servidor não possui mais a reserva necessária para gravar esse perfil. |
| SAVE_BUSY | As tentativas de gravação concorrente não conseguiram concluir. |
| LOCAL_WRITE_FAILED | Falha na cópia local do save. O resultado remoto precisa ser conferido antes de concluir que o Redis falhou. |
| SAVE_FAILED | Falha ainda sem classificação específica. |
| null | Nenhuma falha de gravação registrada nesse momento. Não representa uma verificação independente de todos os saves. |

O save continua pendente em caso de falha e o servidor continua tentando gravar. O diagnóstico volta a `saveError: false` quando a rotina consegue concluir. As proteções de concorrência, de sessões e das contas continuam ativas. Não apague o banco para eliminar um aviso.

Verificado com 17 testes automatizados de conta DEV, transferência regional, classificação segura de erros e falhas HTTP simuladas do Redis com recuperação do save. Nenhuma credencial ou base de produção foi usada nos testes.
