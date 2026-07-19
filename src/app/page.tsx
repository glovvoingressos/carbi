import type { Metadata } from 'next'
import Link from 'next/link'
import { Search, TrendingUp, Plus, BarChart3, ChevronRight, ArrowRight, Heart, MapPin, Fuel, Gauge, Calendar, MessageCircle, Car, CheckCircle2, Star } from 'lucide-react'
import { getLatestPublicListings } from '@/lib/marketplace-server'
import { formatBRL } from '@/data/cars'
import MarketplaceListingImage from '@/components/marketplace/MarketplaceListingImage'
import { TextRotate } from '@/components/ui/text-rotate'
import KineticText from '@/components/ui/KineticText'
import { GridPattern } from '@/components/ui/grid-pattern'
import { cn } from '@/lib/utils'
import { GlareCard } from '@/components/ui/glare-card'

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

  // Stats data
  const statsData = [
    { label: 'Jan', value: 30 },
    { label: 'Fev', value: 45 },
    { label: 'Mar', value: 25 },
    { label: 'Abr', value: 60 },
    { label: 'Mai', value: 40 },
    { label: 'Jun', value: 55 },
  ]
  const maxValue = Math.max(...statsData.map((s) => s.value))

  return (
    <div className="fingen-page">
      <main className="fingen-main">
        {/* Hero Section */}
        <section className="hero-collage">
          <div className="hero-collage-inner">
            {/* Left: Typography */}
            <div className="hero-collage-content">
              <h1 className="hero-collage-title">
                Encontre o carro
                <br />
                <KineticText
                  texts={["perfeito.", "ideal.", "dos sonhos.", "certo.", "novo."]}
                  interval={3000}
                  className="hero-collage-title-accent"
                />
              </h1>

              <p className="hero-collage-sub">
                Compre, compare e anuncie seminovos com dados reais da FIPE,
                chat interno seguro e tráfego pago grátis.
              </p>

              <Link href="/carros-a-venda" className="hero-collage-btn">
                Explorar anúncios
                <ArrowRight size={18} />
              </Link>
            </div>

            {/* Right: Collage Composition */}
            <div className="hero-collage-visual">
              {/* Curved line SVG */}
              <svg className="hero-collage-lines" viewBox="0 0 500 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M80 120 C200 80, 350 150, 420 100" stroke="#E0E0E0" strokeWidth="2" strokeDasharray="6 4" />
                <path d="M60 280 C180 320, 300 200, 450 260" stroke="#E0E0E0" strokeWidth="2" strokeDasharray="6 4" />
                <circle cx="80" cy="120" r="4" fill="#D4F576" />
                <circle cx="420" cy="100" r="4" fill="#D4F576" />
                <circle cx="450" cy="260" r="4" fill="#D4F576" />
              </svg>

              {/* Car image 1 */}
              <div className="hero-collage-item hero-collage-item-1">
                <img src="/categories/sedan.jpg" alt="Sedan" />
              </div>

              {/* Car image 2 */}
              <div className="hero-collage-item hero-collage-item-2">
                <img src="/categories/suv.jpg" alt="SUV" />
              </div>

              {/* Car image 3 */}
              <div className="hero-collage-item hero-collage-item-3">
                <img src="/categories/esportivo.jpg" alt="Esportivo" />
              </div>

              {/* Dark pill - Brand Insights */}
              <div className="hero-collage-pill">
                <div className="hero-collage-pill-dot" />
                <span>FIPE Verificado</span>
                <div className="hero-collage-pill-badge">See</div>
              </div>

              {/* Data card - Price */}
              <div className="hero-collage-data-card">
                <div className="hero-collage-data-label">Preço médio</div>
                <div className="hero-collage-data-value">R$ 67.5k</div>
                <div className="hero-collage-data-change positive">
                  <TrendingUp size={12} />
                  -8.2% vs FIPE
                </div>
              </div>

              {/* Chart card */}
              <div className="hero-collage-chart-card">
                <div className="hero-collage-chart-header">
                  <span className="hero-collage-chart-title">Tendência</span>
                  <span className="hero-collage-chart-badge">Q4</span>
                </div>
                <svg className="hero-collage-chart" viewBox="0 0 120 40" fill="none">
                  <path d="M0 35 Q20 30, 30 25 T60 20 T90 15 T120 8" stroke="#D4F576" strokeWidth="2" fill="none" />
                  <circle cx="120" cy="8" r="3" fill="#D4F576" />
                </svg>
                <div className="hero-collage-chart-value">1.2k</div>
                <div className="hero-collage-chart-label">anúncios este mês</div>
              </div>

              {/* Green dot accent */}
              <div className="hero-collage-dot-accent" />
            </div>
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
          <div className="fingen-testimonials-grid">
            <div className="fingen-testimonial-card">
              <div className="fingen-testimonial-stars">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <p>&ldquo;Comprei meu HB20 2023 12% abaixo da FIPE. Sem dor de cabeça, dados todos ali.&rdquo;</p>
              <div className="fingen-testimonial-author">
                <strong>Marcos S.</strong>
                <span>Belo Horizonte</span>
              </div>
            </div>
            <div className="fingen-testimonial-card">
              <div className="fingen-testimonial-stars">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <p>&ldquo;Anunciei meu Onix e vendi em 3 dias. O tráfego grátis fez toda a diferença.&rdquo;</p>
              <div className="fingen-testimonial-author">
                <strong>Ana Clara R.</strong>
                <span>Contagem</span>
              </div>
            </div>
            <div className="fingen-testimonial-card">
              <div className="fingen-testimonial-stars">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <p>&ldquo;A comparação com a FIPE me deu confiança pra fechar. Finalmente uma plataforma séria.&rdquo;</p>
              <div className="fingen-testimonial-author">
                <strong>Pedro H.</strong>
                <span>Uberlândia</span>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="fingen-stats">
          <div className="fingen-stats-header">
            <div className="fingen-stats-title">Estatísticas</div>
            <Link href="/rankings" className="fingen-stats-link">Ver rankings</Link>
          </div>
          <div className="fingen-stats-chart">
            {statsData.map((stat, i) => (
              <div key={stat.label} className="fingen-stats-col">
                <div
                  className="fingen-stats-bar"
                  style={{
                    height: `${(stat.value / maxValue) * 100}%`,
                    background: i === statsData.length - 1 ? 'var(--color-accent)' : 'rgba(255,255,255,0.15)',
                  }}
                />
                <div className="fingen-stats-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

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
                  <div className="fingen-brand-initial">{brandInitials(brand)}</div>
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
