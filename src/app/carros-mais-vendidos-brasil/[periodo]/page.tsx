import type { Metadata } from 'next'
import { getMonthlyRankings } from '@/lib/rankings-data'
import RankingsHubView from '@/components/rankings/RankingsHubView'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ periodo: string }>
}): Promise<Metadata> {
  const { periodo } = await params
  const label = periodo.replace('-', ' ').toUpperCase()
  return {
    title: `Carros mais vendidos no Brasil - ${label} | Carbi`,
    description: `Ranking de vendas de veículos 0km e seminovos em ${label}. Confira o TOP 100 com dados FIPE e emplacamentos.`,
    alternates: { canonical: `/carros-mais-vendidos-brasil/${periodo}` },
  }
}

export default async function CarrosMaisVendidosPeriodoPage({
  params,
}: {
  params: Promise<{ periodo: string }>
}) {
  const { periodo } = await params
  const [newRankings, usedRankings] = await Promise.all([
    getMonthlyRankings(periodo, 'new'),
    getMonthlyRankings(periodo, 'used'),
  ])

  const label = periodo === 'julho-2026' ? 'Julho / 2026' : periodo.replace('-', ' ').toUpperCase()

  return (
    <RankingsHubView
      initialNewRankings={newRankings}
      initialUsedRankings={usedRankings}
      periodLabel={label}
      periodSlug={periodo}
    />
  )
}
