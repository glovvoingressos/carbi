#!/usr/bin/env node
import assert from 'node:assert/strict'
import { mapTruckPayload, normalizeTruckData } from '../src/lib/trucks.ts'

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

assert.equal(normalizeTruckData({ tipoVeiculo: 'bi-truck' }).truck_category, 'bitruck')
assert.equal(normalizeTruckData({ tipoVeiculo: 'cavalo mecânico' }).truck_category, 'cavalo_mecanico')
assert.equal(normalizeTruckData({ tipoVeiculo: 'toco' }).truck_category, 'toco')
assert.equal(normalizeTruckData({ capacidadeCarga: '17.000,5', pbt: '23.000', cmt: '28.000,25', quantidadeEixos: '2' }).load_capacity, 17000.5)
assert.equal(normalizeTruckData({ capacidadeCarga: '17.000,5', pbt: '23.000', cmt: '28.000,25', quantidadeEixos: '2' }).pbt, 23000)
assert.equal(normalizeTruckData({ capacidadeCarga: '17.000,5', pbt: '23.000', cmt: '28.000,25', quantidadeEixos: '2' }).cmt, 28000.25)
assert.equal(normalizeTruckData({ capacidadeCarga: '17.000,5', pbt: '23.000', cmt: '28.000,25', quantidadeEixos: '2' }).axles, 2)

const missing = normalizeTruckData({ tipoVeiculo: 'caminhão', marca: 'Volvo' })
assert.equal(missing.load_capacity, null)
assert.equal(missing.axles, null)
assert.equal(missing.pbt, null)
assert.equal(missing.cmt, null)
assert.equal(missing.cabin_type, null)
assert.equal(missing.chassis, null)

console.log('truck mapping tests passed')
