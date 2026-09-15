import {
  JULY_2026_NEW_RANKINGS,
  JULY_2026_USED_RANKINGS,
  STATE_RANKINGS_DATA,
} from '@/data/rankings-july-2026'

const RANKING_PERIOD = 'julho-2026'

export function getRankingSitemapPaths(): string[] {
  const modelSlugs = new Set([
    ...JULY_2026_NEW_RANKINGS.map((item) => item.slug),
    ...JULY_2026_USED_RANKINGS.map((item) => item.slug),
  ])

  return [
    '/carros-mais-vendidos-brasil',
    `/carros-mais-vendidos-brasil/${RANKING_PERIOD}`,
    ...Array.from(modelSlugs, (slug) => `/carros-mais-vendidos-brasil/${RANKING_PERIOD}/${slug}`),
    ...Object.keys(STATE_RANKINGS_DATA).map((state) => `/carros-mais-vendidos/${state}`),
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
    headline: `${brand} ${model}: vendas e preço FIPE em ${periodLabel}`,
    description: `Relatório de vendas e FIPE do ${brand} ${model} em ${periodLabel}.`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    author: {
      '@type': 'Organization',
      name: 'Carbi',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Carbi',
    },
  }
}
