import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type FipeYear = { name: string; code: string }

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

async function getPrice(
  versions: FipeYear[],
  options: { modelYear?: number; modelName?: string; version?: string } = {},
) {
  const modelYear = options.modelYear ?? 2025
  const modelName = options.modelName ?? 'Model Sport'
  const version = options.version ?? 'Sport'
  vi.resetModules()
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const path = new URL(String(input)).pathname
    if (path.endsWith('/references')) return jsonResponse([{ code: '2026-10', month: 'October 2026' }])
    if (path === '/api/v2/cars/brands') return jsonResponse([{ name: 'Test', code: '1' }])
    if (path === '/api/v2/cars/brands/1/models') return jsonResponse([{ name: modelName, code: '10' }])
    if (path === '/api/v2/cars/brands/1/models/10/years') return jsonResponse(versions)
    if (path.startsWith('/api/v2/cars/brands/1/models/10/years/')) {
      return jsonResponse({
        price: 'R$ 100.000,00',
        brand: 'Test',
        model: modelName,
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
  return getFipePrice('Test', 'Model', 2025, version)
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
    const result = await getPrice([{ name: '2025 Sport', code: '2025-1' }], { modelYear: 2024 })

    expect(result).toBeNull()
  })

  it('accepts the FIPE v2 fuel-only year label when the trim was resolved by the model', async () => {
    const result = await getPrice([{ name: '2025 Flex', code: '2025-5' }])

    expect(result?.modelYear).toBe(2025)
    expect(result?.referenceMonth).toBe('October 2026')
  })

  it('uses the fuel hinted by the model name when the year has several variants', async () => {
    const result = await getPrice(
      [
        { name: '2025 Flex', code: '2025-5' },
        { name: '2025 Diesel', code: '2025-3' },
      ],
      { modelName: 'Model Sport 2.0 Diesel' },
    )

    expect(result?.modelYear).toBe(2025)
  })

  it('returns no price when the year has several fuel variants and no fuel hint', async () => {
    const result = await getPrice([
      { name: '2025 Flex', code: '2025-5' },
      { name: '2025 Diesel', code: '2025-3' },
    ])

    expect(result).toBeNull()
  })
})
