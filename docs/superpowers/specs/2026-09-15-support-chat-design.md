# Chat de suporte público — especificação

**Status:** aguardando revisão do usuário

## Objetivo

Adicionar um chat de suporte acessível por visitantes e usuários autenticados, aberto por um botão flutuante no canto inferior direito com o texto “Precisa de ajuda?”. O visitante poderá enviar uma mensagem sem criar conta. O administrador receberá uma notificação por e-mail e poderá responder pelo painel administrativo.

## Experiência do visitante

- O botão flutuante permanece visível em desktop e mobile, respeitando a navegação inferior e a área segura do celular.
- O painel usa o visual existente do Carbi: fundo branco, cabeçalho escuro, acento chartreuse, bordas arredondadas, tipografia e estados de foco já usados no `SupportWidget`.
- Ao abrir pela primeira vez, o painel mostra uma mensagem de boas-vindas e um formulário com:
  - nome opcional;
  - e-mail opcional;
  - mensagem obrigatória.
- O texto explica que o e-mail é opcional, mas ajuda o suporte a retornar depois.
- Depois do envio, o visitante vê a conversa e as respostas do admin sem precisar fazer login.
- A conversa é identificada por um token aleatório em cookie `HttpOnly`, `Secure`, `SameSite=Lax`, com validade de 30 dias. O token não contém dados pessoais.
- O painel atualiza novas mensagens automaticamente a cada 4 segundos enquanto estiver aberto.
- Estados cobertos: carregando, vazio, enviando, enviado, erro, conversa encerrada e link de retorno ao login para usuários autenticados quando aplicável.

## Experiência do administrador

- Nova rota `/admin/suporte`, com layout compatível com o admin existente.
- Acesso permitido apenas para usuários autenticados cujo e-mail esteja em `SUPPORT_ADMIN_EMAILS`; nunca confiar em e-mail enviado pelo navegador.
- Lista de conversas ordenada pela última atividade, com filtros `Todas`, `Abertas`, `Aguardando resposta` e `Encerradas`.
- Cada item mostra nome/e-mail quando fornecidos, identificador curto da conversa, horário e prévia da última mensagem.
- Ao selecionar uma conversa, o admin vê o histórico e responde pelo mesmo painel.
- Respostas do admin são marcadas como `admin` e atualizam a conversa para `waiting_visitor`.
- O admin pode encerrar ou reabrir a conversa.
- O painel atualiza a lista e a conversa automaticamente, sem recarregar a página.

## Dados e segurança

Criar uma migration Supabase com duas tabelas privadas:

### `support_conversations`

- `id uuid primary key default gen_random_uuid()`
- `visitor_token_hash text not null unique`
- `visitor_name text null`
- `visitor_email text null`
- `status text not null default 'open'` com valores `open`, `waiting_visitor`, `closed`
- `last_message_at timestamptz not null default now()`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `support_messages`

- `id uuid primary key default gen_random_uuid()`
- `conversation_id uuid not null references support_conversations(id) on delete cascade`
- `sender_type text not null` com valores `visitor`, `admin`
- `sender_name text null`
- `body text not null`
- `created_at timestamptz not null default now()`

RLS fica habilitado e sem acesso direto para `anon`/`authenticated`. As rotas server-side usam o cliente administrativo somente depois de validar o cookie do visitante ou o contexto do admin. O hash do token é calculado no servidor com SHA-256; o token em claro nunca é salvo no banco.

## APIs

- `POST /api/support/conversations`: cria ou recupera a conversa do cookie e insere a primeira mensagem.
- `GET /api/support/conversations`: retorna somente a conversa correspondente ao cookie atual.
- `POST /api/support/conversations/messages`: adiciona mensagem de visitante à conversa do cookie.
- `GET /api/admin/support/conversations`: lista conversas para admin autenticado.
- `GET /api/admin/support/conversations/[id]`: retorna uma conversa para admin autenticado.
- `POST /api/admin/support/conversations/[id]/messages`: adiciona resposta do admin.
- `PATCH /api/admin/support/conversations/[id]`: encerra ou reabre a conversa.

Todas as entradas terão limites explícitos: nome até 120 caracteres, e-mail validado até 254 caracteres e mensagem até 2.000 caracteres. As respostas de e-mail usarão escape HTML. A API pública terá honeypot e limitação básica por IP/cookie para reduzir spam.

## E-mail

Ao criar uma conversa, enviar via Resend para `ADMIN_NOTIFY_EMAIL`:

- assunto: `[Suporte Carbi] Nova mensagem de visitante`;
- nome, e-mail opcional, horário e mensagem;
- link direto para `/admin/suporte?conversation=<id>`;
- `Reply-To` somente quando o e-mail informado for válido.

Falha no envio não apaga a mensagem: a conversa permanece salva e o endpoint retorna sucesso com aviso interno/log de notificação pendente.

## Compatibilidade e migração

- O `SupportWidget` atual será convertido de “somente autenticado” para fluxo público; usuários autenticados continuam podendo usar o mesmo widget.
- O endpoint atual `/api/support/message` será preservado temporariamente para compatibilidade ou redirecionado internamente ao novo serviço.
- Não haverá exposição de `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` ou credenciais administrativas no cliente.
- A variável `SUPPORT_ADMIN_EMAILS` será adicionada ao ambiente de produção como lista separada por vírgulas.

## Testes e aceitação

- Testes unitários para hash/token, validação de payload, transições de status e autorização de admin.
- Testes de rota para visitante anônimo, visitante com cookie, admin autorizado e admin não autorizado.
- Verificação manual em desktop e mobile: abrir, enviar sem login, receber resposta, atualizar, encerrar e reabrir.
- Verificação de que mensagem não pode ser lida ou alterada usando outro cookie/conversa.
- Build, TypeScript e lint devem passar antes do deploy.
