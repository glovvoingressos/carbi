# Carbi Search Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct vehicle facts and prices, improve useful search pages, and make Carbi's mobile images and sitemap output reliable.

**Architecture:** Reconcile the existing working-tree changes with the approved design, then complete the shared data rules before the page templates that consume them. Keep inventory, rankings/local pages, and crawl infrastructure as separate sequential tasks; Search Console work follows only after production reflects the code.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase/Postgres, Vitest, Google Search Console.

**Spec:** [2026-10-15-carbi-search-remediation-design.md](../specs/2026-10-15-carbi-search-remediation-design.md)

## Global Constraints

- Preserve the 70 pre-existing modified/deleted files; never reset, discard, or stage them as part of this work.
- Use the canonical production host `https://www.carbi.com.br` consistently in metadata, robots, and sitemap URLs.
- Show FIPE only for an exact year/version match and identify its source and reference month.
- Keep purchase pages about available inventory and sale pages about the seller's task.
- Do not deploy; production and field measurements require a separate release.
- Do not claim indexing or Core Web Vitals improvements without fresh Search Console/CrUX evidence.

## Review Focus

- Missing or ambiguous FIPE trim/year: display no inferred price; pin with `getFipePrice` tests.
- Catalog year differs from selected FIPE year: do not mix catalog specifications into the selected year; pin with model-page/schema assertions.
- Outlier on create, edit, or legacy read: keep the listing out of public results and tell the seller why; pin the shared pricing helper and each caller.
- Unknown state or low-inventory local page: return 404 or omit from index signals and sitemap; pin route and sitemap tests.
- Sitemap database failure: return an observable error, not an empty successful sitemap; pin the sitemap listing helper/route behavior.

---

### Task 1: Align catalog variant, FIPE, image, and structured data

**Files:**
- Modify: `src/lib/fipe-api.ts`
- Modify: `src/lib/data-fetcher.ts`
- Modify: `src/app/[brand]/[model]/page.tsx`
- Modify: `src/components/car/CarImage.tsx`
- Modify: `src/data/unsafeCarAssets.ts`
- Modify: `src/components/seo/JSONLD.tsx`
- Modify: `src/app/[brand]/[model]/model-page.css`
- Create: `src/lib/fipe-api.test.ts`
- Create: `src/lib/data-fetcher.test.ts`
- Create: `src/components/seo/JSONLD.test.tsx`

**Interfaces:**
- Consume `getFipeYearsByModelName(brand, model, limit, version)` and `getFipePrice(brand, model, year, version)`.
- Keep model-generation digits such as `Tiggo 7` and `Tiggo 8` in their canonical slugs; strip engine displacement tokens such as `1.6T`.
- Preserve the public catalog route `/{brand}/{model}` and its `year`/`version` search parameters.
- The rendered page and `VehicleSchema` must use the same selected catalog variant and confirmed model year.

- [x] Add a `groupCarsByModel` regression test asserting `Tiggo 7` and `Tiggo 8` produce distinct slugs; add only missing FIPE assertions for exact trim, no match, ambiguous match, and returned year mismatch, plus JSON-LD assertions for blank descriptions and omitted `modelDate`.
- [x] Run the focused FIPE, model-slug, and JSON-LD suite; use the regression cases to cover the discovered gaps and confirm the corrected behavior.
- [x] Make year and version selection exact in `src/lib/fipe-api.ts`; align page title, H1, visible specs, image choice, and `VehicleSchema` in `src/app/[brand]/[model]/page.tsx`.
- [x] Keep unverified image assets out of vehicle pages and ensure the chosen photo corresponds to the visible brand/model/variant.
- [x] Re-run the focused Vitest command after remaining edits and confirm all assertions pass.

### Task 2: Stop extreme-price listings from reaching public inventory

**Files:**
- Modify: `src/lib/marketplace.ts`
- Modify: `src/lib/marketplace.test.ts`
- Modify: `src/app/api/marketplace/listings/route.ts`
- Modify: `src/app/api/marketplace/listings/[listingId]/route.ts`
- Modify: `src/lib/marketplace-server.ts`
- Modify: `src/components/marketplace/ListingForm.tsx`
- Modify: `src/components/marketplace/VehicleDetailView.tsx`
- Review migration: `supabase/migrations/20261013013330_marketplace_price_outlier_filter.sql`

**Interfaces:**
- Use `getListingPriceReview(price, fipePrice)` as the shared decision and reason for create, update, and public-read paths.
- Treat trucks separately from passenger-car FIPE comparisons.

- [x] Review the current uncommitted implementation and add only missing helper assertions for the Ford Ka-style 8,557% deviation, normal negotiation ranges, absent FIPE, invalid amounts, and both high and low outliers.
- [x] Run `npx vitest run src/lib/marketplace.test.ts` and confirm the price-review cases pass.
- [x] Apply the shared review result consistently to creates, price edits/reactivation, legacy public rows, and seller feedback; keep the SQL public view aligned with the TypeScript rule.
- [x] Label asking price separately from FIPE and show FIPE source/reference month wherever a comparison is rendered.
- [x] Re-run the focused Vitest command after any remaining edits and confirm the pricing cases pass.

### Task 3: Gate ranking and local pages by intent and real data

