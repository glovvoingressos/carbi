import type { Metadata } from 'next'
import { existsSync } from 'node:fs'
import path from 'node:path'
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

// Foto da hero: entra sozinha quando existir public/images/caminhao-hero.jpg
const hasHeroPhoto = existsSync(path.join(process.cwd(), 'public', 'images', 'caminhao-hero.jpg'))

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
          <div className="tk-hero-grid">
            <div className="tk-hero-text">
              <div className="tk-hero-top">
                <span className="tk-novelty">Novidade</span>
                <span className="tk-hero-kicker">Agora a Carbi também tem área de caminhões</span>
              </div>

              <h1 className="tk-hero-title">Caminhões à venda, do toco ao cavalo mecânico.</h1>

              <div className="tk-hero-row">
                <p className="tk-hero-sub">
                  Compare ano, quilometragem, eixos e capacidade de carga. Ficha técnica completa e comparação com a tabela FIPE em cada anúncio.
                </p>
                <Link href="/caminhoes/buscar" className="tk-pill">
                  <span className="tk-pill-circle" aria-hidden="true"><ArrowRight size={18} /></span>
                  Ver caminhões à venda
                </Link>
              </div>
            </div>

            <div className={hasHeroPhoto ? 'tk-hero-media has-photo' : 'tk-hero-media'}>
              {hasHeroPhoto ? (
                <img
                  src="/images/caminhao-hero.jpg"
                  alt="Caminhão Scania em rodovia na Islândia"
                  width={736}
                  height={417}
                  loading="eager"
                  fetchPriority="high"
                />
              ) : null}
            </div>
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
              <Link href="/caminhoes/anunciar" className="tk-btn tk-btn-primary">
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
          <Link href="/caminhoes/anunciar" className="tk-btn tk-btn-amber">
            Anunciar meu caminhão
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </section>
      </div>

      <nav className="cbi-nav" aria-label="Navegação de caminhões">
        <Link href="/caminhoes" className="active">Home</Link>
        <Link href="/caminhoes/buscar">Buscar</Link>
        <Link href="/caminhoes/anunciar">Anunciar</Link>
      </nav>
    </main>
  )
}
