# Design: Anunciar pela placa + criação de conta no último passo

**Data:** 2026-08-05
**Status:** Aprovado

## Problema

O card "Anuncie grátis por tempo limitado" na home (`src/app/page.tsx:206-216`) é apenas um link para `/anunciar-carro`. Hoje o fluxo de anúncio **exige login antes de começar** (`ListingForm.tsx:965-971` mostra `AuthCard` se não autenticado), o que cria fricção: o usuário não consegue nem começar a montar o anúncio sem criar conta.

**Objetivo:** o usuário começa pela placa (campo no próprio card da home), preenche o anúncio inteiro sem login e, no último passo, cria a conta (nome, telefone, CPF, email, senha) e publica imediatamente.

## Decisões aprovadas

1. **Card da home com campo de placa** — busca o carro ali mesmo e segue para o fluxo com dados pré-preenchidos.
2. **Publicar na hora** — a conta é criada já confirmada (via service role, `email_confirm: true`), o anúncio é publicado imediatamente; e-mail de boas-vindas ainda é enviado.
3. **CPF incluído no último passo** — nome, telefone, CPF, email e senha (mesmo conjunto do AuthCard).
4. **E-mail já cadastrado** — aviso amigável + oferecer login ali mesmo (link para `/entrar` com redirect).
5. **Usuário logado** — pula o form de conta no último passo; mantém "Publicar anúncio".

## Fluxo proposto

### 1. Card na home — `PlateBannerLookup` (novo componente)

- Substituir o conteúdo do card promo em `src/app/page.tsx:206-216`.
- Novo componente `src/components/marketplace/PlateBannerLookup.tsx` (client component):
  - Campo de placa estilizado com o design system (fundo `#1A2F1E`, accent `#D4F576`, `--radius-*` tokens).
  - Reutiliza `lookupPlateClient` (`/api/marketplace/placa` — sem auth).
  - Ao encontrar: mostra marca/modelo/ano/FIPE e navega para `/anunciar-carro/fluxo?placa=XXX`, salvando os dados completos do veículo em `sessionStorage` (chave `carbi_plate_lookup_v1`).
  - Erro de placa inválida/não encontrada → mensagem inline no card.
  - Mesma nota de privacidade do `PlateInput`: "A placa não será publicada".

### 2. Fluxo — `ListingForm` (editar)

- **Remover gate de login** em `ListingForm.tsx:965-971` (o AuthCard deixa de ser exigido no início).
- No mount, ler `?placa=` da URL + `sessionStorage`:
  - Se existir, pré-preencher `form` (brand, model, year, yearModel, color, fuel, engine, horsepower, transmission, bodyType, plateFinal, version, fipe).
  - Pular direto para o sub-passo de confirmação dos dados do veículo (sub-passo 2 do passo 1).
  - Limpar a chave do `sessionStorage`.
- Manter o estado de autenticação (`isAuthenticated`) apenas para decidir o conteúdo do passo 3.

### 3. Passo 3 — criar conta (se não logado)

- Se `!isAuthenticated`:
  - Mostrar card "Crie sua conta" com: Nome, Sobrenome (opcional ou juntos), Telefone, CPF, Email, Senha, Confirmar senha.
  - Reaproveitar validações do `AuthCard` (CPF, senha com 8+ / maiúscula / número / especial).
  - Botão: **"Criar conta e publicar"**.
- Se `isAuthenticated`:
  - Botão atual "Publicar anúncio" (fluxo inalterado).

### 4. Publicação — conta confirmada + anúncio

- Novo endpoint `src/app/api/auth/signup-publish/route.ts` (POST):
  - Valida payload (email, senha, nome, telefone, cpf).
  - Cria usuário com `supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name, phone, cpf } })` (service role).
  - O trigger `handle_auth_user_created` (já corrigido) copia os metadados para `public.users`.
  - Se o e-mail já existe → `409 { error, code: 'email_exists' }`.
  - Em caso de sucesso, envia `sendWelcomeEmail` (fire-and-forget, sem bloquear o fluxo).
  - Retorna `{ ok: true, email }`.
- No front, após `signup-publish` OK:
  - `supabase.auth.signInWithPassword({ email, password })` → sessão imediata (conta confirmada).
  - Reutiliza o fluxo de publicação existente (`POST /api/marketplace/listings` + upload de imagens) — sem mudanças.
- Se o endpoint responder `email_exists`:
  - Aviso amigável + link para `/entrar?redirect=/anunciar-carro/fluxo`.

### 5. Página `/anunciar-carro` (editar)

- Deixar de redirecionar para `/entrar` quando não logado. Passa a redirecionar direto para `/anunciar-carro/fluxo` (o fluxo agora aceita não-logados).

## Arquivos

**Novos:**
- `src/components/marketplace/PlateBannerLookup.tsx`
- `src/app/api/auth/signup-publish/route.ts`

**Editados:**
- `src/app/page.tsx` — card promo com plate lookup.
- `src/components/marketplace/ListingForm.tsx` — remover gate, prefill por placa, passo 3 com form de conta.
- `src/app/anunciar-carro/page.tsx` — redirecionar sempre para o fluxo.
- `src/app/globals.css` — estilos do novo campo no card (usando tokens do design system).

## Erros tratados

- Placa inválida / não encontrada → mensagem inline no card.
- E-mail já cadastrado no passo 3 → aviso amigável + link `/entrar?redirect=/anunciar-carro/fluxo`.
- Validação de CPF e senha → mesmas regras do `AuthCard`.
- Falha na publicação → reutiliza os estados de erro existentes do `ListingForm` (`error`, `validationDetails`).

## Fora de escopo

- Edição de anúncio existente.
- Upload de múltiplas versões de imagem com recorte.
- Alteração no `AuthCard` ou nos endpoints de publicação existentes.

## Riscos / observações

- A criação da conta confirmada usa `SUPABASE_SERVICE_ROLE_KEY` no servidor (nunca no cliente). Confirmar que a env existe em produção (foi adicionada no trabalho anterior).
- O `signInWithPassword` após signup exige `mailer_autoconfirm` / `email_confirm` aceito — a conta é criada com `email_confirm: true`, então a sessão vem direto.
- Limite de 5 anúncios grátis continua valendo (já no endpoint de listings).
