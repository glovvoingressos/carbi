import { describe, expect, it } from 'vitest'
import { assertSitemapUrlLimit, buildImageSitemapXml, MAX_SITEMAP_URLS } from '@/lib/sitemap-xml'

describe('sitemap XML helpers', () => {
  it('escapes XML values and includes at most five sorted images per listing', () => {
    const images = Array.from({ length: 6 }, (_, index) => ({
      url: `https://img.example/car-${index}?a=1&b=<x>`,
      sort_order: 5 - index,
    }))
    const xml = buildImageSitemapXml([{ path: '/anuncios/carro&x', images }], 'https://www.carbi.com.br')

    expect(xml).toContain('https://www.carbi.com.br/anuncios/carro&amp;x')
    expect(xml).toContain('https://img.example/car-5?a=1&amp;b=&lt;x&gt;')
    expect(xml.match(/<image:image>/g)).toHaveLength(5)
  })

  it('allows the configured safe count and rejects sitemaps that exceed it', () => {
    expect(assertSitemapUrlLimit(Array.from({ length: MAX_SITEMAP_URLS }))).toHaveLength(MAX_SITEMAP_URLS)
    expect(() => assertSitemapUrlLimit(Array.from({ length: MAX_SITEMAP_URLS + 1 }))).toThrow('split it')
  })
})
