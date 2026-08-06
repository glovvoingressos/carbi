'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, AlertCircle, Car, ArrowRight } from 'lucide-react'
import { lookupPlateClient, savePlateLookup } from '@/lib/integrations/placaapi/client'
import { formatBRL } from '@/data/cars'

type Step = 'input' | 'preview'

export default function PlateBannerLookup() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('input')
  const [plate, setPlate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [found, setFound] = useState<{
    brand: string
    model: string
    version: string
    color: string
    year: number
    yearModel?: number
    fipePrice?: number | null
    rawPlate: string
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
        version: data.versao || '',
        color: data.cor,
        year: data.anoFabricacao,
        yearModel: data.anoModelo,
        fipePrice: data.fipe_price,
        rawPlate: data.placa || plate,
      })
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao consultar placa. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleAnunciar = () => {
    if (!found) return
    router.push(`/anunciar-carro/fluxo?placa=${encodeURIComponent(found.rawPlate)}`)
  }

  const handleReset = () => {
    setPlate('')
    setFound(null)
    setError(null)
    setStep('input')
  }

  return (
    <div className="promo-plate">
      {step === 'input' ? (
        <>
          <div className="promo-plate-row">
            <div className="promo-plate-input-wrap">
              <Car className="promo-plate-input-icon" size={16} />
              <input
                type="text"
                value={plate}
                onChange={(e) => { setPlate(formatPlate(e.target.value)); setError(null) }}
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

          <p className="promo-plate-note">A placa é usada apenas para preencher os dados do veículo e não será publicada.</p>
        </>
      ) : found ? (
        <div className="promo-plate-preview">
          <div className="promo-plate-preview-header">
            <Car size={18} />
            <span>Veículo encontrado</span>
          </div>

          <div className="promo-plate-preview-grid">
            <div className="promo-plate-preview-item">
              <span className="promo-plate-preview-label">Marca</span>
              <span className="promo-plate-preview-value">{found.brand}</span>
            </div>
            <div className="promo-plate-preview-item">
              <span className="promo-plate-preview-label">Modelo</span>
              <span className="promo-plate-preview-value">{found.model}</span>
            </div>
            <div className="promo-plate-preview-item">
              <span className="promo-plate-preview-label">Versão</span>
              <span className="promo-plate-preview-value">{found.version || '—'}</span>
            </div>
            <div className="promo-plate-preview-item">
              <span className="promo-plate-preview-label">Cor</span>
              <span className="promo-plate-preview-value">{found.color}</span>
            </div>
            <div className="promo-plate-preview-item">
              <span className="promo-plate-preview-label">Ano</span>
              <span className="promo-plate-preview-value">
                {found.year}{found.yearModel && found.yearModel !== found.year ? `/${found.yearModel}` : ''}
              </span>
            </div>
            <div className="promo-plate-preview-item">
              <span className="promo-plate-preview-label">FIPE</span>
              <span className="promo-plate-preview-value promo-plate-preview-fipe">
                {found.fipePrice != null && found.fipePrice > 0 ? formatBRL(found.fipePrice) : '—'}
              </span>
            </div>
          </div>

          <div className="promo-plate-preview-actions">
            <button type="button" onClick={handleAnunciar} className="promo-plate-preview-btn">
              Anunciar <ArrowRight size={16} />
            </button>
            <button type="button" onClick={handleReset} className="promo-plate-preview-back">
              Buscar outra placa
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
