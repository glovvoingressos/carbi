// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { getLatestPublicListings } = vi.hoisted(() => ({
  getLatestPublicListings: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/lib/marketplace-server', () => ({ getLatestPublicListings }))
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))
vi.mock('@/components/marketplace/MarketplaceListingImage', () => ({ default: () => null }))
vi.mock('@/components/home/ModelComparison', () => ({ default: () => null }))
vi.mock('@/components/home/RankingsBanner', () => ({ default: () => null }))
vi.mock('@/components/home/HomeCounters', () => ({ default: () => null }))
vi.mock('@/components/marketplace/PlateBannerLookup', () => ({ default: () => null }))
vi.mock('@/components/home/ExploreCarousel', () => ({ default: () => null }))

import HomePage from './page'

describe('HomePage featured seller card', () => {
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
})
