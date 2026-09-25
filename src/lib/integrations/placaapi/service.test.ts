import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getFipePrice } from '@/lib/fipe-api'
import { lookupPlate } from './service'

vi.mock('@/lib/fipe-api', () => ({ getFipePrice: vi.fn() }))

const getFipePriceMock = vi.mocked(getFipePrice)

afterEach(() => {
  vi.unstubAllEnvs()
})

function mockPlateApiResponse(body: Record<string, unknown>) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => body,
  }))
}

describe('lookupPlate FIPE source', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    vi.stubEnv('PLACA_API_TOKEN', 'unit-test-token')
  })

  it('uses the FIPE price and reference returned by Placa API', async () => {
    mockPlateApiResponse({
      MARCA: 'VW',
      MODELO: 'CROSSFOX',
      SUBMODELO: 'CROSSFOX',
      VERSAO: 'CROSSFOX 1.6',
      ano: '2007',
      anoModelo: '2007',
      cor: 'Prata',
      extra: {
        combustivel: 'Alcool / Gasolina',
        cap_maxima_tracao: '198',
        placa: 'INT8C36',
        placa_modelo_antigo: 'INT8236',
        tipo_veiculo: 'Automovel',
      },
      placa: 'INT8C36',
      fipe: {
        dados: [
          { score: 50, texto_valor: 'R$ 26.000,00', mes_referencia: 'abril de 2022' },
          {
            ano_modelo: '2007',
            codigo_fipe: '005225-6',
            codigo_marca: 59,
            codigo_modelo: '2368',
            combustivel: 'Gasolina',
            mes_referencia: 'maio de 2022 ',
            score: 101,
            texto_modelo: 'CROSSFOX 1.6 Mi Total Flex 8V 5p',
            texto_valor: 'R$ 28.799,00',
            tipo_modelo: 1,
          },
        ],
      },
    })

    const result = await lookupPlate('ABC1D23')

    expect(result.data).toMatchObject({
      marca: 'VW',
      modelo: 'CROSSFOX',
      anoFabricacao: 2007,
      anoModelo: 2007,
      combustivel: 'Alcool / Gasolina',
      cmt: 198,
      fipe_price: 28799,
      fipe_reference_month: 'maio de 2022 ',
      fipe_code: '005225-6',
      fipe_model_name: 'CROSSFOX 1.6 Mi Total Flex 8V 5p',
    })
    expect(JSON.stringify(result.data?.structured_data)).not.toContain('INT8C36')
    expect(JSON.stringify(result.data?.structured_data)).not.toContain('INT8236')
    expect(getFipePriceMock).not.toHaveBeenCalled()
  })

  it('does not query another FIPE provider when Placa API has no FIPE value', async () => {
    mockPlateApiResponse({
      marca: 'Toyota',
      modelo: 'Corolla',
      ano_fabricacao: 2020,
      ano_modelo: 2021,
      cor: 'Prata',
      combustivel: 'Flex',
      fipe: { dados: [] },
    })

    const result = await lookupPlate('ABC1D23')

    expect(result.data?.fipe_price ?? null).toBeNull()
    expect(getFipePriceMock).not.toHaveBeenCalled()
  })

  it('removes owner and nested vehicle identifiers from a successful structured response while retaining the FIPE snapshot', async () => {
    mockPlateApiResponse({
      marca: 'VW',
      modelo: 'Gol',
      cpfCnpjProprietario: 'owner-id-fixture',
      nomeProprietario: 'owner-name-fixture',
      extra: {
        cor: 'Prata',
        nested: {
          placa: 'nested-plate-fixture',
          chassis: 'nested-chassis-fixture',
          renavam: 'nested-renavam-fixture',
          token: 'nested-token-fixture',
          safe_field: 'retained-detail',
        },
      },
      fipe: {
        dados: [{
          score: 101,
          texto_valor: 'R$ 28.799,00',
          mes_referencia: 'maio de 2022',
          codigo_fipe: '005225-6',
          metadata: {
            plate: 'fipe-plate-fixture',
            apiToken: 'fipe-token-fixture',
            safe_field: 'retained-fipe-detail',
          },
        }],
      },
    })

    const result = await lookupPlate('ABC1D23')

    expect(result.success).toBe(true)
    expect(result.data?.fipe_price).toBe(28799)
    expect(result.data?.fipe_reference_month).toBe('maio de 2022')
    expect(result.data?.fipe_code).toBe('005225-6')
    expect(result.data?.structured_data).toMatchObject({
      cor: 'Prata',
      nested: { safe_field: 'retained-detail' },
      fipe: { dados: [{ metadata: { safe_field: 'retained-fipe-detail' } }] },
    })

    const structured = JSON.stringify(result.data?.structured_data)
    expect(structured).not.toMatch(/cpfcnpjproprietario|nomeproprietario|placa|plate|chassis|renavam|token/i)
    expect(structured).not.toMatch(/owner-id-fixture|owner-name-fixture|nested-plate-fixture|nested-chassis-fixture|nested-renavam-fixture|nested-token-fixture|fipe-plate-fixture|fipe-token-fixture/)
  })
})

