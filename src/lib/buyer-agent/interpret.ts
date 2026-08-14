import { emptyCriteria, CarCriteria, InterpretResult } from './types'
import {
  Vocabulary,
  BRAND_ALIASES,
  normalizeText,
  normalizeBrand,
  normalizeModel,
  resolveAliases,
  resolveBodyType,
  resolveFuel,
  resolveTransmission,
  resolveOptional,
  resolveIntent,
  resolveCity,
} from './vocabulary'

const STOP_WORDS = new Set([
  'quero', 'gostaria', 'procurando', 'procuro', 'busco', 'preciso', 'achei',
  'um', 'uma', 'uns', 'umas', 'o', 'a', 'os', 'as', 'de', 'da', 'do', 'das', 'dos',
  'carro', 'carros', 'veiculo', 'veículo', 'veiculos', 'para', 'por', 'na', 'no',
  'nas', 'nos', 'em', 'com', 'sem', 'e', 'ou', 'até', 'ate', 'novo', 'nova',
  'mais', 'menos', 'que', 'qual', 'me', 'meu', 'minha', 'querendo', 'estou', 'eu',
  'poderia', 'ate', 'r$', 'rs', 'ate', 'porvolta', 'por volta', 'uma', 'depois',
  'series', 'série', 'anos',
])

const YEAR_RE = /\b(19[5-9]\d|20[0-2]\d)\b/
const OWNER_RE = /(?:ultimo|último|unico|único|unico)\s*dono\b|\b(\d{1,2})\s*dono(s)?\b/

const PRICE_DIR_MAX = /(?:até|ate|por até|no maximo|no máximo|no max|maximo|máximo|limitado a|menos de|de menos)/i
const PRICE_DIR_MIN = /(?:a partir de|apartir de|a cima de|acima de|no minimo|no mínimo|pelo menos|mais de|desde)/i

function cleanThousands(value: string): number {
  const normalized = value.replace(/\s/g, '')
  const match = normalized.match(/^\d{1,3}(?:\.\d{3})+(?:,\d+)?$/)
  if (match) return Number(normalized.replace(/\./g, '').replace(',', '.'))
  return Number(normalized.replace(/\./g, '').replace(',', '.'))
}

interface MoneyHit {
  amount: number
  start: number
  end: number
  direction: 'max' | 'min'
}

function scanMoneyAndYears(text: string): { money: MoneyHit[], years: { value: number, start: number, end: number, dir: 'min' | 'max' | 'exact' }[], clean: string } {
  const money: MoneyHit[] = []
  const years: { value: number, start: number, end: number, dir: 'min' | 'max' | 'exact' }[] = []
  let clean = text

  const re = /(?:r\$\s*|\b)(\d{1,3}(?:[.,]\d{3})+(?:,\d+)?|\d+)\s*(mil|milhoes|milhões|k|k\b|reais)?\b/gi
  let match: RegExpExecArray | null
  const removals: { start: number, end: number }[] = []

  while ((match = re.exec(text)) !== null) {
    const raw = match[1]
    const suffix = (match[2] || '').trim().toLowerCase()
    const isYear = !suffix && raw.length === 4 && YEAR_RE.test(raw)

    let value: number
    if (suffix === 'mil' || suffix === 'milhões' || suffix === 'milhoes' || suffix === 'k') {
      const base = Number(raw.replace(/,/g, '.'))
      value = Math.round(base * 1000)
    } else {
      value = cleanThousands(raw)
    }

    const isMoneyMaybe = suffix === 'mil' || suffix === 'milhões' || suffix === 'milhoes' || suffix === 'k' || suffix === 'reais'
    const hasThousandsSeparator = /\.\d{3}/.test(raw)

    const before = text.slice(Math.max(0, match.index - 24), match.index)
    let direction: 'max' | 'min' | null = null
    if (PRICE_DIR_MAX.test(before)) direction = 'max'
    if (PRICE_DIR_MIN.test(before)) direction = 'min'

    if (isYear && !hasThousandsSeparator) {
      const year = value
      const dir: 'min' | 'max' | 'exact' =
        /mais novo|maisnova|novo|nova|acima|para cima|\+/i.test(before) ? 'min'
          : /para traz|pra traz|de traz|mais antigo|antigo|ate 20|até 20|antes de|anterior/i.test(before) ? 'max'
            : 'exact'
      years.push({ value: year, start: match.index, end: match.index + match[0].length, dir })
      removals.push({ start: match.index, end: match.index + match[0].length })
    } else if (isMoneyMaybe || hasThousandsSeparator || value >= 20000) {
      if (direction === null) direction = 'max' // bare price intent "200 mil"
      money.push({ amount: value, start: match.index, end: match.index + match[0].length, direction })
      removals.push({ start: match.index, end: match.index + match[0].length })
    }
  }

  // Handle "entre X e Y mil" as a range, pre-remove from clean text
  const betweenRe = /(?:entre|de)\s+([\d.,]+)\s*(?:mil)?\s*(?:e|a)\s+([\d.,]+)\s*mil\b/gi
  let bm: RegExpExecArray | null
  while ((bm = betweenRe.exec(text)) !== null) {
    const low = Number(bm[1].replace(/,/g, '.'))
    const high = Number(bm[2].replace(/,/g, '.'))
    money.push({ amount: Math.round(low * 1000), start: bm.index, end: bm.index, direction: 'min' })
    money.push({ amount: Math.round(high * 1000), start: bm.index, end: bm.index, direction: 'max' })
    removals.push({ start: bm.index, end: bm.index + bm[0].length })
  }

  if (removals.length > 0) {
    const sorted = removals.sort((a, b) => b.start - a.start)
    let result = text
    for (const range of sorted) {
      result = result.slice(0, range.start) + result.slice(range.end)
    }
    clean = result
  }

  // years that are expressed as bare year but were matched as money-like
  return { money, years, clean }
}

