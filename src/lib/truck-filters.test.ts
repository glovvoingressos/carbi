import { describe, expect, it } from 'vitest'
import {
  applyTruckQueryFilters,
  expandTruckBodyTypeValues,
  expandTruckTypeValues,
  serializeTruckListingFilters,
  truckBodyTypeLabel,
  truckTypeLabel,
} from './truck-filters'

/** Query builder falso: registra as chamadas de filtro em ordem. */
function fakeQuery() {
  const calls: Array<[string, ...unknown[]]> = []
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop) {
      if (typeof prop !== 'string') return undefined
      return (...args: unknown[]) => {
        calls.push([prop, ...args])
        return proxy
      }
    },
  }
  const proxy = new Proxy({}, handler)
  return { proxy, calls }
}

describe('truckTypeAliases', () => {
  it('não confunde truck com bitruck', () => {
    expect(expandTruckTypeValues('truck')).toEqual(['truck', 'Truck'])
    expect(expandTruckTypeValues('truck')).not.toContain('bitruck')
  })

  it('aceita o rótulo enviado pela UI de filtros', () => {
    expect(expandTruckTypeValues('Cavalo mecânico')).toContain('cavalo-mecanico')
    expect(expandTruckTypeValues('Bitruck')).toContain('bitruck')
  })

  it('deduplica valores expandidos', () => {
    expect(expandTruckTypeValues(['truck', 'Truck'])).toEqual(['truck', 'Truck'])
  })
})

describe('truckBodyTypeAliases', () => {
  it('resolve o slug da URL para o rótulo gravado no banco', () => {
    expect(expandTruckBodyTypeValues('bau')).toContain('Baú')
    expect(expandTruckBodyTypeValues('bau-frigorifico')).toContain('Baú frigorífico')
    expect(expandTruckBodyTypeValues('basculante')).toContain('Basculante')
  })

  it('não devolve rótulo de outra carroceria', () => {
    expect(expandTruckBodyTypeValues('bau')).not.toContain('Baú frigorífico')
  })

  it('mantém valores desconhecidos como estão', () => {
    expect(expandTruckBodyTypeValues('Caçamba')).toEqual(['Caçamba'])
  })
})

describe('rótulos de exibição', () => {
  it('converte slug em rótulo para a UI', () => {
    expect(truckTypeLabel('cavalo-mecanico')).toBe('Cavalo mecânico')
    expect(truckTypeLabel('toco')).toBe('Toco')
    expect(truckBodyTypeLabel('bau')).toBe('Baú')
    expect(truckBodyTypeLabel('carga-seca')).toBe('Carga seca')
  })

  it('devolve o valor original quando não há correspondência', () => {
    expect(truckTypeLabel('Esote')).toBe('Esote')
  })
})

describe('applyTruckQueryFilters', () => {
  it('filtra truck_type por igualdade exata', () => {
    const { proxy, calls } = fakeQuery()
    applyTruckQueryFilters(proxy, { vehicle_type: 'truck', truckType: 'truck' })
    expect(calls).toContainEqual(['eq', 'vehicle_type', 'truck'])
    expect(calls).toContainEqual(['in', 'truck_type', ['truck', 'Truck']])
    expect(calls.find(([method, column]) => method === 'ilike' && column === 'truck_type')).toBeUndefined()
  })

  it('filtra carroceria em truck_body_type', () => {
    const { proxy, calls } = fakeQuery()
    applyTruckQueryFilters(proxy, { vehicle_type: 'truck', truckBodyType: 'sider' })
    expect(calls).toContainEqual(['in', 'truck_body_type', ['Sider', 'sider']])
  })
})

describe('serializeTruckListingFilters', () => {
  it('leva carroceria na query string', () => {
    const params = serializeTruckListingFilters({ vehicle_type: 'truck', truckType: 'toco', truckBodyType: 'bau' })
    expect(params.get('truck_type')).toBe('toco')
    expect(params.get('truck_body_type')).toBe('bau')
    expect(params.get('vehicle_type')).toBe('truck')
  })
})
