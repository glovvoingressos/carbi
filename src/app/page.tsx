import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import {
  Search, ArrowRight, ChevronRight, TrendingUp,
  MapPin, Plus, Zap,
} from 'lucide-react'
import { getLatestPublicListings } from '@/lib/marketplace-server'
import { formatBRL, cars } from '@/data/cars'
import MarketplaceListingImage from '@/components/marketplace/MarketplaceListingImage'
import ModelComparison from '@/components/home/ModelComparison'
import RankingsBanner from '@/components/home/RankingsBanner'
import HomeCounters from '@/components/home/HomeCounters'
import PlateBannerLookup from '@/components/marketplace/PlateBannerLookup'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Carbi | anunciar carros grátis, seminovos à venda e FIPE',
  description: 'Anuncie carros grátis, encontre seminovos à venda e compare preço com FIPE em uma plataforma com chat interno e dados reais.',
  keywords: ['anunciar carros grátis', 'seminovos à venda', 'carros à venda', 'anunciar carro', 'vender carro', 'comprar carro', 'tabela fipe'],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Carbi | anunciar carros grátis, seminovos à venda e FIPE',
    description: 'Anuncie carros grátis, encontre seminovos à venda e compare preço com FIPE em uma plataforma com chat interno e dados reais.',
    url: '/',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Carbi | anunciar carros grátis, seminovos à venda e FIPE',
    description: 'Anuncie carros grátis, encontre seminovos à venda e compare preço com FIPE em uma plataforma com chat interno e dados reais.',
  },
}

type Listing = Awaited<ReturnType<typeof getLatestPublicListings>>[number]

function fipePercent(listing: Listing) {
  if (typeof listing.fipe_difference_percent !== 'number') return null
  return Math.round(listing.fipe_difference_percent)
}

