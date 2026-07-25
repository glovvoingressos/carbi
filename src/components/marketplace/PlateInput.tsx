'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, Car, Check, AlertCircle, Loader2, TrendingUp, Sparkles } from 'lucide-react'
import { lookupPlateClient } from '@/lib/integrations/placaapi/client'
import { formatBRL } from '@/data/cars'

interface PlateInputProps {
  onPlateFound: (data: {
    brand: string
    model: string
    year: number
    yearModel: number
    color: string
    fuel: string
    engine: string
    horsepower: string
    transmission: string
    bodyType: string
    plate: string
    fipePrice?: number | null
    fipeReference?: string | null
  }) => void
}

export default function PlateInput({ onPlateFound }: PlateInputProps) {
  const [plate, setPlate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [vehicleData, setVehicleData] = useState<{
    brand: string
    model: string
    year: number
    yearModel?: number
    color: string
    fuel?: string
    fipePrice?: number | null
  } | null>(null)

  const formatPlate = (v: string) => {
    return v.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 7)
  }

  const handleLookup = async () => {
    if (plate.length < 7) { setError('A placa deve conter 7 caracteres'); return }
    setLoading(true); setError(null); setSuccess(false)
    try {
      const data = await lookupPlateClient(plate)
      setSuccess(true)
      setVehicleData({
        brand: data.marca,
        model: data.modelo,
        year: data.anoFabricacao,
        yearModel: data.anoModelo,
        color: data.cor,
        fuel: data.combustivel,
        fipePrice: data.fipe_price
      })
      onPlateFound({
        brand: data.marca,
        model: data.modelo,
        year: data.anoFabricacao,
        yearModel: data.anoModelo || data.anoFabricacao,
        color: data.cor,
        fuel: data.combustivel,
        engine: data.cilindradas || '',
        horsepower: data.potencia || '',
        transmission: data.cambio || 'Automático',
        bodyType: data.tipoVeiculo || 'Hatch',
        plate: data.placa || plate,
        fipePrice: data.fipe_price || null,
        fipeReference: data.fipe_reference_month || null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao consultar placa. Verifique os dados e tente novamente.')
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-[#16855C]/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-[#16855C]" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-[#1A1A1A]">Preencher pela placa</h4>
          <p className="text-[11px] text-gray-400">Consulta FIPE e Denatran automática</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
              <Car className="w-4 h-4 text-gray-400" />
              <span className="text-[10px] font-semibold text-gray-400">BR</span>
            </div>
            <input
              type="text"
              value={plate}
              onChange={(e) => { setPlate(formatPlate(e.target.value)); setError(null); setSuccess(false); setVehicleData(null) }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !loading && plate.length === 7) handleLookup() }}
              placeholder="ABC1D23"
              maxLength={7}
              disabled={loading}
              className="w-full h-10 pl-16 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-sm font-mono font-semibold tracking-wider text-[#1A1A1A] placeholder:text-gray-300 focus:outline-none focus:border-[#16855C] focus:ring-2 focus:ring-[#16855C]/10 transition-all uppercase"
            />
          </div>

          <button
            type="button"
            onClick={handleLookup}
            disabled={loading || plate.length < 7}
            className="h-10 px-5 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 shrink-0"
            style={{ backgroundColor: '#16855C' }}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            Buscar
          </button>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg bg-red-50 text-red-600 text-xs">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            </motion.div>
          )}

          {success && vehicleData && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 p-3 rounded-lg bg-emerald-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-sm font-semibold text-[#1A1A1A]">{vehicleData.brand} {vehicleData.model}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Preenchido
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
                  <span>Ano: <strong>{vehicleData.year}{vehicleData.yearModel ? `/${vehicleData.yearModel}` : ''}</strong></span>
                  <span>Cor: <strong>{vehicleData.color}</strong></span>
                  {vehicleData.fuel && <span>Combustível: <strong>{vehicleData.fuel}</strong></span>}
                </div>

                {vehicleData.fipePrice != null && vehicleData.fipePrice > 0 && (
                  <div className="flex items-center gap-1.5 pt-2 border-t border-emerald-100 text-emerald-700 text-xs font-semibold">
                    <TrendingUp className="w-3 h-3" />
                    <span>FIPE: {formatBRL(vehicleData.fipePrice)}</span>
                  </div>
                )}

                <p className="text-[10px] text-emerald-600 mt-1">
                  ✓ Campos vazios foram preenchidos automaticamente
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

