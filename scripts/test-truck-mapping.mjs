#!/usr/bin/env node
import assert from 'node:assert/strict'
import { normalizeTruckData } from '../src/lib/trucks.ts'

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

const truckData = normalizeTruckData(payload)
const mapped = {
  brand: payload.marca,
  model: payload.modelo,
  yearManufacture: payload.anoFabricacao,
  yearModel: payload.anoModelo,
  truck: {
    category: truckData.truck_category,
    axles: truckData.axles,
    loadCapacity: truckData.load_capacity,
    pbt: truckData.pbt,
    cmt: truckData.cmt,
    structuredData: truckData.structured_data,
  },
}

assert.equal(mapped.brand, 'Mercedes-Benz')
assert.equal(mapped.model, 'Atego 1719')
assert.equal(mapped.yearManufacture, 2019)
assert.equal(mapped.yearModel, 2020)
assert.equal(mapped.truck.category, 'truck')
assert.equal(mapped.truck.axles, 2)
assert.equal(mapped.truck.loadCapacity, 17000)
assert.equal(mapped.truck.pbt, 23000)
assert.equal(mapped.truck.cmt, 28000)
assert.equal(mapped.truck.structuredData.cabine, 'estendida')
assert.equal(mapped.truck.structuredData.campoDesconhecido, 'preservar')

const missing = normalizeTruckData({ tipoVeiculo: 'caminhão', marca: 'Volvo' })
assert.equal(missing.load_capacity, null)
assert.equal(missing.axles, null)
assert.equal(missing.pbt, null)
assert.equal(missing.cmt, null)
assert.equal(missing.cabin_type, null)
assert.equal(missing.chassis, null)

console.log('truck mapping tests passed')
