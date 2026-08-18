import { describe, it, expect } from 'vitest'
import { getMonthlyRankings, getModelRankingDetail, getStateRankings } from '../lib/rankings-data'

describe('rankings-data', () => {
  it('returns July 2026 rankings for new cars', async () => {
    const data = await getMonthlyRankings('julho-2026', 'new')
    expect(data.length).toBeGreaterThan(0)
    expect(data[0].model).toBeDefined()
  })

  it('returns details for specific model in July 2026', async () => {
    const detail = await getModelRankingDetail('julho-2026', 'volkswagen-polo')
    expect(detail).not.toBeNull()
    expect(detail?.brand).toBe('Volkswagen')
  })

  it('returns state rankings for state slug', async () => {
    const stateData = await getStateRankings('sao-paulo')
    expect(stateData).not.toBeNull()
    expect(stateData?.stateName).toBe('São Paulo')
    expect(stateData?.rankings.length).toBeGreaterThan(0)
  })
})
