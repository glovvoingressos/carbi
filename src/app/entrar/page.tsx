import { Metadata } from 'next'
import AuthCard from '@/components/marketplace/AuthCard'
import { getSafeRedirectPath } from '@/lib/auth-redirect'
import { heroFont } from '@/components/home/home-font'
import './auth.css'

export const metadata: Metadata = {
  title: 'Criar conta ou Entrar',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const { redirect: redirectTo } = await searchParams
  const safeRedirectTo = getSafeRedirectPath(redirectTo)

  return (
    <div className={`auth-page-shell ${heroFont.variable}`}>
      <h1 className="sr-only">Criar conta ou entrar na Carbi</h1>
      <div className="auth-page-grid">
        <section className="auth-hero-content" aria-hidden="true">
          <div className="auth-hero-image-wrap">
            <img
              src="/images/porsche-hero.jpg"
              alt=""
              className="auth-hero-image"
              loading="eager"
            />
          </div>
        </section>

        <section className="auth-form-card">
          <AuthCard redirectTo={safeRedirectTo} defaultMode="signup" />
        </section>
      </div>
    </div>
  )
}
