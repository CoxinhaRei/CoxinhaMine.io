# CoxinhaMine.io 1.5.5 — recuperação de conta, magnetos e biomas

Build: `release-155-recovery1`. Patch cumulativo preparado localmente; ainda não publicado no GitHub/Render.

## Entrada na conta e SAVE_CONFLICT

Foi reproduzido um bloqueio em que um servidor conservava um perfil de uma sessão antiga, enquanto outro servidor já havia salvo uma versão mais recente. A tentativa de salvar o perfil antigo ficava pendente e também impedia a atualização do catálogo antes de outros logins.

- Antes de usar uma conta, o servidor adquire a sessão e carrega seu registro atualizado do Redis. Isso evita usar a cópia carregada antes de outro servidor terminar de salvar.
- Quando o Redis confirma que uma sessão antiga já não pertence a este servidor, a cópia pendente é guardada em `save-conflicts/` junto do `db.json`. O perfil remoto é preservado, a sessão antiga é encerrada e outros logins podem continuar.
- Um conflito de uma sessão ainda pertencente ao próprio servidor continua bloqueando o save. O patch não escolhe silenciosamente entre duas versões nesse caso.
- Login, recuperação da sessão e entrada no mundo devolvem a conta e o inventário na própria confirmação, além do evento de atualização existente. O cliente aplica a confirmação apenas uma vez.
- Jogar aguarda o login e mostra uma falha de entrada em vez de escondê-la e entrar como convidado. O convidado continua disponível por uma escolha explícita.
- Uma aba substituída não apaga o token mais recente salvo por outra aba. Sessões expiradas voltam ao menu e oferecem novo login.

A recuperação foi verificada com Redis simulado e dois servidores Socket.IO reais locais. O banco de produção não foi acessado ou modificado. Este patch não cria uma conta nova para substituir uma existente e não recupera progresso que nunca chegou a ser salvo no banco. O backup local de conflito contém dados privados da conta e não deve ser enviado ao GitHub. No disco temporário do Render ele também pode desaparecer em um reinício.

## Magnetos por raridade

O mesmo acessório evolui pelo craft normal e mantém o identificador dos magnetos antigos. Cada raridade tem nome e modelo próprios:

| Raridade | Evolução | Raio de coleta |
|---|---|---:|
| Comum | Magneto Normal | 500 |
| Incomum | Magneto de Ferro | 900 |
| Raro | Magneto de Cobre | 1.600 |
| Épico | Magneto de Aço | 2.800 |
| Lendário | Magneto de Ouro | 4.800 |
| Mítico | Magneto de Cristal | 7.600 |
| ULTRA | Magneto Eletromagnético | 11.000 |
| SUPER | Magneto de Plasma | 15.000 |
| ABSOLUT | Magneto Gravitacional | 20.000 |
| QUANTIUM | Magneto Estelar | 25.000 |
| ALEPH | Magneto Galáctico | 30.000 |
| CHOSEN | Magneto Cósmico | 35.000 |

O CHOSEN tem diâmetro de 70.000 unidades, suficiente para cobrir uma região intermediária inteira quando bem posicionado. O círculo de alcance aparece no atlas/minimapa. O campo atravessa paredes, mas coleta somente os drops aos quais o dono tem direito, no mesmo mapa e dentro do prazo de coleta. Não causa dano nem altera a regra dos 5% ou dos squads. Equipar vários magnetos usa o maior alcance, sem somar os raios.

Coletas simultâneas são agrupadas em uma atualização e o número de efeitos visuais é limitado. O inventário recebe todos os itens válidos mesmo quando somente uma amostra aparece na animação.

## Invocações e projéteis

- Pedras lançadas por minérios e outros projéteis hostis podem acertar os mobs dos ovos.
- O trajeto do projétil é verificado entre os dois pontos do movimento para evitar atravessar uma invocação velozmente. O primeiro alvo na trajetória absorve o impacto.
- Invocações perdem vida, desaparecem ao morrer e respeitam a recarga individual do ovo. Não geram loot nem XP ao morrer.
- Retirar o ovo ou perder o dono torna a invocação inelegível como alvo.
- Nome original do mob acima da barra de vida; raridade colorida abaixo dela, em Ubuntu. Os rótulos de dono/“Aliado · Convidado” foram removidos somente dessas invocações.

## Formato dos mapas

Cada bioma possui um desenho de salas e passagens próprio: clareiras floridas no Jardim, enseadas na Praia, trilhas de raízes na Jungle, salões hexagonais na Floresta de Gelo e cânions curvos no Deserto. A Caverna conserva seu labirinto próprio.

As regiões de raridade continuam contíguas, com as mesmas regras de spawn e passagens entre elas. Há uma região específica de ABSOLUT; ela não se espalha pelo mapa inteiro. As cores de raridade permanecem apenas no atlas/minimapa. O chão mantém a textura do bioma. As dimensões não foram alteradas neste patch.

## Instalação

1. Extraia o ZIP em uma pasta vazia.
2. Envie todo o conteúdo extraído para a raiz do repositório do jogo. Preserve as pastas `public`, `tests` e `scripts`; não coloque os arquivos do servidor dentro de `public`.
3. Espere o deploy do Render concluir e abra `/health`. O campo `build` deve ser `release-155-recovery1`.
4. Feche abas antigas do jogo, pressione Ctrl+F5 e entre com o nick e a senha da conta existente.

Não são necessárias novas variáveis de ambiente. Mantenha o mesmo Redis configurado. Não exclua o banco nem crie outra conta para tentar recuperar seus itens. Se o build correto ainda mostrar conflito, consulte `saveErrorCode` em `/health` e copie apenas a linha do erro, sem tokens ou senhas.
