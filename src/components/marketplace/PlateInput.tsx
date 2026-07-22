'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, Car, Check, AlertCircle, Loader2 } from 'lucide-react'
import { lookupPlateClient } from '@/lib/integrations/placaapi/client'

interface PlateInputProps {
  onPlateFound: (data: {
    brand: string
    model: string
    year: number
    yearModel: number
    color: string
    fuel: string
    engine: string
    transmission: string
    bodyType: string
    plate: string
  }) => void
}

export default function PlateInput({ onPlateFound }: PlateInputProps) {
  const [plate, setPlate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [vehicleData, setVehicleData] = useState<{ brand: string; model: string; year: number; color: string } | null>(null)

  const formatPlate = (v: string) => {
    const c = v.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 7)
    return c
  }

  const handleLookup = async () => {
    if (plate.length < 7) { setError('Placa deve ter 7 caracteres'); return }
    setLoading(true); setError(null); setSuccess(false)
    try {
      const data = await lookupPlateClient(plate)
      setSuccess(true)
      setVehicleData({ brand: data.marca, model: data.modelo, year: data.anoFabricacao, color: data.cor })
      onPlateFound({
        brand: data.marca, model: data.modelo, year: data.anoFabricacao, yearModel: data.anoModelo,
        color: data.cor, fuel: data.combustivel, engine: `${data.cilindradas} ${data.potencia}`,
        transmission: data.cambio, bodyType: data.tipoVeiculo, plate: data.placa,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao consultar placa')
    } finally { setLoading(false) }
  }

  const borderColor = success ? 'border-green-500' : error ? 'border-red-500' : 'border-gray-200'
  const focusRing = success ? 'focus:ring-green-500/20' : error ? 'focus:ring-red-500/20' : 'focus:ring-blue-500/20'

  return (
    <div className="w-full">
      <div className={`relative flex items-center gap-2 rounded-xl border-2 ${borderColor} bg-white p-1.5 transition-all duration-200 focus-within:ring-2 ${focusRing}`}>
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100">
          <Car className="w-5 h-5 text-gray-500" />
        </div>
        <input
          type="text"
          value={plate}
          onChange={(e) => { setPlate(formatPlate(e.target.value)); setError(null); setSuccess(false); setVehicleData(null) }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !loading && plate.length === 7) handleLookup() }}
          placeholder="ABC1D23 ou ABC1234"
          maxLength={7}
          disabled={loading}
          className="flex-1 h-10 px-2 text-lg font-mono font-semibold tracking-wider text-gray-800 placeholder:text-gray-400 outline-none bg-transparent disabled:opacity-50"
        />
        <motion.button
          type="button"
          onClick={handleLookup}
          disabled={loading || plate.length < 7}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 h-10 px-5 rounded-lg bg-blue-600 text-white font-medium text-sm transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Consultar
        </motion.button>
      </div>
      <AnimatePresence mode="wait">
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 mt-3 px-4 py-2.5 rounded-lg bg-red-50 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </motion.div>
        )}
        {success && vehicleData && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 mt-3 px-4 py-3 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-800">{vehicleData.brand} {vehicleData.model}</p>
              <p className="text-xs text-green-600">{vehicleData.year} • {vehicleData.color}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
