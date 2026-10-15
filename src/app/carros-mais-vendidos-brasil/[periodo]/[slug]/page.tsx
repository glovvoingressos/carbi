import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getModelRankingDetail } from '@/lib/rankings-data'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { buildRankingStructuredData } from '@/lib/rankings-seo'
import { getSeptemberFirstHalfShare } from '@/data/rankings-september-2026'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.carbi.com.br'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ periodo: string; slug: string }>
}): Promise<Metadata> {
  const { periodo, slug } = await params
  if (periodo !== 'setembro-2026') notFound()
  const detail = await getModelRankingDetail(periodo, slug)
  if (!detail) return { title: 'Modelo não encontrado' }

  return {
    title: `${detail.brand} ${detail.modelName} - Emplacamentos em setembro de 2026`,
    description: `Posição e emplacamentos do ${detail.brand} ${detail.modelName} na primeira quinzena de setembro de 2026.`,
    alternates: { canonical: `/carros-mais-vendidos-brasil/${periodo}/${slug}` },
  }
}

export default async function ModelRankingDetailPage({
  params,
}: {
  params: Promise<{ periodo: string; slug: string }>
}) {
  const { periodo, slug } = await params
  if (periodo !== 'setembro-2026') notFound()
  const detail = await getModelRankingDetail(periodo, slug)

  if (!detail) notFound()

  const { item, newItem } = detail
  const periodLabel = 'Setembro / 2026 · 1ª quinzena'

  const canonicalUrl = `${SITE_URL}/carros-mais-vendidos-brasil/${periodo}/${slug}`
  const rankingSchema = buildRankingStructuredData({
    canonicalUrl,
    brand: item.brand,
    model: item.model,
    periodLabel,
  })

  return (
    <div className="cb-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(rankingSchema) }}
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
              Emplacamentos registrados para este modelo no recorte parcial indicado. Esta página não representa vendas de usados nem preço FIPE.
            </p>
          </div>
        </div>
      </section>

      <section className="cb-section-pad pt-0">
        <div className="cb-wrap">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {newItem && (
              <div className="bg-white border-2 border-[var(--cb-lime)] rounded-3xl p-6">
                <div className="cb-eyebrow">Emplacamentos de carros novos</div>
                <div className="text-4xl font-extrabold font-[var(--cb-head)]">
                  #{newItem.position} posição
                </div>
                <p className="text-gray-500 mt-2">
                  <strong>{newItem.unitsSold.toLocaleString('pt-BR')}</strong> emplacamentos no período · participação estimada pela Carbi: {getSeptemberFirstHalfShare(newItem.unitsSold).toLocaleString('pt-BR')}%
                </p>
              </div>
            )}
          </div>

          <p className="mb-10 text-sm leading-relaxed text-gray-600">
            Fontes: contagem do modelo reportada por <a className="underline" href="https://motor1.uol.com.br/news/808566/carros-mais-vendidos-quinzena-setembro/" target="_blank" rel="noreferrer">Motor1 com dados da Fenabrave</a>; total divulgado pela <a className="underline" href="https://pt.linkedin.com/posts/bright-consulting-isd_an%C3%A1lise-de-vendas-quinzenal-setembro-2026-activity-7506035976927117314-YTPr" target="_blank" rel="noreferrer">Bright Consulting</a>. Método: a participação é calculada pela Carbi dividindo os emplacamentos do modelo por 109.536 emplacamentos de veículos leves da primeira quinzena e arredondando para uma casa decimal. Período parcial; consulte as fontes para atualizações ou revisões.
            {' '}Responsabilidade editorial: Carbi.
          </p>

          <div className="bg-[var(--cb-charcoal)] text-white rounded-3xl p-9 flex flex-wrap justify-between items-center gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">
                Procurando um {item.brand} {item.model}?
              </h3>
              <p className="m-0 opacity-80">
                Veja anúncios de vendedores e consulte a FIPE quando a versão e o ano-modelo coincidirem.
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
