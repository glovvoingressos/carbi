# Caminhões — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Caminhões as a first-class vehicle category with shared marketplace infrastructure, dedicated routes and form, plate API mapping, truck-specific filters, and equivalent SEO/GEO coverage.

**Architecture:** Keep `vehicle_listings` as the shared marketplace table and distinguish trucks with `vehicle_type = 'truck'`. Reuse the existing plate lookup service, listing API, image system, authentication, FIPE snapshot, detail components, and account tooling; add truck-specific fields and dedicated route adapters where the car UI currently hardcodes car terminology or filters.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase/Postgres, existing placa API integration, existing FIPE integration, existing marketplace components, JSON-LD metadata, sitemap generation.

## Global Constraints

- Dedicated public routes: `/caminhoes`, `/caminhoes/anuncio/[slug]`, `/caminhoes/marca/[brand]`, `/anunciar-caminhao`.
- Dedicated account route: `/minha-conta/caminhoes`.
- Trucks also remain visible in general marketplace results when no `vehicle_type` filter is selected.
- Truck records use `vehicle_type = 'truck'` in shared marketplace storage.
- Reuse the existing plate API flow, error handling, cache behavior, and timeout behavior exactly.
- Map equivalent fields such as brand, model, manufacturing/model year, color, fuel, chassis/VIN, plate final, transmission, and FIPE.
- Support truck fields returned by the API: load capacity, axle count, cabin/body type, PBT/CMT, truck category, and other unknown fields in `structured_data` without losing raw values.
- FIPE is used when available; publication is allowed without FIPE and must display `FIPE não disponível`.
- Dedicated truck pages must follow the existing car SEO/GEO strategy: metadata, canonical URLs, indexable brand/model/category surfaces, JSON-LD, internal links, sitemap inclusion, and useful Portuguese copy.
- No new visual design system: reuse existing marketplace components, tokens, typography, spacing, cards, gallery, filters, form primitives, and detail components.
- Do not add dependencies or expose API tokens/secrets.

---

### Task 1: Add failing tests and define truck domain contracts

**Files:**
- Create: `src/lib/trucks.ts`
- Create: `scripts/test-truck-mapping.mjs`
- Modify: `src/lib/marketplace.ts`
- Test: `scripts/test-truck-mapping.mjs`

**Interfaces:**

```ts
export type TruckCategory = 'toco' | 'truck' | 'bitruck' | 'cavalo_mecanico' | 'carreta' | 'outro'

export interface TruckData {
  truck_type: string | null
  load_capacity: number | null
  axles: number | null
  truck_body_type: string | null
  cabin_type: string | null
  pbt: number | null
  cmt: number | null
  truck_category: TruckCategory | null
  chassis: string | null
  structured_data: Record<string, unknown>
}

export function normalizeTruckData(input: Record<string, unknown>): TruckData
```

- [ ] **Step 1: Write failing mapping tests**

Use a representative plate API payload with common and truck-specific fields. Assert:

```js
assert.equal(mapped.brand, 'Mercedes-Benz')
assert.equal(mapped.model, 'Atego 1719')
assert.equal(mapped.yearManufacture, 2019)
assert.equal(mapped.yearModel, 2020)
assert.equal(mapped.truck.category, 'truck')
assert.equal(mapped.truck.axles, 2)
assert.equal(mapped.truck.loadCapacity, 17000)
assert.equal(mapped.truck.pbt, 23000)
assert.equal(mapped.truck.cmt, 28000)
assert.equal(mapped.truck.structuredData.cabine, 'estendida')
```

Also assert missing truck fields become `null`, not `undefined`, and unknown API fields are preserved in `structured_data`.

- [ ] **Step 2: Run the test and verify it fails**

```bash
node scripts/test-truck-mapping.mjs
```

Expected: FAIL because no truck normalization contract exists.

- [ ] **Step 3: Implement the domain contract**

Add `TruckData`, category normalization aliases (`bitruck`, `bi-truck`, `cavalo mecânico`, `toco`, `truck`) and numeric normalization for capacity, PBT, CMT, and axles. Extend `ListingFormPayload` and `ListingPublic` with nullable truck fields while preserving `vehicle_type: 'car' | 'truck'`.

- [ ] **Step 4: Run mapping tests**