describe('lookupPlate safe failure classification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    vi.stubEnv('PLACA_API_TOKEN', 'unit-test-token')
  })

  it('returns a generic failure without fetching when the provider token is missing', async () => {
    vi.stubEnv('PLACA_API_TOKEN', '')
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 503 })
    vi.stubGlobal('fetch', fetchMock)

    const result = await lookupPlate('ABC1D23')

    expect(result).toEqual({
      success: false,
      failureKind: 'provider-error',
      error: 'Serviço de consulta indisponível. Tente novamente.',
    })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(JSON.stringify(result)).not.toContain('ABC1D23')
  })

  it('rejects invalid input without exposing the submitted plate', async () => {
    const result = await lookupPlate('SECRET')
    expect(result).toMatchObject({ success: false, failureKind: 'invalid-result' })
    expect(JSON.stringify(result)).not.toContain('SECRET')
  })

  it('classifies 429 before reading a provider error payload', async () => {
    const json = vi.fn().mockResolvedValue({ message: 'private provider payload' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429, json }))

    const result = await lookupPlate('ABC1D23')
    expect(result).toEqual({
      success: false,
      failureKind: 'rate-limited',
      error: 'Limite de consultas atingido. Tente novamente.',
    })
    expect(json).not.toHaveBeenCalled()
  })

  it('classifies other non-2xx responses before parsing', async () => {
    const json = vi.fn().mockResolvedValue({ message: 'private provider payload' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503, json }))

    const result = await lookupPlate('ABC1D23')
    expect(result).toMatchObject({ success: false, failureKind: 'provider-error' })
    expect(json).not.toHaveBeenCalled()
    expect(JSON.stringify(result)).not.toContain('private provider payload')
  })

  it('classifies fetch failures without exposing the thrown message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ABC1D23 private network details')))

    const result = await lookupPlate('ABC1D23')
    expect(result).toMatchObject({ success: false, failureKind: 'network-error' })
    expect(JSON.stringify(result)).not.toContain('private network details')
  })

  it.each([null, {}, { message: 'private provider payload' }])('classifies no-result or invalid payload %j', async (body) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => body }))

    const result = await lookupPlate('ABC1D23')
    expect(result).toMatchObject({ success: false, failureKind: 'invalid-result' })
    expect(JSON.stringify(result)).not.toContain('private provider payload')
  })

  it('classifies an unreadable JSON payload as invalid without exposing its error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => { throw new Error('raw private bytes') } }))

    const result = await lookupPlate('ABC1D23')
    expect(result).toMatchObject({ success: false, failureKind: 'invalid-result' })
    expect(JSON.stringify(result)).not.toContain('raw private bytes')
  })

  it.each([
    { texto_valor: 'R$ 0,00', mes_referencia: 'setembro/2026' },
    { texto_valor: 'R$ -10,00', mes_referencia: 'setembro/2026' },
    { texto_valor: 'R$ inválido', mes_referencia: 'setembro/2026' },
    { texto_valor: 'R$ 28.799,00', mes_referencia: 'referência inválida' },
  ])('does not accept FIPE price or month unless both are valid: %j', async (entry) => {
    mockPlateApiResponse({ marca: 'VW', modelo: 'Gol', fipe: { dados: [{ score: 100, ...entry }] } })

    const result = await lookupPlate('ABC1D23')
    expect(result.success).toBe(true)
    expect(result.data?.fipe_price ?? null).toBeNull()
    expect(result.data?.fipe_reference_month ?? null).toBeNull()
  })
})
