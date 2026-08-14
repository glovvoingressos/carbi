import assert from 'node:assert/strict'
import { buildTruckListingFilters, clearTruckListingFilters, serializeTruckListingFilters } from '../src/lib/truck-filters.ts'

const filters = buildTruckListingFilters({
  truckType: ['Truck'], axles: [2, 3], loadCapacityMin: 10000, loadCapacityMax: 20000,
  mileageMin: 100, mileageMax: 90000, transmission: ['Manual'], city: ['São Paulo'], state: 'SP',
})
assert.deepEqual(filters, {
  vehicle_type: 'truck', truckType: ['Truck'], axles: [2, 3], loadCapacityMin: 10000, loadCapacityMax: 20000,
  mileageMin: 100, mileageMax: 90000, transmission: ['Manual'], city: ['São Paulo'], state: 'SP',
})
assert.equal(buildTruckListingFilters({}).vehicle_type, 'truck')
assert.equal(clearTruckListingFilters().vehicle_type, 'truck')
const params = serializeTruckListingFilters(filters)
assert.equal(params.get('vehicle_type'), 'truck')
assert.deepEqual(params.getAll('truck_type'), ['Truck'])
assert.deepEqual(params.getAll('axles'), ['2', '3'])
assert.equal(params.get('city'), 'São Paulo')
assert.equal(params.get('state'), 'SP')
assert.equal(params.get('mileage_min'), '100')
assert.equal(params.get('load_capacity_max'), '20000')
console.log('truck filter tests passed')
