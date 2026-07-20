'use client'

interface Column {
  index: number
  header: string
  mappedTo?: string
}

interface ColumnMapperProps {
  columns: Column[]
  onChange: (columns: Column[]) => void
}

const FIELD_OPTIONS = [
  { value: '', label: '-- Ignorar --' },
  { value: 'brand', label: 'Marca' },
  { value: 'model', label: 'Modelo' },
  { value: 'year', label: 'Ano' },
  { value: 'version', label: 'Versão' },
  { value: 'price', label: 'Preço' },
  { value: 'mileage', label: 'Quilometragem' },
  { value: 'color', label: 'Cor' },
  { value: 'fuel', label: 'Combustível' },
  { value: 'transmission', label: 'Câmbio' },
  { value: 'city', label: 'Cidade' },
  { value: 'state', label: 'Estado' },
  { value: 'plate', label: 'Placa' },
  { value: 'description', label: 'Descrição' },
]

export default function ColumnMapper({ columns, onChange }: ColumnMapperProps) {
  const handleChange = (index: number, value: string) => {
    const next = columns.map((col, i) => 
      i === index ? { ...col, mappedTo: value || undefined } : col
    )
    onChange(next)
  }

  return (
    <div className="revenda-mapper">
      <h3 className="revenda-mapper-title">Mapear colunas</h3>
      <div className="revenda-mapper-grid">
        {columns.map((col) => (
          <div key={col.index} className="revenda-mapper-row">
            <span className="revenda-mapper-header">{col.header}</span>
            <span className="revenda-mapper-arrow">→</span>
            <select
              className="revenda-mapper-select"
              value={col.mappedTo || ''}
              onChange={(e) => handleChange(col.index, e.target.value)}
            >
              {FIELD_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}
