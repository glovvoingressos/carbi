// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MemberOverview, { type MemberConversation } from './MemberOverview'
import type AccountLayout from './AccountLayout'
import type { AccountWorkspaceListing } from './AccountLayout'
import MinhaContaPage from '@/app/minha-conta/page'
type SessionFixture = {
  user: { id: string; email: string }
  access_token: string
}

type ShellProps = React.ComponentProps<typeof AccountLayout>
type OverviewProps = React.ComponentProps<typeof MemberOverview>
type ShellStat = { label: string; value: string | number }

function readShellStats(): ShellStat[] {
  return JSON.parse(screen.getByTestId('shell-stats').textContent || '[]') as ShellStat[]
}

function readShellListings(): AccountWorkspaceListing[] {
  return JSON.parse(screen.getByTestId('shell-listings').textContent || '[]') as AccountWorkspaceListing[]
}

const mocks = vi.hoisted(() => ({
  params: new URLSearchParams(), router: { replace: vi.fn() },
  session: { user: { id: 'user-1', email: 'member@example.test' }, access_token: 'test-token' } as SessionFixture | null,
  metricError: false, ranges: [] as number[], conversationError: false, listingError: false,
  profileReads: vi.fn(),
}))

vi.mock('next/navigation', () => ({ useRouter: () => mocks.router, useSearchParams: () => mocks.params, usePathname: () => '/minha-conta' }))
vi.mock('next/link', () => ({ default: ({ children, href, ...props }: React.PropsWithChildren<{ href: string }>) => <a href={href} {...props}>{children}</a> }))
vi.mock('@/components/marketplace/AccountLayout', () => ({
  default: ({ children, stats = [], listings = [], listingsError, onListingsRetry }: ShellProps) => (
    <div>
      <div data-testid="shell-stats">{JSON.stringify(stats.map(({ label, value }) => ({ label, value })))}</div>
      <div data-testid="shell-listings">{JSON.stringify(listings)}</div>
      {listingsError && (
        <div data-testid="shell-listings-error">
          {listingsError}
          <button onClick={onListingsRetry}>Retry shell listings</button>
        </div>
      )}
      {children}
    </div>
  ),
}))
vi.mock('@/components/marketplace/ProfilePanel', () => ({ default: ({ onProfileUpdate }: { onProfileUpdate: () => void }) => <button onClick={onProfileUpdate}>Atualizar perfil</button> }))
vi.mock('@/lib/supabase-browser', () => ({
  isSupabaseBrowserConfigured: () => true,
  getSupabaseBrowserClient: () => ({
    auth: { getSession: async () => ({ data: { session: mocks.session }, error: null }) },
    from: (table: string) => {
      let head = false, active = false, offset = 0
      const query = {
        select: (_fields: string, options?: { head: boolean }) => { head = Boolean(options?.head); return query },
        eq: (key: string) => { if (key === 'status') active = true; return query },
        order: () => query,
        range: (start: number) => { offset = start; mocks.ranges.push(start); return query },
        abortSignal: () => query,
        maybeSingle: async () => {
          mocks.profileReads()
          return { data: { full_name: 'Test Member', phone: '', avatar_url: '' }, error: null }
        },
        then: (resolve: (value: unknown) => void) => resolve(table === 'users' ? { data: null, error: null } : head
          ? { count: active ? 400 : 501, error: mocks.metricError ? new Error('Unavailable') : null }
          : { data: offset === 0 ? Array.from({ length: 500 }, (_, id) => ({ id, view_count: 2 })) : [{ id: 500, view_count: 7 }], error: null }),
      }
      return query
    },
  }),
}))

