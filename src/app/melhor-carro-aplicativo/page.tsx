import type { Metadata } from 'next'
import Link from 'next/link'
import { cars, formatBRL } from '@/data/cars'
import { CheckCircle2, DollarSign, Zap, Plus, ArrowRight, ShieldCheck } from 'lucide-react'
import Badge from '@/components/ui/Badge'

export const metadata: Metadata = {
  title: 'Melhor Carro para Aplicativo 2026 | Ranking carbi',
  description: 'Descubra qual o melhor carro para trabalhar na Uber e 99 em 2026. Ranking completo com economia por km, custo de manutenção e ROI.',
  keywords: 'melhor carro aplicativo, carro mais economico uber, carro uber 2026, carro eletrico para trabaho, carbi ranking'
}

const ranking = [
  { 
    id: 'byd-dolphin-mini-ev-38kwh-2026',
    brand: 'BYD',
    model: 'Dolphin Mini',
    reason: 'Zero custo de combustível e manutenção simplificada.',
    roiRating: 10,
    costPerKm: 'R$ 0,12',
    type: 'Eletrizante'
  },
  { 
    id: 'fiat-mobi-10-like-2026',
    brand: 'Fiat',
    model: 'Mobi',
    reason: 'O rei da cidade. Peças em qualquer esquina e revenda ultra rápida.',
    roiRating: 9,
    costPerKm: 'R$ 0,58',
    type: 'Resistente'
  },
  { 
    id: 'chevrolet-onix-10-turbo-premier-2026',
    brand: 'Chevrolet',
    model: 'Onix',
    reason: 'Equilíbrio perfeito entre conforto para o passageiro e economia.',
    roiRating: 8.5,
    costPerKm: 'R$ 0,62',
    type: 'Equilibrado'
  },
  { 
    id: 'byd-dolphin-ev-diamond-2026',
    brand: 'BYD',
    model: 'Dolphin',
    reason: 'Para quem busca Uber Black e máximo conforto de rodagem.',
    roiRating: 8,
    costPerKm: 'R$ 0,14',
    type: 'Premium'
  }
]

