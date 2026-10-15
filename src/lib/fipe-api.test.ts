import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type FipeYear = { name: string; code: string }

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

async function getPrice(versions: FipeYear[], modelYear = 2025) {
  vi.resetModules()
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const path = new URL(String(input)).pathname
    if (path.endsWith('/references')) return jsonResponse([{ code: '2026-10', month: 'October 2026' }])
    if (path === '/api/v2/cars/brands') return jsonResponse([{ name: 'Test', code: '1' }])
    if (path === '/api/v2/cars/brands/1/models') return jsonResponse([{ name: 'Model Sport', code: '10' }])
    if (path === '/api/v2/cars/brands/1/models/10/years') return jsonResponse(versions)
    if (path.startsWith('/api/v2/cars/brands/1/models/10/years/')) {
      return jsonResponse({
        price: 'R$ 100.000,00',
        brand: 'Test',
        model: 'Model Sport',
        modelYear,
        fuel: 'Gasolina',
        codeFipe: '001-001',
        referenceMonth: 'October 2026',
        vehicleType: 1,
        fuelAcronym: 'G',
      })
    }
    return new Response('Not found', { status: 404 })
  })
  vi.stubGlobal('fetch', fetchMock)
  const { getFipePrice } = await import('./fipe-api')
  return getFipePrice('Test', 'Model', 2025, 'Sport')
}

describe('getFipePrice', () => {
  beforeEach(() => vi.resetModules())
  afterEach(() => vi.unstubAllGlobals())

  it('returns the single exact trim for the requested model year', async () => {
    const result = await getPrice([{ name: '2025 Sport', code: '2025-1' }])

    expect(result?.modelYear).toBe(2025)
    expect(result?.referenceMonth).toBe('October 2026')
  })

  it('returns no price when the requested trim has no FIPE match', async () => {
    const result = await getPrice([{ name: '2025 Luxury', code: '2025-2' }])

    expect(result).toBeNull()
  })

  it('returns no price when the requested trim matches multiple FIPE entries', async () => {
    const result = await getPrice([
      { name: '2025 Sport Plus', code: '2025-1' },
      { name: '2025 Sport Pro', code: '2025-2' },
    ])

    expect(result).toBeNull()
  })

  it('returns no price when the FIPE detail reports another model year', async () => {
    const result = await getPrice([{ name: '2025 Sport', code: '2025-1' }], 2024)

    expect(result).toBeNull()
  })
})
