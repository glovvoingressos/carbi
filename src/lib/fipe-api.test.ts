import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('getFipePrice', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = String(input)
      let body: unknown

      if (url.endsWith('/references')) {
        body = [{ code: '337', month: 'julho/2026' }]
      } else if (url.endsWith('/cars/brands')) {
        body = [{ code: '21', name: 'Chevrolet' }]
      } else if (url.includes('/cars/brands/21/models?')) {
        body = [{ code: '5448', name: 'Tracker LT 1.4 Turbo 16V Aut.' }]
      } else if (url.includes('/cars/brands/21/models/5448/years/2018-1?')) {
        body = {
          price: 'R$ 75.000,00',
          brand: 'Chevrolet',
          model: 'Tracker LT 1.4 Turbo 16V Aut.',
          modelYear: 2018,
          fuel: 'Gasolina',
          codeFipe: '004462-1',
          referenceMonth: 'julho/2026',
          vehicleType: 1,
          fuelAcronym: 'G',
        }
      } else if (url.includes('/cars/brands/21/models/5448/years?')) {
        body = [{ code: '2018-1', name: '2018 Gasolina' }]
      } else {
        throw new Error(`Unexpected FIPE request: ${url}`)
      }

      return { ok: true, json: async () => body } as Response
    }))
  })

  it('requests the target model year only once while resolving a price', async () => {
    const { getFipePrice } = await import('./fipe-api')

    const result = await getFipePrice('Chevrolet', 'Tracker', 2018, 'LT 1.4 Turbo')

    const yearRequests = vi.mocked(fetch).mock.calls.filter(([input]) =>
      String(input).includes('/cars/brands/21/models/5448/years?'),
    )
    expect(result?.price).toBe('R$ 75.000,00')
    expect(yearRequests).toHaveLength(1)
  })

  it('reuses the resolved version when building FIPE history', async () => {
    const { getFipeMonthlyHistory } = await import('./fipe-api')

    const result = await getFipeMonthlyHistory('Chevrolet', 'Tracker', 2018, 'LT 1.4 Turbo', 1)

    const yearRequests = vi.mocked(fetch).mock.calls.filter(([input]) =>
      String(input).includes('/cars/brands/21/models/5448/years?'),
    )
    expect(result).toHaveLength(1)
    expect(yearRequests).toHaveLength(1)
  })

  it('does not retry FIPE requests before the Retry-After window ends', async () => {
    const fetchMock = vi.mocked(fetch)
    const successfulResponse = fetchMock.getMockImplementation()
    let rateLimitedOnce = false
    fetchMock.mockImplementation(async (input) => {
      if (!rateLimitedOnce && String(input).includes('/cars/brands/21/models/5448/years?')) {
        rateLimitedOnce = true
        return { ok: false, status: 429, headers: new Headers({ 'Retry-After': '30' }) } as Response
      }
      return successfulResponse!(input)
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { getFipePrice } = await import('./fipe-api')

    const result = await getFipePrice('Chevrolet', 'Tracker', 2018, 'LT 1.4 Turbo')
    const callsAfterLimit = fetchMock.mock.calls.length
    const retry = await getFipePrice('Chevrolet', 'Tracker', 2018, 'LT 1.4 Turbo')

    expect(result).toBeNull()
    expect(retry).toBeNull()
    expect(fetchMock.mock.calls).toHaveLength(callsAfterLimit)
    expect(warn).toHaveBeenCalledOnce()
    expect(error).not.toHaveBeenCalled()
  })

  it('reuses successful monthly history for the same vehicle and model year', async () => {
    const { getFipeMonthlyHistory } = await import('./fipe-api')

    const first = await getFipeMonthlyHistory('Chevrolet', 'Tracker', 2018, 'LT 1.4 Turbo', 1)
    const callsAfterFirstHistory = vi.mocked(fetch).mock.calls.length
    const second = await getFipeMonthlyHistory('Chevrolet', 'Tracker', 2018, 'LT 1.4 Turbo', 1)

    expect(first).toHaveLength(1)
    expect(second).toEqual(first)
    expect(vi.mocked(fetch).mock.calls).toHaveLength(callsAfterFirstHistory)
  })

  it('stops monthly history requests after the first rate-limit response', async () => {
    const fetchMock = vi.mocked(fetch)
    const successfulResponse = fetchMock.getMockImplementation()
    fetchMock.mockImplementation(async (input) => {
      const url = String(input)
      if (url.endsWith('/references')) {
        return {
          ok: true,
          json: async () => [
            { code: '337', month: 'setembro/2026' },
            { code: '336', month: 'agosto/2026' },
            { code: '335', month: 'julho/2026' },
          ],
        } as Response
      }
      if (url.includes('/years/2018-1?reference=335')) {
        return {
          ok: true,
          json: async () => ({ price: 'R$ 75.000,00' }),
        } as Response
      }
      if (url.includes('/years/2018-1?reference=336')) {
        return { ok: false, status: 429, headers: new Headers({ 'Retry-After': '30' }) } as Response
      }
      if (url.includes('/years/2018-1?reference=337')) {
        throw new Error('A consulta deve parar após o primeiro 429')
      }
      return successfulResponse!(input)
    })

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    warn.mockClear()
    const { getFipeMonthlyHistory } = await import('./fipe-api')
    const result = await getFipeMonthlyHistory('Chevrolet', 'Tracker', 2018, 'LT 1.4 Turbo', 3)

    const monthlyRequests = fetchMock.mock.calls.filter(([input]) =>
      String(input).includes('/years/2018-1?reference='),
    )
    expect(result).toHaveLength(1)
    expect(monthlyRequests).toHaveLength(2)
    expect(warn).toHaveBeenCalledOnce()
  })
})
