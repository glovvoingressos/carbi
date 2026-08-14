import assert from 'node:assert/strict'
import { buildTruckListingFilters } from '../src/lib/truck-filters.ts'

const filters = buildTruckListingFilters({
  truckType: ['Truck'], axles: [2, 3], loadCapacityMin: 10000, loadCapacityMax: 20000,
  mileageMin: 100, mileageMax: 90000, transmission: ['Manual'], city: ['São Paulo'], state: 'SP',
})
assert.deepEqual(filters, {
  vehicle_type: 'truck', truckType: ['Truck'], axles: [2, 3], loadCapacityMin: 10000, loadCapacityMax: 20000,
  mileageMin: 100, mileageMax: 90000, transmission: ['Manual'], city: ['São Paulo'], state: 'SP',
})
assert.equal(buildTruckListingFilters({}).vehicle_type, 'truck')
console.log('truck filter tests passed')
