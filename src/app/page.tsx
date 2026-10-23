import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight, ChevronRight, MessageCircle, Plus, ShieldCheck, TrendingUp, Zap,
} from 'lucide-react'
import { getLatestPublicListings, searchPublicListings } from '@/lib/marketplace-server'
import { cars } from '@/data/cars'
import ModelComparison from '@/components/home/ModelComparison'
import RankingsBanner from '@/components/home/RankingsBanner'
import HomeCounters from '@/components/home/HomeCounters'
import PlateBannerLookup from '@/components/marketplace/PlateBannerLookup'
import HomeListings from '@/components/home/HomeListings'
import HomeFeaturedListing, { type HomeFeaturedListingData } from '@/components/home/HomeFeaturedListing'
import HomeHero from '@/components/home/HomeHero'
import { heroFont } from '@/components/home/home-font'
import { slugifyBrand } from '@/lib/brand-utils'
import { canonicalModelSlug } from '@/lib/vehicle-slug'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Carbi | anunciar carros grátis, seminovos à venda e FIPE',
  description: 'Anuncie sem custo no plano gratuito, encontre seminovos à venda e consulte a FIPE quando ano e versão coincidirem.',
  keywords: ['anunciar carros grátis', 'seminovos à venda', 'carros à venda', 'anunciar carro', 'vender carro', 'comprar carro', 'tabela fipe'],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Carbi | anunciar carros grátis, seminovos à venda e FIPE',
    description: 'Anuncie sem custo no plano gratuito, encontre seminovos à venda e consulte a FIPE quando ano e versão coincidirem.',
    url: '/',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Carbi | anunciar carros grátis, seminovos à venda e FIPE',
    description: 'Anuncie sem custo no plano gratuito, encontre seminovos à venda e consulte a FIPE quando ano e versão coincidirem.',
  },
}

type Listing = Awaited<ReturnType<typeof getLatestPublicListings>>[number]

function isPeugeot2008Gt(listing: Listing) {
  const searchable = `${listing.brand} ${listing.model} ${listing.version ?? ''}`.toLowerCase()
  return searchable.includes('peugeot') && searchable.includes('2008') && /\bgt\b/.test(searchable)
}

function transmissionLabel(value: Listing['transmission']) {
  return Array.isArray(value) ? value.join(' / ') : value
}

