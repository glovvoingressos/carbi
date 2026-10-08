// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ListingPublic } from '@/lib/marketplace'
import HomeListings from './HomeListings'

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }))

vi.mock('next/font/google', () => ({ Barlow_Condensed: () => ({ variable: '--hh-font' }) }))
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock('@/components/marketplace/MarketplaceListingImage', () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}))

vi.mock('@/components/ui/select', async () => {
  const React = await import('react')
  const SelectContext = React.createContext<(value: string) => void>(() => {})

  return {
    Select: ({ value, onValueChange, children }: { value: string; onValueChange: (value: string) => void; children: React.ReactNode }) => (
      <SelectContext.Provider value={onValueChange}>
        <div data-select-value={value}>{children}</div>
      </SelectContext.Provider>
    ),
    SelectTrigger: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button type="button" role="combobox" {...props}>{children}</button>
    ),
    SelectValue: () => null,
    SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => {
      const onValueChange = React.useContext(SelectContext)
      return <button type="button" role="option" onClick={() => onValueChange(value)}>{children}</button>
    },
  }
})

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(),
}))

function makeListing(overrides: Partial<ListingPublic> = {}): ListingPublic {
  return {
    id: 'listing-1',
    user_id: 'user-1',
    title: 'Carro anunciado',
    description: 'Descrição do anúncio',
    vehicle_type: 'car',
    brand: 'Marca',
    model: 'Modelo',
    version: null,
    year: 2024,
    year_model: 2024,
    mileage: 10000,
    price: 50000,
    transmission: 'Automático',
    fuel: 'Flex',
    color: 'Preto',
    body_type: 'Sedan',
    city: 'São Paulo',
    state: 'SP',
    optional_items: [],
    engine: null,
    horsepower: null,
    plate_final: null,
    doors: 4,
    fipe_price: null,
    fipe_difference_value: null,
    fipe_difference_percent: null,
    fipe_reference_month: null,
    status: 'active',
    slug: 'marca-modelo',
    published_at: '2026-09-01T10:00:00.000Z',
    created_at: '2026-09-01T10:00:00.000Z',
    updated_at: '2026-09-01T10:00:00.000Z',
    images: [],
    ...overrides,
  }
}

describe('HomeListings', () => {
  afterEach(() => {
    cleanup()
    replace.mockClear()
  })

  it('sorts the loaded cards by the selected price order', () => {
    const listings = [
      makeListing({ id: 'expensive', slug: 'expensive', price: 90000 }),
      makeListing({ id: 'cheap', slug: 'cheap', price: 20000 }),
      makeListing({ id: 'middle', slug: 'middle', price: 50000 }),
    ]

    render(<HomeListings listings={listings} />)

    fireEvent.click(screen.getByRole('option', { name: 'Menor preço' }))

    expect(screen.getAllByTestId('home-listing-card')[0].getAttribute('href')).toBe('/anuncios/cheap')
    expect(replace).toHaveBeenCalledWith('/?ordem=price_asc', { scroll: false })
  })

  it('reveals six more loaded cards at a time until the full list is visible', () => {
    const listings = Array.from({ length: 13 }, (_, index) => makeListing({
      id: `listing-${index}`,
      slug: `listing-${index}`,
    }))

    render(<HomeListings listings={listings} />)

    expect(screen.getAllByTestId('home-listing-card')).toHaveLength(6)
    expect(screen.queryByText('Mostrando 6 de 12 anúncios')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar mais anúncios' }))
    expect(screen.getAllByTestId('home-listing-card')).toHaveLength(12)

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar mais anúncios' }))
    expect(screen.getAllByTestId('home-listing-card')).toHaveLength(13)
    expect(screen.queryByRole('button', { name: 'Mostrar mais anúncios' })).toBeNull()
  })
})
