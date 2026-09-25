import { describe, expect, it } from 'vitest'
import { getFipeDifferencePercent, sanitizeVehicleStructuredData } from './marketplace'

describe('getFipeDifferencePercent', () => {
  it('derives the comparison from asking price and FIPE when the stored percentage is missing', () => {
    expect(getFipeDifferencePercent(13900, 12300)).toBeCloseTo(13.008, 3)
  })

  it('accepts numeric database values represented as strings', () => {
    expect(getFipeDifferencePercent('13900', '12300')).toBeCloseTo(13.008, 3)
  })

  it('does not invent a comparison without a valid FIPE reference', () => {
    expect(getFipeDifferencePercent(13900, null)).toBeNull()
    expect(getFipeDifferencePercent(13900, 0)).toBeNull()
  })
})

describe('sanitizeVehicleStructuredData', () => {
  it('removes license plate and identity fields while preserving vehicle specifications', () => {
    const result = sanitizeVehicleStructuredData({
      marca: 'VW',
      extra: {
        placa: 'INT8C36',
        renavam: '123456789',
        cpfCnpjProprietario: '12345678900',
        cap_maxima_tracao: '198',
        eixos: '2',
      },
      chassi: '*****10137',
      truck_body_type: 'Baú',
    })

    expect(result).toEqual({
      marca: 'VW',
      extra: { cap_maxima_tracao: '198', eixos: '2' },
      truck_body_type: 'Baú',
    })
  })

  it('removes sensitive keys from objects nested several arrays deep', () => {
    const result = sanitizeVehicleStructuredData({
      vehicle: [
        [
          {
            plate_number: 'INT8C36',
            chassis: '9BW123456789',
            renavam: '123456789',
            make: 'VW',
            details: [[{
              ownerCpf: '12345678900',
              proprietario: 'Maria',
              accessToken: 'secret',
              model: 'Gol',
            }]],
          },
        ],
      ],
    })

    expect(result).toEqual({
      vehicle: [[{
        make: 'VW',
        details: [[{ model: 'Gol' }]],
      }]],
    })
  })

  it('removes accented and case-varied sensitive keys at any array depth', () => {
    const result = sanitizeVehicleStructuredData({
      registros: [[[
        {
          nome_proprietário: 'Maria',
          número_renavam: '123456789',
          NÓME_PROPRIETÁRIO: 'João',
          RÉNAVÁM: '987654321',
          PlÁcA: 'INT8C36',
          especificações: {
            COR: 'Azul',
            detalhes: [[{ CÓDIGO_CPF: '12345678900', modelo: 'Baú', ativo: true }]],
          },
        },
      ]]],
    })

    expect(result).toEqual({
      registros: [[[
        {
          especificações: {
            COR: 'Azul',
            detalhes: [[{ modelo: 'Baú', ativo: true }]],
          },
        },
      ]]],
    })
  })

  it('preserves safe primitive values throughout nested arrays and objects', () => {
    const result = sanitizeVehicleStructuredData({
      specifications: [
        'diesel',
        2024,
        null,
        true,
        [[{ color: 'blue', engine: { horsepower: 180, token: 'secret' } }, 'automatic', 0, false]],
      ],
    })

    expect(result).toEqual({
      specifications: [
        'diesel',
        2024,
        null,
        true,
        [[{ color: 'blue', engine: { horsepower: 180 } }, 'automatic', 0, false]],
      ],
    })
  })
})
