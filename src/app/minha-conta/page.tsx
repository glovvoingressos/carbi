import Link from 'next/link'
import type { Metadata } from 'next'
import { LayoutDashboard, MessageCircle, CarFront, UserRound, Store } from 'lucide-react'
import ProfilePanel from '@/components/marketplace/ProfilePanel'

export const metadata: Metadata = {
  title: 'Minha conta | Carbi',
  robots: {
    index: false,
    follow: false,
  },
}

export default function MinhaContaPage() {
  return (
    <main className="profile-page-shell">
      <div className="profile-page-grid">
        <section className="profile-hero surface-strong">
          <h1 className="auth-hero-title">Organize anúncios, conversas e dados do perfil em um só lugar.</h1>
          <p className="auth-hero-copy">
            Uma área de conta consistente com a home e com a página do anúncio, focada em gestão rápida e leitura limpa.
          </p>

          <div className="profile-actions-grid">
            <Link href="/minha-conta/anuncios" className="profile-action-card">
              <div className="profile-action-top">
                <LayoutDashboard className="h-5 w-5" />
                <span>Meus anúncios</span>
              </div>
              <p>Editar fotos, preço, descrição e status.</p>
            </Link>

            <Link href="/minha-conta/conversas" className="profile-action-card">
              <div className="profile-action-top">
                <MessageCircle className="h-5 w-5" />
                <span>Meus chats</span>
              </div>
              <p>Acompanhar conversas com compradores.</p>
            </Link>

            <Link href="/anunciar-carro" className="profile-action-card">
              <div className="profile-action-top">
                <CarFront className="h-5 w-5" />
                <span>Anunciar carro</span>
              </div>
              <p>Publicar novo anúncio em poucos passos.</p>
            </Link>

            <Link href="/entrar" className="profile-action-card">
              <div className="profile-action-top">
                <UserRound className="h-5 w-5" />
                <span>Login / Segurança</span>
              </div>
              <p>Entrar ou trocar de conta com segurança.</p>
            </Link>

            <Link href="/minha-conta/revenda" className="profile-action-card" style={{ border: '1px solid #D4F576' }}>
              <div className="profile-action-top">
                <Store className="h-5 w-5" style={{ color: '#5D9400' }} />
                <span>Área da Revenda</span>
              </div>
              <p>Dashboard, importação em massa e gestão de veículos.</p>
            </Link>
          </div>
        </section>

        <section className="profile-panel-wrap">
          <ProfilePanel />
        </section>
      </div>
    </main>
  )
}
