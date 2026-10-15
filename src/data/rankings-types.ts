export interface RankingModelItem {
  position: number
  previousPosition?: number
  brand: string
  model: string
  versionName?: string
  slug: string
  unitsSold: number
  category: string
  segment: 'hatch' | 'sedan' | 'suv' | 'pickup' | 'electric' | 'sport'
}

export interface PeriodRankingData {
  period: string
  periodLabel: string
  marketType: 'new' | 'used'
  totalMarketUnits: number
  lastUpdated: string
  rankings: RankingModelItem[]
}

export interface StateRankingData {
  stateSlug: string
  stateName: string
  uf: string
  totalUnitsSold: number
  rankings: RankingModelItem[]
}
