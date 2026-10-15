# Carbi Search Remediation Design

## Goal

Improve the accuracy, usefulness, and indexability of Carbi's vehicle, local, and ranking pages while reducing misleading prices, mismatched vehicle data, and mobile image cost.

## Context

The Search Console review found a large pool of discovered and crawled pages that are not indexed, stale or invalid sitemap submissions, and model pages that need more distinct, reliable content. The repository already contains a broad uncommitted patch across vehicle pages, marketplace pricing, rankings, local pages, image handling, metadata, and sitemaps. That work must be preserved and reviewed before any overlapping edits.

The requested remediation is items 5–16 from the user's earlier checklist, plus the concrete Search Console findings: prioritize important pages among the 268 discovered-not-indexed and 46 crawled-not-indexed URLs, keep only valid canonical sitemaps, and recheck the Tiggo model page after its existing indexing request.

## Design

### 1. Vehicle facts and marketplace trust

- Derive each model page's title, H1, visible year/version, technical fields, image, and `Car` JSON-LD from the same selected catalog variant.
- Show FIPE only when year and version resolve to one exact FIPE combination. Identify the source and reference month; otherwise omit the value and state that no exact reference is available.
- Label marketplace values as seller asking prices and FIPE values as dated external references. Do not render zero or empty technical measurements as facts.
- Review unusually large deviations from a matched FIPE reference before public display. Apply the same rule to new listings, price edits, legacy rows, and public queries, and explain the review reason to the seller.

### 2. Search intent and page quality

- Use sourced data with period and method on ranking pages; unknown state slugs return 404.
- Include generated pages in the index and sitemap only when their own inventory or data supports a useful page. Keep purchase intent on inventory pages and sale intent on seller guidance pages.
- Consolidate duplicate Belo Horizonte pages around their distinct purchase or sale intent. Keep BYD seller content focused on evidence-based battery, warranty, and service-history guidance.
- Replace unsupported commercial claims and loading placeholders with verifiable values, sources, or no display. Add editorial responsibility where a page makes informational claims.

### 3. Mobile, structured data, and crawl infrastructure

- Serve the Rampage and Strada hero images at responsive dimensions and modern formats, with the LCP image present in the initial server-rendered response and high priority when appropriate. Keep price type, source, and date visible without letting the mobile image displace the promised answer.
- Emit structured data only for visible, confirmed facts. Omit invalid `modelDate`, template descriptions, unsupported social profiles, and non-visible offers or reviews.
- Keep `robots.ts` and the legacy sitemap configuration aligned. A failed sitemap inventory query must return an observable error rather than a successful empty sitemap; log URL counts by page type and fail before the single-file protocol limit.

## Operational boundaries

- Preserve all existing working-tree changes and make additions only after reviewing their current behavior.
- Code changes can prepare canonical sitemap output and page quality gates. Search Console submissions, URL inspections, and indexing requests are external follow-up actions, using the user's previously specified Google account. Do not deploy or claim production/CrUX results without an actual release and field sample.
- After the code is published, verify public `robots.txt`, both sitemap endpoints, canonical/robots responses, redirects, and the priority page set in Search Console. Remove obsolete invalid sitemap submissions there and recheck the Tiggo request.

## Acceptance criteria

- A selected catalog vehicle has internally consistent title, H1, year/version, visible specifications, image, and schema; unavailable facts are omitted or explicitly unavailable.
- No FIPE amount is shown for an ambiguous or mismatched trim/year; each displayed FIPE amount has source and reference month.
- Listings with a confirmed extreme price deviation are withheld for review on create, update, and public reads, with a user-visible reason.
- Ranking and local pages use their own verified data and intent; unknown state slugs return 404, and pages without sufficient value are excluded from index signals and sitemaps.
- Rampage/Strada heroes use responsive delivery and priority only when the image is the LCP candidate; mobile price context remains available in the first block.
- JSON-LD contains only valid, visible facts; sitemap generation exposes database failures and reports counts by type.
- Production and field outcomes are reported only after production checks and sufficient CrUX/RUM data.
