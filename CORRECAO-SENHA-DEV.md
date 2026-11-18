# Correção da senha DevTeste — 1.5.5

Este pacote corrige o aviso de que a senha configurada não corresponde à conta de testes existente. Depende do patch da conta DEV já instalado. Não é uma versão completa do jogo e não contém senha real.

1. Extraia o ZIP e envie os arquivos para a raiz do mesmo repositório do jogo. `developer-account.js` e `server.js` ficam junto de `package.json`; preserve a pasta `tests`. Substitua somente os arquivos de mesmo caminho. Não apague o banco, as contas ou os demais arquivos.
2. No Render → Environment, mantenha `DEV_ACCOUNT_ENABLED=true` e `DEV_ACCOUNT_NICK=DevTeste`. Defina uma **nova senha privada de 16 a 128 caracteres** em `DEV_ACCOUNT_PASSWORD`. Preserve as variáveis de Upstash e `SAVE_KEY`.
3. Salve e faça deploy do commit que contém esta correção. A senha é atualizada durante a inicialização do servidor.
4. Abra `https://coxinhamine-io.onrender.com/health`. Confira `build: release-155-devaccount2` e `developerAccountReady: true`.
5. No jogo, escolha **Entrar**, use o nick **DevTeste** e a nova senha configurada no Render. Não use Criar conta. As sessões antigas da conta DEV deixam de funcionar; entre novamente.

A atualização preserva o ID e o progresso da conta de testes. Somente uma conta que já possui a marca DEV do servidor pode receber essa troca de senha; uma conta normal com o mesmo nome continua protegida e não será alterada. A senha fica armazenada como hash scrypt e não aparece na resposta de `/health`.

Se houver mais de um serviço regional, configure a mesma senha em todos. Uma região com outra configuração pode voltar a trocá-la quando reiniciar. Se os logs indicarem que a conta está conectada em outro servidor, saia da DevTeste nessa região; após uma queda, aguarde até 60 segundos e faça um novo deploy no serviço que apresentou o aviso.

Verificado com 16 testes automatizados de contas, isolamento DEV, persistência Redis simulada e transferência regional. Inclui troca de senha, recusa da senha antiga, invalidação das sessões antigas, preservação das contas normais e reinício sem nova alteração. Nenhum banco ou serviço de produção foi acessado nesta verificação.
