# Publicar CoxinhaMine.io 1.5.5

## Enviar os arquivos

1. Extraia o ZIP no computador. Envie o conteúdo extraído para a raiz do repositório conectado ao Render: package.json, package-lock.json, server.js e os demais arquivos da raiz, junto das pastas public, scripts e tests.
2. Mantenha public como pasta: index.html, arquivos JS/CSS, sprites e fonts continuam dentro dela. Os arquivos do servidor ficam fora de public. Não envie o ZIP como um único arquivo ao repositório e não coloque o projeto inteiro dentro de public.
3. Confirme a substituição dos arquivos de mesmo caminho. Os arquivos de outros caminhos já existentes no GitHub não são apagados por esse envio. Os arquivos novos desta atualização também precisam ser enviados.
4. Faça o commit e aguarde o deploy automático no Render, ou use o deploy manual do último commit.

## Configuração do serviço

- Root Directory: raiz do repositório, se package.json estiver nela.
- Build Command: npm install
- Start Command: npm start
- Node 24.x; mantenha a configuração existente que já funciona.
- Preserve UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN e SAVE_KEY. Se SAVE_KEY não estava definida, o padrão continua coxinha:database:v2. Trocar a chave seleciona outra base de saves.
- Não envie .env, db.json, data, dev-data ou node_modules. Este pacote não contém esses dados. .env.example contém somente campos vazios de exemplo.
- Se houver dois serviços regionais, atualize os dois. Preserve os endereços e a região física configurados. Leia REGIONS.md para os detalhes de configuração.

## Conferir depois do deploy

Abra /health no endereço do jogo. A resposta deve conter version: 1.5.5, build: release-155-session2, protocol: 6, guests: true e accountRequired: false. Se o banco Redis estiver configurado, confira também sharedSaves: true, durable: true e saveError: false.

Recarregue com Ctrl+F5. O aviso de desenvolvimento local foi retirado. Confira o changelog 1.5.5, o botão Como jogar, a espada inicial, as configurações do convidado e o login de uma conta existente. Teste dois convidados em abas diferentes para conferir o mundo compartilhado.

As contas existentes continuam no banco configurado; este ZIP não reseta contas nem guildas. Convidados têm progresso temporário e precisam criar uma conta para guardá-lo.

## Testar antes no computador

Execute npm install e depois npm run dev. A prévia abre em http://127.0.0.1:3000, usa dados isolados em dev-data e não acessa o Redis de produção. A hospedagem deve usar npm start.
