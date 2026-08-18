import {
  JULY_2026_NEW_RANKINGS,
  JULY_2026_USED_RANKINGS,
  STATE_RANKINGS_DATA,
  RankingModelItem,
  PeriodRankingData,
  StateRankingData,
} from '../data/rankings-july-2026'

export type { RankingModelItem, PeriodRankingData, StateRankingData }

export async function getMonthlyRankings(
  period = 'julho-2026',
  marketType: 'new' | 'used' = 'new'
): Promise<RankingModelItem[]> {
  if (period === 'julho-2026') {
    return marketType === 'new' ? JULY_2026_NEW_RANKINGS : JULY_2026_USED_RANKINGS
  }
  return marketType === 'new' ? JULY_2026_NEW_RANKINGS : JULY_2026_USED_RANKINGS
}

export async function getModelRankingDetail(
  period = 'julho-2026',
  slug: string
): Promise<{ item: RankingModelItem; brand: string; modelName: string; newItem?: RankingModelItem; usedItem?: RankingModelItem } | null> {
  const normSlug = slug.toLowerCase()
  const newItem = JULY_2026_NEW_RANKINGS.find((r) => r.slug.toLowerCase() === normSlug)
  const usedItem = JULY_2026_USED_RANKINGS.find((r) => r.slug.toLowerCase() === normSlug)

  const item = newItem || usedItem
  if (!item) return null

  return {
    item,
    brand: item.brand,
    modelName: item.model,
    newItem,
    usedItem,
  }
}

export async function getStateRankings(stateSlug: string): Promise<StateRankingData | null> {
  const normSlug = stateSlug.toLowerCase()
  const found = STATE_RANKINGS_DATA[normSlug]
  if (found) return found

  return {
    stateSlug: normSlug,
    stateName: normSlug.replace(/-/g, ' ').toUpperCase(),
    uf: 'BR',
    totalUnitsSold: 45000,
    rankings: JULY_2026_NEW_RANKINGS.slice(0, 10),
  }
}
