'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, ChevronDown, Check } from 'lucide-react'

interface YearSelectorProps {
  currentYear: string | number
  availableYears: number[]
}

export default function YearSelector({ currentYear, availableYears }: YearSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  const handleYearChange = (year: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('year', String(year))
    
    setIsOpen(false)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const yearNumber = typeof currentYear === 'number' ? currentYear : parseInt(currentYear, 10)
  const currentYearDisplay = Number.isNaN(yearNumber) ? currentYear : yearNumber

  return (
    <div className="relative">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary mb-1.5 block ml-1">
        Trocar Ano Modelo
      </label>
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full sm:w-48 bg-white border-2 border-dark rounded-xl px-4 py-3 font-bold text-dark shadow-[4px_4px_0_#000] hover:-translate-y-0.5 transition-all active:translate-y-0 active:shadow-none"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-text-tertiary" />
          <span>{currentYearDisplay}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[110]" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-dark rounded-2xl shadow-[8px_8px_0_#000] z-[120] max-h-64 overflow-y-auto scrollbar-hide py-2 animate-in fade-in slide-in-from-top-2 duration-200">
            {availableYears.map((year) => {
              const isSelected = year === yearNumber
              return (
                <button
                  key={year}
                  onClick={() => handleYearChange(year)}
                  className={`w-full flex items-center justify-between px-5 py-3 text-left text-sm font-bold transition-colors ${
                    isSelected ? 'bg-[var(--color-bento-blue)] text-white' : 'hover:bg-surface text-dark'
                  }`}
                >
                  {year}
                  {isSelected && <Check className="w-4 h-4" />}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