const listing: AccountWorkspaceListing = { id: 'vehicle-1', title: 'Honda Civic', brand: 'Honda', model: 'Civic', price: 85000, status: 'active', year: 2022, year_model: 2023, mileage: 12000, created_at: '2026-09-25T12:00:00Z', slug: 'honda-civic', images: [{ public_url: '/real-listing.jpg', sort_order: 1 }, { public_url: '/primary-listing.jpg', is_primary: true, sort_order: 2 }] }
const otherListing: AccountWorkspaceListing = { ...listing, id: 'vehicle-2', title: 'Toyota Corolla', price: 112000 }
const conversation: MemberConversation = { id: 'conversation-1', listing_id: 'vehicle-1', is_unread: true, last_message_preview: 'O carro ainda está disponível?', last_message_at: '2026-09-28T12:00:00Z', created_at: '2026-09-26T12:00:00Z', vehicle_listings_public: { id: 'vehicle-1', title: 'Honda Civic', slug: 'honda-civic', images: [{ url: '/real-conversation.jpg' }] } }
const ready = { loading: false, error: null }
const base: OverviewProps = { listings: [listing, otherListing], conversations: [conversation], metrics: { totalListings: 501, activeListings: 400, totalViews: 1007 }, selectedVehicleId: null, listingState: ready, conversationState: ready, metricState: ready, onRetry: vi.fn() }

beforeEach(() => {
  mocks.params = new URLSearchParams()
  mocks.session = { user: { id: 'user-1', email: 'member@example.test' }, access_token: 'test-token' }
  mocks.metricError = false
  mocks.conversationError = false
  mocks.listingError = false
  mocks.ranges.length = 0
  mocks.router.replace.mockReset()
  mocks.profileReads.mockReset()
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.includes('conversations') && mocks.conversationError) throw new Error('Network unavailable')
    if (url.includes('my-listings') && mocks.listingError) throw new Error('Network unavailable')
    return { ok: true, json: async () => url.includes('conversations') ? [conversation] : [listing, otherListing] }
  }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('MemberOverview', () => {
  it('shows real conversation preview, unread state, deep link and exact totals', () => {
    render(<MemberOverview {...base} />)
    expect(screen.getByText('O carro ainda está disponível?')).toBeTruthy()
    expect(screen.getByText('1 conversa não lida')).toBeTruthy()
    expect(screen.getByText('1.007')).toBeTruthy()
    expect(screen.getByText('O carro ainda está disponível?').closest('a')?.getAttribute('href')).toBe('/minha-conta/conversas?conversation=conversation-1')
    expect(screen.getByRole('link', { name: 'Criar anúncio' }).getAttribute('href')).toBe('/anunciar-carro')
    expect(screen.queryByRole('button', { name: 'Atualizar perfil' })).toBeNull()
  })

  it('filters both feeds and changes the selected price when selection changes', () => {
    const view = render(<MemberOverview {...base} selectedVehicleId="vehicle-1" />)
    expect(screen.getByText(/85.000/)).toBeTruthy()
    expect(screen.queryByText('Toyota Corolla')).toBeNull()
    expect(screen.getAllByAltText('Honda Civic').some((image) => image.getAttribute('src') === '/real-conversation.jpg')).toBe(true)
    view.rerender(<MemberOverview {...base} selectedVehicleId="vehicle-2" />)
    expect(screen.getByText(/112.000/)).toBeTruthy()
    expect(screen.queryByText('O carro ainda está disponível?')).toBeNull()
    expect(screen.getByText('Nenhuma conversa sobre este veículo')).toBeTruthy()
  })

  it('does not present zero unread or stale conversations when the request fails', () => {
    const retry = vi.fn()
    render(<MemberOverview {...base} conversationState={{ loading: false, error: 'Conversas indisponíveis' }} onRetry={retry} />)
    expect(screen.getByRole('alert').textContent).toContain('Conversas indisponíveis')
    expect(screen.queryByText('Você está em dia com as conversas.')).toBeNull()
    expect(screen.queryByText('Ainda sem conversas')).toBeNull()
    expect(screen.queryByText('O carro ainda está disponível?')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Tentar novamente/ }))
    expect(retry).toHaveBeenCalledOnce()
  })

  it('offers truthful empty states and marks unavailable totals instead of zero', () => {
    render(<MemberOverview {...base} listings={[]} conversations={[]} metrics={{ totalListings: null, totalViews: null, activeListings: null }} metricState={{ loading: false, error: 'Desempenho indisponível' }} />)
    expect(screen.getByText('Sua atividade começa aqui')).toBeTruthy()
    expect(screen.getByText('Ainda sem conversas')).toBeTruthy()
    expect(screen.getByLabelText('Visualizações indisponíveis').textContent).toBe('—')
    expect(screen.getByLabelText('Anúncios ativos indisponíveis').textContent).toBe('—')
  })

  it('shows loading states and handles a missing selected vehicle', () => {
    const view = render(<MemberOverview {...base} listingState={{ loading: true, error: null }} conversationState={{ loading: true, error: null }} />)
    expect(screen.getByRole('status', { name: 'Carregando atividade' })).toBeTruthy()
    expect(screen.getByRole('status', { name: 'Carregando conversas' })).toBeTruthy()
    view.rerender(<MemberOverview {...base} selectedVehicleId="removed" />)
    expect(screen.getByText('Este veículo não está disponível na sua carteira.')).toBeTruthy()
    expect(screen.queryByText(/85.000/)).toBeNull()
  })
})

