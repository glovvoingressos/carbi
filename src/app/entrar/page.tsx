import { Metadata } from 'next'
import AuthCard from '@/components/marketplace/AuthCard'

export const metadata: Metadata = {
  title: 'Entrar | Carbi',
  robots: {
    index: false,
    follow: false,
  },
}

export default function LoginPage() {
  return (
    <div className="auth-page-shell">
      <div className="auth-page-grid">
        <section className="auth-hero-card surface-strong">
          <span className="auth-hero-kicker">Acesso rápido</span>
          <h1 className="auth-hero-title">Entre para gerenciar seus anúncios e conversar com compradores.</h1>
          <p className="auth-hero-copy">
            A mesma identidade visual da home e do anúncio, com foco em conversão, clareza e acesso rápido ao seu painel.
          </p>
          <div className="auth-hero-points">
            <div className="auth-hero-point">
              <strong>Anúncios e chat</strong>
              <span>Veja seus veículos publicados e conversas em um só lugar.</span>
            </div>
            <div className="auth-hero-point">
              <strong>Dados protegidos</strong>
              <span>O contato direto continua protegido pelo chat interno.</span>
            </div>
            <div className="auth-hero-point">
              <strong>Visual consistente</strong>
              <span>Mesmo padrão da home, do anúncio e do perfil do usuário.</span>
            </div>
          </div>
        </section>

        <section className="auth-form-card">
          <AuthCard redirectTo="/minha-conta" />
        </section>
      </div>
    </div>
  )
}
