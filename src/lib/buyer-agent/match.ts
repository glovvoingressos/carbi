import { CarCriteria, MatchEvaluation, Deviation, MatchLevel, matchLevelOrder } from './types'
import { normalizeText, normalizeBrand, normalizeModel } from './vocabulary'
import { ListingPublic } from '@/lib/marketplace'

const CRITERION_WEIGHTS: Record<string, number> = {
  model: 25,
  brand: 15,
  year: 12,
  price: 18,
  body: 10,
  transmission: 10,
  fuel: 5,
  city: 10,
  mileage: 5,
  owners: 5,
  optional: 5,
  intent: 3,
}

interface ScoreState {
  matched: string[]
  deviation: Deviation[]
  score: number
  notes: string[]
}

function bump(state: ScoreState, key: string, satisfied: boolean, weight = CRITERION_WEIGHTS[key] ?? 0) {
  if (satisfied) {
    if (!state.matched.includes(key)) {
      state.matched.push(key)
      state.score += weight
    }
    return 'matched'
  }
  return 'missed'
}

export function evaluateMatch(criteria: CarCriteria, listing: ListingPublic, opts?: { skipLevelGate?: boolean }): MatchEvaluation {
  const state: ScoreState = { matched: [], deviation: [], score: 0, notes: [] }

  const price = Number(listing.price)
  const year = Number(listing.year_model)
  const mileage = Number(listing.mileage) || 0
  const listingBrand = normalizeBrand(listing.brand)
  const listingModel = normalizeModel(listing.model)
  const listingBody = normalizeText(listing.body_type || '')
  const listingTransmission = normalizeText(String(listing.transmission || ''))
  const listingFuel = normalizeText(listing.fuel || '')
  const listingCity = normalizeText(listing.city || '')
  const listingState = normalizeText(listing.state || '')

  const brandMismatch = criteria.brand != null && !listingBrand.includes(normalizeBrand(criteria.brand)) && !normalizeBrand(criteria.brand).includes(listingBrand)

  // Brand
  if (criteria.brand != null) {
    if (brandMismatch) {
      state.deviation.push({ key: 'brand', label: listing.brand, detail: `marca ${listing.brand}`, severity: 'relevant' })
    } else {
      bump(state, 'brand', true)
    }
  }

  // Model (needs brand context)
  if (criteria.model != null && listingModel.length > 0) {
    const normModel = normalizeModel(criteria.model)
    const modelMatch = listingModel.includes(normModel) || normModel.includes(listingModel)
    if (modelMatch) {
      bump(state, 'model', true)
    } else {
      state.deviation.push({ key: 'model', label: listing.model, detail: `modelo ${listing.model}`, severity: 'relevant' })
    }
  } else if (criteria.model == null && criteria.brand != null && !brandMismatch) {
    // No model requested, but same brand — treat brand as matched (may be a different model)
    bump(state, 'brand', true)
  }

  // Year
  if (criteria.year_min !== null || criteria.year_max !== null) {
    const min = criteria.year_min ?? 1900
    const max = criteria.year_max ?? 2100
    const inRange = year >= min && year <= max
    if (inRange) bump(state, 'year', true)
    else {
      const closeness = Math.max(min - year, year - max)
      if (closeness <= 2) {
        state.deviation.push({ key: 'year', label: String(year), detail: `ano ${year}`, severity: 'minor' })
      } else {
        state.deviation.push({ key: 'year', label: String(year), detail: `ano ${year}`, severity: 'relevant' })
      }
    }
  }

  // Price
  if (criteria.price_max !== null) {
    const over = price - criteria.price_max
    if (price <= criteria.price_max) {
      if (price < criteria.price_max * 0.97) {
        const diffPct = ((criteria.price_max - price) / criteria.price_max) * 100
        if (diffPct >= 10) state.notes.push('preço abaixo do seu limite')
      }
      bump(state, 'price', true)
    } else if (over <= criteria.price_max * 0.1) {
      state.deviation.push({ key: 'price', label: listing.model, detail: `${over}`, severity: 'minor' })
    } else {
      state.deviation.push({ key: 'price', label: listing.model, detail: `${over}`, severity: 'relevant' })
    }
  }
  if (criteria.price_min !== null) {
    if (price >= criteria.price_min) bump(state, 'price', true)
    else state.deviation.push({ key: 'price', label: listing.model, detail: `${criteria.price_min - price}`, severity: 'minor' })
  }

  // Mileage
  if (criteria.mileage_max !== null) {
    if (mileage <= criteria.mileage_max) bump(state, 'mileage', true)
    else {
      const over = mileage - criteria.mileage_max
      if (over <= criteria.mileage_max * 0.2) state.deviation.push({ key: 'mileage', label: listing.model, detail: `${over}`, severity: 'minor' })
      else state.deviation.push({ key: 'mileage', label: listing.model, detail: `${over}`, severity: 'relevant' })
    }
  }

  // Body
  if (criteria.body_type != null) {
    const bodyNorm = normalizeText(criteria.body_type)
    if (listingBody.includes(bodyNorm)) bump(state, 'body', true)
    else state.deviation.push({ key: 'body', label: listing.body_type || 'não informada', detail: listing.body_type || '', severity: 'relevant' })
  }

  // Transmission
  if (criteria.transmission != null) {
    const isAuto = listingTransmission.includes('auto')
    const wantAuto = criteria.transmission === 'automatico'
    if ((wantAuto && isAuto) || (!wantAuto && !isAuto)) bump(state, 'transmission', true)
    else state.deviation.push({ key: 'transmission', label: String(listing.transmission || ''), detail: 'câmbio', severity: 'relevant' })
  }

  // Fuel
  if (criteria.fuel != null) {
    const fuelNorm = normalizeText(criteria.fuel)
    if (listingFuel.includes(fuelNorm)) bump(state, 'fuel', true)
    else state.deviation.push({ key: 'fuel', label: listing.fuel, detail: listing.fuel, severity: 'relevant' })
  }

  // City / State
  if (criteria.city != null) {
    if (listingCity.includes(normalizeText(criteria.city)) || normalizeText(criteria.city).includes(listingCity)) {
      bump(state, 'city', true)
    } else {
      state.deviation.push({ key: 'city', label: `${listing.city}${listing.state ? '/' + listing.state : ''}`, detail: listing.city, severity: 'minor' })
    }
  } else if (criteria.state != null) {
    if (listingState.includes(normalizeText(criteria.state))) bump(state, 'city', true)
    else state.deviation.push({ key: 'state', label: listing.state, detail: listing.state, severity: 'minor' })
  }

  // Owners (not present in listing schema in a comparable way; treat as soft)
  if (criteria.max_owners != null) {
    bump(state, 'owners', true) // best-effort
  }

  // Optionals
  if (criteria.optional_items.length > 0) {
    const listingOptions = (listing.optional_items || []).map((o) => normalizeText(o))
    let matchedOptions = 0
    for (const wanted of criteria.optional_items) {
      const wantedNorm = normalizeText(wanted)
      if (listingOptions.some((o) => o.includes(wantedNorm) || wantedNorm.includes(o))) matchedOptions++
    }
    const ratio = matchedOptions / criteria.optional_items.length
    if (ratio >= 0.66) bump(state, 'optional', true, CRITERION_WEIGHTS.optional * ratio)
    else if (matchedOptions > 0) state.deviation.push({ key: 'optional', label: criteria.optional_items.join(', '), detail: 'faltam opcionais', severity: 'minor' })
    else state.deviation.push({ key: 'optional', label: criteria.optional_items.join(', '), detail: 'sem os opcionais pedidos', severity: 'relevant' })
  }

  if (criteria.intent) bump(state, 'intent', true)

  // Level logic
  const relevantDev = state.deviation.some((d) => d.severity === 'relevant')
  const minorDev = state.deviation.filter((d) => d.severity === 'minor').length

  let level: MatchLevel = 'exato'
  if (brandMismatch && criteria.model != null) {
    // Model requested but different brand entirely → too far off; treat as possivel only if intended permissively
    level = 'possivel'
  } else if (relevantDev) {
    level = 'possivel'
  } else if (minorDev > 0) {
    level = 'proximo'
  }

  // Sanity: if nothing was matched at all, mark incompatible
  const compatible = state.matched.length > 0 || (opts?.skipLevelGate ?? false)

  return {
    level,
    score: Math.round(state.score * 100) / 100,
    criteriaMatched: state.matched.sort((a, b) => (CRITERION_WEIGHTS[b] ?? 0) - (CRITERION_WEIGHTS[a] ?? 0)),
    deviation: state.deviation,
    explanation: '',
    compatible,
  }
}

export function scoreForSearch(criteria: CarCriteria, listing: ListingPublic): MatchEvaluation {
  return evaluateMatch(criteria, listing)
}

export function levelAtLeast(level: MatchLevel, floor: MatchLevel): boolean {
  return matchLevelOrder[level] >= matchLevelOrder[floor]
}

export function explanationNotes(listing: ListingPublic, matched: string[], deviation: Deviation[], level: MatchLevel): string[] {
  const notes: string[] = []
  if (typeof listing.fipe_difference_percent === 'number' && listing.fipe_difference_percent <= -3) {
    notes.push('preço abaixo da FIPE')
  }
  return notes
}