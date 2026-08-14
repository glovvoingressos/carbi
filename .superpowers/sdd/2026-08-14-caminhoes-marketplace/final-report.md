# Relatório final — Caminhões Marketplace

Data: 2026-08-14

## Correções

- `supabase/migrations/20260814_truck_listing_fields.sql`: adicionadas, com `add column if not exists`, as colunas `vehicle_type`, `truck_type`, `load_capacity`, `axles`, `truck_body_type`, `cabin_type`, `pbt`, `cmt`, `truck_category`, `chassis` e `structured_data`. A view `vehicle_listings_public` não foi recriada porque não há definição local segura nesta migration; a decisão foi documentada no SQL.
- O PATCH de anúncios agora registra internamente erros de atualização/exclusão e retorna mensagens genéricas, sem expor `error.message` do Supabase.
- Ajustes lint mínimos nos componentes tocados, incluindo ordem de declarações e impureza de `Date.now`.

## Validação

- `npm run build`: passou. O Next informou apenas que o binding nativo SWC Darwin não está instalado e usou WASM; também houve log de dados externo `Requested range not satisfiable` durante geração, sem falha do build.
- `npx tsc --noEmit`: passou.
- `node scripts/test-truck-form.mjs`: passou.
- `node scripts/test-truck-mapping.mjs`: passou.
- `node scripts/test-truck-filters.mjs`: passou.
- `node scripts/test-truck-seo.mjs`: passou.
- `git diff --check`: passou.

## Lint direcionado

Comando: `npx eslint 'src/components/marketplace/MyListingsDashboard.tsx' 'src/components/marketplace/VehicleDetailView.tsx' 'src/app/api/marketplace/listings/[listingId]/route.ts' 'src/app/caminhoes/page.tsx' 'src/app/caminhoes/anuncio/[slug]/page.tsx' 'src/app/anunciar-caminhao/page.tsx' 'src/app/minha-conta/caminhoes/page.tsx'`

Pendências existentes nos arquivos tocados:

- `src/components/marketplace/MyListingsDashboard.tsx`: 3 erros `react-hooks/set-state-in-effect` em efeitos que carregam/autopreenchem estado; warnings de dependências de hooks e `<img>`.
- `src/components/marketplace/VehicleDetailView.tsx`: warnings de dependências de hook e `<img>`.
- `src/app/anunciar-caminhao/page.tsx`: warning de `<img>`.
- Os demais arquivos direcionados não apresentaram pendências no lint.

Essas pendências foram mantidas sem refatoração unrelated ao bloqueio truck.

## Supabase

Nenhuma migration remota foi aplicada.
