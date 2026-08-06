'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, AlertCircle, Check, Car } from 'lucide-react'
import { lookupPlateClient, savePlateLookup } from '@/lib/integrations/placaapi/client'
import { formatBRL } from '@/data/cars'

export default function PlateBannerLookup() {
  const router = useRouter()
  const [plate, setPlate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [found, setFound] = useState<{
    brand: string
    model: string
    year: number
    yearModel?: number
    fipePrice?: number | null
  } | null>(null)

  const formatPlate = (v: string) => v.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 7)

  const handleLookup = async () => {
    if (plate.length < 7) { setError('A placa deve conter 7 caracteres'); return }
    setLoading(true); setError(null); setFound(null)
    try {
      const data = await lookupPlateClient(plate)
      savePlateLookup(data)
      setFound({
        brand: data.marca,
        model: data.modelo,
        year: data.anoFabricacao,
        yearModel: data.anoModelo,
        fipePrice: data.fipe_price,
      })
      router.push(`/anunciar-carro/fluxo?placa=${encodeURIComponent(data.placa || plate)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao consultar placa. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="promo-plate">
      <div className="promo-plate-row">
        <div className="promo-plate-input-wrap">
          <Car className="promo-plate-input-icon" size={16} />
          <input
            type="text"
            value={plate}
            onChange={(e) => { setPlate(formatPlate(e.target.value)); setError(null); setFound(null) }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !loading && plate.length === 7) handleLookup() }}
            placeholder="Digite a placa (ABC1D23)"
            maxLength={7}
            disabled={loading}
            aria-label="Placa do veículo"
            className="promo-plate-input"
          />
        </div>
        <button type="button" onClick={handleLookup} disabled={loading || plate.length < 7} className="promo-plate-btn">
          {loading ? <Loader2 className="promo-plate-btn-spin" size={16} /> : <Search size={16} />}
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {error ? (
        <p className="promo-plate-error"><AlertCircle size={14} />{error}</p>
      ) : null}

      {found ? (
        <p className="promo-plate-found">
          <Check size={14} />
          {found.brand} {found.model} {found.year}
          {found.yearModel && found.yearModel !== found.year ? `/${found.yearModel}` : ''}
          {found.fipePrice != null && found.fipePrice > 0 ? ` • FIPE ${formatBRL(found.fipePrice)}` : ''}
        </p>
      ) : null}

      <p className="promo-plate-note">A placa é usada apenas para preencher os dados do veículo e não será publicada.</p>
    </div>
  )
}
