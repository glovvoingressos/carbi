import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, DollarSign, Zap, ArrowRight, ShieldCheck, Star } from 'lucide-react'
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
    <main className="fingen-shell">
      {/* Hero SEO */}
      <section className="fingen-dark-hero" style={{ textAlign: "center" }}>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
           <Zap className="w-96 h-96 absolute -top-10 -left-10 text-white" />
        </div>
        
        <div className="fingen-shell-content" style={{ position: "relative", zIndex: 1 }}>
          <Badge className="mb-6 bg-white/10 text-white border-white/20">Guia 2026 — Inteligência de Mercado</Badge>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter mb-8 leading-none">
            melhor carro para <br />
            <span className="text-[#F4F0E7]/88">aplicativo 2026</span>
          </h1>
          <p className="max-w-2xl mx-auto text-[#F4F0E7]/88 text-lg md:text-xl font-medium leading-relaxed">
            Economia por KM, custo de manutenção e ROI. Analisamos os dados técnicos dos modelos 2026 para você faturar mais e gastar menos.
          </p>
        </div>
      </section>

      {/* Comparisons Section */}
      <section className="fingen-section">
        <div className="fingen-grid-2" style={{ marginBottom: "64px" }}>
           <div className="p-10 bg-[#FAFAF9] rounded-2xl border border-[#EAEAE8]">
              <div className="flex items-center gap-4 mb-6">
                 <div className="p-3 bg-[#0A0A0A] rounded-2xl"><Zap className="w-6 h-6 text-white" /></div>
                 <h3 className="text-2xl font-black uppercase tracking-tight">Cenário Elétrico</h3>
              </div>
              <p className="text-[#F4F0E7]/88 font-medium mb-8 leading-relaxed">
                 Embora o investimento inicial seja maior, o custo por KM rodado é imbatível. Em 2026, com o aumento da rede de recarga, o elétrico se torna a escolha óbvia para quem roda mais de 3.000km/mês.
              </p>
              <ul className="space-y-4">
                 {['IPVA isento em diversos estados', 'Revisões até 60% mais baratas', 'Silêncio total de rodagem (Ganhe 5 estrelas!)'].map(item => (
                   <li key={item} className="flex items-center gap-3 font-bold text-[#0A0A0A]">
                     <CheckCircle2 className="w-5 h-5 text-[#10B981]" /> {item}
                   </li>
                 ))}
              </ul>
           </div>

           <div className="p-10 bg-white rounded-2xl border border-[#EAEAE8]">
              <div className="flex items-center gap-4 mb-6">
                 <div className="p-3 bg-[#0A0A0A] rounded-2xl"><DollarSign className="w-6 h-6 text-white" /></div>
                 <h3 className="text-2xl font-black uppercase tracking-tight">Cenário Combustão</h3>
              </div>
              <p className="text-[#F4F0E7]/88 font-medium mb-8 leading-relaxed">
                 O baixo custo de aquisição e a facilidade de reparo em qualquer oficina do Brasil continuam seduzindo. Para quem quer flexibilidade total sem depender de pontos de carga.
              </p>
              <ul className="space-y-4">
                 {['Peças de reposição baratas e fartas', 'Revenda garantida em poucas horas', 'Maior rede de abastecimento do mundo'].map(item => (
                   <li key={item} className="flex items-center gap-3 font-bold text-[#0A0A0A]">
                     <CheckCircle2 className="w-5 h-5 text-[#10B981]" /> {item}
                   </li>
                 ))}
              </ul>
           </div>
        </div>

        {/* The Ranking Table */}
        <div className="mb-24">
           <h2 className="text-3xl sm:text-4xl font-black text-[#0A0A0A] mb-12 tracking-tight flex items-center gap-4">
              <span className="w-12 h-12 bg-[#0A0A0A] text-white rounded-2xl flex items-center justify-center">#</span> 
              Ranking carbi — Eficiência 2026
           </h2>
           
           <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                 <thead>
                    <tr className="border-b-4 border-[#0A0A0A]">
                       <th className="text-left py-6 px-4 font-black uppercase tracking-widest text-[#A3A3A3] text-sm">Viatura</th>
                       <th className="text-left py-6 px-4 font-black uppercase tracking-widest text-[#A3A3A3] text-sm">Vantagem</th>
                       <th className="text-center py-6 px-4 font-black uppercase tracking-widest text-[#A3A3A3] text-sm">Custo/KM</th>
                       <th className="text-center py-6 px-4 font-black uppercase tracking-widest text-[#A3A3A3] text-sm">ROI (1-10)</th>
                       <th className="text-right py-6 px-4"></th>
                    </tr>
                 </thead>
                 <tbody>
                    {ranking.map((item, i) => (
                      <tr key={item.id} className="border-b border-[#EAEAE8] group hover:bg-[#FAFAF9] transition-colors">
                         <td className="py-8 px-4">
                            <div className="flex items-center gap-4">
                               <div className="text-2xl font-black text-[#D4D4D4] pr-4">0{i+1}</div>
                               <div>
                                  <p className="text-xl font-black uppercase leading-none">{item.brand} {item.model}</p>
                                  <span className="text-[10px] font-bold text-white bg-[#0A0A0A] px-2.5 py-0.5 rounded-full mt-2 inline-block uppercase tracking-widest">{item.type}</span>
                               </div>
                            </div>
                         </td>
                         <td className="py-8 px-4 text-[#F4F0E7]/88 font-medium max-w-xs">{item.reason}</td>
                         <td className="py-8 px-4 text-center">
                            <span className="text-lg font-black text-[#0A0A0A]">{item.costPerKm}</span>
                         </td>
                         <td className="py-8 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#0A0A0A] text-white rounded-full font-black">
                               {item.roiRating} <Star className="w-3 h-3 fill-white border-none" />
                            </div>
                         </td>
                         <td className="py-8 px-4 text-right"></td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Action Banner */}
        <div className="fingen-card-dark" style={{ textAlign: "center", padding: "clamp(40px, 6vw, 80px) 32px" }}>
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
               <ShieldCheck className="w-64 h-64 text-white" />
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-8 max-w-3xl">
               Não decida antes de ver os dados técnicos.
            </h2>
            <Link
              href="/qual-carro"
              className="inline-flex items-center gap-2 bg-white text-[#0A0A0A] hover:bg-white/90 transition-colors rounded-full min-h-[56px] px-8 text-[15px] font-semibold"
            >
              Fazer o teste gratuito
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>
        </div>
      </section>
    </main>
  )
}
