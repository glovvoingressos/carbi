import { describe, it, expect } from 'vitest'
import { getMonthlyRankings, getModelRankingDetail, getStateRankings } from '../lib/rankings-data'
import { getSeptemberFirstHalfShare } from '@/data/rankings-september-2026'

describe('rankings-data', () => {
  it('returns only the verified partial September 2026 new-car ranking', async () => {
    const data = await getMonthlyRankings('setembro-2026', 'new')
    expect(data).toHaveLength(10)
    expect(data[0].model).toBe('Strada')
    expect(await getMonthlyRankings('setembro-2026', 'used')).toEqual([])
    expect(await getMonthlyRankings('julho-2026', 'new')).toEqual([])
  })

  it('returns model details only for the supported September period', async () => {
    const detail = await getModelRankingDetail('setembro-2026', 'fiat-strada')
    expect(detail).not.toBeNull()
    expect(detail?.brand).toBe('Fiat')
    expect(detail?.modelName).toBe('Strada')
    expect(await getModelRankingDetail('julho-2026', 'volkswagen-polo')).toBeNull()
  })

  it('does not fabricate unsupported state rankings', async () => {
    const stateData = await getStateRankings('sao-paulo')
    expect(stateData).toBeNull()
  })

  it('calculates model share from the published half-month total', () => {
    expect(getSeptemberFirstHalfShare(7307)).toBe(6.7)
  })
})