export interface RulesResult {
  criteria: CarCriteria
  concrete: boolean
  cleanText: string
}

export function interpretRules(query: string, vocabulary: Vocabulary): RulesResult {
  const original = query.trim()
  const criteria: CarCriteria = { ...emptyCriteria }
  let text = ` ${original} `

  // 1. Mileage
  const mileageRe = /(\d{1,3}(?:[.,]\d{3})*|\d+)\s*mil\s*(?:quilometros|quilômetros|km|kms|qm)\b/gi
  let m: RegExpExecArray | null
  while ((m = mileageRe.exec(text)) !== null) {
    const base = Number(m[1].replace(/,/g, '.'))
    criteria.mileage_max = Math.round(base * 1000)
    text = text.slice(0, m.index) + ' ' + text.slice(m.index + m[0].length)
  }
  const kmRe = /(\d{1,3}(?:[.,]\d{3})*|\d+)\s*km\b/gi
  while ((m = kmRe.exec(text)) !== null) {
    if (criteria.mileage_max == null) criteria.mileage_max = cleanThousands(m[1])
    text = text.slice(0, m.index) + ' ' + text.slice(m.index + m[0].length)
  }
  const wordKm = /(\d{1,3}(?:[.,]\d{3})*|\d+)\s*quilometros?/gi
  while ((m = wordKm.exec(text)) !== null) {
    if (criteria.mileage_max == null) criteria.mileage_max = cleanThousands(m[1])
    text = text.slice(0, m.index) + ' ' + text.slice(m.index + m[0].length)
  }

  // 2. Owners
  const om = OWNER_RE.exec(text)
  if (om) {
    const num = om[1] ? Number(om[1]) : 1
    criteria.max_owners = num
    text = text.slice(0, om.index) + ' ' + text.slice(om.index + om[0].length)
  }

  // 3. Money + Years
  const scan = scanMoneyAndYears(text)
  for (const money of scan.money) {
    if (money.direction === 'min') criteria.price_min = Math.min(money.amount, criteria.price_min ?? Infinity)
    else criteria.price_max = Math.max(money.amount, criteria.price_max ?? 0)
  }
  for (const year of scan.years) {
    if (year.dir === 'min') criteria.year_min = Math.max(year.value, criteria.year_min ?? 0)
    else if (year.dir === 'max') criteria.year_max = Math.min(year.value, criteria.year_max ?? Infinity)
    else {
      criteria.year_min = criteria.year_min ?? year.value
      criteria.year_max = criteria.year_max ?? year.value + 1
    }
  }
  text = scan.clean

  // 4. City/state
  const city = resolveCity(text)
  if (city.city) criteria.city = city.city
  if (city.state) criteria.state = city.state

  // 5. Fuel
  const fuel = resolveFuel(text)
  if (fuel) criteria.fuel = fuel

  // 6. Transmission
  const transmission = resolveTransmission(text)
  if (transmission === 'automatico' || transmission === 'manual') criteria.transmission = transmission

  // 7. Body type
  const body = resolveBodyType(text)
  if (body) criteria.body_type = body

  // 8. Brand
  const alias = resolveAliases(original)
  let brand = alias.brand
  let brandModelToken = alias.model

  if (brand) {
    criteria.brand = brand
    if (brandModelToken) text = text.replace(new RegExp(`\\b${brandModelToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\b|\\s)`, 'gi'), ' ')
  }

  // 9. Model (from vocabulary)
  const modelKey = findModel(text, vocabulary, brand)
  if (modelKey) {
    criteria.model = modelKey
  } else if (brand && brandModelToken) {
    const candidate = vocabulary.modelsByBrand[brand]?.find(
      (model) => normalizeModel(brandModelToken).includes(normalizeModel(model)) || normalizeModel(model).includes(normalizeModel(brandModelToken))
    )
    if (candidate) criteria.model = candidate
  }

  // 10. Version hints
  const versionRe = /(?:1\.\d|1,6|1,8|2\.0|turbos?|tsi|tfsi|flex|xr|xsx|volare|limited|premium|touring|sport|prestige|dynamic|titano|rapid|confort)/i
  const versionMatch = versionRe.exec(original)
  if (versionMatch && !criteria.version) {
    criteria.version = versionMatch[0]
  }

  // 11. Optionals
  for (const key of ['teto solar', 'couro', 'carplay', 'android auto', 'multimídia', 'multimídia', 'bluetooth', 'câmera de ré', 'sensor de ré', 'xenôn', 'led']) {
    if (normalizeText(original).includes(normalizeText(key))) {
      const opt = resolveOptional(original)
      if (opt && !criteria.optional_items.includes(opt)) criteria.optional_items.push(opt)
    }
  }
  if (normalizeText(original).includes('teto solar') && !criteria.optional_items.includes('teto solar')) {
    criteria.optional_items.push('teto solar')
  }

  // 12. Intent + notes
  const intent = resolveIntent(original)
  if (intent) criteria.intent = intent
  const economico = /economico|econômico|economia|consumo baixo/i.test(original)
  if (economico) criteria.notes = criteria.notes ? `${criteria.notes}; econômico` : 'econômico'
  const confiavel = /confiavel|confiável|seguro|duravel|durável|robusto/i.test(original)
  if (confiavel) criteria.notes = criteria.notes ? `${criteria.notes}; confiável` : 'confiável'

  const concrete =
    criteria.brand != null || criteria.model != null || criteria.body_type != null ||
    criteria.transmission != null || criteria.fuel != null || criteria.price_min != null ||
    criteria.price_max != null || criteria.year_min != null || criteria.year_max != null ||
    criteria.mileage_max != null || criteria.city != null

  return { criteria, concrete, cleanText: text }
}

