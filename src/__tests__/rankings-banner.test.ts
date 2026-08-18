import { describe, it, expect } from 'vitest'
import { getMonthlyRankings } from '../lib/rankings-data'

describe('rankings-banner data', () => {
  it('loads top models for home banner preview', async () => {
    const topNew = await getMonthlyRankings('julho-2026', 'new')
    const topUsed = await getMonthlyRankings('julho-2026', 'used')
    expect(topNew[0].model).toBeDefined()
    expect(topUsed[0].model).toBeDefined()
  })
})