export default async function HomePage() {
  let listings: Listing[] = []
  let featuredCandidates: Listing[] = []
  let fetchError = false

  const [latestResult, featuredResult] = await Promise.allSettled([
    getLatestPublicListings(),
    searchPublicListings('Peugeot 2008 GT'),
  ])

  if (latestResult.status === 'fulfilled') {
    listings = latestResult.value
  } else {
    fetchError = true
  }
  if (featuredResult.status === 'fulfilled') {
    featuredCandidates = featuredResult.value
  }

  const recentListings = listings
  const publishedPeugeot2008Gt = [...recentListings, ...featuredCandidates].find(isPeugeot2008Gt)
  const featuredListing: HomeFeaturedListingData | null = publishedPeugeot2008Gt
    ? {
        brand: publishedPeugeot2008Gt.brand,
        model: publishedPeugeot2008Gt.model,
        version: publishedPeugeot2008Gt.version,
        year: publishedPeugeot2008Gt.year_model || publishedPeugeot2008Gt.year,
        price: publishedPeugeot2008Gt.price,
        priceLabel: 'Preço anunciado',
        fuel: publishedPeugeot2008Gt.fuel,
        transmission: transmissionLabel(publishedPeugeot2008Gt.transmission),
        horsepower: publishedPeugeot2008Gt.horsepower,
        href: `/anuncios/${publishedPeugeot2008Gt.slug}`,
        imageUrls: publishedPeugeot2008Gt.images?.map((image) => image.url) ?? [],
        imageAlt: `${publishedPeugeot2008Gt.brand} ${publishedPeugeot2008Gt.model} ${publishedPeugeot2008Gt.year_model}`,
      }
    : null
  const topBrands = [...new Set(listings.map((l) => l.brand))].slice(0, 6)
  const cities = [...new Set(listings.map((l) => l.city))].filter(Boolean).slice(0, 6)

  const mapCar = (c: typeof cars[0]) => {
    return {
      brand: c.brand,
      model: c.model,
      version: c.version,
      segment: c.segment,
      engineType: c.engineType,
      horsepower: c.horsepower,
      fuelEconomyCityGas: c.fuelEconomyCityGas,
      airbagsCount: c.airbagsCount,
      slug: c.slug,
      image: c.image,
      idealFor: c.idealFor,
      modelPath: `/${slugifyBrand(c.brand)}/${canonicalModelSlug(c.model)}`,
    }
  }
  const comparisonCars = cars.filter((c) => c.isPopular).slice(0, 2).map(mapCar)
  const allComparisonCars = cars.map(mapCar)

  return (
    <div className="cb-page">
      {/* ═══ HERO ═══ */}
      <HomeHero
        listingCount={listings.length}
        cityCount={new Set(listings.map((l) => l.city).filter(Boolean)).size}
        brandCount={new Set(listings.map((l) => l.brand).filter(Boolean)).size}
      />

      <div className="cb-wrap">
        <HomeCounters cityCount={new Set(listings.map((listing) => listing.city.trim().toLocaleLowerCase('pt-BR')).filter(Boolean)).size} />
      </div>

      {/* ═══ PLATE LOOKUP ═══ */}
      <section id="pesquise-placa" className={`cb-section-pad cb-promo-before-listings ${heroFont.variable}`}>
        <div className="cb-wrap">
          <PlateBannerLookup />
        </div>
      </section>

      {/* ═══ FEATURED LISTING ═══ */}
      <HomeFeaturedListing listing={featuredListing} />

      {/* ═══ LISTINGS TABLE ═══ */}
      <section className={`cb-section-pad ${heroFont.variable}`}>
        <div className="cb-wrap">
          <div className="cb-head">
            <div>
              <h2>Os anúncios mais procurados desta semana</h2>
            </div>
            <Link href="/carros-a-venda" className="cb-head-link">
              Ver todos os carros
              <ChevronRight size={16} />
            </Link>
          </div>

          <HomeListings listings={recentListings} fetchError={fetchError} />
        </div>
      </section>

      {/* ═══ MODEL COMPARISON ═══ */}
      <section className={`hh-compare-section ${heroFont.variable}`}>
        <div className="hh-compare">
          <ModelComparison cars={comparisonCars} allCars={allComparisonCars} />
        </div>
      </section>

      {/* ═══ APP SHOWCASE ═══ */}
      <section id="home-showcase" className={`cb-section-pad cb-showcase ${heroFont.variable}`} aria-labelledby="home-showcase-title">
        <div className="cb-wrap cb-showcase-wrap">
          <h2 id="home-showcase-title" className="cb-showcase-title">
            Negocie pelo{' '}
            <span className="cb-showcase-pill">
              chat interno
              <span className="cb-showcase-pill-icon" aria-hidden="true">
                <MessageCircle size={18} />
              </span>
            </span>{' '}
            na Carbi.
          </h2>

          <div className="cb-showcase-stage">
            <div className="cb-showcase-note cb-showcase-note--left">
              <span className="cb-showcase-note-title">Sem intermediários</span>
              <span className="cb-showcase-note-text">Fale direto com o vendedor, do primeiro contato ao test drive.</span>
            </div>

            <div className="cb-showcase-phone">
              <Image
                src="/images/ChatGPT Image 31 de ago. de 2026, 22_12_52-2.png"
                alt="Conversa no chat interno da Carbi em um celular"
                width={1275}
                height={1234}
                sizes="(max-width: 900px) 78vw, 380px"
                loading="lazy"
              />
            </div>

            <div className="cb-showcase-note cb-showcase-note--right">
              <span className="cb-showcase-note-title">Sem expor seu telefone</span>
              <span className="cb-showcase-note-text">A conversa fica dentro da Carbi. Combine tudo com segurança.</span>
            </div>
          </div>

          <div className="cb-showcase-rail" aria-hidden="true">
            <span><MessageCircle size={16} /></span>
            <span><ShieldCheck size={16} /></span>
            <span><TrendingUp size={16} /></span>
          </div>
        </div>
      </section>

      {/* ═══ BUILD / SOLUTIONS ═══ */}
      <section className="cb-section-pad cb-build-section">
        <div className="cb-wrap">
          <div className="cb-build-grid">
            <Link href="/anunciar-carro" className="cb-build-card cb-build-card-dark cb-build-card-featured">
              <div className="cb-build-card-featured-visual">
                <img
                  src="/images/defender-octa-tasman-blue.jpg"
                  alt="Land Rover Defender Octa azul Tasman, imagem ilustrativa"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="cb-build-card-featured-content">
                <div>
                  <h3>Anuncie grátis em poucos passos</h3>
                  <p>Apresente seu carro com fotos atuais, dados do veículo e preço pedido.</p>
                </div>
                <span className="cb-build-cta">
                  Anunciar meu carro <ArrowRight size={16} />
                </span>
              </div>
            </Link>
            <Link href="/qual-carro" className="cb-build-card cb-build-card-lime cb-build-card-secondary">
              <div>
                <h3>Compare veículos e preços</h3>
                <p>Consulte a FIPE quando houver correspondência de ano e versão.</p>
              </div>
              <span className="cb-build-cta">
                Comparar agora <ArrowRight size={16} />
              </span>
            </Link>
            <Link href="/anunciar-carro" className="cb-build-card cb-build-card-light cb-build-card-secondary">
              <div>
                <h3>Anuncie sem custo</h3>
                <p>Mantenha até 5 anúncios ativos por conta e adicione até 10 fotos em cada anúncio.</p>
              </div>
              <span className="cb-build-cta">
                Começar anúncio <ArrowRight size={16} />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ RANKINGS BANNER ═══ */}
      <RankingsBanner />

      {/* ═══ BRAND MARQUEE ═══ */}
      {topBrands.length > 0 ? (
        <section className="cb-marquee" aria-label="Marcas disponíveis">
          <div className="cb-marquee-track">
            {[...topBrands, ...topBrands].map((brand, i) => {
              const isDuplicate = i >= topBrands.length
              return (
                <Link
                  key={`${brand}-${i}`}
                  href={`/carros-a-venda?brand=${encodeURIComponent(brand)}`}
                  className="cb-marquee-item"
                  aria-hidden={isDuplicate}
                  tabIndex={isDuplicate ? -1 : undefined}
                >
                  <Zap size={18} fill="currentColor" aria-hidden="true" />
                  {brand}
                </Link>
              )
            })}
          </div>
        </section>
      ) : null}

      {/* ═══ FINAL CTA ═══ */}
      <section className="cb-final-cta">
        <div className="cb-wrap">
          <div className="cb-cta-block">
            <div>
              <h2>Pronto para encontrar o carro certo?</h2>
              <p>
                Anuncie no plano gratuito, consulte a FIPE quando houver correspondência e converse pelo chat interno.
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
              <strong>FIPE</strong>
              <span>comparação transparente de preços</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