export default async function HomePage() {
  let listings: Listing[] = []
  let fetchError = false

  try {
    listings = await getLatestPublicListings(100)
  } catch {
    fetchError = true
  }

  const recentListings = listings
  const topBrands = [...new Set(listings.map((l) => l.brand))].slice(0, 6)
  const cities = [...new Set(listings.map((l) => l.city))].filter(Boolean).slice(0, 6)

  const mapCar = (c: typeof cars[0]) => ({
    brand: c.brand,
    model: c.model,
    version: c.version,
    segment: c.segment,
    priceBrl: c.priceBrl,
    horsepower: c.horsepower,
    fuelEconomyCityGas: c.fuelEconomyCityGas,
    airbagsCount: c.airbagsCount,
    slug: c.slug,
    image: c.image,
    idealFor: c.idealFor,
  })
  const comparisonCars = cars.filter((c) => c.isPopular).slice(0, 2).map(mapCar)
  const allComparisonCars = cars.map(mapCar)

  const categories = [
    { label: 'SUVs', filter: 'SUV', img: '/categories/suv.jpg', badge: 'Mais procurados' },
    { label: 'Elétricos', filter: 'Elétrico', img: '/categories/eletrico.jpg', badge: 'Zero emissão' },
    { label: 'Picapes', filter: 'Pickup', img: '/categories/pickup.jpg', badge: 'Robustez total' },
    { label: 'Esportivos', filter: 'Esportivo', img: '/categories/esportivo.jpg', badge: 'Pura performance' },
  ]

  const pills = [
    { label: 'Todos os estilos', href: '/carros-a-venda', active: true, lime: false },
    { label: 'SUV', href: '/carros-a-venda?body_type=SUV', active: false, lime: false },
    { label: 'Sedan', href: '/carros-a-venda?body_type=sedan', active: false, lime: false },
    { label: 'Hatch', href: '/carros-a-venda?body_type=hatch', active: false, lime: false },
    { label: 'Pickup', href: '/carros-a-venda?body_type=pickup', active: false, lime: false },
    { label: 'Elétrico', href: '/carros-a-venda?body_type=elétrico', active: false, lime: false },
    { label: 'Até R$ 80 mil', href: '/carros-a-venda?price_max=80000', active: false, lime: true },
  ]

  const budgetOptions = [
    { label: 'Qualquer orçamento', value: '' },
    { label: 'Até R$ 50 mil', value: '50000' },
    { label: 'Até R$ 80 mil', value: '80000' },
    { label: 'Até R$ 120 mil', value: '120000' },
    { label: 'Até R$ 200 mil', value: '200000' },
  ]

  return (
    <div className="cb-page">
      {/* ═══ HERO ═══ */}
      <section className="cb-hero">
        <div className="cb-wrap">
          <div className="cb-hero-grid">
            <div className="cb-hero-copy">
              <h1 className="cb-hero-title">
                Encontre o carro <u>certo</u>, sem complicação.
              </h1>
              <p className="cb-hero-lead">
                Anuncie grátis, compare com a FIPE e negocie direto com o vendedor.
                Dados reais, chat interno e as melhores ofertas de seminovos do país.
              </p>

              <div className="cb-hero-cta-row">
                <Link href="/carros-a-venda" className="cb-btn cb-btn-lime cb-btn-arrow">
                  Ver estoque completo
                  <ArrowRight size={18} />
                </Link>
                <Link href="/anunciar-carro" className="cb-btn cb-btn-ghost cb-btn-arrow">
                  <Plus size={18} />
                  Anunciar grátis
                </Link>
              </div>

              <div className="cb-hero-avatars">
                <div className="cb-avatar-stack">
                  {['/categories/suv.jpg', '/categories/sedan.jpg', '/categories/hatch.jpg'].map((src) => (
                    <img key={src} src={src} alt="" className="cb-avatar" loading="lazy" />
                  ))}
                  <div className="cb-avatar-more">+8</div>
                </div>
                <p>
                  <strong>32 mil+</strong> compradores ativos todo mês
                </p>
              </div>
            </div>

            <div className="cb-hero-visual">
              <img
                src="/images/Porsche 911 GT3 RS | Speed Art Motion Blur Photography.jpg"
                alt="Porsche 911 GT3 RS em destaque na Carbi"
                width={960}
                height={816}
                fetchPriority="high"
              />
            </div>
          </div>

          <HomeCounters cityCount={cities.length} />
        </div>
      </section>

      {/* ═══ CATEGORY PILLS ═══ */}
      <section className="cb-pills" aria-label="Categorias">
        {pills.map((pill) => (
          <Link
            key={pill.label}
            href={pill.href}
            className={`cb-pill${pill.active ? ' cb-pill-active' : ''}${pill.lime ? ' cb-pill-lime' : ''}`}
          >
            {pill.label}
          </Link>
        ))}
        <Link href="/carros-a-venda" className="cb-pill cb-pill-arrow" aria-label="Ver todos os carros">
          <ArrowRight size={20} />
        </Link>
      </section>

      {/* ═══ PLATE LOOKUP ═══ */}
      <section className="cb-section-pad cb-promo-before-listings">
        <div className="cb-wrap">
          <PlateBannerLookup />
        </div>
      </section>

      {/* ═══ LISTINGS TABLE ═══ */}
      <section className="cb-section-pad">
        <div className="cb-wrap">
          <div className="cb-head">
            <div>
              <p className="cb-eyebrow">Estoque selecionado</p>
              <h2>Os anúncios mais procurados desta semana</h2>
            </div>
            <Link href="/carros-a-venda" className="cb-head-link">
              Ver todos os carros
              <ChevronRight size={16} />
            </Link>
          </div>

          <div className="cb-listing-cards">
            {recentListings.length > 0 ? (
              recentListings.map((listing) => {
                const fipe = fipePercent(listing)
                const imageUrls = listing.images?.map((img) => img.url) || []
                return (
                  <Link key={listing.id} href={`/anuncios/${listing.slug}`} className="cb-listing-card">
                    <div className="cb-listing-card-image">
                      <MarketplaceListingImage
                        brand={listing.brand}
                        model={listing.model}
                        year={listing.year_model}
                        imageUrls={imageUrls}
                        alt={`${listing.brand} ${listing.model} ${listing.year_model}`}
                      />
                      <span className="cb-listing-card-heart" aria-hidden="true">♡</span>
                    </div>
                    <div className="cb-listing-card-body">
                      <div className="cb-listing-card-title">{listing.brand} {listing.model}</div>
                      <div className="cb-listing-card-meta">
                        {listing.year_model} · {listing.mileage?.toLocaleString('pt-BR')} km
                      </div>
                      <div className="cb-listing-card-location">
                        <MapPin size={14} />
                        <span>{listing.city}</span>
                      </div>
                      <div className="cb-listing-card-footer">
                        <div>
                          <div className="cb-listing-card-price">{formatBRL(Number(listing.price))}</div>
                          {fipe !== null ? (
                            <div className={`cb-fipe-compare ${fipe <= 0 ? 'is-below' : 'is-above'}`}>
                              <div className="cb-fipe-label">
                                <TrendingUp size={12} />
                                <span>{Math.abs(fipe)}% {fipe <= 0 ? 'abaixo' : 'acima'} da FIPE</span>
                              </div>
                              <div className="cb-fipe-track" aria-hidden="true">
                                <span style={{ '--cb-fipe-progress': `${Math.min(Math.max(Math.abs(fipe), 8), 100)}%` } as CSSProperties} />
                              </div>
                            </div>
                          ) : (
                            <div className="cb-fipe-unavailable">FIPE indisponível</div>
                          )}
                        </div>
                        <span className="cb-listing-card-arrow"><ArrowRight size={17} /></span>
                      </div>
                    </div>
                  </Link>
                )
              })
            ) : (
              <div className="cb-listing-empty">
                {fetchError ? 'Carregando anúncios...' : 'Nenhum anúncio ainda'}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══ EXPLORE GRID ═══ */}
      <section className="cb-section-pad">
        <div className="cb-wrap">
          <div className="cb-head">
            <div>
              <p className="cb-eyebrow">Explore</p>
              <h2>Encontre o seu estilo</h2>
            </div>
          </div>
          <div className="cb-explore-grid">
            {categories.map((cat) => (
              <Link
                key={cat.label}
                href={`/carros-a-venda?body_type=${encodeURIComponent(cat.filter)}`}
                className="cb-explore-card"
              >
                <img src={cat.img} alt={cat.label} loading="lazy" />
                <div className="cb-explore-overlay" aria-hidden="true" />
                <div className="cb-explore-body">
                  <span className="cb-explore-badge">{cat.badge}</span>
                  <div className="cb-explore-title">
                    {cat.label}
                    <span className="cb-explore-arrow">
                      <ArrowRight size={18} />
                    </span>
                  </div>
                  <div className="cb-explore-count">Ver ofertas disponíveis</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="cb-section-pad">
        <div className="cb-wrap cb-process-grid">
          <div>
            <p className="cb-eyebrow">Como funciona</p>
            <h2 style={{ fontFamily: 'var(--cb-head)', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 12px' }}>
              Do jeito mais simples
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--cb-ink-soft)', margin: '0 0 24px', maxWidth: '46ch' }}>
              Do primeiro filtro ao contrato, todo o processo pensado para você economizar tempo e dinheiro.
            </p>

            <div className="cb-process-step">
              <div className="cb-step-num">01</div>
              <div className="cb-step-body">
                <h3>Busque o carro ideal</h3>
                <p>Filtre por marca, preço, ano e cidade. Compare com a FIPE e veja os dados reais de cada veículo.</p>
              </div>
            </div>
            <div className="cb-process-step">
              <div className="cb-step-num">02</div>
              <div className="cb-step-body">
                <h3>Fale direto com o vendedor</h3>
                <p>Chat interno, sem intermediários. Tire dúvidas, combine visita e negocie com segurança.</p>
              </div>
            </div>
            <div className="cb-process-step">
              <div className="cb-step-num">03</div>
              <div className="cb-step-body">
                <h3>Fechou o negócio</h3>
                <p>Dados verificados, preço justo, zero surpresas. O carro certo, no preço certo.</p>
              </div>
            </div>
          </div>

          <div className="cb-process-visual">
            <img src="/images/ChatGPT Image 31 de ago. de 2026, 22_12_52-2.png" alt="Chat interno Carbi" loading="lazy" />
          </div>
        </div>
      </section>

      {/* ═══ BUILD / SOLUTIONS ═══ */}
      <section className="cb-section-pad">
        <div className="cb-wrap">
          <div className="cb-build-grid">
            <Link href="/anunciar-carro" className="cb-build-card cb-build-card-dark">
              <div>
                <div className="cb-build-card-tag">Para vender</div>
                <h3>Anuncie grátis em 2 minutos</h3>
                <p>Seu anúncio com fotos, FIPE verificada e alcance de milhares de compradores.</p>
              </div>
              <span className="cb-build-cta">
                Anunciar meu carro <ArrowRight size={16} />
              </span>
            </Link>
            <Link href="/qual-carro" className="cb-build-card cb-build-card-lime">
              <div>
                <div className="cb-build-card-tag">Para comparar</div>
                <h3>Compare com a FIPE</h3>
                <p>Saiba se o preço está justo antes de fechar negócio.</p>
              </div>
              <span className="cb-build-cta">
                Comparar agora <ArrowRight size={16} />
              </span>
            </Link>
            <Link href="/trafego-pago-gratis" className="cb-build-card cb-build-card-light">
              <div>
                <div className="cb-build-card-tag">Para vender</div>
                <h3>Tráfego pago grátis</h3>
                <p>Divulgamos seus anúncios no Google e Meta Ads sem custo.</p>
              </div>
              <span className="cb-build-cta">
                Saiba mais <ArrowRight size={16} />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ RANKINGS BANNER ═══ */}
      <RankingsBanner />

      {/* ═══ MODEL COMPARISON ═══ */}
      <ModelComparison cars={comparisonCars} allCars={allComparisonCars} />

      {/* ═══ BRAND MARQUEE ═══ */}
      <section className="cb-marquee" aria-label="Marcas disponíveis">
        <div className="cb-marquee-track">
          {[...topBrands, ...topBrands].map((brand, i) => (
            <Link key={`${brand}-${i}`} href={`/carros-a-venda?brand=${encodeURIComponent(brand)}`} className="cb-marquee-item">
              <Zap size={18} fill="currentColor" />
              {brand}
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="cb-final-cta">
        <div className="cb-wrap">
          <div className="cb-cta-block">
            <div>
              <div className="cb-cta-eyebrow">Carbi</div>
              <h2>Pronto para encontrar o carro certo?</h2>
              <p>
                Anuncie grátis, compare preços com a FIPE e negocie direto com o vendedor.
                Sem complicação, do jeito que deveria ser.
              </p>
              <div className="cb-hero-cta-row" style={{ marginBottom: 0 }}>
                <Link href="/carros-a-venda" className="cb-btn cb-btn-dark cb-btn-arrow">
                  Explorar carros
                  <ArrowRight size={18} />
                </Link>
                <Link href="/anunciar-carro" className="cb-btn cb-btn-ghost cb-btn-arrow">
                  <Plus size={18} />
                  Anunciar grátis
                </Link>
              </div>
            </div>
            <div className="cb-cta-big">
              <strong>4.9</strong>
              <span>avaliação média dos usuários</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
