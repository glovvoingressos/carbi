// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { lookupPlateClientMock, savePlateLookupMock } = vi.hoisted(() => ({
  lookupPlateClientMock: vi.fn(),
  savePlateLookupMock: vi.fn(),
}))

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/lib/integrations/placaapi/client', () => ({
  lookupPlateClient: lookupPlateClientMock,
  savePlateLookup: savePlateLookupMock,
}))

import PlateBannerLookup from './PlateBannerLookup'

describe('PlateBannerLookup presentation', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('adds the vehicle image while keeping the plate lookup flow intact', async () => {
    const lookupResponse = {
      capacidadeCarga: null,
      numeroEixos: null,
      tipoCabine: '',
      pbt: null,
      cmt: null,
      categoria: 'SUV',
      structured_data: {},
      placa: 'ABC1D23',
      chassi: '',
      renavam: '',
      marca: 'Chevrolet',
      modelo: 'Tracker',
      versao: 'LT',
      anoFabricacao: 2024,
      anoModelo: 2024,
      cor: 'Branco',
      combustivel: 'Flex',
      cilindradas: '',
      potencia: '',
      cambio: 'Automático',
      tipoVeiculo: 'SUV',
      situacao: 'Regular',
      uf: 'SP',
      municipio: 'São Paulo',
      cpfCnpjProprietario: '',
      nomeProprietario: '',
      dataAtualizacao: '',
      fipe_price: 123000,
    }
    lookupPlateClientMock.mockResolvedValue(lookupResponse)

    render(<PlateBannerLookup />)

    expect(screen.getByRole('img', { name: 'Picape em uma estrada no deserto' })).toBeTruthy()

    fireEvent.change(screen.getByRole('textbox', { name: 'Placa do veículo' }), {
      target: { value: 'abc1d23' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Consultar' }))

    expect(await screen.findByText('Chevrolet Tracker')).toBeTruthy()
    expect(lookupPlateClientMock).toHaveBeenCalledWith('ABC1D23')
    expect(savePlateLookupMock).toHaveBeenCalledWith(lookupResponse)
  })
})
