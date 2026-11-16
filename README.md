# CoxinhaMine.io 1.5.3

Jogo de jardim e mineração com mundo compartilhado, coxinhas, equipamentos, talentos, contas e squads.

Inclui joystick e combate touch, conta obrigatória, drops no chão, colisões no servidor, barras de vida suaves e bosses Super+ com rajadas e invocações. O nível 300 exige 100 bilhões de XP acumulados e não é o nível máximo.

O patch 1.5.3 adiciona BR/US no menu, ping medido, transferência da mesma conta entre servidores e movimento com replay e correções visuais suaves. Leia [REGIONS.md](REGIONS.md) para configurar os endereços e publicar em uma região próxima. Servidores não configurados ficam indisponíveis; o código não altera a localização física da hospedagem.

Para rodar localmente (Node 24):

```sh
npm install
npm start
```

Abra http://localhost:3000. Para testar: `npm test`.

Leia [DEPLOY.md](DEPLOY.md) para atualizar o GitHub/Render, configurar persistência e entender contas, squads e recompensas. Use uma instância por região. Cada região tem seu próprio mundo; contas e guildas compartilham o Redis configurado.

Não publique `db.json`, backups de jogadores, `.env` ou tokens privados. Novos cadastros no Render exigem Redis ou um disco persistente configurado. Limpar os dados do navegador encerra a sessão; a conta permanece no banco e pode ser acessada com nick e senha.
