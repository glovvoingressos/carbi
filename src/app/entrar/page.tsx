import { Metadata } from 'next'
import AuthCard from '@/components/marketplace/AuthCard'

export const metadata: Metadata = {
  title: 'Criar conta ou Entrar | Carbi',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const { redirect: redirectTo } = await searchParams

  return (
    <div className="auth-page-shell">
      <div className="auth-page-grid">
        <section className="auth-hero-card surface-strong">
          <h1 className="auth-hero-title">Anuncie carros grátis em minutos.</h1>
          <p className="auth-hero-copy">
            Cadastro rápido com FIPE integrada, chat interno e tráfego pago grátis para seus anúncios.
          </p>
          <div className="auth-hero-points">
            <div className="auth-hero-point">
              <strong>Publicação rápida</strong>
              <span>Anuncie em menos de 2 minutos.</span>
            </div>
            <div className="auth-hero-point">
              <strong>FIPE integrada</strong>
              <span>Preço de referência verificado.</span>
            </div>
            <div className="auth-hero-point">
              <strong>Tráfego grátis</strong>
              <span>Seus anúncios no Google e Meta Ads sem custo.</span>
            </div>
          </div>
        </section>

        <section className="auth-form-card">
          <AuthCard redirectTo={redirectTo || '/minha-conta'} defaultMode="signup" />
        </section>
      </div>
    </div>
  )
}
