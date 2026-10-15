const MODEL_TRIM_STOPWORDS = new Set([
  'advance', 'advantage', 'ambition', 'attraction', 'black', 'comfortline', 'drive',
  'edition', 'exclusive', 'gl', 'gli', 'griffe', 'highline', 'hybrid', 'line',
  'limited', 'lt', 'ltz', 'm', 'pack', 'performance', 'plus', 'premium', 'prestige',
  'pro', 'rs', 's', 'sline', 'sport', 'style', 'tech', 'touring', 'ultimate', 'xlt',
  'xrx', 'xrv',
])

function normalizeModelText(value: string): string {
  return value
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isEngineToken(token: string): boolean {
  const normalized = normalizeModelText(token)
  const raw = token.trim()
  if (!normalized) return false
  if (/^\d+$/.test(raw) || /^\d+[a-z]$/i.test(raw)) return false
  if (/^\d+[.,]\d+(?:[a-z]+)?$/i.test(raw) || /^\d{3}[id]$/i.test(raw)) return true
  if (/^\d/.test(normalized) && /[.,]/.test(raw)) return true
  return /tfsi|tsi|turbo|flex|tronic|tiptronic|quattro|cv|v6|v8|v12/.test(normalized)
}

export function canonicalModelName(modelName: string): string {
  const rawTokens = String(modelName || '')
    .replace(/\bTTRS\b/gi, 'TT RS')
    .replace(/\bTT-RS\b/gi, 'TT RS')
    .replace(/\bTRON\b/gi, 'TRON')
    .replace(/\be-tron\b/gi, 'etron')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)

  if (rawTokens.length === 0) return ''

  const picked: string[] = []
  for (const token of rawTokens) {
    if (picked.length > 0 && isEngineToken(token)) break
    picked.push(token)
    if (picked.length >= 4) break
  }

  while (picked.length > 1) {
    const tail = normalizeModelText(picked[picked.length - 1]).replace(/-/g, '')
    if (!MODEL_TRIM_STOPWORDS.has(tail)) break
    picked.pop()
  }

  return picked.join(' ').trim() || rawTokens[0]
}

export function canonicalModelSlug(modelName: string): string {
  return normalizeModelText(canonicalModelName(modelName)).replace(/\s+/g, '-')
}
