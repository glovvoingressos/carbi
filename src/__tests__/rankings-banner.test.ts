import { describe, it, expect } from 'vitest'
import { getMonthlyRankings } from '../lib/rankings-data'

describe('rankings-banner data', () => {
  it('loads the sourced new-car snapshot and no unsupported used ranking', async () => {
    const topNew = await getMonthlyRankings('setembro-2026', 'new')
    const topUsed = await getMonthlyRankings('setembro-2026', 'used')
    expect(topNew).toHaveLength(10)
    expect(topNew[0].model).toBe('Strada')
    expect(topUsed).toEqual([])
  })
})
