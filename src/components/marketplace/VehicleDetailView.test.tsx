// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ListingPublic } from '@/lib/marketplace'

vi.mock('next/link', () => ({ default: ({ children, ...props }: any) => <a {...props}>{children}</a> }))
vi.mock('@/lib/supabase-browser', () => ({ isSupabaseBrowserConfigured: () => false, getSupabaseBrowserClient: vi.fn() }))
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }))
vi.mock('./ListingImageGallery', () => ({ default: () => <div /> }))
vi.mock('./ChatStarter', () => ({ default: () => <div /> }))
vi.mock('./OfferHistory', () => ({ default: () => <div /> }))
vi.mock('@/components/animations/ConfirmModal', () => ({ default: () => null }))
vi.mock('@/components/animations/Tooltip', () => ({ default: ({ children }: any) => children }))

import VehicleDetailView from './VehicleDetailView'

describe('VehicleDetailView FIPE cards', () => {
  afterEach(() => cleanup())

  it('keeps the FIPE comparison visible and omits history when no price is available', () => {
    const listing = {
      id: 'listing-1',
      user_id: 'seller-1',
      slug: 'chev-tracker',
      title: 'Chevrolet Tracker LT',
      description: '',
      vehicle_type: 'car',
      brand: 'Chevrolet',
      model: 'Tracker',
      version: 'LT',
      year: 2018,
      year_model: 2018,
      mileage: 100000,
      price: 75800,
      transmission: 'Automático',
      fuel: 'Flex',
      color: 'Preto',
      body_type: 'SUV',
      city: 'Maringá',
      state: 'PR',
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
      published_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      images: [],
    } as ListingPublic

    render(
      <VehicleDetailView
        listing={listing}
        sellerInfo={null}
        relatedListings={[]}
        comparison={{ status: 'unknown', diffPercent: null }}
        currentFipePrice={null}
      />,
    )

    expect(screen.getByText('Comparativo FIPE')).toBeTruthy()
    expect(screen.getByText('FIPE indisponível')).toBeTruthy()
    expect(screen.queryByText('Histórico FIPE')).toBeNull()
  })

  it('shows the saved FIPE reference month with the current snapshot', () => {
    const listing = {
      id: 'listing-2',
      user_id: 'seller-1',
      slug: 'tiggo-7',
      title: 'Caoa Chery Tiggo 7',
      description: '',
      vehicle_type: 'car',
      brand: 'CAOA CHERY',
      model: 'Tiggo 7 Pro PHEV',
      version: 'Super Hybrid',
      year: 2027,
      year_model: 2027,
      mileage: 1000,
      price: 200000,
      transmission: 'Automático',
      fuel: 'Híbrido',
      color: 'Preto',
      body_type: 'SUV',
      city: 'Maringá',
      state: 'PR',
      optional_items: [],
      engine: null,
      horsepower: null,
      plate_final: null,
      doors: 4,
      fipe_price: 189024,
      fipe_difference_value: null,
      fipe_difference_percent: null,
      fipe_reference_month: 'setembro/2026',
      status: 'active',
      published_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      images: [],
    } as ListingPublic

    render(
      <VehicleDetailView
        listing={listing}
        sellerInfo={null}
        relatedListings={[]}
        comparison={{ status: 'above', diffPercent: 5 }}
        currentFipePrice={189024}
      />,
    )

    expect(screen.getByText('Tabela FIPE · referência setembro/2026')).toBeTruthy()
    expect(screen.queryByText('Histórico FIPE')).toBeNull()
  })
})
