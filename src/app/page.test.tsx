// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { getLatestPublicListings, searchPublicListings } = vi.hoisted(() => ({
  getLatestPublicListings: vi.fn().mockResolvedValue([]),
  searchPublicListings: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/lib/marketplace-server', () => ({ getLatestPublicListings, searchPublicListings }))
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))
vi.mock('@/components/marketplace/MarketplaceListingImage', () => ({
  default: ({ alt, imageUrls }: { alt: string; imageUrls?: string[] }) => (
    <img src={imageUrls?.[0] ?? ''} alt={alt} />
  ),
}))
vi.mock('@/components/home/ModelComparison', () => ({ default: () => null }))
vi.mock('@/components/home/RankingsBanner', () => ({ default: () => null }))
vi.mock('@/components/home/HomeCounters', () => ({ default: () => null }))
vi.mock('@/components/marketplace/PlateBannerLookup', () => ({ default: () => null }))
vi.mock('@/components/home/ExploreCarousel', () => ({ default: () => null }))
vi.mock('@/components/home/HomeListings', () => ({ default: () => null }))

import HomePage from './page'

describe('HomePage featured seller card', () => {
  beforeEach(() => {
    getLatestPublicListings.mockResolvedValue([])
    searchPublicListings.mockResolvedValue([])
  })

  afterEach(() => {
    cleanup()
  })

  it('keeps the supplied image before the copy inside the existing seller link', async () => {
    const page = await HomePage()
    render(page)

    const card = screen.getByRole('link', { name: /Anuncie grátis em 2 minutos/ })
    const image = within(card).getByRole('img', { name: 'SUV elétrico OMODA em fundo tecnológico' })
    const copy = within(card).getByText('Anuncie grátis em 2 minutos')

    expect(image.compareDocumentPosition(copy) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(card.getAttribute('href')).toBe('/anunciar-carro')
    expect(within(card).getByText('Anunciar meu carro')).toBeTruthy()
  })

  it('omits the category tags from all three build cards', async () => {
    const page = await HomePage()
    render(page)

    expect(screen.queryAllByText('Para vender')).toHaveLength(0)
    expect(screen.queryAllByText('Para comparar')).toHaveLength(0)
  })

  it('does not create a catalog fallback when no real Peugeot 2008 GT listing is available', async () => {
    const page = await HomePage()
    render(page)

    expect(screen.queryByTestId('home-featured-listing')).toBeNull()
    expect(screen.queryByText('Referência do catálogo')).toBeNull()
    expect(screen.getByRole('heading', { name: 'Os anúncios mais procurados desta semana' })).toBeTruthy()
  })

  it('uses the real Peugeot 2008 GT marketplace listing data', async () => {
    searchPublicListings.mockResolvedValueOnce([{
      brand: 'Peugeot',
      model: '2008',
      version: 'GT T200',
      year: 2024,
      year_model: 2024,
      price: 119900,
      description: 'Peugeot 2008 GT com revisão em dia.',
      fuel: 'Flex',
      transmission: 'Automático',
      horsepower: 130,
      slug: 'peugeot-2008-gt-real',
      images: [{ url: '/uploads/peugeot-2008-gt-real.jpg' }],
    }])

    const page = await HomePage()
    render(page)

    const featured = screen.getByTestId('home-featured-listing')
    expect(within(featured).getByRole('heading', { name: '2008' })).toBeTruthy()
    expect(within(featured).getByRole('img', { name: 'Peugeot 2008 2024' }).getAttribute('src')).toBe('/uploads/peugeot-2008-gt-real.jpg')
    expect(within(featured).getByText('R$ 119.900')).toBeTruthy()
    expect(within(featured).queryByText('Peugeot 2008 GT com revisão em dia.')).toBeNull()
    expect(within(featured).getByText('Anúncio publicado')).toBeTruthy()
    expect(featured.getAttribute('href')).toBe('/anuncios/peugeot-2008-gt-real')
  })

  it('removes the buyer shortcut section from the home flow', async () => {
    const page = await HomePage()
    render(page)

    expect(screen.queryByRole('heading', { name: 'Comprar' })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Encontre o seu estilo' })).toBeTruthy()
  })
})
