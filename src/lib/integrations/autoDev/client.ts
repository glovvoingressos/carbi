import { AutoDevErrorCode } from '@/lib/integrations/autoDev/types'

const DEFAULT_BASE_URL = 'https://api.auto.dev'
const DEFAULT_TIMEOUT_MS = 10000

export class AutoDevError extends Error {
  public readonly code: AutoDevErrorCode
  public readonly status?: number
  public readonly endpoint?: string

  constructor(code: AutoDevErrorCode, message: string, opts?: { status?: number; endpoint?: string }) {
    super(message)
    this.name = 'AutoDevError'
    this.code = code
    this.status = opts?.status
    this.endpoint = opts?.endpoint
  }
}

function getApiKey(): string {
  const key = process.env.AUTODEV_API_KEY || process.env.AUTO_DEV_API_KEY || ''
  if (!key) {
    throw new AutoDevError('NOT_CONFIGURED', 'Auto.dev API key não configurada.')
  }
  return key
}

function getBaseUrl(): string {
  const base = process.env.AUTODEV_BASE_URL || process.env.AUTO_DEV_BASE_URL || DEFAULT_BASE_URL
  return base.replace(/\/+$/, '')
}

function normalizeVin(vin: string): string {
  return vin.trim().toUpperCase()
}

function mapStatusToCode(status: number): AutoDevErrorCode {
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 403) return 'FORBIDDEN'
  if (status === 404) return 'NOT_FOUND'
  if (status === 429) return 'RATE_LIMITED'
  return 'INTERNAL_ERROR'
}

async function requestJson<T>(endpoint: string): Promise<{ data: T; sourceVersion: string | null }> {
  const apiKey = getApiKey()
  const baseUrl = getBaseUrl()
  const timeoutMs = Number(process.env.AUTODEV_TIMEOUT_MS || DEFAULT_TIMEOUT_MS)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store',
    })

    const sourceVersion =
      response.headers.get('x-api-version') || response.headers.get('x-autodev-version') || null

    if (!response.ok) {
      throw new AutoDevError(
        mapStatusToCode(response.status),
        `Auto.dev retornou erro ${response.status} em ${endpoint}.`,
        { status: response.status, endpoint },
      )
    }

    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      throw new AutoDevError('INVALID_RESPONSE', 'Resposta inválida da Auto.dev.', { endpoint, status: response.status })
    }

    return { data: payload as T, sourceVersion }
  } catch (error) {
    if (error instanceof AutoDevError) throw error

    if (error instanceof Error && error.name === 'AbortError') {
      throw new AutoDevError('TIMEOUT', `Timeout ao consultar ${endpoint}.`, { endpoint })
    }

    throw new AutoDevError('NETWORK_ERROR', `Falha de rede ao consultar ${endpoint}.`, { endpoint })
  } finally {
    clearTimeout(timer)
  }
}

export async function decodeVin(vin: string): Promise<{ data: unknown; sourceVersion: string | null }> {
  return requestJson(`/vin/${encodeURIComponent(normalizeVin(vin))}`)
}

export async function getVehicleSpecsByVin(vin: string): Promise<{ data: unknown; sourceVersion: string | null }> {
  return requestJson(`/specs/${encodeURIComponent(normalizeVin(vin))}`)
}

export async function getVehiclePhotosByVin(vin: string): Promise<{ data: unknown; sourceVersion: string | null }> {
  return requestJson(`/photos/${encodeURIComponent(normalizeVin(vin))}`)
}

export async function getVehicleBuildByVin(vin: string): Promise<{ data: unknown; sourceVersion: string | null }> {
  return requestJson(`/build/${encodeURIComponent(normalizeVin(vin))}`)
}

export async function getVehicleRecallsByVin(vin: string): Promise<{ data: unknown; sourceVersion: string | null }> {
  return requestJson(`/recalls/${encodeURIComponent(normalizeVin(vin))}`)
}
