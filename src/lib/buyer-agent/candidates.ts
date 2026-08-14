import { CarCriteria, MatchEvaluation, MatchLevel } from './types'
import { toListingsInput } from './explain'
import { evaluateMatch, levelAtLeast } from './match'
import { buildExplanation, humanizeDeviations } from './explain'
import { explanationNotes } from './match'
import { fetchPublicListingsPage } from '@/lib/marketplace-server'
import type { ListingPublic } from '@/lib/marketplace'
import type { ListingsPageInput } from '@/lib/marketplace-server'

export interface RankedCandidate {
  listing: ListingPublic
  evaluation: MatchEvaluation
  explanation: string
  level: MatchLevel
  score: number
}

async function fetchRelaxed(input: Omit<ListingsPageInput, 'page' | 'pageSize'>, pageSize: number): Promise<ListingPublic[]> {
  const { items } = await fetchPublicListingsPage({ ...input, page: 1, pageSize, sort: 'recent' })
  return items
}

export async function findCandidates(
  criteria: CarCriteria,
  opts?: { floor?: MatchLevel; pageSize?: number; maxResults?: number },
): Promise<RankedCandidate[]> {
  const floor: MatchLevel = opts?.floor || 'possivel'
  const pageSize = Math.min(Math.max(opts?.pageSize || 24, 6), 48)
  const maxResults = opts?.maxResults || 12

  const base = toListingsInput(criteria)
  const seen = new Map<string, ListingPublic>()

  // Pass 1 — strict
  const strict = await fetchRelaxed(base, pageSize)
  for (const listing of strict) seen.set(listing.id, listing)

  const want = maxResults * 2

  // Pass 2 — relax price/year slightly (PRÓXIMO "R$ 204k when asked 200k")
  if (seen.size < want) {
    const relaxed: ListingsPageInput = { ...base }
    if (criteria.price_max != null) relaxed.priceMax = Math.round(criteria.price_max * 1.1)
    if (criteria.year_min != null) relaxed.yearMin = criteria.year_min - 2
    if (criteria.year_max != null) relaxed.yearMax = criteria.year_max + 2
    if (relaxed.priceMax !== base.priceMax || relaxed.yearMin !== base.yearMin || relaxed.yearMax !== base.yearMax) {
      const found = await fetchRelaxed(relaxed, pageSize)
      for (const listing of found) {
        if (!seen.has(listing.id)) seen.set(listing.id, listing)
      }
    }
  }

  // Pass 3 — drop model, keep brand (POSSÍVEL "same brand, other model")
  if (seen.size < want && criteria.model != null) {
    const relaxed: ListingsPageInput = { ...base, model: undefined }
    const found = await fetchRelaxed(relaxed, pageSize)
    for (const listing of found) {
      if (!seen.has(listing.id)) seen.set(listing.id, listing)
    }
  }

  // Pass 4 — drop brand too, keep body/fuel/transmission/city (broad POSSÍVEL)
  if (seen.size < want) {
    const relaxed: ListingsPageInput = { ...base, model: undefined, brand: undefined }
    if (criteria.city) delete (relaxed as Partial<ListingsPageInput>).state // state may over-restrict
    const found = await fetchRelaxed(relaxed, pageSize)
    for (const listing of found) {
      if (!seen.has(listing.id)) seen.set(listing.id, listing)
    }
  }

  const ranked: RankedCandidate[] = []
  for (const listing of seen.values()) {
    const evaluation = evaluateMatch(criteria, listing)
    if (!evaluation.compatible) continue
    if (!levelAtLeast(evaluation.level, floor)) continue
    const notes = explanationNotes(listing, evaluation.criteriaMatched, evaluation.deviation, evaluation.level)
    const explanation = buildExplanation(evaluation.level, evaluation.criteriaMatched, evaluation.deviation, notes)
    ranked.push({ listing, evaluation, explanation, level: evaluation.level, score: evaluation.score })
  }

  ranked.sort((a, b) => b.score - a.score || b.listing.year_model - a.listing.year_model)
  return ranked.slice(0, maxResults)
}

export function toMatchLevel(level: string): MatchLevel {
  if (level === 'exato' || level === 'proximo' || level === 'possivel') return level
  return 'possivel'
}

export { humanizeDeviations }