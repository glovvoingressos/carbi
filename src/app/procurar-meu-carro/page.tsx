import type { Metadata } from 'next'
import ProcurarMeuCarroWizard from '@/components/buyer/ProcurarMeuCarroWizard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Procure meu carro | Carbi',
  description:
    'Diga o que você procura e o Carbi acompanha os anúncios disponíveis, procurando oportunidades compatíveis com o que você procura.',
  alternates: { canonical: '/procurar-meu-carro' },
}

export default async function ProcurarMeuCarroPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  return <ProcurarMeuCarroWizard initialQuery={q || undefined} isLoggedIn={false} />
}
