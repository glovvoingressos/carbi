import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { lookupPlate } = vi.hoisted(() => ({ lookupPlate: vi.fn() }))

vi.mock('@/lib/integrations/placaapi/service', () => ({ lookupPlate }))

describe('GET /api/marketplace/placa', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns listing and FIPE fields without private vehicle or owner identifiers', async () => {
    lookupPlate.mockResolvedValue({ success: true, data: {
      placa: 'ABC1D23', chassi: 'VIN-SECRET', renavam: 'RENAVAM-SECRET',
      cpfCnpjProprietario: 'OWNER-ID-SECRET', nomeProprietario: 'OWNER-NAME-SECRET',
      marca: 'Fiat', modelo: 'Bravo', versao: 'Essence 1.8',
      anoFabricacao: 2012, anoModelo: 2013, cor: 'Prata', combustivel: 'Flex',
      cilindradas: '1.8', potencia: '132', cambio: 'Manual', tipoVeiculo: 'Hatch',
      situacao: 'Regular', uf: 'SP', municipio: 'São Paulo', dataAtualizacao: '2026-09-24',
      capacidadeCarga: 3500, numeroEixos: 2, tipoCabine: 'Simples', pbt: 5000, cmt: 7000, categoria: 'Caminhão',
      fipe_price: 38950, fipe_reference_month: 'setembro/2026',
      fipe_code: '001234-5', fipe_model_name: 'BRAVO ESSENCE 1.8 16V Flex', fipe_brand_name: 'Fiat',
      structured_data: { placa: 'ABC1D23', fuel: 'Flex', truck_body_type: 'Baú', nested: { renavam: 'NESTED-SECRET', axles: 2 } },
    } })
    const { GET } = await import('./route')

    const response = await GET(new NextRequest('http://localhost/api/marketplace/placa?plate=ABC1D23'))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toMatchObject({
      marca: 'Fiat', modelo: 'Bravo', versao: 'Essence 1.8',
      anoFabricacao: 2012, anoModelo: 2013, cor: 'Prata', combustivel: 'Flex',
      cilindradas: '1.8', potencia: '132', cambio: 'Manual', tipoVeiculo: 'Hatch',
      capacidadeCarga: 3500, numeroEixos: 2, tipoCabine: 'Simples', pbt: 5000, cmt: 7000, categoria: 'Caminhão',
      fipe_price: 38950, fipe_reference_month: 'setembro/2026',
      fipe_code: '001234-5', fipe_model_name: 'BRAVO ESSENCE 1.8 16V Flex', fipe_brand_name: 'Fiat',
      structured_data: { fuel: 'Flex', truck_body_type: 'Baú', nested: { axles: 2 } },
    })
    expect(payload).not.toHaveProperty('placa')
    expect(payload).not.toHaveProperty('chassi')
    expect(payload).not.toHaveProperty('renavam')
    expect(payload).not.toHaveProperty('cpfCnpjProprietario')
    expect(payload).not.toHaveProperty('nomeProprietario')
    expect(JSON.stringify(payload)).not.toContain('ABC1D23')
    expect(JSON.stringify(payload)).not.toMatch(/VIN-SECRET|RENAVAM-SECRET|OWNER-ID-SECRET|OWNER-NAME-SECRET|NESTED-SECRET/)
  })

  it('keeps the missing plate response', async () => {
    const { GET } = await import('./route')
    const response = await GET(new NextRequest('http://localhost/api/marketplace/placa'))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Placa não informada.' })
    expect(lookupPlate).not.toHaveBeenCalled()
  })

  it('keeps unsuccessful lookup responses', async () => {
    lookupPlate.mockResolvedValue({ success: false, failureKind: 'rate-limited', error: 'Limite de consultas atingido. Tente novamente.' })
    const { GET } = await import('./route')
    const response = await GET(new NextRequest('http://localhost/api/marketplace/placa?plate=ABC1D23'))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Limite de consultas atingido. Tente novamente.' })
  })
})
