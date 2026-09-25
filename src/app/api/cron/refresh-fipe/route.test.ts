import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { runFipeRefreshBatch } = vi.hoisted(() => ({ runFipeRefreshBatch: vi.fn() }))

vi.mock('@/lib/fipe-refresh-worker', () => ({ runFipeRefreshBatch }))

import { GET } from './route'

const originalEnv = { ...process.env }

function makeRequest(authorization?: string) {
  return new Request('http://localhost/api/cron/refresh-fipe', {
    headers: authorization ? { authorization } : undefined,
  })
}

describe('GET /api/cron/refresh-fipe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = 'test-cron-secret'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'server-only-test-key'
    process.env.PLACA_API_TOKEN = 'server-only-placa-token'
    delete process.env.FIPE_REFRESH_BATCH_SIZE
    runFipeRefreshBatch.mockResolvedValue({ scanned: 2, updatedVehicles: 1, unchanged: 1, skipped: 0, retried: 0, failed: 0 })
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it.each([undefined, 'Bearer wrong-secret'])('rejects missing or wrong bearer before starting work', async (authorization) => {
    const response = await GET(makeRequest(authorization))

    expect(response.status).toBe(401)
    expect(runFipeRefreshBatch).not.toHaveBeenCalled()
  })

  it('fails closed when the cron secret is not configured', async () => {
    delete process.env.CRON_SECRET

    const response = await GET(makeRequest('Bearer test-cron-secret'))

    expect(response.status).toBe(503)
    expect(runFipeRefreshBatch).not.toHaveBeenCalled()
  })

  it.each([
    ['NEXT_PUBLIC_SUPABASE_URL'],
    ['SUPABASE_SERVICE_ROLE_KEY'],
    ['PLACA_API_TOKEN'],
  ])('fails closed when %s is missing', async (key) => {
    delete process.env[key]

    const response = await GET(makeRequest('Bearer test-cron-secret'))

    expect(response.status).toBe(503)
    expect(runFipeRefreshBatch).not.toHaveBeenCalled()
  })

  it('runs with the default bounded batch size and returns aggregate counts', async () => {
    const response = await GET(makeRequest('Bearer test-cron-secret'))

    expect(response.status).toBe(200)
    expect(runFipeRefreshBatch).toHaveBeenCalledWith({ limit: 25, now: expect.any(Date) })
    await expect(response.json()).resolves.toEqual({ scanned: 2, updatedVehicles: 1, unchanged: 1, skipped: 0, retried: 0, failed: 0 })
  })

  it.each([
    ['1', 1],
    ['250', 100],
    ['invalid', 25],
    ['0', 25],
  ])('parses batch size %s safely', async (configured, expected) => {
    process.env.FIPE_REFRESH_BATCH_SIZE = configured

    await GET(makeRequest('Bearer test-cron-secret'))

    expect(runFipeRefreshBatch).toHaveBeenCalledWith({ limit: expected, now: expect.any(Date) })
  })

  it('returns a generic error when the worker throws', async () => {
    runFipeRefreshBatch.mockRejectedValue(new Error('sensitive internal detail'))

    const response = await GET(makeRequest('Bearer test-cron-secret'))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'Falha ao atualizar valores FIPE.' })
  })
})