```bash
node scripts/test-truck-mapping.mjs
npx tsc --noEmit
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/trucks.ts src/lib/marketplace.ts scripts/test-truck-mapping.mjs
git commit -m "feat: define truck marketplace contracts"
```

---

### Task 2: Reuse plate lookup and map truck fields

**Files:**
- Modify: `src/lib/integrations/placaapi/types.ts`
- Modify: `src/lib/integrations/placaapi/service.ts`
- Modify: `src/lib/integrations/placaapi/client.ts` only if the public response type requires it
- Test: `scripts/test-truck-mapping.mjs`

**Interfaces:**

```ts
export interface PlacaLookupResult {
  success: boolean
  data?: PlacaApiResponse
  error?: string
}

export function mapPlacaApiResponse(raw: Record<string, unknown>, cleanPlate: string): PlacaApiResponse
```

- [ ] **Step 1: Add a failing test against the mapper**

Call the mapper with common car fields plus truck aliases from nested `extra`/`dados` objects and assert equivalent output for:

- `marca`, `modelo`;
- `ano_fabricacao`, `ano_modelo`;
- `cor`, `combustivel`, `caixa_cambio`;
- `chassi`/`vin`;
- `capacidade_carga`, `numero_eixos`, `tipo_cabine`, `pbt`, `cmt`, `categoria`.

- [ ] **Step 2: Run the test and verify it fails**

```bash
node scripts/test-truck-mapping.mjs
```

Expected: FAIL for truck-specific fields.

- [ ] **Step 3: Implement mapping without changing request behavior**

Keep the existing URL, plate normalization, API error handling, FIPE fallback, cache behavior, timeout behavior, and client endpoint unchanged. Extend only the response mapping to include normalized truck data and preserve unknown truck fields in `structured_data`.

- [ ] **Step 4: Run tests and typecheck**

```bash
node scripts/test-truck-mapping.mjs
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/integrations/placaapi/types.ts src/lib/integrations/placaapi/service.ts src/lib/integrations/placaapi/client.ts scripts/test-truck-mapping.mjs
git commit -m "feat: map truck data from plate lookup"
```

---

### Task 3: Extend listing creation and editing for trucks

**Files:**
- Modify: `src/app/api/marketplace/listings/route.ts`
- Modify: `src/app/api/marketplace/listings/[listingId]/route.ts`
- Modify: `src/lib/marketplace.ts`
- Create: `supabase/migrations/20260814_truck_listing_fields.sql`
- Test: `scripts/test-truck-mapping.mjs`

**Interfaces:**

- POST `/api/marketplace/listings` accepts `vehicle_type: 'truck'` and truck fields.
- PATCH `/api/marketplace/listings/:listingId` accepts the same truck fields and only permits the owner to edit.
- Truck field columns remain nullable so existing car rows are unaffected.

- [ ] **Step 1: Write failing persistence tests**

Add a test fixture for a truck payload and assert validation retains:

```js
vehicle_type: 'truck'
truck_type: 'Truck'
load_capacity: 17000
axles: 2
truck_body_type: 'Baú'
structured_data: { pbt: 23000, cmt: 28000, cabin_type: 'Estendida' }
```

Assert a car payload remains valid and receives no truck defaults that would alter its behavior.

- [ ] **Step 2: Run tests and verify failure**

```bash
node scripts/test-truck-mapping.mjs
```

Expected: FAIL until truck validation and persistence mapping are implemented.

- [ ] **Step 3: Add nullable schema fields**

Create the migration adding `cabin_type`, `pbt`, `cmt`, `truck_category`, and `structured_data` if absent. Keep existing `truck_type`, `load_capacity`, `axles`, and `truck_body_type` columns. Add constraints only where safe: non-negative numeric values and `vehicle_type` values `car`/`truck`.

Apply the migration through the repository’s Supabase migration workflow after inspecting the current table schema.

- [ ] **Step 4: Update POST/PATCH mappings**

Use one shared normalized truck payload helper. Store common fields in existing columns, truck-specific fields in dedicated columns, and all additional API values in `structured_data`. Do not require FIPE for trucks; preserve `null` FIPE and expose the absence to the UI.

- [ ] **Step 5: Run validation and typecheck**

