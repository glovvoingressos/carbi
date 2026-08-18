import type { Metadata } from 'next'
import { getStateRankings, getMonthlyRankings } from '@/lib/rankings-data'
import RankingsHubView from '@/components/rankings/RankingsHubView'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ estado: string }>
}): Promise<Metadata> {
  const { estado } = await params
  const stateData = await getStateRankings(estado)
  const name = stateData?.stateName || estado

  return {
    title: `Carros mais vendidos em ${name} (Julho 2026) | Carbi`,
    description: `Ranking de vendas e emplacamentos de carros novos e usados no estado de ${name} em Julho/2026 com dados FIPE.`,
    alternates: { canonical: `/carros-mais-vendidos/${estado}` },
  }
}

export default async function CarrosMaisVendidosEstadoPage({
  params,
}: {
  params: Promise<{ estado: string }>
}) {
  const { estado } = await params
  const [stateData, usedRankings] = await Promise.all([
    getStateRankings(estado),
    getMonthlyRankings('julho-2026', 'used'),
  ])

  return (
    <RankingsHubView
      initialNewRankings={stateData?.rankings || []}
      initialUsedRankings={usedRankings}
      periodLabel="Julho / 2026"
      periodSlug="julho-2026"
      stateName={stateData?.stateName}
    />
  )
}
