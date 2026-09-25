import { describe, expect, it } from 'vitest'

import { mapPlacaApiResponse } from './types'

describe('mapPlacaApiResponse', () => {
  it('uses the FIPE fuel when the provider leaves the extra fields empty', () => {
    const result = mapPlacaApiResponse({
      marca: 'PEUGEOT',
      modelo: '2008 GT T200',
      extra: {},
      fipe: {
        dados: [
          { score: 53, combustivel: 'Flex' },
          { score: 47, combustivel: 'Flex' },
        ],
      },
    }, 'TCI6D41')

    expect(result.combustivel).toBe('Flex')
  })

  it('uses the engine specification from the best FIPE model when displacement is missing', () => {
    const result = mapPlacaApiResponse({
      marca: 'PEUGEOT',
      modelo: '2008 GT T200',
      extra: {},
      fipe: {
        dados: [
          { score: 53, texto_modelo: 'Peugeot 2008 GT 1.0 Turbo Flex 5p Aut.' },
        ],
      },
    }, 'TCI6D41')

    expect(result.cilindradas).toBe('1.0 Turbo')
  })
})
