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
      <label className="eyebrow mb-2 block">Trocar ano modelo</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={`flex items-center justify-between w-full sm:w-48 h-12 bg-white border rounded-full px-5 transition-colors ${
          isOpen ? 'border-[#0A0A0A]' : 'border-[#EAEAE8] hover:border-[#D4D4D4]'
        } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
      >
        <div className="flex items-center gap-2.5">
          {isPending ? (
            <Loader2 className="w-4 h-4 text-[#A3A3A3] animate-spin" />
          ) : (
            <Calendar className="w-4 h-4 text-[#A3A3A3]" strokeWidth={1.75} />
          )}
          <span className="text-[14px] font-medium text-[#0A0A0A] tracking-tight">{currentYearDisplay}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-[#A3A3A3] transition-transform ${isOpen ? 'rotate-180' : ''}`} strokeWidth={2} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[110]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#EAEAE8] rounded-2xl shadow-lg z-[120] max-h-64 overflow-y-auto custom-scrollbar py-2 animate-fade-in">
            {availableYears.length > 0 ? (
              availableYears.map((year) => {
                const isSelected = year === yearNumber
                return (
                  <button
                    key={year}
                    onClick={() => handleYearChange(year)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-[14px] font-medium tracking-tight transition-colors ${
                      isSelected ? 'bg-[#FAFAF9] text-[#0A0A0A]' : 'text-[#525252] hover:bg-[#FAFAF9] hover:text-[#0A0A0A]'
                    }`}
                  >
                    <span>{year}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#0A0A0A]" strokeWidth={2} />}
                  </button>
                )
              })
            ) : (
              <div className="px-4 py-3 text-[12px] text-[#A3A3A3]">
                Nenhum outro ano disponível
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
