import { CarCriteria } from './types'
import { ListingsPageInput } from '@/lib/marketplace-server'
import { formatBRL } from '@/data/cars'
import { MatchLevel, matchLevelLabels, Deviation } from './types'

export { matchLevelLabels }

export interface CriteriaLine {
  key: string
  label: string
  value: string
}

export function criteriaLines(criteria: CarCriteria): CriteriaLine[] {
  const lines: CriteriaLine[] = []

  if (criteria.brand) {
    const modelPart = criteria.model ? ` ${criteria.model}` : ''
    lines.push({ key: 'model', label: criteria.model ? 'Marca e modelo' : 'Marca', value: `${criteria.brand}${modelPart}` })
  } else if (criteria.model) {
    lines.push({ key: 'model', label: 'Modelo', value: criteria.model })
  }

  if (criteria.year_min !== null && criteria.year_max !== null && criteria.year_min === criteria.year_max) {
    lines.push({ key: 'year', label: 'Ano', value: String(criteria.year_min) })
  } else if (criteria.year_min !== null && criteria.year_max !== null) {
    lines.push({ key: 'year', label: 'Ano', value: `${criteria.year_min} a ${criteria.year_max}` })
  } else if (criteria.year_min !== null) {
    lines.push({ key: 'year', label: 'Ano mínimo', value: `${criteria.year_min}+` })
  } else if (criteria.year_max !== null) {
    lines.push({ key: 'year', label: 'Ano', value: `até ${criteria.year_max}` })
  }

  if (criteria.price_min !== null && criteria.price_max !== null) {
    lines.push({ key: 'price', label: 'Preço', value: `${formatBRL(criteria.price_min)} a ${formatBRL(criteria.price_max)}` })
  } else if (criteria.price_max !== null) {
    lines.push({ key: 'price', label: 'Preço', value: `Até ${formatBRL(criteria.price_max)}` })
  } else if (criteria.price_min !== null) {
    lines.push({ key: 'price', label: 'Preço', value: `A partir de ${formatBRL(criteria.price_min)}` })
  }

  if (criteria.transmission) {
    lines.push({ key: 'transmission', label: 'Câmbio', value: criteria.transmission === 'automatico' ? 'Automático' : 'Manual' })
  }

  if (criteria.fuel) {
    lines.push({ key: 'fuel', label: 'Combustível', value: criteria.fuel })
  }

  if (criteria.body_type) {
    lines.push({ key: 'body', label: 'Carroceria', value: criteria.body_type })
  }

  if (criteria.mileage_max !== null) {
    lines.push({ key: 'mileage', label: 'Quilometragem', value: `Até ${criteria.mileage_max.toLocaleString('pt-BR')} km` })
  }

  if (criteria.max_owners !== null) {
    lines.push({ key: 'owners', label: 'Proprietários', value: `Até ${criteria.max_owners}` })
  }

  if (criteria.city) {
    lines.push({ key: 'location', label: 'Localização', value: criteria.state ? `${criteria.city} (${criteria.state})` : criteria.city })
  } else if (criteria.state) {
    lines.push({ key: 'location', label: 'Localização', value: criteria.state })
  }

  if (criteria.optional_items.length > 0) {
    lines.push({ key: 'optional', label: 'Opcionais', value: criteria.optional_items.join(', ') })
  }

  if (criteria.intent && criteria.intent === 'family') {
    lines.push({ key: 'intent', label: 'Objetivo', value: 'Família' })
  }

  return lines
}

export function criteriaSummary(criteria: CarCriteria): string {
  const lines = criteriaLines(criteria)
  const parts = [
    criteria.brand || criteria.model || null,
    criteria.year_min !== null && criteria.year_max === criteria.year_min ? String(criteria.year_min) : null,
    criteria.year_min !== null && criteria.year_max !== null && criteria.year_max !== criteria.year_min ? `${criteria.year_min}-${criteria.year_max}` : null,
    criteria.year_min !== null && criteria.year_max === null ? `${criteria.year_min}+` : null,
    criteria.year_max !== null && criteria.year_min === null ? `até ${criteria.year_max}` : null,
    criteria.price_max !== null ? formatBRL(criteria.price_max) : null,
    criteria.transmission ? (criteria.transmission === 'automatico' ? 'Automático' : 'Manual') : null,
    criteria.body_type || null,
    criteria.city || criteria.state || null,
  ].filter(Boolean)

  return parts.join(' · ')
}

