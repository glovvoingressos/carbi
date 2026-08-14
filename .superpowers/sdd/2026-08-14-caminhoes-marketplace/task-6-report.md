# Task 6 — Caminhões SEO/GEO e integração do marketplace

## Status
Implementação concluída no escopo da Task 6.

## Alterações
- Adicionados `/caminhoes/marcas` e `/caminhoes/categorias` com metadata, canonical, conteúdo GEO, links internos e JSON-LD `CollectionPage`/`ItemList`.
- Expandido `truck-seo.ts` com marcas, categorias e helper de JSON-LD para anúncios ativos.
- Expandido `marketplace-seo.ts` com caminhos SEO de caminhões.
- Sitemap inclui `/caminhoes`, hubs, páginas de marcas/categorias e filtros de caminhões.
- Navbar e Home ganharam links dedicados para caminhões sem remover entradas de carros.
- Marketplace geral deixou de converter ausência de `vehicle_type` para `car`.
- Teste de mapeamento recebeu assertions SEO/GEO para metadata, canonical, JSON-LD e paths.

## Validações
- RED: `node --experimental-strip-types scripts/test-truck-mapping.mjs` falha antes da implementação por resolução do alias `@/lib` no runner Node direto.
- `npx tsc --noEmit`: PASS após geração dos tipos pelo build.
- ESLint direcionado: PASS com 1 warning preexistente sobre `<img>` em `src/app/page.tsx:335`.
- `npm run build`: PASS; Next gerou as rotas `/caminhoes/marcas` e `/caminhoes/categorias`.

## Concerns
- O script `scripts/test-truck-mapping.mjs` não executa no Node direto neste ambiente porque imports internos usam o alias TypeScript `@/lib`; o problema já existia no runner e não foi mascarado.
- O build exibiu warnings de SWC nativo ausente e uma consulta de página 2 sem linhas, sem falhar.
- Não foram incluídas alterações não relacionadas já existentes no workspace no commit.
