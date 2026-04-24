'use client'

import React from 'react'
import { Calendar, TrendingUp, ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { formatBRL } from '@/data/cars'

interface HistoryItem {
  year: number
  price: string
  priceNum: number
}

interface FipeHistoryProps {
  history: HistoryItem[]
}

export default function FipeHistory({ history }: FipeHistoryProps) {
  if (!history || history.length === 0) return null

  // Calculate depreciation vs latest year
  const latestPrice = history[0].priceNum
  
  return (
    <div className="pastel-card pastel-card-blue rounded-[40px] overflow-hidden mt-12 mb-8">
      <div className="bg-[#1a1a1a] p-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-dark">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold uppercase tracking-tight text-white">Histórico de Valor</h3>
            <p className="text-xs font-medium text-white/50 uppercase tracking-widest">Trajetória de valor (6 anos)</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
           <TrendingUp className="w-4 h-4 text-white/70" />
           <span className="text-[10px] font-semibold uppercase tracking-widest text-white/70">Dados Oficiais</span>
        </div>
      </div>

      <div className="p-4 sm:p-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {history.map((item, i) => {
            const isLatest = i === 0;
            const diff = !isLatest ? ((item.priceNum - latestPrice) / item.priceNum * 100).toFixed(1) : null;
            
            return (
              <div 
                key={item.year} 
                className={`relative p-5 rounded-[28px] transition-all hover:-translate-y-1 ${
                  isLatest ? 'bg-dark text-white' : 'bg-[#f5f5f3] hover:bg-white border border-black/6'
                }`}
              >
                {isLatest && (
                  <div className="absolute -top-3 -right-2 bg-white text-dark text-[9px] font-bold px-2 py-1 rounded-full uppercase">
                    Atual
                  </div>
                )}
                
                <p className={`text-[11px] font-semibold uppercase tracking-widest mb-1 ${isLatest ? 'text-white/50' : 'text-dark/40'}`}>{item.year}</p>
                <p className={`text-lg font-bold tracking-tight mb-3 ${isLatest ? 'text-white' : 'text-dark'}`}>
                  {formatBRL(item.priceNum).replace('R$', '').trim()}
                </p>
                
                {!isLatest && diff && (
                  <div className="flex items-center gap-1">
                    {item.priceNum > latestPrice ? (
                      <div className="flex items-center gap-0.5 text-[10px] font-bold text-dark/50">
                        <ArrowDownRight className="w-3 h-3" />
                        <span>-{diff}%</span>
                      </div>
                    ) : (
                       <div className="flex items-center gap-0.5 text-[10px] font-bold text-[var(--color-accent)]">
                        <ArrowUpRight className="w-3 h-3" />
                        <span>+{Math.abs(parseFloat(diff))}%</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-8 p-4 bg-[#f5f5f3] rounded-2xl border border-black/6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] font-medium text-text-tertiary">
            * Valores médios de mercado para o modelo e versão selecionados (referência mensal oficial).
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-dark rounded-full" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-dark/60">Referência Atual</span>
          </div>
        </div>
      </div>
    </div>
  )
}