**Files:**
- Modify: `src/lib/rankings-data.ts`
- Modify: `src/lib/rankings-seo.ts`
- Modify: `src/data/rankings-september-2026.ts`
- Modify: `src/app/carros-mais-vendidos/[estado]/page.tsx`
- Modify: `src/app/carros-mais-vendidos-brasil/page.tsx`
- Modify: `src/app/carros-mais-vendidos-brasil/[periodo]/page.tsx`
- Modify: `src/app/carros-mais-vendidos-brasil/[periodo]/[slug]/page.tsx`
- Modify: `src/app/carros-usados-bh/page.tsx`
- Modify: `src/app/vender-carro-bh/page.tsx` and `src/app/anunciar-carro-bh/page.tsx`
- Modify: `next.config.js` to preserve the canonical BH redirects
- Modify: `src/lib/marketplace-seo.ts`, `src/lib/category-intents.ts`, and `src/lib/truck-seo.ts`
- Modify: `src/data/seo-content.ts` and `src/app/vender/[brand]/page.tsx`
- Modify: `src/components/home/RankingsBanner.tsx`, `src/components/home/HomeCounters.tsx`, and `src/components/seo/SEOPageClient.tsx`
- Modify: `src/app/anunciar-carro/page.tsx`, `src/app/anunciar-seminovo/page.tsx`, `src/app/trafego-pago-gratis/page.tsx`, and `src/app/sobre/page.tsx`
- Modify: `src/__tests__/rankings-data.test.ts` and `src/lib/rankings-seo.test.ts`

**Interfaces:**
- Keep ranking pages data-driven through `getMonthlyRankings` and `getRankingSitemapPaths`.
- Keep local inventory pages backed by `fetchPublicListingsPage` and the existing minimum-inventory rule.

- [x] Review existing tests and add only missing assertions for unknown state 404s, sourced ranking period/method, low-inventory exclusion, and canonical BH redirects.
- [x] Run the focused ranking-data and SEO suite and confirm the supported-path and intent cases pass.
- [x] Ensure rankings are genuinely state-specific or not published; expose only supported ranking paths through `getRankingSitemapPaths`; consolidate overlapping BH intent; keep BYD advice evidence-based; state free-plan terms and duration; hide unverified metrics; link sources/methodology and identify Carbi's editorial responsibility without inventing an individual author.
- [x] Re-run the focused ranking tests after any remaining edits and confirm the assertions pass.

### Task 4: Reduce mobile hero cost and keep the promised answer visible

**Files:**
- Modify: `src/app/[brand]/[model]/page.tsx`
- Modify: `src/app/[brand]/[model]/model-page.css`
- Modify: `src/components/car/CarImage.tsx`
- Modify: `src/components/home/HomeHero.tsx` and `src/components/home/HomeFeaturedListing.tsx`
- Review: `src/app/page.tsx` and `src/app/globals.css` for the existing redesign
- Review: `src/app/page.test.tsx` for current home-render assertions; add only missing assertions there
- Review: `next.config.js` image delivery settings

- [x] Replace the 14.6 MiB Rampage source with a 1600×901 WebP (~160 KB), limit mobile hero height to 160px, and verify the image is in initial HTML with responsive `sizes`, preload, and high priority.
- [x] Configure responsive AVIF/WebP delivery, avoid client-only hero mounting, and reserve high priority for the actual LCP candidate.
- [x] Keep Rampage and Strada price type, date, and source legible in the first mobile block while limiting hero height to the designed responsive ratio.
- [ ] After release, inspect both model pages at mobile and desktop widths, rerun PSI, and record delivered bytes and lab LCP. The local optimizer smoke check returned AVIF at 828px (28.7 KB); this is not a PSI or field CWV measurement.

### Task 5: Make sitemap and robots output canonical and observable

**Files:**
- Modify: `src/app/robots.ts`
- Modify: `next-sitemap.config.js`
- Modify: `src/lib/sitemap-listings.ts`
- Modify: `src/lib/marketplace-server.ts`
- Modify: `src/app/sitemap.ts`
- Modify: `src/app/sitemap-images/route.ts`
- Create: `src/lib/sitemap-listings.test.ts`

**Interfaces:**
- Preserve `getAllPublicSitemapListings(includeImages)` as the collection entry point.
- A database error must remain distinguishable from a valid empty inventory result.
- Consume the page-eligibility paths produced by Task 3 and public listings filtered by Task 2; do not add duplicate eligibility or price rules here.

- [x] Add tests for inventory-query failure, valid empty data, URL counts by type, image XML escaping, and the pre-limit size guard.
- [x] Run `npx vitest run src/lib/sitemap-listings.test.ts`; record existing behavior for database errors and valid empty inventory.
- [x] Propagate sitemap inventory failures to an observable 503/log; align both robots generators, exclude non-indexable routes, log counts by page type, and fail before the sitemap single-file limit.
- [x] Re-run the focused Vitest command and confirm it passes.

### Task 6: Production Search Console follow-up after release

**Files:** None; read-only checks and explicitly requested sitemap cleanup in the already authorized Google account.

- [ ] After the code is published, fetch `robots.txt`, `sitemap.xml`, and the image sitemap; verify status, canonical host, redirects, `noindex`, and URL counts.
- [ ] In the correct Search Console property, remove obsolete invalid sitemap submissions, inspect the priority URLs among the 268 discovered-not-indexed and 46 crawled-not-indexed pages, and recheck the Tiggo indexing request.
- [ ] Report indexing as pending or observed; report CrUX Core Web Vitals only if a field sample exists.
