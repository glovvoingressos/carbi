import { describe, expect, it } from 'vitest'
import { randomBytes } from 'node:crypto'
import { decryptPlate, encryptPlate, hashPlate, isPlateEncryptionConfigured, normalizePlate } from './plate-crypto'

const key = randomBytes(32).toString('base64')

describe('normalizePlate', () => {
  it('aceita Mercosul e o formato antigo, normalizando caixa e separadores', () => {
    expect(normalizePlate('abc1d23')).toBe('ABC1D23')
    expect(normalizePlate('ABC-1234')).toBe('ABC1234')
  })

  it('rejeita placa incompleta ou com caracteres inválidos', () => {
    expect(normalizePlate('ABC123')).toBeNull()
    expect(normalizePlate('AB12345')).toBeNull()
    expect(normalizePlate('')).toBeNull()
    expect(normalizePlate(null)).toBeNull()
  })
})

describe('cofre de placas', () => {
  it('criptografa e descriptografa a placa', () => {
    const encrypted = encryptPlate('ABC1D23', key)
    expect(encrypted).toMatch(/^v1\./)
    expect(encrypted).not.toContain('ABC1D23')
    expect(decryptPlate(encrypted, key)).toBe('ABC1D23')
  })

  it('gera hashes estáveis e diferentes por placa', () => {
    expect(hashPlate('ABC1D23', key)).toBe(hashPlate('abc1d23', key))
    expect(hashPlate('ABC1D23', key)).not.toBe(hashPlate('ABC1D24', key))
  })

  it('não descriptografa com outra chave', () => {
    const encrypted = encryptPlate('ABC1D23', key)
    const otherKey = randomBytes(32).toString('base64')
    expect(decryptPlate(encrypted, otherKey)).toBeNull()
  })

  it('recusa chave inválida', () => {
    expect(isPlateEncryptionConfigured(key)).toBe(true)
    expect(isPlateEncryptionConfigured('curta')).toBe(false)
    expect(encryptPlate('ABC1D23', 'curta')).toBeNull()
  })
})
