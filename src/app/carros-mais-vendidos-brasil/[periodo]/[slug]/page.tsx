import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getModelRankingDetail } from '@/lib/rankings-data'
import { formatBRL } from '@/data/cars'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ periodo: string; slug: string }>
}): Promise<Metadata> {
  const { periodo, slug } = await params
  const detail = await getModelRankingDetail(periodo, slug)
  if (!detail) return { title: 'Modelo não encontrado | Carbi' }

  return {
    title: `${detail.brand} ${detail.modelName} - Vendas e Preço FIPE em ${periodo} | Carbi`,
    description: `Saiba tudo sobre as vendas do ${detail.brand} ${detail.modelName} no Brasil em ${periodo}. Posição no ranking, unidades vendidas e comparação FIPE.`,
    alternates: { canonical: `/carros-mais-vendidos-brasil/${periodo}/${slug}` },
  }
}

export default async function ModelRankingDetailPage({
  params,
}: {
  params: Promise<{ periodo: string; slug: string }>
}) {
  const { periodo, slug } = await params
  const detail = await getModelRankingDetail(periodo, slug)

  if (!detail) notFound()

  const { item, newItem, usedItem } = detail
  const periodLabel = periodo === 'julho-2026' ? 'Julho / 2026' : periodo.replace('-', ' ')

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${item.brand} ${item.model}`,
    description: `Relatório de vendas e FIPE do ${item.brand} ${item.model} em ${periodLabel}.`,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'BRL',
      lowPrice: item.startingPriceBrl,
      highPrice: item.fipeAvgPriceBrl || item.startingPriceBrl,
      offerCount: item.unitsSold,
    },
  }

  return (
    <div className="cb-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      <section className="cb-hero">
        <div className="cb-wrap">
          <Link
            href={`/carros-mais-vendidos-brasil/${periodo}`}
            className="cb-head-link mb-6 inline-flex"
          >
            <ArrowLeft size={16} /> Voltar ao ranking completo
          </Link>

          <div className="cb-hero-copy">
            <div className="cb-eyebrow">
              {item.brand} · Ficha de Desempenho de Mercado ({periodLabel})
            </div>
            <h1 className="cb-hero-title">
              {item.brand} <u>{item.model}</u>
            </h1>
            <p className="cb-hero-lead">
              Análise completa de emplacamentos, preço médio de mercado e comparação FIPE para o modelo.
            </p>
          </div>
        </div>
      </section>

      <section className="cb-section-pad pt-0">
        <div className="cb-wrap">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {newItem && (
              <div className="bg-white border-2 border-[var(--cb-lime)] rounded-3xl p-6">
                <div className="cb-eyebrow">Mercado de 0km (Novos)</div>
                <div className="text-4xl font-extrabold font-[var(--cb-head)]">
                  #{newItem.position} Lugar
                </div>
                <p className="text-gray-500 mt-2">
                  <strong>{newItem.unitsSold.toLocaleString('pt-BR')}</strong> unidades emplacadas ({newItem.marketSharePercentage}% de mercado)
                </p>
                <div className="mt-4 text-lg font-extrabold">
                  Preço sugerido: {formatBRL(newItem.startingPriceBrl)}
                </div>
              </div>
            )}

            {usedItem && (
              <div className="bg-white border border-gray-200 rounded-3xl p-6">
                <div className="cb-eyebrow">Mercado de Seminovos</div>
                <div className="text-4xl font-extrabold font-[var(--cb-head)]">
                  #{usedItem.position} Lugar
                </div>
                <p className="text-gray-500 mt-2">
                  <strong>{usedItem.unitsSold.toLocaleString('pt-BR')}</strong> transferências realizadas
                </p>
                <div className="mt-4 text-lg font-extrabold">
                  Preço FIPE médio: {formatBRL(usedItem.fipeAvgPriceBrl || usedItem.startingPriceBrl)}
                </div>
              </div>
            )}
          </div>

          <div className="bg-[var(--cb-charcoal)] text-white rounded-3xl p-9 flex flex-wrap justify-between items-center gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">
                Procurando um {item.brand} {item.model}?
              </h3>
              <p className="m-0 opacity-80">
                Encontre ofertas com FIPE verificada e fale direto com os vendedores.
              </p>
            </div>

            <Link
              href={`/carros-a-venda?q=${encodeURIComponent(item.model)}`}
              className="cb-btn cb-btn-lime"
            >
              Ver ofertas do {item.model} <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
