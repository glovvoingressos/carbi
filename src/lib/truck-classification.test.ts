import { describe, expect, it } from 'vitest'
import { isTruckListing, resolveVehicleType } from './truck-classification'

describe('isTruckListing', () => {
  it('reconhece marcas que só vendem comerciais pesados', () => {
    expect(isTruckListing({ brand: 'Iveco', model: 'Stralis 600S44T', vehicle_type: 'car' })).toBe(true)
    expect(isTruckListing({ brand: 'SCANIA', model: 'R 440 A6X4', vehicle_type: 'car' })).toBe(true)
    expect(isTruckListing({ brand: 'MAN', model: 'TGX 29.480', vehicle_type: 'car' })).toBe(true)
  })

  it('reconhece a nomenclatura de caminhão da VW e da Mercedes', () => {
    expect(isTruckListing({ brand: 'VW', model: '25.370 CLM T 6X2', vehicle_type: 'car' })).toBe(true)
    expect(isTruckListing({ brand: 'Volkswagen', model: 'Constellation 24.280', vehicle_type: 'car' })).toBe(true)
    expect(isTruckListing({ brand: 'Mercedes-Benz', model: 'Atego 2426', vehicle_type: 'car' })).toBe(true)
    expect(isTruckListing({ brand: 'Mercedes-Benz', model: 'LS 1938', vehicle_type: 'car' })).toBe(true)
  })

  it('não confunde carros das mesmas marcas com caminhão', () => {
    expect(isTruckListing({ brand: 'Volkswagen', model: 'Nivus 1.0 TSI', vehicle_type: 'car' })).toBe(false)
    expect(isTruckListing({ brand: 'Volkswagen', model: 'Amarok 2.0', vehicle_type: 'car' })).toBe(false)
    expect(isTruckListing({ brand: 'Mercedes-Benz', model: 'C 180', vehicle_type: 'car' })).toBe(false)
    expect(isTruckListing({ brand: 'Ford', model: 'Ranger XLT', vehicle_type: 'car' })).toBe(false)
    expect(isTruckListing({ brand: 'Volvo', model: 'XC60', vehicle_type: 'car' })).toBe(false)
    expect(isTruckListing({ brand: 'Toyota', model: 'Hilux SRX 4x4', vehicle_type: 'car' })).toBe(false)
  })

  it('respeita dados explícitos de caminhão', () => {
    expect(isTruckListing({ vehicle_type: 'truck' })).toBe(true)
    expect(isTruckListing({ truck_type: 'toco' })).toBe(true)
    expect(isTruckListing({ axles: 3 })).toBe(true)
  })

  it('não classifica anúncio vazio como caminhão', () => {
    expect(isTruckListing({ vehicle_type: 'car' })).toBe(false)
  })
})

describe('resolveVehicleType', () => {
  it('promove para truck apenas quando há evidência de caminhão', () => {
    expect(resolveVehicleType({ brand: 'Iveco', model: 'Tector 27-320' })).toBe('truck')
    expect(resolveVehicleType({ brand: 'Fiat', model: 'Toro Freedom' })).toBe('car')
  })
})
