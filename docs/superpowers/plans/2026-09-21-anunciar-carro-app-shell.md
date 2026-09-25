# Fluxo de anúncio como app Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transformar o fluxo de anúncio da Carbi em uma experiência mobile-first, acessível, persistente e rápida.

**Architecture:** Manter `ListingForm` como orquestrador da publicação, extraindo apenas a persistência de rascunho para um módulo testável. O shell da rota será decidido pelo `ClientShell` com base no pathname. A etapa ficará sincronizada com query params via History API, enquanto a FIPE será normalizada para o estado já usado pelo comparativo.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest, Testing Library, IndexedDB browser API, Lighthouse, Impeccable detector.

**Spec:** `docs/superpowers/specs/2026-09-21-anunciar-carro-app-shell-design.md`

## Global Constraints

- Preservar a identidade Carbi: chartreuse `#D4F576`, ink `#1A1A1A`, superfícies claras e tipografia existente.
- Não alterar conteúdo, SEO ou URLs públicas fora das rotas de fluxo.
- Não reverter alterações preexistentes em `globals.css`, galeria ou arquivos não relacionados.
- Não adicionar dependência sem necessidade; usar APIs nativas para History API e IndexedDB.
- Manter WCAG AA como mínimo e respeitar `prefers-reduced-motion`.

## Review Focus

- Rota com `?placa=TCI6D41`: deve restaurar dados e não apagar rascunho sem confirmação.
- Rascunho sem IndexedDB ou com dados corrompidos: deve continuar utilizável sem quebrar a tela.
- Falha/timeout da placa e FIPE: deve comunicar recuperação e não deixar loading infinito.
- Arquivos inválidos, grandes ou fotos apagadas: deve informar o motivo e manter as fotos válidas.
- Viewport de 320–430px, teclado e leitor de tela: nenhum overflow, foco perdido ou CTA encoberto.

### Task 1: Contratos de estado e persistência do rascunho

**Files:**
- Create: `src/lib/listing-draft.ts`
- Test: `src/lib/listing-draft.test.ts`
- Modify: `src/components/marketplace/ListingForm.tsx`

- [ ] Escrever testes falhando para serialização versionada, restauração de etapa/subetapa e descarte seguro de payload inválido.
- [ ] Escrever testes falhando para persistir/restaurar metadados de imagens e usar fallback quando IndexedDB não existir.
- [ ] Implementar o módulo com `LISTING_DRAFT_VERSION`, funções `loadListingDraft`, `saveListingDraft`, `clearListingDraft`, `saveListingDraftImages` e `loadListingDraftImages`.
- [ ] Integrar o formulário para persistir formulário, etapa, subetapa e imagens sem gravar `File` diretamente no localStorage.
- [ ] Exibir estado acessível “Rascunho salvo” e restaurar sem limpar dados por causa de query param.
- [ ] Rodar `npx vitest run src/lib/listing-draft.test.ts` e depois a suíte completa.

### Task 2: Shell de app e navegação da etapa

**Files:**
- Modify: `src/components/layout/ClientShell.tsx`
- Modify: `src/app/anunciar-carro/fluxo/page.tsx`
- Modify: `src/app/anunciar-carro-bh/fluxo/page.tsx`
- Modify: `src/components/marketplace/ListingForm.tsx`
- Test: `src/components/layout/ClientShell.test.tsx`

- [ ] Escrever testes falhando para ocultar chrome global somente nas rotas de fluxo e manter o shell normal nas demais rotas.
- [ ] Criar o shell visual com header compacto, voltar, título curto, progresso e área de formulário; não duplicar CTAs.
- [ ] Sincronizar etapa/subetapa com `step` e `substep` usando `window.history.pushState`, preservando a placa e permitindo back/forward.
- [ ] Remover hero promocional, footer e suporte da superfície de tarefa sem alterar a home ou páginas públicas.
- [ ] Ajustar CSS mobile-first: container quase full-width, uma coluna em telas estreitas, CTA seguro acima da safe area e no máximo dois campos apenas quando houver largura suficiente.
- [ ] Rodar testes direcionados e verificar manualmente 320px, 390px, 430px e desktop.

### Task 3: Acessibilidade, campos e estados assíncronos

**Files:**
- Modify: `src/components/marketplace/ListingForm.tsx`
- Modify: `src/components/marketplace/PlateInput.tsx`
- Modify: `src/app/globals.css`
- Test: `src/components/marketplace/ListingForm.a11y.test.tsx`

- [ ] Escrever testes falhando para nomes acessíveis, erro com `role=alert`, status de loading com `aria-live` e heading sem salto.
- [ ] Associar labels visíveis aos inputs com ids estáveis; adicionar `autocomplete`, `inputMode`, `aria-describedby` e `aria-invalid` onde aplicável.
- [ ] Transformar estados de consulta, upload e publicação em regiões `aria-live` com mensagens de recuperação.
- [ ] Corrigir contraste dos labels e foco visível; manter motion reduzido.
- [ ] Separar classes de input textual, select e textarea, removendo chevrons de campos que não são selects.
- [ ] Informar rejeição de formato/tamanho de imagem e identificar cada ação de mover/remover foto.
- [ ] Rodar testes a11y direcionados e detector Impeccable sobre os arquivos alterados.

### Task 4: FIPE e carregamento sob demanda

**Files:**
- Modify: `src/components/marketplace/ListingForm.tsx`
- Modify: `src/components/marketplace/PlateInput.tsx`
- Modify: `src/components/analytics/GoogleAnalytics.tsx`
- Test: `src/components/marketplace/ListingForm.fipe.test.tsx`

- [ ] Escrever teste falhando que passa `fipePrice`/`fipeReference` da consulta da placa para o comparativo exibido na etapa 2.
- [ ] Implementar a normalização de placa/FIPE em uma única atualização de estado, com fallback explícito quando a FIPE não estiver disponível.
- [ ] Escrever teste falhando que garante que `/api/cars` não é chamado no mount sem veículo identificado e só é carregado quando enriquecimento técnico for necessário.
- [ ] Adiar o carregamento do catálogo para `requestIdleCallback`/timer seguro após a identificação do veículo; evitar chamadas duplicadas.
- [ ] Preservar analytics, mas adiar o script não crítico no fluxo até idle/interação sem bloquear o formulário.
- [ ] Rodar testes direcionados, medir requests no navegador e comparar Lighthouse de produção.

### Task 5: Verificação integrada e segunda auditoria mobile

**Files:**
- Modify: somente os arquivos necessários após os testes das tarefas anteriores.
- Test: suíte existente e testes novos.

- [ ] Rodar `npx vitest run` e corrigir regressões.
- [ ] Rodar `npm run build` e corrigir TypeScript/build.
- [ ] Rodar detector Impeccable uma vez sobre os alvos finais.
- [ ] Iniciar build de produção em porta isolada e executar Lighthouse com preset mobile, coletando performance, accessibility, LCP, TBT, CLS e payload.
- [ ] Inspecionar visualmente a rota em desktop e viewport mobile real/emulado, incluindo loading, erro, etapa 2, upload e revisão.
- [ ] Conferir `git diff --check` e `git status`; não incluir arquivos preexistentes não relacionados.
