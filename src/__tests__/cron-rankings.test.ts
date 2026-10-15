import { describe, it, expect } from 'vitest'
import { GET } from '../app/api/cron/update-rankings/route'

describe('update-rankings cron endpoint', () => {
  it('keeps publishing disabled until a verified source is configured', async () => {
    const req = new Request('http://localhost/api/cron/update-rankings?secret=wrong')
    const res = await GET(req)
    expect(res.status).toBe(410)
    await expect(res.json()).resolves.toMatchObject({
      error: expect.stringContaining('fonte de dados validada'),
    })
  })
})
