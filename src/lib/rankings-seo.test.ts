import { describe, expect, it } from 'vitest'
import { buildRankingStructuredData, getRankingSitemapPaths } from './rankings-seo'

describe('ranking SEO metadata helpers', () => {
  it('exposes only sourced ranking and model pages in the sitemap', () => {
    const paths = getRankingSitemapPaths()

    expect(paths).toContain('/carros-mais-vendidos-brasil/setembro-2026')
    expect(paths).toContain('/carros-mais-vendidos-brasil/setembro-2026/fiat-strada')
    expect(paths).not.toContain('/carros-mais-vendidos-brasil')
    expect(paths).not.toContain('/carros-mais-vendidos/sao-paulo')
  })

  it('describes a ranking report as an article instead of a product', () => {
    const schema = buildRankingStructuredData({
      canonicalUrl: 'https://www.carbi.com.br/carros-mais-vendidos-brasil/setembro-2026/fiat-strada',
      brand: 'Fiat',
      model: 'Strada',
      periodLabel: 'Setembro / 2026 · 1ª quinzena',
    })

    expect(schema['@type']).toBe('Article')
    expect(schema).not.toHaveProperty('offers')
    expect(schema.mainEntityOfPage).toEqual({
      '@type': 'WebPage',
      '@id': 'https://www.carbi.com.br/carros-mais-vendidos-brasil/setembro-2026/fiat-strada',
    })
    expect(schema.author).toEqual({ '@type': 'Organization', name: 'Carbi' })
  })
})
