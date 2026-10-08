import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, Gauge, MessageCircle, Ruler, TrendingUp, Truck } from 'lucide-react'
import ListingCard from '@/components/marketplace/ListingCard'
import { BreadcrumbSchema, FAQSchema } from '@/components/seo/JSONLD'
import { FAQSection } from '@/components/seo/SEOContentSection'
import { fetchPublicTruckListingsPage } from '@/lib/marketplace-server'
import {
  TRUCK_BRANDS,
  TRUCK_CATEGORIES,
  TRUCK_FAQ,
  TRUCK_QUICK_LINKS,
  serializeJsonLd,
  truckBrandSlug,
  truckBrowseJsonLd,
} from '@/lib/truck-seo'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.carbi.com.br'

export const metadata: Metadata = {
  title: 'Caminhões à venda: truck, bitruck, cavalo mecânico e toco',
  description:
    'Caminhões usados e seminovos com ficha técnica completa: eixos, PBT, capacidade de carga e comparação com a tabela FIPE. Anuncie grátis na Carbi.',
  keywords: ['caminhões à venda', 'caminhão usado', 'cavalo mecânico', 'bitruck', 'truck', 'toco', 'comprar caminhão'],
  alternates: { canonical: '/caminhoes' },
  openGraph: {
    title: 'Caminhões à venda: truck, bitruck, cavalo mecânico e toco | Carbi',
    description: 'Caminhões usados e seminovos com ficha técnica completa e comparação FIPE.',
    url: '/caminhoes',
    type: 'website',
  },
}

const CATEGORY_ICONS: Record<string, typeof Truck> = {
  truck: Truck,
  bitruck: Truck,
  'cavalo-mecanico': Truck,
  toco: Truck,
}

const ADVANTAGES = [
  {
    icon: Ruler,
    title: 'Ficha técnica completa',
    text: 'Eixos, PBT, CMT, capacidade de carga e carroceria em cada anúncio.',
  },
  {
    icon: TrendingUp,
    title: 'Preço comparado com a FIPE',
    text: 'Veja se o valor pedido está justo antes de fechar negócio.',
  },
  {
    icon: MessageCircle,
    title: 'Chat interno',
    text: 'Negocie pelo chat da Carbi sem expor seu telefone.',
  },
  {
    icon: BadgeCheck,
    title: 'Anúncio grátis',
    text: 'Publique seu caminhão sem custo e alcance compradores de todo o Brasil.',
  },
]

