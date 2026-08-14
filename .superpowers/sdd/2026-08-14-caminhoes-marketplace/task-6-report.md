# Task 6 — Caminhões SEO/GEO e integração do marketplace

## Status
Findings corrigidos e commitados.

## Correções
- Hub de marcas mantém o nome canônico real (`Mercedes-Benz`) e usa slug apenas na URL; a página de destino decodifica/canoniza o slug antes de consultar o banco.
- Navbar voltou a fechar o menu mobile na mudança de rota.
- JSON-LD usa `serializeJsonLd` em marcas e categorias, neutralizando `<` antes de inserção no script e preservando JSON válido.
- Adicionado `scripts/test-truck-seo.mjs`, runner puro compatível com Node, sem dependência de aliases `@/lib`; `test-truck-mapping.mjs` não importa mais módulos server-side com alias.

## Validações
- RED reproduzido em `scripts/test-truck-seo.mjs` antes dos helpers: exports ausentes.
- `node --experimental-strip-types scripts/test-truck-seo.mjs`: PASS, incluindo payload JSON-LD de categorias.
- `node --experimental-strip-types scripts/test-truck-mapping.mjs`: PASS.
- `npm run build`: PASS; rotas `/caminhoes/marcas` e `/caminhoes/categorias` geradas.
- `npx tsc --noEmit`: PASS após o build gerar `.next/types`.
- ESLint direcionado: PASS.

## Concerns
- Warning preexistente de `<img>` em `src/app/page.tsx:335`.
- Warnings de SWC nativo ausente no ambiente.
- Build registra uma consulta de página 2 sem linhas, sem falhar.
- Alterações não relacionadas permaneceram fora do commit.
