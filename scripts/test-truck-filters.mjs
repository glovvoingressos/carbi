import assert from 'node:assert/strict'
import { buildTruckListingFilters, clearTruckListingFilters, serializeTruckListingFilters, applyTruckQueryFilters } from '../src/lib/truck-filters.ts'

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

const calls = []
const query = ['eq', 'in', 'ilike', 'gte', 'lte'].reduce((builder, method) => {
  builder[method] = (...args) => { calls.push([method, ...args]); return builder }
  return builder
}, {})
applyTruckQueryFilters(query, filters)
assert.deepEqual(calls, [
  ['eq', 'vehicle_type', 'truck'], ['in', 'truck_type', ['Truck']], ['in', 'axles', [2, 3]],
  ['gte', 'load_capacity', 10000], ['lte', 'load_capacity', 20000], ['in', 'city', ['São Paulo']],
  ['eq', 'state', 'SP'], ['in', 'transmission', ['Manual']], ['gte', 'mileage', 100], ['lte', 'mileage', 90000],
])
const carCalls = []
const carQuery = ['eq', 'in', 'ilike', 'gte', 'lte'].reduce((builder, method) => {
  builder[method] = (...args) => { carCalls.push([method, ...args]); return builder }
  return builder
}, {})
applyTruckQueryFilters(carQuery, { vehicle_type: undefined, transmission: 'Automatic' })
assert.deepEqual(carCalls, [['ilike', 'transmission', '%Automatic%']])
console.log('truck filter tests passed')
