const fold = (value: string | null | undefined) =>
  String(value || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const titleCase = (value: string) => value
  .trim()
  .toLowerCase()
  .replace(/(^|[\s-])\S/g, (letter) => letter.toUpperCase())

export const TRANSMISSION_OPTIONS = ['Automático', 'Manual', 'CVT', 'Automatizado'] as const
export const FUEL_OPTIONS = ['Flex', 'Gasolina', 'Etanol', 'Diesel', 'Híbrido', 'Elétrico'] as const

export function normalizeTransmission(value: string | null | undefined): string {
  const token = fold(value)
  if (!token) return 'Manual'
  if (token.includes('cvt')) return 'CVT'
  if (
    token.includes('automatiz') ||
    token.includes('dualogic') ||
    token.includes('imotion') ||
    token.includes('easytronic') ||
    token === 'amt'
  ) return 'Automatizado'
  if (
    token.includes('automat') ||
    token.includes('dct') ||
    token.includes('tronic') ||
    token.includes('powershift') ||
    token.includes('tiptronic') ||
    token.includes('dsg')
  ) return 'Automático'
  return 'Manual'
}

export function normalizeFuel(value: string | null | undefined): string {
  const token = fold(value)
  if (token.includes('eletric') || token.includes('electric')) return 'Elétrico'
  if (token.includes('hibrid') || token.includes('hybrid')) return 'Híbrido'
  if (token.includes('diesel')) return 'Diesel'
  if (token.includes('etanol')) return 'Etanol'
  if (token.includes('alcool') || token.includes('flex')) return 'Flex'
  if (token.includes('gasolin')) return 'Gasolina'
  return 'Flex'
}

export function normalizeColor(value: string | null | undefined): string {
  const token = fold(value)
  if (!token) return 'Não informado'
  if (token.includes('branc')) return 'Branco'
  if (token.includes('pret')) return 'Preto'
  if (token.includes('prat')) return 'Prata'
  if (token.includes('cinz') || token.includes('chumbo')) return 'Cinza'
  if (token.includes('vermelh') || token.includes('vinho')) return 'Vermelho'
  if (token.includes('azul')) return 'Azul'
  if (token.includes('verd')) return 'Verde'
  if (token.includes('amarel') || token.includes('dourad')) return 'Amarelo'
  if (token.includes('bege')) return 'Bege'
  if (token.includes('laranj')) return 'Laranja'
  if (token.includes('roxo') || token.includes('violet')) return 'Roxo'
  if (token.includes('marrom')) return 'Marrom'
  return titleCase(String(value))
}

export function normalizeBodyType(value: string | null | undefined): string {
  const token = fold(value)
  if (!token) return 'Não informado'
  if (token.includes('suv')) return 'SUV'
  if (token.includes('pickup') || token.includes('picape')) return 'Picape'
  if (token.includes('automovel')) return 'Automóvel'
  if (token.includes('hatch')) return 'Hatch'
  if (token.includes('sedan')) return 'Sedã'
  if (token.includes('wagon') || token.includes('perua')) return 'Perua'
  if (token.includes('convers')) return 'Conversível'
  if (token.includes('coupe')) return 'Cupê'
  if (token.includes('minivan') || token.includes('monovolume')) return 'Minivan'
  return titleCase(String(value))
}

export function uniqueNormalizedValues(
  values: Array<string | null | undefined>,
  normalize: (value: string | null | undefined) => string,
) {
  const seen = new Set<string>()
  return values.reduce<string[]>((result, value) => {
    const normalized = normalize(value)
    if (!normalized || normalized === 'Não informado' || seen.has(normalized)) return result
    seen.add(normalized)
    result.push(normalized)
    return result
  }, [])
}

export function colorToHex(value: string): string {
  const colors: Record<string, string> = {
    Branco: '#FFFFFF',
    Preto: '#0A0A0A',
    Prata: '#C0C0C0',
    Cinza: '#737373',
    Vermelho: '#DC2626',
    Azul: '#2563EB',
    Verde: '#10B981',
    Amarelo: '#FACC15',
    Bege: '#D6B98C',
    Laranja: '#F97316',
    Roxo: '#8B5CF6',
    Marrom: '#8B5E3C',
  }
  return colors[normalizeColor(value)] || '#9CA3AF'
}

export function filterSearchTokens(value: string, kind: 'transmission' | 'fuel' | 'bodyType' | 'color'): string[] {
  const normalized = kind === 'transmission'
    ? normalizeTransmission(value)
    : kind === 'fuel'
      ? normalizeFuel(value)
      : kind === 'bodyType'
        ? normalizeBodyType(value)
        : normalizeColor(value)
  const token = fold(normalized)

  if (kind === 'transmission') {
    if (normalized === 'Automático') return ['automat', 'automatic', 'dct', 'dsg', 'tronic', 'powershift', 'tiptronic']
    if (normalized === 'Automatizado') return ['automatiz', 'dualogic', 'imotion', 'easytronic', 'amt']
    if (normalized === 'CVT') return ['cvt']
    return ['manual']
  }
  if (kind === 'fuel') {
    if (normalized === 'Elétrico') return ['eletric', 'electric']
    if (normalized === 'Híbrido') return ['hibrid', 'hybrid']
    if (normalized === 'Diesel') return ['diesel']
    if (normalized === 'Gasolina') return ['gasolin']
    if (normalized === 'Etanol') return ['etanol']
    if (normalized === 'Flex') return ['flex', 'alcool']
  }
  if (kind === 'bodyType') return [token]
  return [token]
}
