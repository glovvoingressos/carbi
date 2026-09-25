export interface PlacaApiResponse {
  capacidadeCarga: number | null
  numeroEixos: number | null
  tipoCabine: string
  pbt: number | null
  cmt: number | null
  categoria: string
  structured_data: Record<string, unknown>
  placa: string
  chassi: string
  renavam: string
  marca: string
  modelo: string
  versao: string
  anoFabricacao: number
  anoModelo: number
  cor: string
  combustivel: string
  cilindradas: string
  potencia: string
  cambio: string
  tipoVeiculo: string
  situacao: string
  uf: string
  municipio: string
  cpfCnpjProprietario: string
  nomeProprietario: string
  dataAtualizacao: string
  fipe_price?: number | null
  fipe_reference_month?: string | null
}

export interface PlacaLookupResult {
  success: boolean
  data?: PlacaApiResponse
  error?: string
}

function first(...values: unknown[]): unknown {
  return values.find((value) => value !== undefined && value !== null && value !== '')
}

function numberValue(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string' || !value.trim()) return null
  const parsed = Number(value.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

function engineFromFipeModel(value: unknown): string {
  if (typeof value !== 'string') return ''
  const match = value.match(/\b(\d+(?:[.,]\d+))\s*(Turbo|Biturbo|Bi[- ]Turbo)?\b/i)
  if (!match) return ''
  return [match[1].replace(',', '.'), match[2]].filter(Boolean).join(' ')
}

export function mapPlacaApiResponse(raw: Record<string, unknown>, cleanPlate: string): PlacaApiResponse {
  const extra = raw.extra && typeof raw.extra === 'object' ? raw.extra as Record<string, unknown> : {}
  const dados = raw.dados && typeof raw.dados === 'object' ? raw.dados as Record<string, unknown> : {}
  const fipe = raw.fipe && typeof raw.fipe === 'object' ? raw.fipe as Record<string, unknown> : {}
  const fipeEntries = Array.isArray(fipe.dados)
    ? fipe.dados.filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
    : []
  const bestFipeEntry = [...fipeEntries].sort((a, b) => (numberValue(b.score) || 0) - (numberValue(a.score) || 0))[0]
  const fipeEngine = engineFromFipeModel(bestFipeEntry?.texto_modelo)
  const value = (...keys: string[]) => first(...keys.flatMap((key) => [raw[key], extra[key], dados[key]]))
  const known = new Set(['extra', 'dados'])
  const structured_data = Object.fromEntries([
    ...Object.entries(extra),
    ...Object.entries(dados),
    ...Object.entries(raw).filter(([key]) => !known.has(key)),
  ])
  return {
    placa: String(first(raw.placa, cleanPlate) || cleanPlate),
    chassi: String(value('chassi', 'vin') || ''),
    renavam: String(raw.renavam || ''),
    marca: String(value('marca') || ''),
    modelo: String(value('modelo') || ''),
    versao: String(raw.VERSAO || raw.versao || ''),
    anoFabricacao: numberValue(value('ano_fabricacao', 'anoFabricacao', 'ano')) || 0,
    anoModelo: numberValue(value('ano_modelo', 'anoModelo')) || 0,
    cor: String(value('cor') || ''),
    combustivel: String(first(value('combustivel'), bestFipeEntry?.combustivel) || ''),
    cilindradas: String(first(value('cilindradas'), fipeEngine) || ''),
    potencia: String(value('potencia', 'hp') || ''),
    cambio: String(value('caixa_cambio', 'cambio') || ''),
    tipoVeiculo: String(value('tipo_veiculo', 'tipoVeiculo') || ''),
    situacao: String(raw.situacao || ''),
    uf: String(value('uf') || ''),
    municipio: String(value('municipio') || ''),
    cpfCnpjProprietario: '',
    nomeProprietario: '',
    dataAtualizacao: String(raw.data || ''),
    capacidadeCarga: numberValue(value('capacidade_carga', 'capacidadeCarga')),
    numeroEixos: numberValue(value('numero_eixos', 'quantidadeEixos', 'eixos')),
    tipoCabine: String(value('tipo_cabine', 'cabine') || ''),
    pbt: numberValue(value('pbt', 'pesoBrutoTotal')),
    cmt: numberValue(value('cmt', 'capacidadeMaximaTracao')),
    categoria: String(value('categoria', 'tipo_veiculo', 'tipoVeiculo') || ''),
    structured_data,
  }
}
