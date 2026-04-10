'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { cars, formatBRL, compareCars } from '@/data/cars'
import { Plus, ArrowRight, Zap, Trophy, X, Search, Fuel, Package, ShieldCheck, DollarSign } from 'lucide-react'
import CarImage from '@/components/car/CarImage'

export default function HomeComparison() {
  const [selected, setSelected] = useState<(string | null)[]>([null, null])
  const [searchOpen, setSearchOpen] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCars = useMemo(() => {
    if (!searchTerm) return cars.slice(0, 8)
    return cars.filter(c => 
      c.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.brand.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 8)
  }, [searchTerm])

  const selectCar = (id: string) => {
    if (searchOpen !== null) {
      const newSelected = [...selected]
      newSelected[searchOpen - 1] = id
      setSelected(newSelected)
      setSearchOpen(null)
      setSearchTerm('')
    }
  }

  const comparison = selected[0] && selected[1] ? compareCars([selected[0], selected[1]]) : null
  const carA = selected[0] ? cars.find(c => c.id === selected[0]) : null
  const carB = selected[1] ? cars.find(c => c.id === selected[1]) : null

  return (
    <section style={{ paddingBlock: 'clamp(32px, 5vh, 64px)', background: 'var(--color-bg)' }}>
      <div className="container">
        <div
          className="relative overflow-hidden rounded-[40px] border border-dark/5 shadow-[0_20px_40px_-20px_rgba(167,200,255,0.4)]"
          style={{
            background: 'var(--color-bento-blue)',
            padding: 'clamp(28px, 5vw, 64px)',
          }}
        >
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 blur-[100px] rounded-full -mr-48 -mt-48 pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            {/* Left: Content */}
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.2em] text-dark/40 mb-4">Ferramenta Inteligente</p>
              <h2 className="text-4xl md:text-6xl font-black text-dark tracking-tighter leading-[0.9] mb-6 uppercase">
                {comparison ? 'Resumo do <br/>Versus' : 'Em dúvida entre <br/>dois carros?'}
              </h2>
              <p className="text-lg font-medium text-dark/60 leading-relaxed max-w-md mb-8">
                {comparison 
                  ? 'Veja o raio-x rápido das principais diferenças técnicas entre os modelos selecionados.' 
                  : 'Compare lado a lado com destaque visual de quem vence em cada critério. Motor, segurança, consumo e mais.'
                }
              </p>
              
              <div className="flex items-center gap-4">
                {comparison ? (
                  <Link 
                    href={`/comparar?ids=${selected[0]},${selected[1]}`}
                    className="px-8 h-14 bg-dark text-white rounded-full font-bold uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-transform"
                  >
                    Ver Tudo <ArrowRight className="w-5 h-5" />
                  </Link>
                ) : (
                  <button 
                    onClick={() => setSearchOpen(1)}
                    className="px-8 h-14 bg-dark text-white rounded-full font-bold uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-transform"
                  >
                    Começar Arena <ArrowRight className="w-5 h-5" />
                  </button>
                )}
                
                {comparison && (
                  <button 
                    onClick={() => setSelected([null, null])}
                    className="px-6 h-14 bg-white/50 border border-dark/10 rounded-full font-bold text-dark/60 hover:text-dark transition-colors"
                  >
                    Resetar
                  </button>
                )}
              </div>
            </div>

            {/* Right: Interactive Slots / Summary */}
            <div className={`relative flex flex-col gap-6 ${comparison ? 'animate-in fade-in duration-700' : ''}`}>
               {comparison ? (
                  /* Summary View */
                  <div className="bg-white/60 backdrop-blur-xl border-2 border-dark rounded-[32px] p-6 shadow-[10px_10px_0_#0A0A0A]">
                     <div className="space-y-4">
                        <SummaryRow 
                           label="Preço" 
                           icon={<DollarSign className="w-4 h-4" />}
                           winner={carA?.priceBrl! < carB?.priceBrl! ? carA! : carB!}
                           valA={formatBRL(carA?.priceBrl!)}
                           valB={formatBRL(carB?.priceBrl!)}
                        />
                        <SummaryRow 
                           label="Potência" 
                           icon={<Zap className="w-4 h-4" />}
                           winner={carA?.horsepower! > carB?.horsepower! ? carA! : carB!}
                           valA={`${carA?.horsepower} cv`}
                           valB={`${carB?.horsepower} cv`}
                        />
                        <SummaryRow 
                           label="Espaço" 
                           icon={<Package className="w-4 h-4" />}
                           winner={carA?.trunkCapacity! > carB?.trunkCapacity! ? carA! : carB!}
                           valA={`${carA?.trunkCapacity}L`}
                           valB={`${carB?.trunkCapacity}L`}
                        />
                        <SummaryRow 
                           label="Consumo" 
                           icon={<Fuel className="w-4 h-4" />}
                           winner={carA?.fuelEconomyCityGas! > carB?.fuelEconomyCityGas! ? carA! : carB!}
                           valA={`${carA?.fuelEconomyCityGas}km/l`}
                           valB={`${carB?.fuelEconomyCityGas}km/l`}
                        />
                     </div>
                     
                     <div className="mt-8 flex items-center justify-between pt-6 border-t border-dark/5">
                        <div className="flex flex-col items-center">
                           <div className="w-12 h-12 rounded-full overflow-hidden border border-dark/10 bg-white mb-2 shadow-sm">
                              <CarImage id={carA?.id!} brand={carA?.brand!} model={carA?.model!} year={carA?.year!} src={carA?.image} className="w-full h-full" />
                           </div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-dark">{carA?.model}</p>
                        </div>
                        <div className="text-sm font-black text-dark/20 italic tracking-tighter">VERSUS</div>
                        <div className="flex flex-col items-center">
                           <div className="w-12 h-12 rounded-full overflow-hidden border border-dark/10 bg-white mb-2 shadow-sm">
                              <CarImage id={carB?.id!} brand={carB?.brand!} model={carB?.model!} year={carB?.year!} src={carB?.image} className="w-full h-full" />
                           </div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-dark">{carB?.model}</p>
                        </div>
                     </div>
                  </div>
               ) : (
                  /* Selection Slots */
                  <div className="flex items-center justify-center lg:justify-end gap-4 sm:gap-6">
                     <Slot 
                        num={1} 
                        car={carA} 
                        onClick={() => setSearchOpen(1)} 
                        icon={<Zap className="w-5 h-5" />} 
                     />
                     <div className="font-heading text-4xl text-dark/10 italic select-none">VS</div>
                     <Slot 
                        num={2} 
                        car={carB} 
                        onClick={() => setSearchOpen(2)} 
                        icon={<Fuel className="w-5 h-5" />} 
                        accent 
                     />
                  </div>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* Mini Search Overlay */}
      {searchOpen !== null && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-dark/20 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSearchOpen(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black uppercase tracking-tight">Escolher Carro {searchOpen}</h3>
              <button 
                onClick={() => setSearchOpen(null)}
                className="p-3 bg-neutral-100 rounded-full hover:bg-neutral-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative mb-6">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark/30" />
               <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Busque por marca ou modelo..."
                  className="w-full h-14 bg-neutral-100 rounded-[20px] pl-12 pr-4 font-bold outline-none focus:ring-2 ring-dark/5 transition-all"
                  autoFocus
               />
            </div>
            
            <div className="grid grid-cols-1 gap-2 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
               {filteredCars.map(car => (
                  <button 
                    key={car.id}
                    onClick={() => selectCar(car.id)}
                    className="w-full p-4 rounded-2xl border border-dark/5 flex items-center gap-4 hover:bg-dark hover:text-white transition-all group"
                  >
                     <div className="w-16 h-12 bg-[#f8fafc] rounded-xl overflow-hidden p-1 flex items-center justify-center group-hover:bg-white transition-colors">
                        <CarImage id={car.id} brand={car.brand} model={car.model} year={car.year} src={car.image} className="w-full h-full" />
                     </div>
                     <div className="text-left">
                        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{car.brand}</p>
                        <p className="font-heading text-lg leading-none">{car.model}</p>
                     </div>
                     <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-5 h-5" />
                     </div>
                  </button>
               ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function Slot({ num, car, onClick, icon, accent = false }: any) {
   return (
      <button 
         onClick={onClick}
         className="relative group transition-all duration-500 hover:-translate-y-2"
      >
         <div className={`w-32 h-44 sm:w-44 sm:h-64 bg-white border-2 border-dark rounded-[32px] shadow-[8px_8px_0_#0A0A0A] p-4 flex flex-col justify-between items-center group-hover:shadow-[12px_12px_0_#0A0A0A] transition-all overflow-hidden ${car ? 'border-solid' : 'border-dashed opacity-80'}`}>
            <div className="w-full h-24 sm:h-32 bg-neutral-50 rounded-2xl flex items-center justify-center group-hover:bg-white transition-all relative overflow-hidden">
               {car ? (
                  <CarImage id={car.id} brand={car.brand} model={car.model} year={car.year} src={car.image} className="w-full h-full" />
               ) : (
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-dark/10 flex items-center justify-center group-hover:border-dark group-hover:animate-spin-slow">
                     <Plus className="w-6 h-6 text-dark/30 group-hover:text-dark" />
                  </div>
               )}
            </div>
            
            <div className="w-full text-center">
               <p className="text-[9px] font-black uppercase tracking-widest text-[#0a0a0a]/30 mb-1">Slot 0{num}</p>
               <span className="text-[11px] sm:text-[13px] font-black uppercase tracking-tighter text-dark">
                  {car ? car.model : 'Selecionar'}
               </span>
            </div>
         </div>
         <div className={`absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center text-lg font-black shadow-lg border-2 border-dark transition-all group-hover:scale-110 z-20 ${accent ? 'bg-[var(--color-bento-yellow)] text-dark' : 'bg-dark text-white'}`}>
            {num}
         </div>
      </button>
   )
}

function SummaryRow({ label, icon, winner, valA, valB }: any) {
   return (
      <div className="flex items-center gap-4 group">
         <div className="w-8 h-8 rounded-lg bg-dark/5 flex items-center justify-center text-dark/40 group-hover:text-dark transition-colors">
            {icon}
         </div>
         <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
               <span className="text-[10px] font-black uppercase tracking-widest text-dark/40">{label}</span>
               <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[var(--color-accent)] text-dark rounded-md text-[9px] font-black uppercase tracking-tight">
                  <Trophy className="w-3 h-3" /> {winner.model}
               </div>
            </div>
            <div className="flex items-center gap-3">
               <div className="flex-1 h-3 bg-dark/5 rounded-full relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-dark w-full animate-in slide-in-from-left duration-1000" />
               </div>
            </div>
         </div>
      </div>
   )
}
