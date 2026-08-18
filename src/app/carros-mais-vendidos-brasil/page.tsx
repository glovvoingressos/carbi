import type { Metadata } from 'next'
import { getMonthlyRankings } from '@/lib/rankings-data'
import RankingsHubView from '@/components/rankings/RankingsHubView'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Os 100 Carros mais vendidos no Brasil em Julho de 2026 | Carbi',
  description: 'Ranking oficial dos 100 carros 0km e seminovos mais vendidos no Brasil em Julho/2026. Preços FIPE, comparativos e ofertas disponíveis.',
  keywords: [
    'carros mais vendidos',
    'carros mais vendidos no brasil',
    'carros mais vendidos julho 2026',
    'emplacamentos fenabrave',
    'seminovos mais vendidos',
  ],
  alternates: { canonical: '/carros-mais-vendidos-brasil' },
}

export default async function CarrosMaisVendidosHubPage() {
  const [newRankings, usedRankings] = await Promise.all([
    getMonthlyRankings('julho-2026', 'new'),
    getMonthlyRankings('julho-2026', 'used'),
  ])

  return (
    <RankingsHubView
      initialNewRankings={newRankings}
      initialUsedRankings={usedRankings}
      periodLabel="Julho / 2026"
      periodSlug="julho-2026"
    />
  )
}
