#!/usr/bin/env node
import assert from 'node:assert/strict'
import { mapTruckPayload, normalizeTruckData } from '../src/lib/trucks.ts'
import { mapPlacaApiResponse } from '../src/lib/integrations/placaapi/types.ts'

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

const placaMapped = mapPlacaApiResponse({
  placa: 'ABC1D23',
  marca: 'Volvo',
  modelo: 'FH 540',
  ano: '2022',
  cor: 'Branco',
  extra: {
    ano_fabricacao: '2021',
    ano_modelo: '2022',
    combustivel: 'Diesel',
    caixa_cambio: 'Automatizada',
    capacidade_carga: '25.000',
    numero_eixos: '3',
    tipo_cabine: 'Leito',
    pbt: '45.000',
    cmt: '60.000',
    categoria: 'Caminhão',
    vin: '9BV1ABC1234567890',
    campo_especifico: 'preservar',
  },
  dados: {
    tipo_veiculo: 'Caminhão',
  },
}, 'ABC1D23')

assert.equal(placaMapped.marca, 'Volvo')
assert.equal(placaMapped.modelo, 'FH 540')
assert.equal(placaMapped.anoFabricacao, 2021)
assert.equal(placaMapped.anoModelo, 2022)
assert.equal(placaMapped.cor, 'Branco')
assert.equal(placaMapped.combustivel, 'Diesel')
assert.equal(placaMapped.cambio, 'Automatizada')
assert.equal(placaMapped.chassi, '9BV1ABC1234567890')
assert.equal(placaMapped.capacidadeCarga, 25000)
assert.equal(placaMapped.numeroEixos, 3)
assert.equal(placaMapped.tipoCabine, 'Leito')
assert.equal(placaMapped.pbt, 45000)
assert.equal(placaMapped.cmt, 60000)
assert.equal(placaMapped.categoria, 'Caminhão')
assert.equal(placaMapped.structured_data.campo_especifico, 'preservar')

const nestedCommonMapped = mapPlacaApiResponse({
  extra: {
    marca: 'Scania',
    modelo: 'R 450',
    cor: 'Azul',
  },
  dados: {
    tipo_veiculo: 'Cavalo mecânico',
  },
}, 'DEF4G56')

assert.equal(nestedCommonMapped.marca, 'Scania')
assert.equal(nestedCommonMapped.modelo, 'R 450')
assert.equal(nestedCommonMapped.cor, 'Azul')
assert.equal(nestedCommonMapped.tipoVeiculo, 'Cavalo mecânico')
assert.equal(nestedCommonMapped.categoria, 'Cavalo mecânico')

const marketplaceSource = await (await import('node:fs/promises')).readFile(new URL('../src/lib/marketplace.ts', import.meta.url), 'utf8')
const postSource = await (await import('node:fs/promises')).readFile(new URL('../src/app/api/marketplace/listings/route.ts', import.meta.url), 'utf8')
const patchSource = await (await import('node:fs/promises')).readFile(new URL('../src/app/api/marketplace/listings/[listingId]/route.ts', import.meta.url), 'utf8')

assert.match(marketplaceSource, /export function normalizeTruckPayload/)
assert.match(marketplaceSource, /vehicle_type === 'truck'/)
assert.match(postSource, /normalizeTruckPayload\(payload\)/)
assert.match(patchSource, /normalizeTruckPayload\(body\)/)
assert.match(marketplaceSource, /structured_data/)

console.log('truck mapping tests passed')