```bash
node scripts/test-truck-mapping.mjs
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/marketplace/listings/route.ts src/app/api/marketplace/listings/[listingId]/route.ts src/lib/marketplace.ts supabase/migrations/20260814_truck_listing_fields.sql scripts/test-truck-mapping.mjs
git commit -m "feat: persist truck-specific listing fields"
```

---

### Task 4: Add dedicated truck listing, filters, and detail routes

**Files:**
- Create: `src/app/caminhoes/page.tsx`
- Create: `src/app/caminhoes/anuncio/[slug]/page.tsx`
- Create: `src/app/caminhoes/marca/[brand]/page.tsx`
- Modify: `src/lib/marketplace-server.ts`
- Modify: `src/components/marketplace/MarketplaceClient.tsx` or add a truck adapter component only if required by current props
- Modify: `src/components/marketplace/VehicleDetailView.tsx` only to render truck-specific fields conditionally
- Create: `src/lib/truck-seo.ts`

**Interfaces:**

```ts
export type TruckListingFilters = ListingsPageInput & {
  truckType?: string | string[]
  axles?: number | number[]
  loadCapacityMin?: number
  loadCapacityMax?: number
}

export async function fetchPublicTruckListingsPage(input: TruckListingFilters): Promise<ListingsPageResult>
```

- [ ] **Step 1: Write failing route/filter tests**

Test that truck page queries always add `vehicle_type = 'truck'`, car pages preserve their existing behavior, and truck filters map to `truck_type`, `axles`, `load_capacity`, transmission, mileage, brand, model, state, and city.

- [ ] **Step 2: Run tests and verify failure**

```bash
node scripts/test-truck-mapping.mjs
```

Expected: FAIL because no dedicated truck query helper/routes exist.

- [ ] **Step 3: Implement the truck query adapter**

Add `fetchPublicTruckListingsPage` as a narrow wrapper around `fetchPublicListingsPage`, adding `vehicle_type: 'truck'`. Extend `ListingsPageInput` with truck filters and apply them only when provided. Do not filter trucks out of general queries when `vehicle_type` is absent.

- [ ] **Step 4: Implement `/caminhoes`**

Reuse `MarketplaceClient` and existing listing cards. Add Portuguese truck title/copy, truck-specific filter controls, pagination, sorting, canonical metadata, and indexable content. Do not create a new card visual.

- [ ] **Step 5: Implement `/caminhoes/anuncio/[slug]`**

Reuse the existing detail page/data flow and `VehicleDetailView`, with conditional truck fields: category, body/cabin type, axles, load capacity, PBT, CMT, and FIPE status. Ensure car details remain unchanged.

- [ ] **Step 6: Run typecheck and build**

```bash
npx tsc --noEmit
npm run build
```

Expected: PASS and both route families appear in the build output.

- [ ] **Step 7: Commit**

```bash
git add src/app/caminhoes src/lib/marketplace-server.ts src/components/marketplace/MarketplaceClient.tsx src/components/marketplace/VehicleDetailView.tsx src/lib/truck-seo.ts
 git commit -m "feat: add dedicated truck marketplace routes"
```

---

### Task 5: Add dedicated truck creation/edit flow

**Files:**
- Create: `src/app/anunciar-caminhao/page.tsx`
- Modify: `src/components/marketplace/ListingForm.tsx` only to extract/reuse neutral form logic or accept a `vehicleType` prop
- Create: `src/components/marketplace/TruckListingForm.tsx` only if a dedicated adapter is cleaner
- Modify: `src/components/marketplace/PlateInput.tsx` only to display truck-specific mapped fields through existing callback props
- Modify: `src/app/minha-conta/caminhoes/page.tsx` or create it if account routes use a shared dashboard adapter

**Interfaces:**

```ts
<TruckListingForm vehicleType="truck" />
```

- [ ] **Step 1: Add failing form mapping tests**

Assert that a plate result initializes the truck form with common fields plus:

```js
truck_type
load_capacity
axles
truck_body_type
cabin_type
pbt
cmt
truck_category
structured_data
```

Assert missing FIPE leaves a visible non-blocking state.

- [ ] **Step 2: Run tests and verify failure**

```bash
node scripts/test-truck-mapping.mjs
```

Expected: FAIL until the dedicated truck form adapter exists.

- [ ] **Step 3: Implement the dedicated route/form**

