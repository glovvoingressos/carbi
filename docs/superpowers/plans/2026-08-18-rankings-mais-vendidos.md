# Hub de Carros Mais Vendidos (0 km vs Usados + SEO/Geo) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o hub dinâmico de rankings de carros mais vendidos no Brasil (0 km vs seminovos/usados), com rotas SEO/Geo, gráficos visuais, dados de Julho/2026 e estrutura para atualizações mensais.

**Architecture:** Módulo de dados em `src/lib/rankings-data.ts` alimentando rotas dinâmicas Next.js App Router (`/carros-mais-vendidos-brasil`, `/[periodo]`, `/[periodo]/[slug]`, `/[estado]`), integrando schemas JSON-LD e cron handler para atualização de mercado.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS / `globals.css` (tokens Carbi `cb-`), Lucide React, Supabase Server/Browser Client, Vitest/Node test runners.

## Global Constraints

- Seguir o design system Carbi (sem side-stripes, sem gradiente de texto, sem eyebrows repetitivos em caixa alta).
- WCAG AA mínimo, suporte a `prefers-reduced-motion` em todos os gráficos/animações.
- Fallback gracioso com dados locais de Julho/2026 quando Supabase/API externa falhar.

---

### Task 1: Módulo de Dados e Fallback dos Rankings

**Files:**
- Create: `src/lib/rankings-data.ts`
- Create: `src/data/rankings-july-2026.ts`
- Create: `src/__tests__/rankings-data.test.ts`

**Interfaces:**
- Produces: `getMonthlyRankings(period: string, marketType: 'new' | 'used')`, `getModelRankingDetail(period: string, slug: string)`, `getStateRankings(stateSlug: string)`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest'
import { getMonthlyRankings, getModelRankingDetail } from '@/lib/rankings-data'

describe('rankings-data', () => {
  it('returns July 2026 rankings for new cars', async () => {
    const data = await getMonthlyRankings('julho-2026', 'new')
    expect(data.length).toBeGreaterThan(0)
    expect(data[0].model).toBeDefined()
  })

  it('returns details for specific model in July 2026', async () => {
    const detail = await getModelRankingDetail('julho-2026', 'volkswagen-polo')
    expect(detail).not.toBeNull()
    expect(detail?.brand).toBe('Volkswagen')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/rankings-data.test.ts`
Expected: FAIL with "Cannot find module '@/lib/rankings-data'"

- [ ] **Step 3: Write minimal implementation**

Criar `src/data/rankings-july-2026.ts` com semente dos 100 mais vendidos (0 km e usados) e implementar `src/lib/rankings-data.ts` com fallback local.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/rankings-data.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/data/rankings-july-2026.ts src/lib/rankings-data.ts src/__tests__/rankings-data.test.ts
git commit -m "feat(rankings): add monthly rankings data layer with July 2026 fallback"
```

---

### Task 2: Endpoint Cron de Atualização Mensal

**Files:**
- Create: `src/app/api/cron/update-rankings/route.ts`
- Test: `src/__tests__/cron-rankings.test.ts`

**Interfaces:**
- Consumes: `getSupabaseServerClient()`
- Produces: `GET /api/cron/update-rankings?secret=...` returning JSON status

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest'
import { GET } from '@/app/api/cron/update-rankings/route'

describe('update-rankings cron endpoint', () => {
  it('rejects unauthorized requests', async () => {
    const req = new Request('http://localhost/api/cron/update-rankings')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/cron-rankings.test.ts`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Write minimal implementation**

Implementar `GET` validando `CRON_SECRET` e realizando upsert na tabela `monthly_car_rankings`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/cron-rankings.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/cron/update-rankings/route.ts src/__tests__/cron-rankings.test.ts
git commit -m "feat(cron): add monthly rankings update route handler"
```

---

### Task 3: Hub Principal e Rotas Dinâmicas de SEO/Geo

**Files:**
- Create: `src/app/carros-mais-vendidos-brasil/page.tsx`
- Create: `src/app/carros-mais-vendidos-brasil/[periodo]/page.tsx`
- Create: `src/app/carros-mais-vendidos-brasil/[periodo]/[slug]/page.tsx`
- Create: `src/app/carros-mais-vendidos/[estado]/page.tsx`
- Create: `src/components/rankings/RankingsHubView.tsx`

**Interfaces:**
- Consumes: `getMonthlyRankings`, `getModelRankingDetail`, `getStateRankings`
- Produces: Visualização rica com alternador (0km/Usados), tabela responsiva, gráficos de market share, schemas JSON-LD e links para ofertas Carbi.

- [ ] **Step 1: Build visual component with JSON-LD metadata**

Implementar `RankingsHubView.tsx` com alternador, gráficos, cartões com FIPE e schemas estruturados (`ItemList`, `Product`, `BreadcrumbList`, `FAQPage`).

- [ ] **Step 2: Connect routes and render Server Components**

Conectar as páginas Next.js com `generateMetadata` dinâmico e canonicals.

- [ ] **Step 3: Run TypeScript & Lint verification**

Run: `npx tsc --noEmit && npx eslint src/app/carros-mais-vendidos-brasil/page.tsx`
Expected: Success without errors.

- [ ] **Step 4: Test server response**

Run local dev server e testar respostas HTTP 200 nas rotas criadas.

- [ ] **Step 5: Commit**

```bash
git add src/app/carros-mais-vendidos-brasil/ src/app/carros-mais-vendidos/ src/components/rankings/
git commit -m "feat(rankings): build SEO/Geo rankings hub and detail pages"
```

---

### Task 4: Validação Final, Acessibilidade e Deploy

**Files:**
- Modify: `src/app/globals.css` (estilos específicos da tabela/gráficos de rankings em namespace `cb-`)

- [ ] **Step 1: Execute full test suite and build**

Run: `npx tsc --noEmit && npm run build`
Expected: Build SUCCESS without errors.

- [ ] **Step 2: Deploy to production**

Run: `vercel --prod --yes`
Expected: Production deployment completed successfully.

- [ ] **Step 3: Commit final updates**

```bash
git add .
git commit -m "chore(rankings): polish, accessibility and production release"
```
