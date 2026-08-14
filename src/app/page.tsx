import type { Metadata } from 'next'
import Link from 'next/link'
import { Search, TrendingUp, Plus, BarChart3, ChevronRight, ArrowRight, Heart, MapPin, Fuel, Gauge, Calendar, MessageCircle, Car, CheckCircle2, Star, Tag } from 'lucide-react'
import { getLatestPublicListings, getMonthlyViews } from '@/lib/marketplace-server'
import { formatBRL, cars } from '@/data/cars'
import MarketplaceListingImage from '@/components/marketplace/MarketplaceListingImage'
import { TextRotate } from '@/components/ui/text-rotate'
import KineticText from '@/components/ui/KineticText'
import AnimatedStats from '@/components/ui/AnimatedStats'
import AnimatedBarChart from '@/components/ui/AnimatedBarChart'
import ModelComparison from '@/components/home/ModelComparison'
import TestimonialsCarousel from '@/components/ui/TestimonialsCarousel'
import Logo from '@/components/ui/Logo'
import { GridPattern } from '@/components/ui/grid-pattern'
import { cn } from '@/lib/utils'
import { GlareCard } from '@/components/ui/glare-card'
import BrandLogo from '@/components/brand/BrandLogo'
import PlateBannerLookup from '@/components/marketplace/PlateBannerLookup'
import BuyerAgentBanner from '@/components/buyer/BuyerAgentBanner'

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