Create `/anunciar-caminhao` with the same auth, image upload, plate lookup, validation, error handling, and submit flow as cars, but initialize `vehicle_type = 'truck'` and show truck fields. Reuse existing form controls and CSS classes. Keep the form visually dedicated without duplicating backend logic.

Allow manual truck entry when plate data is incomplete. Keep FIPE optional and show `FIPE não disponível` when absent.

- [ ] **Step 4: Add account truck filtering**

Create `/minha-conta/caminhoes` as a filtered view of the existing dashboard or a thin adapter. Keep general `/minha-conta/anuncios` behavior unchanged.

- [ ] **Step 5: Run tests, typecheck, and build**

```bash
node scripts/test-truck-mapping.mjs
npx tsc --noEmit
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/anunciar-caminhao src/app/minha-conta/caminhoes src/components/marketplace/ListingForm.tsx src/components/marketplace/TruckListingForm.tsx src/components/marketplace/PlateInput.tsx scripts/test-truck-mapping.mjs
 git commit -m "feat: add dedicated truck listing flow"
```

---

### Task 6: Add truck SEO/GEO surfaces and general marketplace integration

**Files:**
- Create: `src/app/caminhoes/marcas/page.tsx`
- Create: `src/app/caminhoes/categorias/page.tsx`
- Modify: `src/app/sitemap.ts` or sitemap source file
- Modify: `src/app/robots.txt` only if route policy requires it
- Modify: `src/app/page.tsx`
- Modify: `src/components/layout/Navbar.tsx`
- Modify: `src/lib/marketplace-seo.ts`

**Interfaces:**

- Truck pages use canonical URLs under `/caminhoes`.
- General marketplace keeps trucks visible when no vehicle type is explicitly selected.
- Navigation and Home may link to `/caminhoes`, but do not remove car entry points.

- [ ] **Step 1: Write failing SEO assertions**

Assert generated metadata and sitemap entries include:

- `/caminhoes`;
- truck brand/category pages;
- canonical URL under `/caminhoes`;
- JSON-LD identifying the page as a vehicle marketplace/listing collection;
- truck detail URLs for active truck listings.

- [ ] **Step 2: Run tests and verify failure**

```bash
node scripts/test-truck-mapping.mjs
```

Expected: FAIL until truck SEO helpers and routes are wired.

- [ ] **Step 3: Implement SEO/GEO parity**

Reuse the car metadata patterns, changing copy to natural Brazilian queries such as `caminhões à venda`, `caminhões usados`, `caminhão [marca] [modelo]`, and category terms. Include useful explanatory copy, FAQ-compatible headings where the existing strategy uses them, internal links to listing/filter pages, and JSON-LD.

- [ ] **Step 4: Add navigation and general visibility**

Add a dedicated Caminhões link in existing navigation/home surfaces. Verify general marketplace calls do not default to `vehicle_type = 'car'` when no filter is selected.

- [ ] **Step 5: Run tests and build**

```bash
node scripts/test-truck-mapping.mjs
npx tsc --noEmit
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/caminhoes src/app/sitemap.ts src/app/page.tsx src/components/layout/Navbar.tsx src/lib/marketplace-seo.ts scripts/test-truck-mapping.mjs
 git commit -m "feat: add truck SEO and discovery surfaces"
```

---

### Task 7: Final verification

**Files:**
- Modify: `scripts/test-truck-mapping.mjs` only for final coverage

- [ ] **Step 1: Run mapping and route tests**

```bash
node scripts/test-truck-mapping.mjs
```

Expected: PASS for common API mapping, truck-specific mapping, missing FIPE, filters, dedicated routes, and SEO outputs.

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Run targeted lint**

```bash
npx eslint src/app/caminhoes src/app/anunciar-caminhao src/app/minha-conta/caminhoes src/components/marketplace src/lib/integrations/placaapi src/lib/trucks.ts src/lib/marketplace.ts
```

Expected: no new errors.

- [ ] **Step 4: Run production build**

```bash
npm run build
```

Expected: successful Next.js production build with car and truck routes.

- [ ] **Step 5: Check the final diff**

```bash
git diff --check
git status --short
git log --oneline -10
```

Expected: no whitespace errors and only intended Caminhões files changed.

- [ ] **Step 6: Commit verification adjustments**

```bash
git add scripts/test-truck-mapping.mjs src/app src/components src/lib supabase/migrations
 git commit -m "test: verify truck marketplace integration"
```
