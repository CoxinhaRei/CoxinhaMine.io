# Correção de teclado e mensagem de login — 1.5.5

Correção do cliente preparada sobre o patch `release-155-session2`. O backend continua com esse identificador em `/health`; o cache do cliente usa `1.5.5-keys1`.

Eventos do navegador sem uma tecla válida agora são ignorados nos controles, habilidades, magia, chat e bloqueio de atalhos. Isso evita os erros `Cannot read properties of undefined (reading 'toLowerCase')` nesses arquivos do jogo. Teclas reais e controles de segurar/soltar continuam funcionando.

Se o login falhar por salvamento, a mensagem mostra um código seguro da própria tentativa, como `SAVE_CONFLICT`. Esse código permanece disponível mesmo que o banco já tenha se recuperado quando `/health` for consultado depois. A correção não altera o banco, as contas ou as regras de autenticação.

O erro de GPU/shader e o arquivo `fcf2a.js` reportados no console não foram identificados como parte do código deste projeto; este pacote corrige os arquivos do jogo citados nos logs.

O login já voltou a funcionar e `/health` informou `saveError:false` antes de preparar este pacote. Esta correção adicional é opcional para esse acesso; não é necessário resetar a conta ou o banco.

Para instalar, envie o conteúdo extraído para a raiz do mesmo repositório, preservando as pastas `public` e `tests`. Depois do deploy, recarregue com Ctrl+F5. Este é um complemento ao patch `release-155-session2`, não o projeto completo.