function brandInitials(brand: string) {
  return brand
    .split(/\s|-/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function fipePercent(listing: Listing) {
  if (typeof listing.fipe_difference_percent !== 'number') return null
  return Math.round(listing.fipe_difference_percent)
}

function CarCard({ listing, index }: { listing: Listing; index: number }) {
  const fipe = fipePercent(listing)
  const isBelowFipe = fipe !== null && fipe <= -3
  const imageUrls = listing.images?.map((img) => img.url) || []

  return (
    <GlareCard className="fingen-car-card" style={{ animationDelay: `${index * 0.1}s` }}>
      <Link
        href={`/anuncios/${listing.slug}`}
        className="fingen-car-card-link"
      >
        <div className="fingen-car-card-image">
          <MarketplaceListingImage
            brand={listing.brand}
            model={listing.model}
            year={listing.year_model}
            imageUrls={imageUrls}
            alt={`${listing.brand} ${listing.model} ${listing.year_model}`}
            className="h-full w-full object-cover"
            priority={index < 4}
          />
          {isBelowFipe && (
            <div className="fingen-car-card-badge">
              <TrendingUp size={10} />
              {Math.abs(fipe!)}% abaixo FIPE
            </div>
          )}
          <button className="fingen-car-card-fav" aria-label="Favoritar">
            <Heart size={16} />
          </button>
        </div>
        <div className="fingen-car-card-body">
          <div className="fingen-car-card-brand">{listing.brand}</div>
          <div className="fingen-car-card-title">
            {listing.model} {listing.year_model}
          </div>
          <div className="fingen-car-card-price">{formatBRL(Number(listing.price))}</div>
          <div className="fingen-car-card-specs">
            <span><Gauge size={12} /> {listing.mileage?.toLocaleString('pt-BR')} km</span>
            <span><Calendar size={12} /> {listing.year_model}</span>
            <span><MapPin size={12} /> {listing.city}</span>
          </div>
        </div>
      </Link>
    </GlareCard>
  )
}

export default async function HomePage() {
  let listings: Listing[] = []
  let fetchError = false

  try {
    listings = await getLatestPublicListings(16)
  } catch {
    fetchError = true
  }

  const recentListings = listings.slice(0, 8)
  const topBrands = [...new Set(listings.map((l) => l.brand))].slice(0, 6)

  // Comparison cars — pick popular models from catalog
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

  return (
    <div className="fingen-page">
      <main className="fingen-main">
        {/* Hero Section - Creative Agency Style */}
        <section className="hero-creative">
          {/* Grid Pattern Background */}
          <div className="hero-creative-grid-wrapper">
            <GridPattern
              width={30}
              height={30}
              x={-1}
              y={-1}
              squares={[
                [4, 4],
                [5, 1],
                [8, 2],
                [5, 3],
                [5, 5],
                [10, 10],
                [12, 15],
                [15, 10],
                [10, 15],
              ]}
              className={cn(
                "[mask-image:radial-gradient(80%_50%_at_center,white,transparent)]",
                "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12",
                "hero-creative-grid"
              )}
            />
          </div>

          {/* Subtitle */}
          <div className="hero-creative-eyebrow">Compre, compare e anuncie carros</div>

          {/* Main Title */}
          <h1 className="hero-creative-title">
            Encontre o carro{' '}
            <span className="hero-creative-highlight">
              <TextRotate
                texts={["perfeito", "ideal", "dos sonhos", "certo", "novo"]}
                mainClassName="hero-creative-highlight-text"
                staggerFrom="last"
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "-120%", opacity: 0 }}
                staggerDuration={0.025}
                splitLevelClassName="overflow-hidden pb-1"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                rotationInterval={3000}
              />
            </span>
          </h1>

          {/* Description */}
          <p className="hero-creative-desc">
            Seminovos com FIPE verificado, dados detalhados e as melhores ofertas do mercado.
          </p>

          {/* CTA */}
          <div className="hero-creative-cta">
            <Link href="/carros-a-venda" className="hero-creative-btn">
              <Search size={18} />
              <span>Explorar carros</span>
            </Link>
            <Link href="/anunciar-carro" className="hero-creative-btn hero-creative-btn-white">
              <Plus size={18} />
              <span>Anunciar grátis</span>
            </Link>
          </div>
        </section>

        {/* Free Promo Banner */}
        <section className="fingen-banner fingen-promo-banner">
          <div className="fingen-banner-content fingen-promo-content fingen-promo-column">
            <div className="fingen-promo-top">
              <div className="fingen-banner-text">
                <strong>Anuncie grátis por tempo limitado</strong>
                <span>Publique seu carro sem custo e alcance milhares de compradores.</span>
              </div>
              <Link href="/anunciar-carro/fluxo" className="fingen-banner-btn fingen-promo-btn">
                Começar agora
              </Link>
            </div>
            <PlateBannerLookup />
          </div>
        </section>

        {/* Recent Listings - Card Grid */}
        <section className="fingen-section">
          <div className="fingen-section-header">
            <div>
              <div className="fingen-section-label">Últimos anúncios</div>
              <h2 className="fingen-section-title">Adicionados recentemente</h2>
            </div>
            <Link href="/carros-a-venda" className="fingen-section-link">
              Ver todos <ChevronRight size={14} />
            </Link>
          </div>
          <div className="fingen-cars-grid">
            {recentListings.length > 0 ? (
              recentListings.map((listing, index) => (
                <CarCard key={listing.id} listing={listing} index={index} />
              ))
            ) : (
              <div className="fingen-empty">
                <p>{fetchError ? 'Carregando anúncios...' : 'Nenhum anúncio ainda'}</p>
              </div>
            )}
          </div>
        </section>

        {/* Buyer Agent - Procure Meu Carro */}
        <section className="fingen-section">
          <div className="mx-auto w-full max-w-6xl">
            <BuyerAgentBanner />
          </div>
        </section>

        {/* Free Traffic Banner */}
        <section className="fingen-banner">
          <div className="fingen-banner-content">
            <div className="fingen-banner-icon">
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor"/>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="fingen-banner-text">
              <strong>Tráfego pago grátis</strong>
              <span>Seus anúncios são divulgados no Google e Meta Ads sem custo</span>
            </div>
            <Link href="/trafego-pago-gratis" className="fingen-banner-btn">
              Saiba mais
            </Link>
          </div>
        </section>

        {/* Como Funciona - Steps */}
        <section className="fingen-section fingen-how-it-works">
          <div className="fingen-section-header">
            <div>
              <div className="fingen-section-label">Como funciona</div>
              <h2 className="fingen-section-title">Do jeito mais simples</h2>
            </div>
          </div>
          <div className="fingen-steps-grid">
            <div className="fingen-step-card">
              <div className="fingen-step-number">01</div>
              <div className="fingen-step-icon">
                <Search size={22} />
              </div>
              <h3>Busque o carro ideal</h3>
              <p>Filtre por marca, preço, ano e cidade. Compare com a FIPE e veja o histórico real do veículo.</p>
            </div>
            <div className="fingen-step-card">
              <div className="fingen-step-number">02</div>
              <div className="fingen-step-icon">
                <MessageCircle size={22} />
              </div>
              <h3>Fale direto com o vendedor</h3>
              <p>Chat interno, sem intermediários. Tire dúvidas, combine visita e negocie com segurança.</p>
            </div>
            <div className="fingen-step-card">
              <div className="fingen-step-number">03</div>
              <div className="fingen-step-icon">
                <CheckCircle2 size={22} />
              </div>
              <h3>Fechou o negócio</h3>
              <p>Dados verificados, preço justo, zero surpresas. O carro certo, no preço certo.</p>
            </div>
          </div>
        </section>

        {/* Categorias por Estilo */}
        <section className="fingen-section">
          <div className="fingen-section-header">
            <div>
              <div className="fingen-section-label">Explore por tipo</div>
              <h2 className="fingen-section-title">Encontre o estilo certo</h2>
            </div>
          </div>
          <div className="fingen-categories-scroll">
            {[
              { label: 'SUV', filter: 'SUV', img: '/categories/suv.jpg' },
              { label: 'Sedan', filter: 'Sedan', img: '/categories/sedan.jpg' },
              { label: 'Hatch', filter: 'Hatch', img: '/categories/hatch.jpg' },
              { label: 'Pickup', filter: 'Pickup', img: '/categories/pickup.jpg' },
              { label: 'Esportivo', filter: 'Esportivo', img: '/categories/esportivo.jpg' },
              { label: 'Elétrico', filter: 'Elétrico', img: '/categories/eletrico.jpg' },
            ].map((cat) => (
              <Link
                key={cat.label}
                href={`/carros-a-venda?body=${encodeURIComponent(cat.filter)}`}
                className="fingen-category-card"
              >
                <img src={cat.img} alt={cat.label} className="fingen-category-img" loading="lazy" />
                <span className="fingen-category-label">{cat.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Depoimentos */}
        <section className="fingen-section">
          <div className="fingen-section-header">
            <div>
              <div className="fingen-section-label">Depoimentos</div>
              <h2 className="fingen-section-title">Quem já comprou, recomenda</h2>
            </div>
          </div>
          <TestimonialsCarousel />
        </section>

        {/* Model Comparison */}
        <ModelComparison cars={comparisonCars} allCars={allComparisonCars} />

        {/* Brands */}
        <section className="fingen-section">
          <div className="fingen-section-header">
            <div>
              <div className="fingen-section-label">Marcas</div>
              <h2 className="fingen-section-title">Comece pela marca</h2>
            </div>
            <Link href="/marcas" className="fingen-section-link">
              Ver todas <ChevronRight size={14} />
            </Link>
          </div>
          <div className="fingen-brands-scroll">
            {topBrands.map((brand) => {
              const count = listings.filter((l) => l.brand === brand).length
              return (
                <Link
                  key={brand}
                  href={`/carros-a-venda?brand=${encodeURIComponent(brand)}`}
                  className="fingen-brand-chip"
                >
                  <div className="fingen-brand-logo-wrap">
                    <BrandLogo brandName={brand} domain={`${brand.toLowerCase().replace(/\s+/g, '')}.com.br`} className="w-full h-full object-contain" />
                  </div>
                  <div className="fingen-brand-info">
                    <div className="fingen-brand-name">{brand}</div>
                    <div className="fingen-brand-count">{count} anúncio{count === 1 ? '' : 's'}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Final CTA */}
        <section className="fingen-final-cta">
          <div className="fingen-final-cta-card">
            <div className="fingen-final-cta-icon">
              <Plus size={24} />
            </div>
            <h3>Pronto para anunciar?</h3>
            <p>Cadastre seu carro grátis e comece a receber contatos hoje.</p>
            <Link href="/anunciar-carro" className="fingen-final-cta-btn">
              Começar agora
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
