import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getMonthlyRankings } from '@/lib/rankings-data'
import RankingsHubView from '@/components/rankings/RankingsHubView'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ periodo: string }>
}): Promise<Metadata> {
  const { periodo } = await params
  if (periodo !== 'setembro-2026') notFound()
  const label = 'Setembro de 2026 · 1ª quinzena'
  return {
    title: `10 carros novos mais emplacados no Brasil - ${label}`,
    description: `Recorte parcial de emplacamentos da primeira quinzena de setembro de 2026, com fontes e método informados.`,
    alternates: { canonical: `/carros-mais-vendidos-brasil/${periodo}` },
  }
}

export default async function CarrosMaisVendidosPeriodoPage({
  params,
}: {
  params: Promise<{ periodo: string }>
}) {
  const { periodo } = await params
  if (periodo !== 'setembro-2026') notFound()
  const newRankings = await getMonthlyRankings(periodo, 'new')

  return (
    <RankingsHubView
      initialNewRankings={newRankings}
      periodLabel="Setembro / 2026 · 1ª quinzena"
      periodSlug={periodo}
    />
  )
}
