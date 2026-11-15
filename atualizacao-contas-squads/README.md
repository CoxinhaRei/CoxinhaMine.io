# CoxinhaMine.io

Jogo de jardim e mineração com mundo compartilhado, coxinhas, equipamentos, talentos, contas e squads.

Para rodar localmente (Node 24):

```sh
npm install
npm start
```

Abra http://localhost:3000. Para testar: `npm test`.

Leia [DEPLOY.md](DEPLOY.md) para atualizar o GitHub/Render, configurar persistência e entender contas, squads e recompensas. O servidor de produção usa uma única instância; cada jogador vê o mesmo mundo.

Não publique `db.json`, backups de jogadores, `.env` ou tokens privados. O cadastro por nick/senha precisa de armazenamento persistente para sobreviver a deploys no Render.
