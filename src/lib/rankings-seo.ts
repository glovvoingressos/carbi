import { SEPTEMBER_2026_NEW_RANKINGS } from '@/data/rankings-september-2026'

export function getRankingSitemapPaths(): string[] {
  return [
    '/carros-mais-vendidos-brasil/setembro-2026',
    ...SEPTEMBER_2026_NEW_RANKINGS.map((item) => `/carros-mais-vendidos-brasil/setembro-2026/${item.slug}`),
  ]
}

export function buildRankingStructuredData({
  canonicalUrl,
  brand,
  model,
  periodLabel,
}: {
  canonicalUrl: string
  brand: string
  model: string
  periodLabel: string
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${brand} ${model}: emplacamentos em ${periodLabel}`,
    description: `Posição e quantidade de emplacamentos do ${brand} ${model} no recorte informado, com fontes e método apresentados na página.`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    author: { '@type': 'Organization', name: 'Carbi' },
    publisher: { '@type': 'Organization', name: 'Carbi' },
  }
}
