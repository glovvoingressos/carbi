import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MapPin, CheckCircle2 } from 'lucide-react'
import { getAllCars } from '@/lib/data-fetcher'
import CarCard from '@/components/car/CarCard'
import { LocalBusinessBHTicketsSchema } from '@/components/seo/JsonLd'

export const metadata: Metadata = {
  title: 'Carros Usados em BH (Belo Horizonte) | Compra e Venda | Carbi',
  description: 'Procurando carros usados e seminovos em Belo Horizonte (BH)? Encontre ofertas verificadas, compare valores atualizados e faça um negócio seguro.',
  keywords: ['carros usados bh', 'comprar carro belo horizonte', 'seminovos bh', 'loja de carros bh', 'veículos usados'],
  openGraph: {
    title: 'Carros Usados e Seminovos em BH - As Melhores Ofertas',
    description: 'Encontre o seu próximo carro em Belo Horizonte com a confiança da Carbi.',
    locale: 'pt_BR',
    type: 'website',
  }
}

export default async function CarrosUsadosBHPage() {
  // Carrega ofertas reais do catálogo integrado
  const cars = await getAllCars();
  const displayCars = cars.slice(0, 12);

  return (
    <div className="bg-surface min-h-screen">
      <LocalBusinessBHTicketsSchema />
      
      {/* Local Hero Area */}
      <section className="pt-16 pb-12 bg-white border-b border-border">
        <div className="container max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-[var(--color-bento-yellow)] text-dark px-4 py-2 rounded-full font-black text-sm uppercase tracking-widest mb-6 border border-dark transform -rotate-2">
            <MapPin className="w-4 h-4" /> Belo Horizonte e Região
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-dark tracking-tight mb-6">
            O carro perfeito para você,<br className="hidden md:block" /> com a confiança que <span className="text-[var(--color-bento-red)]">BH merece.</span>
          </h1>
          <p className="text-lg md:text-xl font-medium text-text-secondary max-w-2xl mx-auto leading-relaxed mb-8">
            Compare centenas de opções reais, confira valor atualizado na hora e não caia em furadas.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
             <Link href="/anunciar-carro-bh" className="bg-dark text-white font-black px-8 py-4 rounded-xl flex items-center gap-2 hover:bg-opacity-90 hover:-translate-y-1 transition-all">
                Quero Vender Meu Carro <ArrowRight className="w-5 h-5" />
             </Link>
          </div>
        </div>
      </section>

      {/* Trust Badges - Local */}
      <section className="py-8 bg-surface">
         <div className="container max-w-4xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="flex items-center gap-3 bg-[#f7f9fc] p-4 rounded-2xl">
                  <CheckCircle2 className="text-[#00D632] w-8 h-8 flex-shrink-0" />
                  <div>
                    <h4 className="font-black text-dark">Valor Atualizado Ao Vivo</h4>
                    <p className="text-xs text-text-secondary font-medium mt-1">Garantia de negócio justo.</p>
                  </div>
               </div>
               <div className="flex items-center gap-3 bg-[#f7f9fc] p-4 rounded-2xl">
                  <CheckCircle2 className="text-[#00D632] w-8 h-8 flex-shrink-0" />
                  <div>
                    <h4 className="font-black text-dark">Atendimento Local</h4>
                    <p className="text-xs text-text-secondary font-medium mt-1">Conectamos você aos lojistas de BH.</p>
                  </div>
               </div>
               <div className="flex items-center gap-3 bg-[#f7f9fc] p-4 rounded-2xl">
                  <CheckCircle2 className="text-[#00D632] w-8 h-8 flex-shrink-0" />
                  <div>
                    <h4 className="font-black text-dark">Venda em 24h</h4>
                    <p className="text-xs text-text-secondary font-medium mt-1">Compradores reais na sua região.</p>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Destaques Locais */}
      <section className="py-16">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black text-dark tracking-tight">Veículos em Destaque (BH)</h2>
            <Link href="/marcas" className="hidden md:flex items-center gap-1 font-bold text-dark hover:text-[var(--color-bento-red)] transition-colors">
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
      <section className="py-16 bg-white border-t border-border">
         <div className="container max-w-4xl mx-auto px-4 font-sans text-dark/80">
            <h2 className="text-2xl font-black text-dark mb-4">Comprar Carro Usado em Belo Horizonte: Dicas da Carbi</h2>
            <div className="space-y-4">
              <p>O mercado de <strong>carros usados em BH</strong> é um dos mais aquecidos do Brasil. Com o relevo acidentado (famosos morros), mineiros costumam procurar veículos com bom torque, suspensão reforçada e, preferencialmente, motorização 1.6 ou superior.</p>
              
              <h3 className="text-lg font-bold text-dark mt-6 mb-2">Por que pesquisar o valor de referência antes de comprar em BH?</h3>
              <p>Antes de visitar uma concessionária ou fechar negócio com pessoa física, consulte sempre a nossa ferramenta de valor atualizado. Ela ajuda a evitar ágio excessivo e melhora sua margem de negociação.</p>
              
              <h3 className="text-lg font-bold text-dark mt-6 mb-2">Como anunciar meu carro para venda rápida em Belo Horizonte?</h3>
              <p>Se você pesquisa "como vender meu carro rápido em BH", a resposta está na visibilidade estruturada. Na Carbi, separamos o ruído e deixamos sua ficha técnica brilhando. <Link href="/anunciar-carro-bh" className="text-blue-600 underline">Clique aqui para criar seu anúncio local</Link> e ser visto por milhares de compradores diários na região metropolitana.</p>
            </div>
         </div>
      </section>
    </div>
  )
}
