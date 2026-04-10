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
    <div className="bg-white border-2 border-dark rounded-[40px] overflow-hidden shadow-[8px_8px_0_#000] mt-12 mb-8">
      <div className="bg-[var(--color-bento-blue)] border-b-2 border-dark p-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-dark shadow-[3px_3px_0_#000] border-2 border-dark">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight italic text-dark">Histórico de Valor</h3>
            <p className="text-xs font-bold text-dark/60 uppercase tracking-widest">Trajetória de valor (6 anos)</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full border border-dark/10">
           <TrendingUp className="w-4 h-4" />
           <span className="text-[10px] font-black uppercase tracking-widest">Dados Oficiais</span>
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
                className={`relative p-5 rounded-[28px] border-2 border-dark transition-all hover:-translate-y-1 ${
                  isLatest ? 'bg-[var(--color-bento-yellow)] shadow-[4px_4px_0_#000]' : 'bg-surface hover:bg-white shadow-sm'
                }`}
              >
                {isLatest && (
                  <div className="absolute -top-3 -right-2 bg-dark text-white text-[9px] font-black px-2 py-1 rounded rotate-[10deg] uppercase border border-dark">
                    Atual
                  </div>
                )}
                
                <p className="text-[11px] font-black text-dark/40 uppercase tracking-widest mb-1">{item.year}</p>
                <p className="text-lg font-black text-dark tracking-tight mb-3">
                  {formatBRL(item.priceNum).replace('R$', '').trim()}
                </p>
                
                {!isLatest && diff && (
                  <div className="flex items-center gap-1">
                    {item.priceNum > latestPrice ? (
                      <div className="flex items-center gap-0.5 text-[10px] font-bold text-[var(--color-bento-red)]">
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

        <div className="mt-8 p-4 bg-dark/5 rounded-2xl border border-dashed border-dark/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] font-bold text-text-tertiary">
            * Valores médios de mercado para o modelo e versão selecionados (referência mensal oficial).
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[var(--color-bento-yellow)] rounded-full border border-dark" />
            <span className="text-[10px] font-black uppercase tracking-widest">Referência Atual</span>
          </div>
        </div>
      </div>
    </div>
  )
}
