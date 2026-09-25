# Faixa do Ranking de Mais Vendidos na Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar uma nova faixa/banner na Home da Carbi destacando o Ranking dos 100 Carros Mais Vendidos de Julho/2026 com link direto para `/carros-mais-vendidos-brasil`.

**Architecture:** Componente `src/components/home/RankingsBanner.tsx` consumindo dados reais do ranking e renderizado em `src/app/page.tsx`.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS / `globals.css` (tokens `cb-`), Lucide React.

## Global Constraints
- Estilo `cb-` consistente com a marca Carbi (Dark `#1A1A1A`, Acento `#D4F576`).
- Mobile-first e acessível (WCAG AA, foco visível, prefers-reduced-motion).

---

### Task 1: Componente `RankingsBanner` e Integração na Home

**Files:**
- Create: `src/components/home/RankingsBanner.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`
- Test: `src/__tests__/rankings-banner.test.ts`

**Interfaces:**
- Consumes: `getMonthlyRankings('julho-2026', 'new')`, `getMonthlyRankings('julho-2026', 'used')`
- Produces: Banner estilizado com link para `/carros-mais-vendidos-brasil`

- [ ] **Step 1: Write failing test**

```typescript
import { describe, it, expect } from 'vitest'
import { getMonthlyRankings } from '../lib/rankings-data'

describe('rankings-banner data', () => {
  it('loads top models for home banner preview', async () => {
    const topNew = await getMonthlyRankings('julho-2026', 'new')
    const topUsed = await getMonthlyRankings('julho-2026', 'used')
    expect(topNew[0].model).toBeDefined()
    expect(topUsed[0].model).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx vitest run src/__tests__/rankings-banner.test.ts`
Expected: PASS

- [ ] **Step 3: Create `RankingsBanner.tsx` and integrate in `src/app/page.tsx`**

Implementar o componente visual com o mini-pódio, dados FIPE e link CTA `Ver ranking completo →`.

- [ ] **Step 4: Verify build & TypeScript**

Run: `npx tsc --noEmit && npm run build`
Expected: Build SUCCESS

- [ ] **Step 5: Deploy to production**

Run: `vercel --prod --yes`
Expected: Production deployment live.

- [ ] **Step 6: Commit**

```bash
git add src/components/home/RankingsBanner.tsx src/app/page.tsx src/app/globals.css src/__tests__/rankings-banner.test.ts
git commit -m "feat(home): add monthly rankings banner to home page"
```