describe('dashboard data integration', () => {
  it('uses Bearer API requests, joined primary photos, four stats, and all pages of views', async () => {
    render(<MinhaContaPage />)
    await screen.findByText('O carro ainda está disponível?')
    await waitFor(() => expect(screen.getByTestId('shell-stats').textContent).toContain('1007'))
    const stats = readShellStats()
    expect(stats.map((stat) => stat.value)).toEqual([501, 1007, 400, 1])
    expect(mocks.ranges).toEqual([0, 500])
    expect(fetch).toHaveBeenCalledWith('/api/marketplace/conversations', expect.objectContaining({ headers: { Authorization: 'Bearer test-token' } }))
    expect(readShellListings()[0].images?.[0]?.public_url).toBe('/primary-listing.jpg')
  })

  it('keeps independent sources visible, reports failed conversations as unknown, and retries', async () => {
    mocks.conversationError = true
    render(<MinhaContaPage />)
    await screen.findByText('Não foi possível carregar suas conversas.')
    await waitFor(() => expect(screen.getByTestId('shell-stats').textContent).toContain('1007'))
    expect(readShellStats()[3].value).toBe('—')
    expect(screen.getAllByText('Anúncio criado')).toHaveLength(2)
    expect(screen.queryByText('Você está em dia com as conversas.')).toBeNull()
    mocks.conversationError = false
    fireEvent.click(screen.getByRole('button', { name: /Tentar novamente/ }))
    await screen.findByText('O carro ainda está disponível?')
    expect(readShellStats()[3].value).toBe(1)
  })

  it('only mounts ProfilePanel for tab=perfil and preserves its update callback', async () => {
    mocks.params = new URLSearchParams('tab=perfil&vehicle=vehicle-1')
    render(<MinhaContaPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Atualizar perfil' }))
    expect(screen.queryByText('Atividade recente')).toBeNull()
    await waitFor(() => expect(mocks.profileReads).toHaveBeenCalledTimes(2))
  })

  it('passes listing failures and a working retry to the shell while keeping exact stats', async () => {
    mocks.listingError = true
    render(<MinhaContaPage />)
    expect((await screen.findByTestId('shell-listings-error')).textContent).toContain('Não foi possível carregar seus anúncios.')
    await waitFor(() => expect(screen.getByTestId('shell-stats').textContent).toContain('1007'))
    expect(readShellStats()[0].value).toBe(501)
    mocks.listingError = false
    fireEvent.click(screen.getByRole('button', { name: 'Retry shell listings' }))
    await waitFor(() => expect(screen.queryByTestId('shell-listings-error')).toBeNull())
    await waitFor(() => expect(readShellListings()).toHaveLength(2))
  })

  it('keeps the existing unauthenticated redirect', async () => {
    mocks.session = null
    render(<MinhaContaPage />)
    await waitFor(() => expect(mocks.router.replace).toHaveBeenCalledWith('/entrar?redirect=/minha-conta'))
    expect(fetch).not.toHaveBeenCalled()
  })

})
