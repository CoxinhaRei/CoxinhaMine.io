# CoxinhaMine.io 1.5.4

Jogo de jardim e mineração com mundo compartilhado, coxinhas, equipamentos, talentos, contas e squads.

Inclui joystick e combate touch, contas com senha, drops no chão, colisões no servidor, barras de vida suaves e bosses Super+ com rajadas e invocações. O nível 300 exige 100 bilhões de XP acumulados e não é o nível máximo.

O patch de convidados mantém a versão 1.5.4. Sem login, **Jogar** cria um personagem temporário e novo. Criar uma conta durante a sessão vincula seu nível, itens, moedas e talentos; entrar em uma conta existente carrega o save dela, sem juntar personagens. Voltar ao menu mantém o convidado. Fechar/recarregar a página, trocar de servidor ou reiniciar o servidor perde esse progresso. Convidados não são gravados no banco nem no armazenamento do navegador; uma queda breve de conexão pode retomar a sessão por até 60 segundos usando apenas o token em memória. Guildas e backups exigem conta. O cadastro no Render continua exigindo banco persistente.

O patch 1.5.3 adiciona BR/US no menu, ping medido, transferência da mesma conta entre servidores e movimento com replay e correções visuais suaves. Leia [REGIONS.md](REGIONS.md) para configurar os endereços e publicar em uma região próxima. Servidores não configurados ficam indisponíveis; o código não altera a localização física da hospedagem.

O patch 1.5.4 corrige a perda progressiva de desempenho ao explorar: geração por índice espacial, áreas inativas em repouso, histórico limitado e cache de minérios confirmado pelo cliente. Bosses e loot existentes são preservados. A configuração do banco e das regiões continua igual.

O botão de Changelog abre notas públicas da 1.5 à 1.5.4 no menu ou na HUD, sem exigir login. Há PT/EN, navegação por versão, expansão e rolagem independente. As notas da 1.5 e 1.5.1 estão identificadas como resumos reconstruídos do histórico, sem datas de lançamento inventadas.

Para rodar localmente (Node 24):

```sh
npm install
npm start
```

Abra http://localhost:3000. Para testar: `npm test`.

Leia [DEPLOY.md](DEPLOY.md) para atualizar o GitHub/Render, configurar persistência e entender contas, squads e recompensas. Use uma instância por região. Cada região tem seu próprio mundo; contas e guildas compartilham o Redis configurado.

Não publique `db.json`, backups de jogadores, `.env` ou tokens privados. Novos cadastros no Render exigem Redis ou um disco persistente configurado. Limpar os dados do navegador encerra a sessão; a conta permanece no banco e pode ser acessada com nick e senha.
