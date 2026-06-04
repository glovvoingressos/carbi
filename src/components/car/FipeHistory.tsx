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

  const latestPrice = history[0].priceNum

  return (
    <div className="bg-white border border-[#EAEAE8] rounded-2xl overflow-hidden">
      <div className="bg-[#0A0A0A] text-white p-6 md:p-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
            <Calendar className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-[18px] font-semibold text-white tracking-tight">Histórico de valor</h3>
            <p className="text-[12px] text-white/50 tracking-tight">Trajetória de valor (6 anos)</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full">
          <TrendingUp className="w-3.5 h-3.5 text-white/70" strokeWidth={1.75} />
          <span className="text-[11px] text-white/70 tracking-tight">Dados oficiais</span>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {history.map((item, i) => {
            const isLatest = i === 0
            const diff = !isLatest ? ((item.priceNum - latestPrice) / item.priceNum * 100).toFixed(1) : null

            return (
              <div
                key={item.year}
                className={`relative p-4 rounded-xl transition-colors ${
                  isLatest ? 'bg-[#0A0A0A] text-white' : 'bg-[#FAFAF9] border border-[#EAEAE8] hover:border-[#D4D4D4]'
                }`}
              >
                {isLatest && (
                  <div className="absolute -top-2 -right-2 bg-white text-[#0A0A0A] text-[9px] font-semibold px-2 py-0.5 rounded-full tracking-tight">
                    Atual
                  </div>
                )}

                <p className={`eyebrow mb-1 ${isLatest ? 'text-white/50' : ''}`}>{item.year}</p>
                <p className={`text-[15px] font-semibold tracking-tight mb-2 ${isLatest ? 'text-white' : 'text-[#0A0A0A]'}`}>
                  {formatBRL(item.priceNum).replace('R$', '').trim()}
                </p>

                {!isLatest && diff && (
                  <div className="flex items-center gap-1">
                    {item.priceNum > latestPrice ? (
                      <div className="flex items-center gap-0.5 text-[10px] text-[#525252]">
                        <ArrowDownRight className="w-3 h-3" strokeWidth={2} />
                        <span>-{diff}%</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5 text-[10px] text-[#10B981]">
                        <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
                        <span>+{Math.abs(parseFloat(diff))}%</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <p className="mt-6 text-[12px] text-[#A3A3A3] tracking-tight">
          * Valores médios de mercado para o modelo e versão selecionados (referência mensal oficial).
        </p>
      </div>
    </div>
  )
}
