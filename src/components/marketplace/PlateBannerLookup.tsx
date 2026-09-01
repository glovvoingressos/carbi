'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, AlertCircle, Car, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'
import { lookupPlateClient, savePlateLookup } from '@/lib/integrations/placaapi/client'
import { formatBRL } from '@/data/cars'

type Step = 'input' | 'preview'

type FoundVehicle = {
  brand: string
  model: string
  version: string
  color: string
  year: number
  yearModel?: number
  fipePrice?: number | null
  rawPlate: string
}

export default function PlateBannerLookup() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('input')
  const [plate, setPlate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [found, setFound] = useState<FoundVehicle | null>(null)

  const formatPlate = (value: string) => value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 7)

  const handleLookup = async () => {
    if (plate.length < 7) {
      setError('A placa deve conter 7 caracteres')
      return
    }

    setLoading(true)
    setError(null)

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
    if (found) router.push(`/anunciar-carro/fluxo?placa=${encodeURIComponent(found.rawPlate)}`)
  }

  const handleReset = () => {
    setPlate('')
    setFound(null)
    setError(null)
    setStep('input')
  }

  return (
    <div className={`cb-plate-premium ${step === 'preview' ? 'is-preview' : ''}`}>
      <div className="cb-plate-premium-copy">
        <span className="cb-plate-premium-mark"><Sparkles size={18} /></span>
        <span className="cb-plate-premium-kicker">Anúncio inteligente</span>
        <h3>{step === 'preview' && found ? 'Seu carro está pronto para anunciar' : 'Anuncie seu carro sem preencher tudo'}</h3>
        <p>{step === 'preview' && found ? 'Confira os dados encontrados e publique em poucos passos.' : 'Consulte pela placa e nós buscamos marca, modelo, ano e FIPE para você.'}</p>
        <div className="cb-plate-premium-trust"><ShieldCheck size={14} /> A placa não será publicada</div>
      </div>

      <div className="cb-plate-premium-panel">
        {step === 'input' ? (
          <div className="cb-plate-premium-form">
            <label htmlFor="plate-premium-input">Placa do veículo</label>
            <div className="cb-plate-premium-entry">
              <div className="cb-plate-premium-input-wrap">
                <Car size={19} />
                <input
                  id="plate-premium-input"
                  value={plate}
                  onChange={(event) => { setPlate(formatPlate(event.target.value)); setError(null) }}
                  onKeyDown={(event) => { if (event.key === 'Enter' && !loading && plate.length === 7) handleLookup() }}
                  placeholder="ABC1D23"
                  maxLength={7}
                  disabled={loading}
                  aria-label="Placa do veículo"
                />
              </div>
              <button type="button" onClick={handleLookup} disabled={loading || plate.length < 7}>
                {loading ? <Loader2 className="cb-plate-spin" size={18} /> : <Search size={18} />}
                {loading ? 'Consultando' : 'Consultar'}
              </button>
            </div>
            {error && <p className="cb-plate-premium-error"><AlertCircle size={15} /> {error}</p>}
          </div>
        ) : found ? (
          <div className="cb-plate-result">
            <div className="cb-plate-result-heading"><span>Veículo identificado</span><ShieldCheck size={18} /></div>
            <div className="cb-plate-result-main">
              <div>
                <strong>{found.brand} {found.model}</strong>
                <span>{found.version || 'Versão não informada'}</span>
              </div>
              <div className="cb-plate-result-price">
                <small>FIPE estimada</small>
                <b>{found.fipePrice != null && found.fipePrice > 0 ? formatBRL(found.fipePrice) : 'Indisponível'}</b>
              </div>
            </div>
            <div className="cb-plate-result-details">
              <span><small>Ano</small>{found.year}{found.yearModel && found.yearModel !== found.year ? `/${found.yearModel}` : ''}</span>
              <span><small>Cor</small>{found.color || 'Não informada'}</span>
            </div>
            <div className="cb-plate-result-actions">
              <button type="button" onClick={handleAnunciar}>Continuar anúncio <ArrowRight size={17} /></button>
              <button type="button" onClick={handleReset}>Outra placa</button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
