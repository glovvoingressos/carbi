import { describe, expect, it } from 'vitest'
import { applyCityFilter, cityPatternVariants } from './city-filter'

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

describe('cityPatternVariants', () => {
  it('gera a grafia acentuada e a sem acento', () => {
    expect(cityPatternVariants('%São Paulo%')).toEqual(['%São Paulo%', '%Sao Paulo%'])
    expect(cityPatternVariants('Brasília')).toEqual(['%Brasília%', '%Brasilia%'])
    expect(cityPatternVariants('Goiânia')).toEqual(['%Goiânia%', '%Goiania%'])
  })

  it('envolve texto livre em curingas, mas preserva o padrão dos presets', () => {
    expect(cityPatternVariants('Rio')).toEqual(['%Rio%'])
    expect(cityPatternVariants('Campinas - Barão Geraldo')).toEqual([
      '%Campinas - Barão Geraldo%',
      '%Campinas - Barao Geraldo%',
    ])
  })

  it('deduplica quando não há acento', () => {
    expect(cityPatternVariants('Rio de Janeiro')).toEqual(['%Rio de Janeiro%'])
  })

  it('descarta vazio e caracteres que quebram o OR do PostgREST', () => {
    expect(cityPatternVariants('   ')).toEqual([])
    expect(cityPatternVariants('Rio, (Grande)')).toEqual(['%Rio Grande%'])
    expect(cityPatternVariants('')).toEqual([])
  })
})

describe('applyCityFilter', () => {
  it('não mexe na query quando não há cidade', () => {
    const { proxy, calls } = fakeQuery()
    expect(applyCityFilter(proxy, undefined)).toBe(proxy)
    expect(applyCityFilter(proxy, [])).toBe(proxy)
    expect(calls).toEqual([])
  })

  it('usa ilike direto quando sobra um padrão só', () => {
    const { proxy, calls } = fakeQuery()
    applyCityFilter(proxy, 'Rio de Janeiro')
    expect(calls).toEqual([['ilike', 'city', '%Rio de Janeiro%']])
  })

  it('monta um OR com as duas grafias para cidade acentuada', () => {
    const { proxy, calls } = fakeQuery()
    applyCityFilter(proxy, 'Brasília')
    expect(calls).toEqual([['or', 'city.ilike.%Brasília%,city.ilike.%Brasilia%']])
  })

  it('aceita o array enviado pelo client (o que quebrava as páginas de cidade)', () => {
    const { proxy, calls } = fakeQuery()
    applyCityFilter(proxy, ['%São Paulo%'])
    expect(calls).toEqual([['or', 'city.ilike.%São Paulo%,city.ilike.%Sao Paulo%']])
  })

  it('une seleção múltipla com as grafias de cada cidade', () => {
    const { proxy, calls } = fakeQuery()
    applyCityFilter(proxy, ['Campinas', 'Santo André'])
    const [, clause] = calls[0]
    expect(String(clause)).toBe(
      'city.ilike.%Campinas%,city.ilike.%Santo André%,city.ilike.%Santo Andre%',
    )
  })
})
