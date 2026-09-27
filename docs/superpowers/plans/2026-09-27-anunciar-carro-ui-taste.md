# Anunciar Carro UI Taste Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir os problemas de privacidade, dados, navegação, acessibilidade e acabamento visual encontrados no fluxo de anúncio de carro sem alterar o caminho feliz de publicação.

**Architecture:** Manter o fluxo atual em três etapas e concentrar regras reutilizáveis em helpers puros de `src/lib/marketplace.ts`. O componente `ListingForm` continuará sendo o orquestrador visual, mas ganhará estados explícitos para fallback manual, upload, FIPE e transição de etapa. A API normalizará a placa novamente no limite de confiança para evitar vazamento mesmo quando o cliente enviar dados incorretos.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Tailwind/CSS existente, Supabase.

**Spec:** `docs/superpowers/specs/2026-09-27-anunciar-carro-ui-taste-improvements.md`

## Global Constraints

- Preservar a jornada atual de três etapas e o salvamento de rascunho.
- Nunca publicar a placa completa; persistir no máximo o último caractere.
- Não exigir upload real, conta real ou publicação real durante a verificação local.
- Reutilizar os tokens visuais existentes do Carbi e manter a interface mobile-first.
- Não adicionar dependências novas.

## Review Focus

- Consulta de placa sem resultado: deve existir uma saída manual clara e utilizável.
- Consulta de placa com FIPE: o valor deve sobreviver à passagem para a etapa 2.
- Arquivo inválido ou grande demais: deve gerar feedback recuperável, sem desaparecer silenciosamente.
- Mudança de etapa em viewport curto: o novo título e a ação principal devem entrar na viewport.
- Payload e revisão: nenhuma tela ou API pública pode carregar a placa completa.

### Task 1: Regras de placa e FIPE

**Files:**
- Modify: `src/lib/marketplace.ts`
- Modify: `src/app/api/marketplace/listings/route.ts`
- Modify: `src/app/api/marketplace/listings/[listingId]/route.ts`
- Modify: `src/components/marketplace/ListingForm.tsx`
- Modify: `src/components/marketplace/PlateInput.tsx`
- Test: `src/lib/marketplace.test.ts`

- [x] Escrever testes falhando para normalizar a placa ao último caractere e para construir um snapshot FIPE a partir do retorno da placa.
- [x] Rodar os testes e confirmar falha pela ausência das regras.
- [x] Implementar helpers mínimos e aplicar a normalização no cliente, nas respostas públicas e nas duas rotas de escrita.
- [x] Repassar `fipePrice`/`fipeReference` do `PlateInput` para `fipeResult` sem mudar a API visual.
- [x] Rodar os testes focados e confirmar aprovação.

### Task 2: Fallback manual e transição de etapa

**Files:**
- Modify: `src/components/marketplace/ListingForm.tsx`
- Modify: `src/components/marketplace/PlateInput.tsx`
- Test: `src/components/marketplace/ListingForm.test.tsx`

- [ ] Escrever testes falhando para bloquear a continuação sem veículo e para exibir a rota manual após erro de placa.
- [ ] Rodar os testes e confirmar falha.
- [x] Implementar o fallback manual com marca/modelo/ano e reset de campos dependentes.
- [x] Adicionar scroll/foco seguro no início de cada nova etapa.
- [x] Validar a navegação no navegador e confirmar aprovação.

### Task 3: Campos, upload e estados de feedback

**Files:**
- Modify: `src/components/marketplace/ListingForm.tsx`
- Modify: `src/app/globals.css`
- Test: `src/components/marketplace/ListingForm.test.tsx`

- [ ] Escrever testes falhando para mensagens de arquivo inválido, limite de tamanho e texto de senha.
- [ ] Rodar os testes e confirmar falha.
- [x] Adicionar labels visíveis aos campos essenciais, mensagens de upload e orientação de senha.
- [x] Exibir loading da FIPE e preservar feedback de erro com recuperação.
- [x] Ajustar contraste, tipografia do fluxo e microcopy sem trocar a arquitetura visual.
- [x] Rodar os testes focados e confirmar aprovação.

### Task 4: Verificação de publicação e qualidade

**Files:**
- Modify: `src/components/marketplace/AuthCard.tsx`
- Modify: `src/components/marketplace/ListingForm.tsx`
- Test: testes existentes do marketplace

- [x] Corrigir os componentes de banner criados durante o render em `AuthCard`.
- [x] Reavaliar o aviso do preview de imagens sem alterar o resultado visual.
- [x] Rodar lint, testes completos e build.
- [x] Renderizar novamente o fluxo em viewport mobile e conferir o comportamento desktop já auditado.
- [x] Verificar que o working tree contém apenas as mudanças planejadas e registrar limitações restantes.

## Verification notes

- `npx vitest run`: 28 arquivos, 92 testes aprovados.
- `npx tsc --noEmit` e `npm run build`: aprovados.
- `npm run lint`: 0 erros; permanecem 3 avisos existentes de uso de `<img>` fora do fluxo.
- O lint direcionado de `ListingForm.tsx` ainda reporta regras `react-hooks/set-state-in-effect` preexistentes em efeitos de carregamento do catálogo; não foram refatoradas para evitar alterar o caminho feliz durante esta entrega.
