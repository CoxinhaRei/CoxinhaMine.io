# CoxinhaMine.io 1.5.5 — sessão de conta reservada

Build: `release-155-session2`. Patch cumulativo, ainda não publicado. Inclui o patch anterior de recuperação de login, magnetos e mapas.

## Falha corrigida

O servidor guardava as contas cujas reservas havia adquirido no Redis e renovava todas a cada 15 segundos. Se a liberação falhasse após o jogador sair, essa lista ainda incluía o perfil sem jogador conectado. Por isso o prazo de 60 segundos podia ser renovado para sempre e outro servidor recusava o login, mesmo sem outra aba aberta.

Agora o servidor só renova reservas de contas com um jogador conectado. Jogadores autenticados no menu continuam protegidos. Convidados, conexões encerradas e contas sem jogador não mantêm a reserva viva. Se houver falha ao salvar/liberar, a reserva expira pelo prazo normal; o próximo login carrega o registro confirmado no banco. A cópia pendente antiga continua sujeita à recuperação e backup do patch anterior.

Contas realmente conectadas em outro servidor continuam protegidas: o patch não rouba uma sessão ativa, não apaga chaves do banco e não troca senhas. A mensagem de reserva, sozinha, não comprova que alguém entrou na sua conta. O código público desse bloqueio é `SESSION_BUSY`.

## Publicar

1. Extraia o ZIP em uma pasta vazia e envie seu conteúdo à raiz do repositório, preservando as pastas.
2. Aguarde o deploy terminar. Confira `/health`: `build` deve ser `release-155-session2`.
3. Feche as abas antigas e espere 60 segundos depois que o processo anterior do servidor encerrar. Abra o jogo com Ctrl+F5 e entre normalmente.
4. Se usa dois serviços regionais, atualize os dois. Um serviço antigo ainda em execução pode continuar renovando uma reserva antiga.

Mantenha as variáveis do Redis e o banco existentes. Nenhum reset de contas é necessário. O prazo da reserva conta a partir da última renovação; se a conexão cair sem avisar, o servidor precisa primeiro detectar a desconexão.

A falha e a correção foram testadas localmente com Redis simulado, expiração controlada, dois proprietários de sessão e preservação do inventário confirmado. Não houve acesso ou alteração do Redis de produção.
