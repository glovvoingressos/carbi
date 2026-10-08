import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, MessageSquare, ShieldCheck, Zap } from 'lucide-react'
import { BreadcrumbSchema, FAQSchema } from '@/components/seo/JSONLD'
import { FAQSection } from '@/components/seo/SEOContentSection'
import { SEO_DATA } from '@/data/seo-content'
import { heroFont } from '@/components/home/home-font'
import '@/app/caminhoes/truck.css'

const data = SEO_DATA.venderCaminhao

const BENEFIT_ICONS = { Zap, ShieldCheck, MessageSquare } as const

export const metadata: Metadata = {
  title: data.title,
  description: data.description,
  keywords: [
    'anunciar caminhão grátis',
    'vender caminhão',
    'vender caminhão usado',
    'caminhão à venda',
    'anunciar caminhão seminovo',
  ],
  alternates: { canonical: '/vender-caminhao' },
  openGraph: {
    title: data.title,
    description: data.description,
    type: 'website',
    url: '/vender-caminhao',
    images: [{ url: '/images/caminhao-hero.jpg', width: 736, height: 417, alt: 'Caminhão em rodovia' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: data.title,
    description: data.description,
    images: ['/images/caminhao-hero.jpg'],
  },
}

/**
 * Landing indexável do anúncio de caminhão. O fluxo (/caminhoes/anunciar)
 * é noindex por ser formulário — esta página concentra o SEO de
 * "anunciar caminhão grátis" e leva o comprador até lá.
 */
export default function VenderCaminhaoPage() {
  return (
    <div className={`truck-site ${heroFont.variable}`}>
      <main className="cbi-page">
        <div className="cbi-main">
          <BreadcrumbSchema
            items={[
              { name: 'Home', url: '/' },
              { name: 'Caminhões à venda', url: '/caminhoes' },
              { name: 'Anunciar caminhão', url: '/vender-caminhao' },
            ]}
          />
          <FAQSchema items={data.faqs} />

          <section className="tk-sell-hero">
            <p className="tk-sell-kicker">Caminhões · Anúncio gratuito</p>
            <h1 className="tk-sell-title">{data.h1}</h1>
            <p className="tk-sell-lead">{data.subtitle}</p>
            <div className="tk-sell-actions">
              <Link href="/caminhoes/anunciar" className="tk-btn tk-btn-amber">
                Começar meu anúncio
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link href="/caminhoes" className="tk-btn tk-btn-outline">
                Ver caminhões à venda
              </Link>
            </div>
            <ul className="tk-sell-checks">
              <li>
                <Check size={16} aria-hidden="true" /> Publicação gratuita
              </li>
              <li>
                <Check size={16} aria-hidden="true" /> Consulta pela placa
              </li>
              <li>
                <Check size={16} aria-hidden="true" /> Chat interno
              </li>
              <li>
                <Check size={16} aria-hidden="true" /> Comparação com a FIPE
              </li>
            </ul>
          </section>

          <section className="tk-section">
            <div className="tk-section-head">
              <h2 className="tk-section-title">Por que anunciar seu caminhão na Carbi</h2>
            </div>
            <div className="tk-advantages">
              {data.benefits.map((benefit) => {
                const Icon = BENEFIT_ICONS[benefit.icon as keyof typeof BENEFIT_ICONS] || Zap
                return (
                  <div key={benefit.title} className="tk-advantage">
                    <span className="tk-advantage-icon" aria-hidden="true">
                      <Icon size={20} />
                    </span>
                    <h3>{benefit.title}</h3>
                    <p>{benefit.description}</p>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="tk-section">
            <div className="tk-section-head">
              <h2 className="tk-section-title">Como anunciar seu caminhão</h2>
            </div>
            <div className="tk-sell-steps">
              {data.steps.map((step, index) => (
                <div key={step.title} className="tk-sell-step">
                  <span className="tk-sell-step-index" aria-hidden="true">{index + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              ))}
            </div>
          </section>

          <FAQSection items={data.faqs} />

          <section className="tk-section">
            <nav className="truck-links" aria-label="Páginas de caminhões">
              <Link href="/caminhoes" className="truck-link">Caminhões à venda</Link>
              <Link href="/caminhoes/marcas" className="truck-link">Marcas de caminhão</Link>
              <Link href="/caminhoes/categorias" className="truck-link">Categorias</Link>
              <Link href="/caminhoes/anunciar-gratis" className="truck-link">Anunciar caminhão grátis</Link>
            </nav>
          </section>
        </div>
      </main>
    </div>
  )
}
