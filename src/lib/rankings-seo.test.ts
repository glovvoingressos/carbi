import { describe, expect, it } from 'vitest'
import { buildRankingStructuredData, getRankingSitemapPaths } from './rankings-seo'

describe('ranking SEO metadata helpers', () => {
  it('exposes ranking hubs and model pages in the sitemap', () => {
    const paths = getRankingSitemapPaths()

    expect(paths).toContain('/carros-mais-vendidos-brasil')
    expect(paths).toContain('/carros-mais-vendidos-brasil/julho-2026')
    expect(paths).toContain('/carros-mais-vendidos-brasil/julho-2026/volkswagen-polo')
    expect(paths).toContain('/carros-mais-vendidos/sao-paulo')
  })

  it('describes a ranking report as an article instead of a product', () => {
    const schema = buildRankingStructuredData({
      canonicalUrl: 'https://www.carbi.com.br/carros-mais-vendidos-brasil/julho-2026/volkswagen-polo',
      brand: 'Volkswagen',
      model: 'Polo',
      periodLabel: 'Julho / 2026',
    })

    expect(schema['@type']).toBe('Article')
    expect(schema).not.toHaveProperty('offers')
    expect(schema.mainEntityOfPage).toEqual({
      '@type': 'WebPage',
      '@id': 'https://www.carbi.com.br/carros-mais-vendidos-brasil/julho-2026/volkswagen-polo',
    })
  })
})
