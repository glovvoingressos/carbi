// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MyListingsDashboard from './MyListingsDashboard'

const mocks = vi.hoisted(() => ({ query: new URLSearchParams(), push: vi.fn(), confirm: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }), useSearchParams: () => mocks.query }))
vi.mock('@/lib/supabase-browser', () => ({
  isSupabaseBrowserConfigured: () => true,
  getSupabaseBrowserClient: () => ({ auth: {
    getSession: async () => ({ data: { session: { access_token: 'test-token', user: { id: 'member' } } } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
  } }),
}))
vi.mock('./PlateInput', () => ({ default: () => null }))
vi.mock('./MarketplaceListingImage', () => ({ default: () => null }))
vi.mock('@/components/marketplace/AuthCard', () => ({ default: () => <p>Entrar</p> }))

const listings = ['first', 'second'].map((id, i) => ({
  id, slug: id, title: `Veículo ${i + 1}`, description: 'Descrição completa do veículo', vehicle_type: 'car',
  brand: 'Toyota', model: 'Corolla', version: '', year: 2023, year_model: 2024, mileage: 12000,
  price: 90000, city: 'São Paulo', state: 'SP', status: 'active', transmission: 'Manual', fuel: 'Flex',
  color: 'Prata', body_type: 'Sedan', optional_items: [], images: [], view_count: 12,
}))
const titleField = () => screen.getByPlaceholderText('Ex: Toyota Corolla 2.0 XEi 2024') as HTMLInputElement
const selectedButton = () => document.querySelector('.member-tools-listing[aria-pressed="true"]')

describe('member listings selection and editor', () => {
  beforeEach(() => {
    mocks.query = new URLSearchParams('vehicle=second')
    mocks.confirm.mockReturnValue(false)
    vi.stubGlobal('confirm', mocks.confirm)
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => listings })))
  })
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks() })

  it('opens the requested vehicle and keeps manual selection across rerenders and filters', async () => {
    const view = render(<MyListingsDashboard />)
    await waitFor(() => expect(titleField().value).toBe('Veículo 2'))
    fireEvent.click(screen.getByRole('button', { name: /Veículo 1/ }))
    await waitFor(() => expect(titleField().value).toBe('Veículo 1'))
    view.rerender(<MyListingsDashboard />)
    fireEvent.change(screen.getByLabelText('Buscar anúncio'), { target: { value: 'Veículo' } })
    expect(titleField().value).toBe('Veículo 1')
    expect(selectedButton()?.textContent).toContain('Veículo 1')
    expect(mocks.confirm).not.toHaveBeenCalled()
  })

  it.each(['', 'vehicle=missing'])('falls back safely for query %s', async (query) => {
    mocks.query = new URLSearchParams(query)
    render(<MyListingsDashboard />)
    await waitFor(() => expect(titleField().value).toBe('Veículo 1'))
  })

  it('handles an empty inventory without selecting a nonexistent vehicle', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [] } as unknown as Response)
    render(<MyListingsDashboard />)
    await screen.findByText('Nenhum anúncio')
    expect(screen.queryByPlaceholderText('Ex: Toyota Corolla 2.0 XEi 2024')).toBeNull()
  })

  it('applies a changed URL once and retains unsaved edits when switching is cancelled', async () => {
    const view = render(<MyListingsDashboard />)
    await waitFor(() => expect(titleField().value).toBe('Veículo 2'))
    fireEvent.change(titleField(), { target: { value: 'Título pendente' } })
    mocks.query = new URLSearchParams('vehicle=first')
    view.rerender(<MyListingsDashboard />)
    await waitFor(() => expect(mocks.confirm).toHaveBeenCalledTimes(1))
    expect(titleField().value).toBe('Título pendente')
    view.rerender(<MyListingsDashboard />)
    expect(mocks.confirm).toHaveBeenCalledTimes(1)
    const unload = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(unload)
    expect(unload.defaultPrevented).toBe(true)
    mocks.confirm.mockReturnValue(true)
    fireEvent.click(screen.getByRole('button', { name: /Veículo 1/ }))
    await waitFor(() => expect(titleField().value).toBe('Veículo 1'))
  })

  it('changes the vehicle when a new valid URL arrives without edits', async () => {
    const view = render(<MyListingsDashboard />)
    await waitFor(() => expect(titleField().value).toBe('Veículo 2'))
    mocks.query = new URLSearchParams('vehicle=first')
    view.rerender(<MyListingsDashboard />)
    await waitFor(() => expect(titleField().value).toBe('Veículo 1'))
    expect(mocks.confirm).not.toHaveBeenCalled()
  })

  it('saves edited status to the requested vehicle without reinitializing the form', async () => {
    render(<MyListingsDashboard />)
    await waitFor(() => expect(titleField().value).toBe('Veículo 2'))
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'paused' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar anúncio' }))
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/marketplace/listings/second', expect.objectContaining({
      method: 'PATCH', headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      body: expect.stringContaining('"status":"paused"'),
    })))
    await screen.findByText('Alterações salvas')
    expect((screen.getAllByRole('combobox')[0] as HTMLSelectElement).value).toBe('paused')
    expect(screen.getByRole('link', { name: 'Ver ao vivo →' }).getAttribute('href')).toBe('/anuncios/second')
  })
})
