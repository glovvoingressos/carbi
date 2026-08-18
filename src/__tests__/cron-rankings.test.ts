import { describe, it, expect } from 'vitest'
import { GET } from '../app/api/cron/update-rankings/route'

describe('update-rankings cron endpoint', () => {
  it('rejects unauthorized requests when secret does not match', async () => {
    const req = new Request('http://localhost/api/cron/update-rankings?secret=wrong')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('accepts authorized requests or bypasses when secret is matches', async () => {
    const secret = process.env.CRON_SECRET || 'test-cron-secret'
    process.env.CRON_SECRET = secret
    const req = new Request(`http://localhost/api/cron/update-rankings?secret=${secret}`)
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('ok')
  })
})
