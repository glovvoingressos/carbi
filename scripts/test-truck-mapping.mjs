#!/usr/bin/env node
import assert from 'node:assert/strict'
import { mapTruckPayload, normalizeTruckData } from '../src/lib/trucks.ts'
import { mapPlacaApiResponse } from '../src/lib/integrations/placaapi/types.ts'
import { buildListingRollbackPayload, normalizeTruckPayload, resolveTruckPatch, validateListingPayload } from '../src/lib/marketplace.ts'

const payload = {
  marca: 'Mercedes-Benz',
  modelo: 'Atego 1719',
  anoFabricacao: 2019,
  anoModelo: 2020,
  tipoVeiculo: 'Caminhão',
  capacidadeCarga: '17000',
  quantidadeEixos: 2,
  pbt: '23000',
  cmt: 28000,
  cabine: 'estendida',
  campoDesconhecido: 'preservar',
}

const mapped = mapTruckPayload(payload)
const truckData = normalizeTruckData(payload)
assert.equal(mapped.truck.axles, 2)
assert.equal(mapped.truck.loadCapacity, 17000)
assert.equal(mapped.truck.structuredData.campoDesconhecido, 'preservar')
assert.equal(truckData.load_capacity, 17000)

const truckPayload = {
  vehicle_type: 'truck',
  brand: 'Mercedes-Benz', model: 'Atego', transmission: 'Manual', fuel: 'Diesel', color: 'Branco',
  city: 'São Paulo', state: 'SP', year: 2020, year_model: 2020, mileage: 100, price: 250000,
  load_capacity: 17000, axles: 2, truck_type: 'Truck', truck_body_type: 'Baú', chassis: '9BM123',
  pbt: 23000, cmt: 28000, cabin_type: 'Estendida', fipe_price: null,
  structured_data: { pbt: 23000, cmt: 28000, cabin_type: 'Estendida', extra: 'preservar' },
}
const normalizedTruck = normalizeTruckPayload(truckPayload)
assert.deepEqual(normalizedTruck, {
  vehicle_type: 'truck', truck_type: 'Truck', load_capacity: 17000, axles: 2, truck_body_type: 'Baú',
  cabin_type: 'Estendida', pbt: 23000, cmt: 28000, structured_data: { ...truckPayload.structured_data, chassis: '9BM123' },
})
assert.deepEqual(validateListingPayload(truckPayload), [])

const carPayload = { ...truckPayload, vehicle_type: 'car', structured_data: { engine_code: 'X' } }
assert.deepEqual(normalizeTruckPayload(carPayload), {})
assert.equal(validateListingPayload(carPayload).length, 0)
assert.equal(truckPayload.fipe_price, null)

assert.deepEqual(normalizeTruckPayload({ vehicle_type: 'truck', structured_data: { pbt: 24000 }, pbt: 24000 }), {
  vehicle_type: 'truck', pbt: 24000, structured_data: { pbt: 24000 },
})
assert.deepEqual(resolveTruckPatch({ load_capacity: 18000, vehicle_type: 'truck' }, 'truck'), {
  updates: { vehicle_type: 'truck', load_capacity: 18000 }, error: null,
})
assert.equal(resolveTruckPatch({ vehicle_type: 'truck' }, 'car').error, 'Não é permitido alterar o tipo do veículo.')
assert.equal(resolveTruckPatch({ load_capacity: -1, vehicle_type: 'truck' }, 'truck').error, 'load_capacity inválido.')
assert.deepEqual(buildListingRollbackPayload(
  { price: 100000, mileage: 12000, structured_data: { old: true } },
  { price: 110000, mileage: 13000, structured_data: { old: false } },
), { price: 100000, mileage: 12000, structured_data: { old: true } })

assert.equal(normalizeTruckData({ tipoVeiculo: 'bi-truck' }).truck_category, 'bitruck')
assert.equal(normalizeTruckData({ tipoVeiculo: 'cavalo mecânico' }).truck_category, 'cavalo_mecanico')
assert.equal(normalizeTruckData({ tipoVeiculo: 'toco' }).truck_category, 'toco')
assert.equal(normalizeTruckData({ capacidadeCarga: '17.000,5', pbt: '23.000', cmt: '28.000,25', quantidadeEixos: '2' }).load_capacity, 17000.5)

const missing = normalizeTruckData({ tipoVeiculo: 'caminhão', marca: 'Volvo' })
assert.equal(missing.load_capacity, null)
assert.equal(missing.axles, null)
assert.equal(missing.pbt, null)
assert.equal(missing.cmt, null)
assert.equal(missing.cabin_type, null)
assert.equal(missing.chassis, null)

const placaMapped = mapPlacaApiResponse({ placa: 'ABC1D23', marca: 'Volvo', modelo: 'FH 540', ano: '2022', cor: 'Branco', extra: { vin: '9BV1ABC1234567890', campo_especifico: 'preservar' }, dados: { tipo_veiculo: 'Caminhão' } }, 'ABC1D23')
assert.equal(placaMapped.chassi, '9BV1ABC1234567890')
assert.equal(placaMapped.structured_data.campo_especifico, 'preservar')

console.log('truck mapping tests passed')
