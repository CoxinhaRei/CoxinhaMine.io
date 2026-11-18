# Conta de testes DevTeste — CoxinhaMine.io 1.5.5

Este patch prepara a criação da conta no servidor do jogo. A conta ainda não foi criada no site por esta entrega: é necessário publicar os arquivos e definir as variáveis abaixo no seu Render. Nenhuma senha real está neste pacote.

## Ativar no jogo publicado

1. Extraia o ZIP e envie todos os arquivos para a raiz do repositório do jogo, preservando `public` e `tests`. Substitua os arquivos de mesmo caminho, mantendo os demais. Este pacote é cumulativo sobre a 1.5.5 e também inclui o patch anterior de Craft/Tornados.
2. No Render, abra o serviço do jogo → Environment. Preserve as variáveis de Upstash e a chave do banco já usadas pelo jogo.
3. Adicione:

| Variável | Valor |
| --- | --- |
| DEV_ACCOUNT_ENABLED | true |
| DEV_ACCOUNT_NICK | DevTeste |
| DEV_ACCOUNT_PASSWORD | Uma senha privada escolhida por você, com 16 a 128 caracteres |

4. Salve com deploy. Se houver mais de um servidor regional, atualize todos os serviços com este código e a mesma configuração antes de usar a conta.
5. Abra `/health`: confira `build: release-155-devaccount1` e `developerAccountReady: true`.
6. No jogo, use **Entrar**, nick **DevTeste** e a senha que você definiu no Render. Não use Criar conta. Recarregue com Ctrl+F5 para carregar o cliente novo.

O cadastro exige o banco persistente no Render. A senha é guardada como hash scrypt; não coloque seu valor no GitHub, em `.env.example`, no ZIP ou no chat. As senhas fictícias dos testes automatizados não servem no site.

Se `developerAccountReady` estiver false, confira os logs do Render. Se já existir uma conta normal chamada DevTeste, ela não será alterada ou tomada: escolha outro nick livre em DEV_ACCOUNT_NICK. Se a conta DEV já foi criada, mantenha a senha original na configuração; trocar a variável não sobrescreve a senha existente.

## O que fica liberado

- Nível mínimo 475 e 20 slots de acessórios.
- Todos os talentos em XI e pontos para testes.
- Todas as espadas, picaretas e armaduras; no primeiro acesso, equipamentos Solar.
- Todos os acessórios em todas as raridades existentes, inclusive cópias de teste de Chosen.
- Um milhão de unidades de cada acessório, drop e minério disponível; um bilhão de moedas. Ao entrar novamente, os materiais e itens de teste são repostos. Sua seleção de equipamentos/acessórios é preservada.
- Galeria e conquistas liberadas para conferir as telas. Os mapas continuam usando as regras reais, com equipamento e nível suficientes para acessar a Caverna.

Não é uma senha universal ou um modo aberto a qualquer jogador. O servidor guarda a marca DEV fora dos dados editáveis do personagem; escolher o mesmo nick ou enviar campos pelo navegador não promove uma conta normal. Não há senha fixa no código.

## Separação dos resultados reais

- A DevTeste fica fora de todas as categorias do ranking, da pesquisa de perfis públicos e das listas/rankings de guildas. Seu próprio perfil continua disponível para conferência.
- A conta não entra em guildas competitivas. Squads continuam disponíveis para teste, mas o dano DEV não conta para qualificar jogadores normais a recompensas compartilhadas.
- Crafts e abates feitos por ela não geram os anúncios globais de conquistas raras.
- Cópias de Chosen de teste não registram posse global. A DevTeste não pode tomar o Chosen de outro jogador pela forja.
- Combate, chance de craft, projéteis e colisões continuam reais. Não há invulnerabilidade nem liberação automática dos comandos de administração. A conta pode aparecer no mundo compartilhado, e ataques atingem os mobs/minérios desse mundo; não é um servidor privado.

Para desativar o acesso, defina DEV_ACCOUNT_ENABLED=false e faça deploy. O registro fica preservado no banco e continua excluído dos rankings; uma conta normal não é alterada por essa opção.

## Verificação

Os testes cobrem criação apenas pelo servidor, hash de senha, proteção de contas existentes, recusa de senha/configuração inválida, restauração após reinício, bloqueio ao desativar, itens/talentos/slots, rankings e guildas, Chosen, anúncios e dano compartilhado. A persistência também foi testada com um Redis local simulado, sem acessar o banco real.