export default function AppRankingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero SEO */}
      <section className="bg-dark pt-32 pb-24 px-6 text-center overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
           <Zap className="w-96 h-96 absolute -top-10 -left-10 text-white" />
        </div>
        
        <div className="container relative z-10">
          <Badge className="mb-6 bg-white/10 text-white border-white/20">Guia 2026 — Inteligência de Mercado</Badge>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-8 leading-none">
            melhor carro para <br />
            <span className="text-[var(--color-bento-yellow)]">aplicativo 2026</span>
          </h1>
          <p className="max-w-2xl mx-auto text-white/60 text-lg md:text-xl font-medium leading-relaxed">
            Economia por KM, custo de manutenção e ROI. Analisamos os dados técnicos dos modelos 2026 para você faturar mais e gastar menos.
          </p>
        </div>
      </section>

      {/* Comparisons Section */}
      <section className="py-20 px-6 container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
           <div className="p-10 bg-[var(--color-bg)-alt] rounded-[40px] border-2 border-dark shadow-[8px_8px_0_#0A0A0A]">
              <div className="flex items-center gap-4 mb-6">
                 <div className="p-3 bg-dark rounded-2xl"><Zap className="w-6 h-6 text-[var(--color-bento-yellow)]" /></div>
                 <h3 className="text-2xl font-black uppercase tracking-tight">Cenário Elétrico</h3>
              </div>
              <p className="text-dark/60 font-medium mb-8">
                 Embora o investimento inicial seja maior, o custo por KM rodado é imbatível. Em 2026, com o aumento da rede de recarga, o elétrico se torna a escolha óbvia para quem roda mais de 3.000km/mês.
              </p>
              <ul className="space-y-4">
                 {['IPVA isento em diversos estados', 'Revisões até 60% mais baratas', 'Silêncio total de rodagem (Ganhe 5 estrelas!)'].map(item => (
                   <li key={item} className="flex items-center gap-3 font-bold text-dark italic">
                     <CheckCircle2 className="w-5 h-5 text-dark" /> {item}
                   </li>
                 ))}
              </ul>
           </div>

           <div className="p-10 bg-white rounded-[40px] border-2 border-dark shadow-[8px_8px_0_#0A0A0A]">
              <div className="flex items-center gap-4 mb-6">
                 <div className="p-3 bg-dark rounded-2xl"><DollarSign className="w-6 h-6 text-[var(--color-bento-red)]" /></div>
                 <h3 className="text-2xl font-black uppercase tracking-tight">Cenário Combustão</h3>
              </div>
              <p className="text-dark/60 font-medium mb-8">
                 O baixo custo de aquisição e a facilidade de reparo em qualquer oficina do Brasil continuam seduzindo. Para quem quer flexibilidade total sem depender de pontos de carga.
              </p>
              <ul className="space-y-4">
                 {['Peças de reposição baratas e fartas', 'Revenda garantida em poucas horas', 'Maior rede de abastecimento do mundo'].map(item => (
                   <li key={item} className="flex items-center gap-3 font-bold text-dark italic">
                     <CheckCircle2 className="w-5 h-5 text-dark" /> {item}
                   </li>
                 ))}
              </ul>
           </div>
        </div>

        {/* The Ranking Table */}
        <div className="mb-24">
           <h2 className="text-4xl font-black text-dark mb-12 tracking-tight flex items-center gap-4">
              <span className="w-12 h-12 bg-dark text-white rounded-2xl flex items-center justify-center">#</span> 
              Ranking carbi — Eficiência 2026
           </h2>
           
           <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                 <thead>
                    <tr className="border-b-4 border-dark">
                       <th className="text-left py-6 px-4 font-black uppercase tracking-widest text-[#0a0a0a]/40 text-sm">Viatura</th>
                       <th className="text-left py-6 px-4 font-black uppercase tracking-widest text-[#0a0a0a]/40 text-sm">Vantagem</th>
                       <th className="text-center py-6 px-4 font-black uppercase tracking-widest text-[#0a0a0a]/40 text-sm">Custo/KM</th>
                       <th className="text-center py-6 px-4 font-black uppercase tracking-widest text-[#0a0a0a]/40 text-sm">ROI (1-10)</th>
                       <th className="text-right py-6 px-4"></th>
                    </tr>
                 </thead>
                 <tbody>
                    {ranking.map((item, i) => (
                      <tr key={item.id} className="border-b border-dark/10 group hover:bg-[var(--color-bg)-alt] transition-colors">
                         <td className="py-8 px-4">
                            <div className="flex items-center gap-4">
                               <div className="text-2xl font-black text-dark/20 pr-4">0{i+1}</div>
                               <div>
                                  <p className="text-xl font-black uppercase leading-none">{item.brand} {item.model}</p>
                                  <span className="text-[10px] font-bold text-white bg-dark px-2 py-0.5 rounded mt-2 inline-block uppercase tracking-widest">{item.type}</span>
                               </div>
                            </div>
                         </td>
                         <td className="py-8 px-4 text-dark font-medium max-w-xs">{item.reason}</td>
                         <td className="py-8 px-4 text-center">
                            <span className="text-lg font-black text-dark">{item.costPerKm}</span>
                         </td>
                         <td className="py-8 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-dark text-white rounded-full font-black">
                               {item.roiRating} <Star className="w-3 h-3 fill-[var(--color-bento-yellow)] border-none" />
                            </div>
                         </td>
                         <td className="py-8 px-4 text-right">
                            <Link href="/comparar" className="p-3 bg-white border-2 border-dark rounded-full inline-flex items-center justify-center hover:bg-dark hover:text-white transition-all">
                               <ArrowRight className="w-6 h-6" />
                            </Link>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Action Banner */}
        <div className="bg-[var(--color-bento-blue)] rounded-[48px] p-12 md:p-20 relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
               <ShieldCheck className="w-64 h-64 text-white" />
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-8 max-w-3xl">
               Não decida antes de ver os dados técnicos.
            </h2>
            <Link href="/comparar" className="px-12 py-6 bg-white text-dark rounded-full font-black text-xl uppercase tracking-widest shadow-[8px_8px_0_#0A0A0A] hover:translate-x-1 hover:-translate-y-1 transition-all">
               Fazer meu Versus Agora
            </Link>
        </div>
      </section>
    </main>
  )
}

function Star({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  )
}
