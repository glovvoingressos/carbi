import { SEPTEMBER_2026_NEW_RANKINGS } from '@/data/rankings-september-2026'

export type { RankingModelItem, PeriodRankingData, StateRankingData } from '@/data/rankings-types'
import type { RankingModelItem } from '@/data/rankings-types'

export async function getMonthlyRankings(
  period = 'setembro-2026',
  marketType: 'new' | 'used' = 'new',
): Promise<RankingModelItem[]> {
  if (period !== 'setembro-2026' || marketType !== 'new') return []
  return SEPTEMBER_2026_NEW_RANKINGS
}

export async function getModelRankingDetail(
  period = 'setembro-2026',
  slug: string,
): Promise<{ item: RankingModelItem; brand: string; modelName: string; newItem: RankingModelItem } | null> {
  if (period !== 'setembro-2026') return null
  const item = SEPTEMBER_2026_NEW_RANKINGS.find((ranking) => ranking.slug.toLowerCase() === slug.toLowerCase())
  if (!item) return null
  return { item, brand: item.brand, modelName: item.model, newItem: item }
}

export async function getStateRankings(_stateSlug: string): Promise<null> {
  // Não há série estadual própria e documentada disponível para publicar.
  return null
}
