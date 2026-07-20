import type { SpreadsheetColumn } from './types'

const COLUMN_ALIASES: Record<string, string[]> = {
  brand: ['marca', 'brand', 'montadora', 'fabricante'],
  model: ['modelo', 'model'],
  year: ['ano', 'year', 'ano modelo', 'ano_modelo'],
  version: ['versão', 'versao', 'trim', 'version'],
  price: ['preço', 'preco', 'price', 'valor'],
  mileage: ['km', 'quilometragem', 'mileage', 'odometro'],
  color: ['cor', 'color', 'cor do carro'],
  fuel: ['combustível', 'combustivel', 'fuel', 'tipo de combustível'],
  transmission: ['câmbio', 'cambio', 'transmissão', 'transmissao', 'transmission', 'cambio'],
  city: ['cidade', 'city'],
  state: ['estado', 'state', 'uf'],
  plate: ['placa', 'plate'],
  description: ['descrição', 'descricao', 'description', 'obs', 'observação'],
}

export function autoMapColumns(headers: string[]): SpreadsheetColumn[] {
  return headers.map((header, index) => {
    const normalized = header.toLowerCase().trim()
    let mappedTo: string | undefined

    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (aliases.some(alias => normalized.includes(alias))) {
        mappedTo = field
        break
      }
    }

    return { index, header, mappedTo }
  })
}

export function getRequiredFields(): string[] {
  return ['brand', 'model', 'year', 'price']
}

export function validateMapping(columns: SpreadsheetColumn[]): string[] {
  const errors: string[] = []
  const required = getRequiredFields()
  const mapped = columns.filter(c => c.mappedTo).map(c => c.mappedTo)

  for (const field of required) {
    if (!mapped.includes(field)) {
      errors.push(`Campo obrigatório não mapeado: ${field}`)
    }
  }

  return errors
}
