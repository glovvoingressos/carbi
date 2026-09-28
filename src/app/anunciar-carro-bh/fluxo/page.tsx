import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import ListingForm from '@/components/marketplace/ListingForm'
import { buildLoginRedirect } from '@/lib/auth-redirect'
import { getSupabaseServerClientWithCookies, isSupabaseConfigured } from '@/lib/supabase-server'

export const metadata: Metadata = {
  title: 'Anunciar meu carro | Carbi',
  description: 'Publique seu anúncio gratuitamente, com até 10 fotos e chat interno seguro.',
  robots: {
    index: false,
    follow: false,
  },
}

export const dynamic = 'force-dynamic'

export default async function AnunciarFluxoPage() {
  if (isSupabaseConfigured()) {
    const supabase = await getSupabaseServerClientWithCookies()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect(buildLoginRedirect('/anunciar-carro-bh/fluxo'))
  }

  return (
    <div className="listing-flow-app">
      <header className="listing-flow-header">
        <Link href="/carros-a-venda" className="listing-flow-back">
          <ArrowLeft size={18} aria-hidden="true" />
          <span>Voltar</span>
        </Link>
        <div className="listing-flow-header-copy">
          <p className="listing-flow-eyebrow">Carbi anúncios · BH</p>
          <h1>Monte seu anúncio</h1>
        </div>
        <div className="listing-flow-trust">Fluxo guiado</div>
      </header>
      <main className="listing-flow-main">
        <p className="listing-flow-intro">Consulta FIPE, fotos e revisão final em poucos minutos.</p>
        <ListingForm />
      </main>
    </div>
  )
}
