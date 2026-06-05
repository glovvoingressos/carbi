import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MapPin, CheckCircle2 } from 'lucide-react'
import { getAllCars, groupCarsByModel } from '@/lib/data-fetcher'
import CarCard from '@/components/car/CarCard'
import { LocalBusinessBHTicketsSchema } from '@/components/seo/JSONLD'

export const metadata: Metadata = {
  title: 'Carros Usados em BH (Belo Horizonte) | Compra e Venda | Carbi',
  description: 'Procurando carros usados e seminovos em Belo Horizonte (BH)? Encontre ofertas verificadas, compare valores atualizados e faça um negócio seguro.',
  keywords: ['carros usados bh', 'comprar carro belo horizonte', 'seminovos bh', 'loja de carros bh', 'veículos usados'],
  alternates: {
    canonical: '/carros-usados-bh',
  },
  openGraph: {
    title: 'Carros Usados e Seminovos em BH - As Melhores Ofertas',
    description: 'Encontre o seu próximo carro em Belo Horizonte com a confiança da Carbi.',
    locale: 'pt_BR',
    type: 'website',
    url: '/carros-usados-bh',
  }
}

export default async function CarrosUsadosBHPage() {
  // Carrega ofertas reais do catálogo integrado
  const cars = await getAllCars();
  const displayCars = groupCarsByModel(cars).map((item) => item.representative).slice(0, 12);

  return (
    <div className="min-h-screen">
      <LocalBusinessBHTicketsSchema />
      
      {/* Local Hero Area */}
      <section className="pt-16 pb-12 border-b border-white/70">
        <div className="container max-w-5xl text-center">
          <div className="section-kicker mb-6">
            <MapPin className="w-3.5 h-3.5" /> Belo Horizonte e Região
          </div>
          <h1 className="text-balance mb-6">
            O carro perfeito para você,<br className="hidden md:block" /> com a confiança que <span className="text-[#0A0A0A]">BH merece.</span>
          </h1>
          <p className="text-lg md:text-xl font-medium text-[#52607A] max-w-2xl mx-auto leading-relaxed mb-8">
            Compare centenas de opções reais, confira valor atualizado na hora e não caia em furadas.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
             <Link href="/anunciar-carro-bh" className="btn btn-primary px-8 flex items-center gap-2">
                Quero Vender Meu Carro <ArrowRight className="w-4 h-4" />
             </Link>
          </div>
        </div>
      </section>

      {/* Trust Badges - Local */}
      <section className="py-8">
         <div className="container max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="flex items-center gap-3 surface p-5">
                  <CheckCircle2 className="text-success w-6 h-6 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-[#0A0A0A]">Valor Atualizado Ao Vivo</h4>
                    <p className="text-xs text-[#52607A] font-medium mt-1">Garantia de negócio justo.</p>
                  </div>
               </div>
               <div className="flex items-center gap-3 surface p-5">
                  <CheckCircle2 className="text-success w-6 h-6 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-[#0A0A0A]">Atendimento Local</h4>
                    <p className="text-xs text-[#52607A] font-medium mt-1">Conectamos você aos lojistas de BH.</p>
                  </div>
               </div>
               <div className="flex items-center gap-3 surface p-5">
                  <CheckCircle2 className="text-success w-6 h-6 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-[#0A0A0A]">Venda em 24h</h4>
                    <p className="text-xs text-[#52607A] font-medium mt-1">Compradores reais na sua região.</p>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Destaques Locais */}
      <section className="py-16">
        <div className="container max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-display text-[#0A0A0A] tracking-tight">Veículos em Destaque (BH)</h2>
            <Link href="/marcas" className="hidden md:flex items-center gap-1 font-medium text-[#0A0A0A] hover:text-[#16855C] transition-colors">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
            {displayCars.map(car => (
              <CarCard key={car.id} car={car} view="grid" />
            ))}
          </div>
        </div>
      </section>
      
      {/* SEO Content Block (Very important for localized long tail) */}
      <section className="py-16 border-t border-white/70">
         <div className="container max-w-4xl text-[#0A0A0A]">
            <h2 className="text-2xl font-display text-[#0A0A0A] mb-4">Comprar Carro Usado em Belo Horizonte: Dicas da Carbi</h2>
            <div className="space-y-4 text-[#52607A]">
              <p>O mercado de <strong>carros usados em BH</strong> é um dos mais aquecidos do Brasil. Com o relevo acidentado (famosos morros), mineiros costumam procurar veículos com bom torque, suspensão reforçada e, preferencialmente, motorização 1.6 ou superior.</p>
              
              <h3 className="text-lg font-bold text-[#0A0A0A] mt-6 mb-2">Por que pesquisar o valor de referência antes de comprar em BH?</h3>
              <p>Antes de visitar uma concessionária ou fechar negócio com pessoa física, consulte sempre a nossa ferramenta de valor atualizado. Ela ajuda a evitar ágio excessivo e melhora sua margem de negociação.</p>
              
              <h3 className="text-lg font-bold text-[#0A0A0A] mt-6 mb-2">Como anunciar meu carro para venda rápida em Belo Horizonte?</h3>
              <p>Se você pesquisa "como vender meu carro rápido em BH", a resposta está na visibilidade estruturada. Na Carbi, separamos o ruído e deixamos sua ficha técnica brilhando. <Link href="/anunciar-carro-bh" className="text-[#10B981] hover:text-[#10B981] font-semibold underline transition-colors">Clique aqui para criar seu anúncio local</Link> e ser visto por milhares de compradores diários na região metropolitana.</p>
            </div>
         </div>
      </section>
    </div>
  )
}