export default async function TruckHomePage() {
  const featured = await fetchPublicTruckListingsPage({ sort: 'recent', page: 1, pageSize: 8 })

  const browseJsonLd = truckBrowseJsonLd({
    name: 'Caminhões à venda',
    description: 'Caminhões usados e seminovos com ficha técnica completa e comparação FIPE.',
    url: `${SITE_URL}/caminhoes`,
    items: [
      ...TRUCK_CATEGORIES.map((category) => ({ name: category.name, url: `${SITE_URL}/caminhoes/${category.slug}` })),
      ...TRUCK_BRANDS.map((brand) => ({ name: `Caminhões ${brand}`, url: `${SITE_URL}/caminhoes/marca-${truckBrandSlug(brand)}` })),
    ],
  })

  const stats = [
    { value: featured.total, label: 'caminhões anunciados' },
    { value: TRUCK_BRANDS.length, label: 'marcas' },
    { value: TRUCK_CATEGORIES.length, label: 'categorias' },
  ].filter((stat) => stat.value > 0)

  return (
    <main className="cbi-page">
      <div className="cbi-main">
        <BreadcrumbSchema items={[{ name: 'Home', url: '/' }, { name: 'Caminhões à venda', url: '/caminhoes' }]} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(browseJsonLd) }} />

        {/* ═══ HERO ═══ */}
        <section className="tk-hero">
          <div className="tk-hero-copy">
            <p className="tk-hero-eyebrow">Caminhões</p>
            <h1 className="tk-hero-title">Do toco ao cavalo mecânico, com preço na mesa.</h1>
            <p className="tk-hero-sub">
              Compare ano, quilometragem, eixos e capacidade de carga em cada anúncio, com ficha técnica completa e
              comparação com a tabela FIPE.
            </p>

            <div className="tk-hero-actions">
              <Link href="/caminhoes/buscar" className="tk-btn tk-btn-primary">
                Ver caminhões à venda
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link href="/anunciar-caminhao" className="tk-btn tk-btn-ghost">
                Anunciar meu caminhão
              </Link>
            </div>

            {stats.length > 0 ? (
              <div className="tk-hero-stats" role="list">
                {stats.map((stat) => (
                  <div key={stat.label} className="tk-hero-stat" role="listitem">
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="tk-hero-cards">
            {TRUCK_CATEGORIES.map((category) => {
              const Icon = CATEGORY_ICONS[category.slug] || Truck
              return (
                <Link key={category.slug} href={`/caminhoes/${category.slug}`} className="tk-hero-card">
                  <span className="tk-hero-card-icon" aria-hidden="true">
                    <Icon size={20} />
                  </span>
                  <span className="tk-hero-card-title">{category.name}</span>
                  <ArrowRight className="tk-hero-card-arrow" size={20} aria-hidden="true" />
                </Link>
              )
            })}
          </div>
        </section>

        {/* ═══ ATALHOS ═══ */}
        <nav className="truck-links" aria-label="Atalhos de caminhões">
          {TRUCK_QUICK_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="truck-link">
              {link.label}
            </Link>
          ))}
        </nav>

        {/* ═══ ANÚNCIOS ═══ */}
        <section className="tk-section">
          <div className="tk-section-head">
            <h2 className="tk-section-title">Caminhões anunciados agora</h2>
            <Link href="/caminhoes/buscar" className="tk-section-link">
              Ver todos os caminhões
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          {featured.items.length > 0 ? (
            <div className="tk-listings">
              {featured.items.map((listing, index) => (
                <ListingCard key={listing.id} listing={listing} index={index} />
              ))}
            </div>
          ) : (
            <div className="tk-empty">
              <strong>Ainda não há caminhões anunciados.</strong>
              <p>Publique o seu em poucos minutos — é grátis e o anúncio aparece aqui.</p>
              <Link href="/anunciar-caminhao" className="tk-btn tk-btn-primary">
                Anunciar meu caminhão
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          )}
        </section>

        {/* ═══ VANTAGENS ═══ */}
        <section className="tk-section">
          <div className="tk-section-head">
            <h2 className="tk-section-title">Por que negociar caminhão na Carbi</h2>
          </div>
          <div className="tk-advantages">
            {ADVANTAGES.map((advantage) => (
              <div key={advantage.title} className="tk-advantage">
                <span className="tk-advantage-icon" aria-hidden="true">
                  <advantage.icon size={20} />
                </span>
                <h3>{advantage.title}</h3>
                <p>{advantage.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ CATEGORIAS ═══ */}
        <section className="tk-section">
          <div className="tk-section-head">
            <h2 className="tk-section-title">Navegue por categoria</h2>
            <Link href="/caminhoes/categorias" className="tk-section-link">
              Ver categorias
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="truck-hub-grid">
            {TRUCK_CATEGORIES.map((category) => (
              <Link key={category.slug} href={`/caminhoes/${category.slug}`} className="truck-hub-card">
                <h2>{category.name}</h2>
                <span className="truck-hub-cta">Ver anúncios</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ═══ MARCAS ═══ */}
        <section className="tk-section">
          <div className="tk-section-head">
            <h2 className="tk-section-title">Caminhões por marca</h2>
            <Link href="/caminhoes/marcas" className="tk-section-link">
              Ver marcas
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="tk-brands">
            {TRUCK_BRANDS.map((brand) => (
              <Link key={brand} href={`/caminhoes/marca-${truckBrandSlug(brand)}`} className="tk-brand">
                {brand}
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>

        {/* ═══ FAQ ═══ */}
        <FAQSchema items={TRUCK_FAQ} />
        <FAQSection items={TRUCK_FAQ} />

        {/* ═══ CTA FINAL ═══ */}
        <section className="tk-cta">
          <div>
            <p className="tk-cta-eyebrow">Carbi caminhões</p>
            <h2 className="tk-cta-title">Anuncie seu caminhão grátis</h2>
            <p className="tk-cta-text">
              Ficha técnica, fotos e chat interno. Seu caminhão divulgado para compradores de todo o Brasil.
            </p>
          </div>
          <Link href="/anunciar-caminhao" className="tk-btn tk-btn-amber">
            Anunciar meu caminhão
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </section>
      </div>

      <nav className="cbi-nav" aria-label="Navegação de caminhões">
        <Link href="/caminhoes" className="active">Home</Link>
        <Link href="/caminhoes/buscar">Buscar</Link>
        <Link href="/anunciar-caminhao">Anunciar</Link>
      </nav>
    </main>
  )
}
