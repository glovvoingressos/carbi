import { Metadata } from 'next'
import AuthCard from '@/components/marketplace/AuthCard'

export const metadata: Metadata = {
  title: 'Criar conta | Carbi',
  robots: {
    index: false,
    follow: false,
  },
}

export default function CadastroPage() {
  return (
    <div className="auth-page-shell">
      <div className="auth-page-grid">
        <section className="auth-hero-card surface-strong auth-hero-signup">
          <span className="auth-hero-kicker">Cadastro gratuito</span>
          <h1 className="auth-hero-title">Crie sua conta e publique seu primeiro anúncio em poucos passos.</h1>
          <p className="auth-hero-copy">
            Comece grátis, com FIPE integrada, fotos reais e chat interno para manter a negociação protegida.
          </p>
          <div className="auth-hero-points">
            <div className="auth-hero-point">
              <strong>Publicação rápida</strong>
              <span>Monte um anúncio básico em menos de 2 minutos.</span>
            </div>
            <div className="auth-hero-point">
              <strong>Enriquecimento depois</strong>
              <span>Complete detalhes avançados sem travar a publicação.</span>
            </div>
            <div className="auth-hero-point">
              <strong>Visual premium</strong>
              <span>Mesmo sistema visual da home e do anúncio.</span>
            </div>
          </div>
        </section>

        <section className="auth-form-card">
          <AuthCard redirectTo="/minha-conta" defaultMode="signup" />
        </section>
      </div>
    </div>
  )
}
