import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MapPin, CheckCircle2 } from 'lucide-react'
import { LocalBusinessBHTicketsSchema } from '@/components/seo/JSONLD'
import ListingCard from '@/components/marketplace/ListingCard'
import { fetchPublicListingsPage } from '@/lib/marketplace-server'

export const metadata: Metadata = {
  title: 'Carros Usados em BH (Belo Horizonte) | Compra e Venda | Carbi',
  description: 'Procurando carros usados e seminovos em Belo Horizonte (BH)? Encontre anúncios reais, compare valores atualizados e faça um negócio seguro.',
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
  },
}

export default async function CarrosUsadosBHPage() {
  const { items } = await fetchPublicListingsPage({ city: '%Belo Horizonte%', state: 'MG', page: 1, pageSize: 12, sort: 'recent' })

  return (
    <div className="min-h-screen">
      <LocalBusinessBHTicketsSchema />

      <section className="pt-16 pb-12 border-b border-white/70">
        <div className="container max-w-5xl text-center">
          <div className="section-kicker mb-6">
            <MapPin className="w-3.5 h-3.5" /> Belo Horizonte e Região
          </div>
          <h1 className="text-balance mb-6">
            O carro perfeito para você,<br className="hidden md:block" /> com a confiança que <span className="text-[#0A0A0A]">BH merece.</span>
          </h1>
          <p className="text-lg md:text-xl font-medium text-[#52607A] max-w-2xl mx-auto leading-relaxed mb-8">
            Compare anúncios reais, confira valores atualizados e avance com mais confiança.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/anunciar-carro-bh" className="btn btn-primary px-8 flex items-center gap-2">
              Quero Vender Meu Carro <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3 surface p-5">
              <CheckCircle2 className="text-success w-6 h-6 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-[#0A0A0A]">Valor atualizado ao vivo</h4>
                <p className="text-xs text-[#52607A] font-medium mt-1">Negociação apoiada por dados reais.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 surface p-5">
              <CheckCircle2 className="text-success w-6 h-6 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-[#0A0A0A]">Atendimento local</h4>
                <p className="text-xs text-[#52607A] font-medium mt-1">Compradores ativos em BH e região.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 surface p-5">
              <CheckCircle2 className="text-success w-6 h-6 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-[#0A0A0A]">Venda em 24h</h4>
                <p className="text-xs text-[#52607A] font-medium mt-1">Foco em oferta e resposta rápida.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-display text-[#0A0A0A] tracking-tight">Veículos em destaque (BH)</h2>
            <Link href="/carros-a-venda?city=Belo%20Horizonte&state=MG" className="hidden md:flex items-center gap-1 font-medium text-[#0A0A0A] hover:text-[#16855C] transition-colors">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
              {items.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-[#EAEAE8] bg-white p-10 text-center text-[#52607A]">
              Nenhum anúncio ativo encontrado em Belo Horizonte no momento.
            </div>
          )}
        </div>
      </section>

      <section className="py-16 border-t border-white/70">
        <div className="container max-w-4xl text-[#0A0A0A]">
          <h2 className="text-2xl font-display text-[#0A0A0A] mb-4">Comprar carro usado em Belo Horizonte</h2>
          <div className="space-y-4 text-[#52607A]">
            <p>O mercado de <strong>carros usados em BH</strong> é um dos mais aquecidos do Brasil. A página agora mostra anúncios reais da cidade, em vez de um catálogo auxiliar.</p>
            <p>Se você quer vender, use o botão acima para publicar seu carro e aparecer para compradores na região.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
