import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'node:crypto'

/**
 * Criptografia da placa para o cofre privado.
 *
 * A placa nunca deve ir para campos públicos. O valor completo é cifrado com
 * AES-256-GCM e o hash (HMAC-SHA256) serve para busca/deduplicação sem expor
 * o texto original. A chave vem de PLATE_ENCRYPTION_KEY (32 bytes em base64).
 */

const PLATE_PATTERN = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/
const ENCRYPTION_CONTEXT = 'carbi-plate-encryption-v1'
const HASH_CONTEXT = 'carbi-plate-hash-v1'

export function normalizePlate(value: string | null | undefined): string | null {
  const plate = String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  return PLATE_PATTERN.test(plate) ? plate : null
}

export function isPlateEncryptionConfigured(masterKeyBase64?: string | null): boolean {
  if (!masterKeyBase64) return false
  try {
    return Buffer.from(masterKeyBase64, 'base64').length === 32
  } catch {
    return false
  }
}

function deriveKeys(masterKeyBase64: string): { encryptionKey: Buffer; hashKey: Buffer } | null {
  if (!isPlateEncryptionConfigured(masterKeyBase64)) return null
  const master = Buffer.from(masterKeyBase64, 'base64')
  return {
    encryptionKey: createHash('sha256').update(master).update(ENCRYPTION_CONTEXT).digest(),
    hashKey: createHash('sha256').update(master).update(HASH_CONTEXT).digest(),
  }
}

export function encryptPlate(plate: string | null | undefined, masterKeyBase64: string): string | null {
  const normalized = normalizePlate(plate)
  if (!normalized) return null
  const keys = deriveKeys(masterKeyBase64)
  if (!keys) return null

  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', keys.encryptionKey, iv)
  const ciphertext = Buffer.concat([cipher.update(normalized, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return [
    'v1',
    iv.toString('base64url'),
    tag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join('.')
}

export function decryptPlate(payload: string | null | undefined, masterKeyBase64: string): string | null {
  if (!payload) return null
  const keys = deriveKeys(masterKeyBase64)
  if (!keys) return null

  const [version, ivB64, tagB64, dataB64] = payload.split('.')
  if (version !== 'v1' || !ivB64 || !tagB64 || !dataB64) return null

  try {
    const decipher = createDecipheriv('aes-256-gcm', keys.encryptionKey, Buffer.from(ivB64, 'base64url'))
    decipher.setAuthTag(Buffer.from(tagB64, 'base64url'))
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64url')),
      decipher.final(),
    ]).toString('utf8')
    return normalizePlate(plaintext)
  } catch {
    return null
  }
}

export function hashPlate(plate: string | null | undefined, masterKeyBase64: string): string | null {
  const normalized = normalizePlate(plate)
  if (!normalized) return null
  const keys = deriveKeys(masterKeyBase64)
  if (!keys) return null
  return createHmac('sha256', keys.hashKey).update(normalized).digest('base64url')
}
