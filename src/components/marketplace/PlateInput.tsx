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
    <div className="w-full bg-gradient-to-br from-gray-900 to-black text-white p-5 sm:p-6 rounded-2xl border border-gray-800 shadow-lg">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-xl bg-[#D4F576]/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-[#D4F576]" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white font-[family-name:var(--font-heading)]">Preencher dados pela Placa</h4>
          <p className="text-xs text-gray-400">Consulte FIPE e Denatran para preencher modelo, ano e versão automaticamente</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch gap-3 mt-4">
        <div className="relative flex-1">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
            <Car className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-bold font-mono tracking-widest text-[#D4F576] bg-[#D4F576]/10 px-1.5 py-0.5 rounded">BR</span>
          </div>
          <input
            type="text"
            value={plate}
            onChange={(e) => { setPlate(formatPlate(e.target.value)); setError(null); setSuccess(false); setVehicleData(null) }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !loading && plate.length === 7) handleLookup() }}
            placeholder="ABC1D23"
            maxLength={7}
            disabled={loading}
            className="w-full h-12 pl-24 pr-4 rounded-xl bg-white/10 border border-white/20 text-lg font-mono font-bold tracking-widest text-white placeholder:text-gray-500 focus:outline-none focus:border-[#D4F576] transition-all uppercase"
          />
        </div>

        <motion.button
          type="button"
          onClick={handleLookup}
          disabled={loading || plate.length < 7}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="h-12 px-6 rounded-xl bg-[#D4F576] text-gray-950 font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#c8e64e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          <span>Buscar Placa</span>
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-2 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </motion.div>
        )}

        {success && vehicleData && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="font-bold text-white text-sm">{vehicleData.brand} {vehicleData.model}</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                Preenchido com sucesso!
              </span>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-300 pt-1 text-[11px]">
              <span>Ano: <strong>{vehicleData.year}{vehicleData.yearModel ? `/${vehicleData.yearModel}` : ''}</strong></span>
              <span>Cor: <strong>{vehicleData.color}</strong></span>
              {vehicleData.fuel && <span>Combustível: <strong>{vehicleData.fuel}</strong></span>}
            </div>

            {vehicleData.fipePrice != null && vehicleData.fipePrice > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t border-emerald-500/20 text-emerald-400 font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Valor Tabela FIPE: {formatBRL(vehicleData.fipePrice)}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

