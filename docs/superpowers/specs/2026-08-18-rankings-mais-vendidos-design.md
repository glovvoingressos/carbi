# Especificação Técnica: Hub de Carros Mais Vendidos (0 km vs Usados + SEO/Geo)

- **Data:** 18/08/2026
- **Status:** Aprovado

## 1. Visão Geral
Construção do Hub de Rankings de Veículos da Carbi com foco em SEO, inteligência de mercado e geo-localização, combinando dados de emplacamentos 0 km e vendas de seminovos/usados com atualização mensal histórica.

## 2. Arquitetura de URLs e SEO
- `/carros-mais-vendidos-brasil`: Hub principal com o mês mais recente.
- `/carros-mais-vendidos-brasil/[periodo]`: Página histórica por mês (ex: `julho-2026`).
- `/carros-mais-vendidos-brasil/[periodo]/[slug]`: Ficha e análise individual do modelo no mês (ex: `volkswagen-polo`).
- `/carros-mais-vendidos/[estado]`: Ranking regional por estado (SEO Geo).

### Dados Estruturados (JSON-LD)
- `ItemList` para a listagem dos 100 mais vendidos.
- `Product` e `AggregateOffer` para os modelos com preço médio/FIPE e links de compra.
- `FAQPage` para perguntas frequentes sobre os mais vendidos do mês.
- `BreadcrumbList` em todas as rotas.

## 3. Modelo de Dados (Supabase / Datastore)
Tabela: `monthly_car_rankings`
- `id` (uuid)
- `period_slug` (string, ex: "julho-2026")
- `period_month` (int, 7)
- `period_year` (int, 2026)
- `market_type` (enum: 'new', 'used')
- `rank_position` (int, 1-100)
- `brand` (string)
- `model` (string)
- `units_sold` (int)
- `fipe_avg_price` (numeric)
- `market_share_percent` (numeric)
- `created_at` (timestamp)

## 4. Pipeline de Atualização Mensal
- Route Handler `/api/cron/update-rankings` protegido por secret.
- Serviço de atualização mensal agendado via Vercel Cron.
- Dados semente locais para Julho 2026 como base inicial confiável.

## 5. Design e Experiência Visual
- Estilo alinhado ao design system Carbi (Fingen-inspired, badges, cards responsivos).
- Alternador 0 km vs Seminovos.
- Gráficos visuais de participação de mercado e variação de preço FIPE.
- Link direto para anúncios disponíveis na plataforma Carbi.

## 6. Self-Review de Qualidade
- Sem dependências de APIs pagas externas para exibição dos dados.
- Totalmente responsivo para mobile.
- Acessibilidade WCAG AA e suporte a `prefers-reduced-motion`.
