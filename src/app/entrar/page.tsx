import { Metadata } from 'next'
import AuthCard from '@/components/marketplace/AuthCard'
import { getSafeRedirectPath } from '@/lib/auth-redirect'

export const metadata: Metadata = {
  title: 'Criar conta ou Entrar | Carbi',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const { redirect: redirectTo } = await searchParams
  const safeRedirectTo = getSafeRedirectPath(redirectTo)

  return (
    <div className="auth-page-shell">
      <div className="auth-page-grid">
        <section className="auth-hero-content">
          <div className="auth-hero-image-wrap">
            <img
              src="/images/porsche-hero.jpg"
              alt="Porsche 911 GT3 em movimento"
              className="auth-hero-image"
              loading="eager"
            />
          </div>
          <h1 className="auth-hero-title">Anuncie carros grátis em minutos.</h1>
          <p className="auth-hero-copy">
            Cadastro rápido com FIPE integrada, chat interno e divulgação gratuita para seus anúncios.
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
              <strong>Divulgação gratuita</strong>
              <span>Seus anúncios divulgados sem custo adicional.</span>
            </div>
          </div>
        </section>

        <section className="auth-form-card">
          <AuthCard redirectTo={safeRedirectTo} defaultMode="signup" />
        </section>
      </div>
    </div>
  )
}