export function toListingsInput(criteria: CarCriteria): ListingsPageInput {
  const input: ListingsPageInput = {
    brand: criteria.brand ?? undefined,
    model: criteria.model ?? undefined,
    priceMin: criteria.price_min ?? undefined,
    priceMax: criteria.price_max ?? undefined,
    yearMin: criteria.year_min ?? undefined,
    yearMax: criteria.year_max ?? undefined,
    mileageMax: criteria.mileage_max ?? undefined,
    transmission: criteria.transmission ?? undefined,
    fuel: criteria.fuel ?? undefined,
    bodyType: criteria.body_type ?? undefined,
    city: criteria.city ?? undefined,
    state: criteria.state ?? undefined,
  }
  if (criteria.optional_items.length > 0) input.optionalItems = criteria.optional_items
  return input
}

export function matchLevelBadge(level: MatchLevel): string {
  return matchLevelLabels[level]
}

const deviationHumans: Record<string, string> = {
  brand: 'marca',
  model: 'modelo',
  version: 'versão',
  year: 'ano',
  price: 'preço',
  mileage: 'quilometragem',
  transmission: 'câmbio',
  fuel: 'combustível',
  body: 'carroceria',
  city: 'cidade',
  state: 'estado',
  owners: 'proprietários',
  optional: 'opcionais',
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function humanizeDeviations(deviation: Deviation[]): string[] {
  return deviation.map((d) => {
    const what = deviationHumans[d.key] || d.key
    if (d.key === 'price') {
      const num = parseFloat(d.detail.replace(/[^\d.-]/g, ''))
      if (!Number.isFinite(num)) return `diferença no ${what}`
      if (num > 0) return `está ${formatMoney(Math.abs(num))} acima do seu limite de preço`
      return `está ${formatMoney(Math.abs(num))} abaixo do seu limite de preço`
    }
    if (d.key === 'mileage') {
      const num = parseFloat(d.detail.replace(/[^\d.-]/g, ''))
      if (Number.isFinite(num) && num > 0) return `possui ${num.toLocaleString('pt-BR').replace(' km', '')} km a menos`
      return `possui quilometragem maior que a pedida`
    }
    if (d.key === 'model') return `mesma marca, porém outro modelo`
    if (d.key === 'body') return `outra carroceria (${d.label || 'não informada'})`
    if (d.key === 'city' || d.key === 'state') return `em outro local: ${d.label || d.detail}`
    return `${what} diferente: ${d.label || d.detail}`
  })
}

export function buildExplanation(level: MatchLevel, matched: string[], deviation: Deviation[], notes: string[]): string {
  const matchedLabels = matched.map((m) => deviationHumans[m] || m)

  if (level === 'exato') {
    const top = matchedLabels.slice(0, 3)
    const list = top.length > 0 ? `modelo, ano e preço` : 'seus critérios principais'
    return `Encontramos este porque atende aos seus principais critérios: ${list}.`
  }

  if (level === 'proximo') {
    const devHuman = humanizeDeviations(deviation)
    if (devHuman.length > 0) {
      const positive = notes.length > 0 ? ` Algo positivo: ${notes[0]}.` : ''
      return `Encontramos este como alternativa: ${devHuman.join(' e ')}.${positive}`
    }
    return 'Encontramos este como alternativa, muito próximo dos seus critérios.'
  }

  // possivel
  const devHuman = humanizeDeviations(deviation)
  if (deviation.some((d) => d.key === 'model')) {
    return 'Encontramos este como opção parecida: mesma marca, porém modelo diferente.'
  }
  if (deviation.some((d) => d.key === 'brand')) {
    return 'Encontramos este como opção parecida: mesmo segmento, porém de outra marca.'
  }
  if (devHuman.length > 0) {
    return `Encontramos este como opção parecida: ${devHuman[0]}.`
  }
  return 'Encontramos este como opção parecida com o que você procura.'
}