function findModel(text: string, vocabulary: Vocabulary, brand?: string | null): string | null {
  const norm = normalizeText(text)
  if (norm.length < 2) return null

  const brandKeys = Object.keys(BRAND_ALIASES).map((k) => BRAND_ALIASES[k])
  const candidates = new Set<string>()

  if (brand && vocabulary.modelsByBrand[brand]) {
    for (const model of vocabulary.modelsByBrand[brand]) candidates.add(model)
  } else if (brand) {
    for (const [sellerBrand, models] of Object.entries(vocabulary.modelsByBrand)) {
      if (normalizeBrand(sellerBrand) === normalizeBrand(brand)) for (const model of models) candidates.add(model)
    }
  } else {
    for (const models of Object.values(vocabulary.modelsByBrand)) for (const model of models) candidates.add(model)
  }

  const sorted = [...candidates]
    .map((model) => ({ model, norm: normalizeModel(model) }))
    .filter((item) => item.norm.length >= 2)
    .sort((a, b) => b.norm.length - a.norm.length)

  const textNorm = norm
  for (const item of sorted) {
    if (textNorm.includes(` ${item.norm}`) || textNorm.startsWith(item.norm) || textNorm.includes(` ${item.norm} `)) {
      return item.model
    }
  }
  // word-boundary-free fallback for short models like "Q3", "Gol"
  for (const item of sorted) {
    if (item.norm.length >= 2 && item.norm.length <= 6 && textNorm.includes(item.norm)) return item.model
  }
  return null
}

export function needsLLMFallback(rules: RulesResult): boolean {
  return !rules.concrete
}

export function wantsFollowUp(criteria: CarCriteria, source: 'rules' | 'llm'): { needs: boolean, question?: string } {
  if (criteria.transmission !== null) return { needs: false }
  if (source === 'llm' || criteria.intent !== null || criteria.notes !== null) {
    return { needs: true, question: 'Quer automático ou manual?' }
  }
  return { needs: false }
}

export async function interpretQuery(
  query: string,
  vocabulary: Vocabulary,
  options?: { onLLM?: (query: string, vocabulary: Vocabulary) => Promise<CarCriteria> }
): Promise<InterpretResult> {
  const rules = interpretRules(query, vocabulary)
  const followUp = wantsFollowUp(rules.criteria, 'rules')

  if (!needsLLMFallback(rules)) {
    return {
      query,
      criteria: rules.criteria,
      source: 'rules',
      needsFollowUp: followUp.needs,
      followUpQuestion: followUp.question,
      ambiguous: false,
    }
  }

  if (options?.onLLM) {
    try {
      const llmCriteria = await options.onLLM(query, vocabulary)
      const merged = { ...emptyCriteria, ...rules.criteria, ...llmCriteria }
      const mergedFollowUp = wantsFollowUp(merged, 'llm')
      return {
        query,
        criteria: merged,
        source: 'llm',
        needsFollowUp: mergedFollowUp.needs,
        followUpQuestion: mergedFollowUp.question,
        ambiguous: true,
      }
    } catch (error) {
      console.warn('buyer-agent: LLM fallback falhou, retornando regras parciais:', error)
    }
  }

  const partialFollowUp = wantsFollowUp(rules.criteria, 'llm')
  return {
    query,
    criteria: rules.criteria,
    source: 'rules',
    needsFollowUp: partialFollowUp.needs,
    followUpQuestion: partialFollowUp.question,
    ambiguous: true,
  }
}