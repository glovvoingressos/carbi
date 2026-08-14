import assert from 'node:assert/strict'
import { mapTruckPlateResult, buildTruckListingPayload, isFipeRequiredForListing } from '../src/lib/truck-listing-form.ts'

const mapped = mapTruckPlateResult({
  tipoVeiculo: 'Truck',
  tipoCarroceria: 'Baú',
  capacidadeCarga: 17000,
  quantidadeEixos: 2,
  pbt: 23000,
  cmt: 28000,
  categoria: 'Truck',
  fipe_price: null,
  structured_data: { origem: 'placa', renavam: '123' },
})
assert.equal(mapped.truck_type, 'Truck')
assert.equal(mapped.truck_body_type, 'Baú')
assert.equal(mapped.load_capacity, '17000')
assert.equal(mapped.axles, '2')
assert.equal(mapped.structured_data.renavam, '123')
assert.equal(mapped.fipeAvailable, false)
assert.equal(isFipeRequiredForListing('truck'), false)
assert.equal(isFipeRequiredForListing('car'), true)

assert.deepEqual(buildTruckListingPayload({
  vehicle_type: 'truck',
  truck_type: 'Truck',
  load_capacity: '17000',
  axles: '2',
  truck_body_type: 'Baú',
  structured_data: { origem: 'placa' },
  fipe_price: null,
}), {
  vehicle_type: 'truck',
  truck_type: 'Truck',
  load_capacity: 17000,
  axles: 2,
  truck_body_type: 'Baú',
  structured_data: { origem: 'placa' },
  fipe_price: null,
})

console.log('truck form tests passed')
