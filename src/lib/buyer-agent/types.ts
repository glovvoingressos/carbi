import { z } from 'zod'

export const criteriaSchema = z.object({
  brand: z.string().nullable().default(null),
  model: z.string().nullable().default(null),
  version: z.string().nullable().default(null),
  year_min: z.number().nullable().default(null),
  year_max: z.number().nullable().default(null),
  price_min: z.number().nullable().default(null),
  price_max: z.number().nullable().default(null),
  mileage_max: z.number().nullable().default(null),
  transmission: z.enum(['automatico', 'manual']).nullable().default(null),
  fuel: z.string().nullable().default(null),
  body_type: z.string().nullable().default(null),
  city: z.string().nullable().default(null),
  state: z.string().nullable().default(null),
  optional_items: z.array(z.string()).default([]),
  max_owners: z.number().nullable().default(null),
  intent: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
})

export type CarCriteria = z.infer<typeof criteriaSchema>

export const emptyCriteria: CarCriteria = {
  brand: null,
  model: null,
  version: null,
  year_min: null,
  year_max: null,
  price_min: null,
  price_max: null,
  mileage_max: null,
  transmission: null,
  fuel: null,
  body_type: null,
  city: null,
  state: null,
  optional_items: [],
  max_owners: null,
  intent: null,
  notes: null,
}

export type InterpretationSource = 'rules' | 'llm'

export interface InterpretResult {
  query: string
  criteria: CarCriteria
  source: InterpretationSource
  needsFollowUp: boolean
  followUpQuestion?: string
  ambiguous: boolean
}

export type MatchLevel = 'exato' | 'proximo' | 'possivel'

export const matchLevelOrder: Record<MatchLevel, number> = { exato: 3, proximo: 2, possivel: 1 }

export const matchLevelLabels: Record<MatchLevel, string> = {
  exato: 'MATCH EXATO',
  proximo: 'MATCH PRÓXIMO',
  possivel: 'POSSÍVEL MATCH',
}

export interface MatchEvaluation {
  level: MatchLevel
  score: number
  criteriaMatched: string[]
  deviation: Deviation[]
  explanation: string
  compatible: boolean
}

export interface Deviation {
  key: string
  label: string
  detail: string
  severity: 'minor' | 'relevant'
}

export interface Vocabulary {
  brands: string[]
  modelsByBrand: Record<string, string[]>
}

export interface SearchMatchRow {
  id: string
  search_id: string
  listing_id: string
  match_level: MatchLevel
  score: number
  criteria_matched: string[]
  deviation: Deviation[]
  explanation: string | null
  notified_email: boolean
  in_app_read: boolean
  created_at: string
  listing: {
    slug: string
    brand: string
    model: string
    version: string | null
    year_model: number
    price: string | number
    mileage: number | null
    city: string
    state: string
    transmission: string | null
    fuel: string | null
    image?: string | null
  } | null
}

export interface BuyerSearchRow {
  id: string
  user_id: string | null
  contact_email: string
  status: 'active' | 'paused' | 'resolved' | 'cancelled'
  original_query: string
  criteria: CarCriteria
  interpretation_source: InterpretationSource
  view_token: string
  match_level_min: MatchLevel
  matched_count: number
  last_scan_at: string | null
  created_at: string
  matches: SearchMatchRow[]
}