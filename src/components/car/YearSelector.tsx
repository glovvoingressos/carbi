'use client'

import React, { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, ChevronDown, Check, Loader2 } from 'lucide-react'

interface YearSelectorProps {
  currentYear: string | number
  availableYears: number[]
}

export default function YearSelector({ currentYear, availableYears }: YearSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleYearChange = (year: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('year', String(year))
    
    setIsOpen(false)
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false })
    })
  }

  const yearNumber = typeof currentYear === 'number' ? currentYear : parseInt(currentYear, 10)
  const currentYearDisplay = Number.isNaN(yearNumber) ? currentYear : yearNumber

  return (
    <div className="relative">
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-dark/30 mb-2 block ml-1">
        Trocar Ano Modelo
      </label>
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={`flex items-center justify-between w-full sm:w-48 bg-white border border-black/10 rounded-2xl px-5 py-3 transition-all duration-300
          ${isOpen ? 'ring-2 ring-black/5 border-black/20 shadow-lg' : 'hover:border-black/20 hover:bg-[#fcfcfb]'}
          ${isPending ? 'opacity-50 cursor-wait' : ''}
        `}
      >
        <div className="flex items-center gap-3">
          {isPending ? (
            <Loader2 className="w-4 h-4 text-dark/20 animate-spin" />
          ) : (
            <Calendar className="w-4 h-4 text-dark/20" />
          )}
          <span className="font-bold text-dark text-sm">{currentYearDisplay}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-dark/40 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[110]" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-black/10 rounded-2xl shadow-2xl z-[120] max-h-64 overflow-y-auto scrollbar-hide py-2 animate-in fade-in slide-in-from-top-2 duration-200">
            {availableYears.length > 0 ? (
              availableYears.map((year) => {
                const isSelected = year === yearNumber
                return (
                  <button
                    key={year}
                    onClick={() => handleYearChange(year)}
                    className={`w-full flex items-center justify-between px-5 py-3 text-left text-sm font-bold transition-colors ${
                      isSelected ? 'bg-[#f5f5f3] text-dark' : 'hover:bg-[#f9f9f8] text-dark/60 hover:text-dark'
                    }`}
                  >
                    <span>{year}</span>
                    {isSelected && <Check className="w-4 h-4 text-dark/40" />}
                  </button>
                )
              })
            ) : (
              <div className="px-5 py-4 text-xs text-dark/40 font-medium">
                Nenhum outro ano disponível
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
