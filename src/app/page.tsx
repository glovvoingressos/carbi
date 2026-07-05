import type { Metadata } from 'next'
import { Fragment } from 'react'
import Link from 'next/link'
import { BadgeDollarSign, Megaphone, Share2 } from 'lucide-react'
import FAQSection from '@/components/layout/FAQSection'
import MarketplaceListingImage from '@/components/marketplace/MarketplaceListingImage'
import ScrollReveal from '@/components/animations/ScrollReveal'
import SearchBar from '@/components/animations/SearchBar'
import { getLatestPublicListings } from '@/lib/marketplace-server'
import { formatBRL } from '@/data/cars'

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

const priceBands = [
  { key: '50k', label: 'Entrada', price: 'Até R$ 50k', max: 50000, className: 'ref-band-c1' },
  { key: '100k', label: 'Custo-benefício', price: 'Até R$ 100k', max: 100000, className: 'ref-band-c2' },
  { key: '200k', label: 'Intermediário', price: 'Até R$ 200k', max: 200000, className: 'ref-band-c3' },
  { key: '500k', label: 'Premium', price: 'Até R$ 500k', max: 500000, className: 'ref-band-c4' },
]

const audienceTop = ['compradores', 'vendedores', 'amantes de SUV', 'motoristas de app', 'colecionadores', 'entusiastas', 'elétricos']
const audienceBottom = ['primeiro carro', 'famílias', 'abaixo da FIPE', 'baixo km', 'automáticos', 'hatchs', 'sedãs']
const barsData = [35, 55, 28, 70, 85, 50, 75, 92, 60, 68, 80, 38]
const dashData = [40, 65, 30, 80, 55, 90, 70, 45, 85, 60]

function brandInitials(brand: string) {
  return brand
    .split(/\s|-/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function fipeLabel(listing: Listing) {
  if (typeof listing.fipe_difference_percent !== 'number') return null
  if (listing.fipe_difference_percent <= -3) return `${Math.abs(Math.round(listing.fipe_difference_percent))}% FIPE`
  if (Math.abs(listing.fipe_difference_percent) <= 3) return 'Na FIPE'
  return null
}

function carGradient(index: number) {
  const gradients = [
    'linear-gradient(145deg,#eef2fb,#d8e4f8)',
    'linear-gradient(145deg,#f0f5e8,#daeec8)',
    'linear-gradient(145deg,#f2eefe,#ddd4fa)',
    'linear-gradient(145deg,#e8f8f2,#c4eede)',
    'linear-gradient(145deg,#fef3ee,#fad8c8)',
    'linear-gradient(145deg,#f8f4e8,#ecdcb0)',
    'linear-gradient(145deg,#f4f4f4,#e2e2e2)',
    'linear-gradient(145deg,#1e2330,#2d3548)',
  ]
  return gradients[index % gradients.length]
}

function CarSilhouette({ dark = false }: { dark?: boolean }) {
  return (
    <svg viewBox="0 0 140 65" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 42 C12 42 28 20 50 18 L70 16 L90 18 C112 20 128 42 128 42 L134 42 L134 50 L6 50 L6 42 Z" fill={dark ? '#4a5068' : '#aab8d8'} />
      <circle cx="33" cy="51" r="10" fill={dark ? '#3a4058' : '#8898b8'} />
      <circle cx="33" cy="51" r="5" fill={dark ? '#c8f45a' : '#eef2fb'} />
      <circle cx="107" cy="51" r="10" fill={dark ? '#3a4058' : '#8898b8'} />
      <circle cx="107" cy="51" r="5" fill={dark ? '#c8f45a' : '#eef2fb'} />
      <path d="M46 18 L62 28 L80 28 L94 18 Z" fill={dark ? 'rgba(200,244,90,.3)' : '#c8d8ff'} fillOpacity=".7" />
    </svg>
  )
}

function AdMock() {
  return (
    <div className="ref-ad-mock">
      <div className="ref-ad-header">
        <span className="ref-ad-status" />
        <span>Campanha ativa</span>
      </div>
      <div className="ref-ad-preview">
        <div className="ref-ad-card">
          <div className="ref-ad-card-img">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="18" width="40" height="16" rx="4" fill="#d1d5db"/>
              <path d="M10 18l4-8h20l4 8" fill="#9ca3af"/>
              <circle cx="14" cy="34" r="4" fill="#6b7280"/>
              <circle cx="34" cy="34" r="4" fill="#6b7280"/>
              <circle cx="14" cy="34" r="2" fill="#d1d5db"/>
              <circle cx="34" cy="34" r="2" fill="#d1d5db"/>
              <rect x="8" y="22" width="8" height="5" rx="1" fill="#93c5fd"/>
              <rect x="32" y="22" width="8" height="5" rx="1" fill="#fca5a5"/>
            </svg>
          </div>
          <div className="ref-ad-card-text">
            <div className="ref-ad-card-title">Honda HR-V EXL 2021</div>
            <div className="ref-ad-card-price">R$ 115.000</div>
            <div className="ref-ad-card-sub">via Carbi · Anúncio verificado</div>
          </div>
        </div>
      </div>
      <div className="ref-ad-platforms">
        <span className="ref-ad-platform ref-ad-google">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Google Ads
        </span>
        <span className="ref-ad-platform ref-ad-meta">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0022 12.06C22 6.53 17.5 2.04 12 2.04Z"/></svg>
          Meta Ads
        </span>
      </div>
      <div className="ref-ad-stats">
        <div className="ref-ad-stat"><span className="ref-ad-stat-val">~5mil</span><span className="ref-ad-stat-lbl">impressões/mês</span></div>
        <div className="ref-ad-stat"><span className="ref-ad-stat-val">200+</span><span className="ref-ad-stat-lbl">cliques/mês</span></div>
      </div>
    </div>
  )
}

function ListingReferenceCard({ listing, index }: { listing: Listing; index: number }) {
  const label = fipeLabel(listing)
  const below = typeof listing.fipe_difference_percent === 'number' && listing.fipe_difference_percent <= -3
  const title = listing.title || `${listing.brand} ${listing.model}`
  const imageUrls = listing.images?.map((image) => image.url) || []

  return (
    <Link href={`/anuncios/${listing.slug}`} className="ref-car-card" data-price={Math.round(Number(listing.price))}>
      <div className="ref-car-card-img" style={{ background: carGradient(index) }}>
        <MarketplaceListingImage
          brand={listing.brand}
          model={listing.model}
          year={listing.year_model}
          imageUrls={imageUrls}
          alt={title}
          className="h-full w-full object-cover"
          priority={index < 4}
        />
        {listing.badges?.some((badge) => badge.key === 'new') && <div className="ref-tag ref-tag-new">Novo</div>}
        {label && <div className={`ref-tag ${below ? 'ref-tag-fipe' : 'ref-tag-fipe-ok'}`}>{below ? `-${label}` : label}</div>}
      </div>
      <div className="ref-car-card-body">
        <div className="ref-car-make">{listing.brand}</div>
        <h4>{title.replace(`${listing.brand} `, '')}</h4>
        <div className="ref-car-price">{formatBRL(Number(listing.price))}</div>
        <div className="ref-car-fipe">{listing.fipe_price ? `FIPE ${formatBRL(Number(listing.fipe_price))}` : 'FIPE sob consulta'}</div>
        <div className="ref-car-specs">
          <span>{listing.year_model}</span>
          <span>{listing.mileage.toLocaleString('pt-BR')} km</span>
          <span>{listing.city}/{listing.state}</span>
        </div>
      </div>
    </Link>
  )
}

export default async function HomePage() {
  const listings = await getLatestPublicListings(16)
  const heroListings = listings.slice(0, 2)
  const shownListings = listings.slice(0, 8)
  const brandStats = [...new Set(listings.map((listing) => listing.brand))].slice(0, 12).map((brand) => ({
    brand,
    count: listings.filter((listing) => listing.brand === brand).length,
  }))

  return (
    <div style={{ background: 'var(--white)' }}>
      <section className="ref-hero">
        <div className="ref-hero-bg-text">carbi</div>
        <div className="ref-hero-container">
          <div className="ref-hero-text">
            <div className="ref-hero-badge"><span className="ref-dot" /> Ao vivo agora · {listings.length.toLocaleString('pt-BR')} anúncios</div>
            <h1>Seu próximo carro<br />{' '}<em>em um só lugar.</em></h1>
            <p>Compre, compare e anuncie seminovos com preço, FIPE e dados reais. Rápido, amigável e feito para o Brasil.</p>
            <SearchBar />
            <div className="ref-hero-ctas">
              <Link href="/anunciar-carro" className="ref-btn ref-btn-chartreuse ref-btn-wide">Anunciar grátis</Link>
              <Link href="/carros-a-venda" className="ref-btn ref-btn-wide" style={{ color: '#fff', border: '1.5px solid rgba(255,255,255,.25)', background: 'transparent' }}>Explorar ofertas</Link>
            </div>
          </div>
          <div className="ref-hero-right">
            <div className="ref-mini-stack">
              <div className="ref-live-tag"><span className="ref-dot" /> Adicionados agora</div>
              {heroListings.map((listing, index) => (
                <Link href={`/anuncios/${listing.slug}`} className="ref-car-card-mini" key={listing.id}>
                  <div className="ref-car-img-mini">
                    <MarketplaceListingImage
                      brand={listing.brand}
                      model={listing.model}
                      year={listing.year_model}
                      imageUrls={listing.images?.map((image) => image.url) || []}
                      alt={`${listing.brand} ${listing.model}`}
                      className="h-full w-full object-cover"
                      priority={index < 2}
                    />
                  </div>
                  <h4>{listing.brand} {listing.model}</h4>
                  <div className="price">{formatBRL(Number(listing.price))}</div>
                  <div className="meta">{listing.year_model} · {listing.mileage.toLocaleString('pt-BR')} km · {listing.city}/{listing.state}</div>
                  <div className="ref-fipe-tag">{listing.fipe_price ? `FIPE ${formatBRL(Number(listing.fipe_price))}` : 'FIPE sob consulta'}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ScrollReveal>
        <section className="ref-sec-price-bands">
          <div className="ref-container">
            <div className="ref-price-bands-header">
              <div>
                <div className="ref-sec-label">Explorar por orçamento</div>
                <h2>Encontre pelo<br />seu orçamento</h2>
              </div>
              <Link href="/carros-a-venda" className="ref-btn ref-btn-ghost">Ver todos os anúncios</Link>
            </div>
            <div className="ref-bands-grid ref-stagger">
              {priceBands.map((band) => {
                const count = listings.filter((listing) => Number(listing.price) <= band.max).length
                return (
                  <Link href={`/carros-a-venda?price_max=${band.max}`} key={band.key} className={`ref-band-card ${band.className}`}>
                    <div>
                      <div className="ref-band-label">{band.label}</div>
                      <div className="ref-band-price">{band.price}</div>
                    </div>
                    <div className="ref-band-count">{count} anúncio{count === 1 ? '' : 's'}</div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <section className="ref-sec-recentes">
        <div className="ref-container">
          <div className="ref-recentes-header">
            <div>
              <div className="ref-sec-label">Últimos anunciados</div>
              <h2>Recém adicionados</h2>
            </div>
            <Link href="/carros-a-venda" className="ref-btn ref-btn-forest">Ver todos</Link>
          </div>
          <div className="ref-price-tabs">
            <Link className="ref-price-tab active" href="/carros-a-venda">Todos</Link>
            {priceBands.map((band) => <Link key={`tab-${band.key}`} className="ref-price-tab" href={`/carros-a-venda?price_max=${band.max}`}>{band.price}</Link>)}
          </div>
          <div className="ref-cars-grid">
            {shownListings.map((listing, index) => <ListingReferenceCard key={listing.id} listing={listing} index={index} />)}
          </div>
        </div>
      </section>

      <ScrollReveal>
        <section className="ref-sec-marble ref-pad">
          <div className="ref-container">
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div className="ref-sec-label" style={{ justifyContent: 'center' }}>Como funciona</div>
              <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 700, letterSpacing: '-1.5px' }}>Tudo que você precisa para anunciar</h2>
              <p style={{ fontSize: 17, color: '#666', marginTop: 12, maxWidth: 560, margin: '12px auto 0' }}>Fotos, FIPE, tráfego e chat — reunidos em uma plataforma que converte.</p>
            </div>
            <div className="ref-cards-grid ref-cards-grid-balanced ref-stagger">
              <Link href="/anunciar-carro" className="ref-card-block ref-card-lavender ref-card-icon-only" style={{ minWidth: 'unset', width: '100%' }}>
                <div className="ref-card-icon-badge"><Share2 aria-hidden="true" /></div>
                <h3>Anúncio profissional</h3>
                <p style={{ fontSize: 15, color: 'rgba(30,35,48,.7)', lineHeight: 1.5 }}>Fotos, dados técnicos e FIPE integrados. Pronto para converter em minutos.</p>
              </Link>
              <div className="ref-cards-stack">
                <Link href="/anunciar-carro" className="ref-card-block ref-card-forest ref-card-icon-only" style={{ minWidth: 'unset', width: '100%' }}>
                  <div className="ref-card-icon-badge" style={{ background: 'var(--chartreuse)', color: 'var(--ink)' }}><Megaphone aria-hidden="true" /></div>
                  <h3>Tráfego pago grátis</h3>
                  <p style={{ fontSize: 15, color: 'rgba(255,255,255,.7)', lineHeight: 1.5 }}>Divulgação no Google e Meta Ads sem custo durante o lançamento.</p>
                </Link>
                <Link href="/carros-a-venda" className="ref-card-block ref-card-iris ref-card-icon-only" style={{ minWidth: 'unset', width: '100%' }}>
                  <div className="ref-card-icon-badge" style={{ background: 'var(--chartreuse)', color: 'var(--ink)' }}><BadgeDollarSign aria-hidden="true" /></div>
                  <h3>FIPE + analytics</h3>
                  <p style={{ fontSize: 15, color: 'rgba(255,255,255,.7)', lineHeight: 1.5 }}>Comparativo automático e painel de desempenho em tempo real.</p>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <section className="ref-sec-marble ref-pad">
        <div className="ref-container">
          <div className="ref-trusted-heading"><h2>O único marketplace de seminovos<br />para <em style={{ fontStyle: 'normal', color: 'var(--iris)' }}>quem ama carros</em>.</h2></div>
          <div className="ref-marquee-wrap">
            <div className="ref-marquee-track">
              {[...audienceTop, ...audienceTop].map((item, index) => (
                <Fragment key={`top-${item}-${index}`}>
                  <span className="ref-marquee-item">{item}</span>
                  <span className="ref-marquee-sep"> / </span>
                </Fragment>
              ))}
            </div>
          </div>
          <div className="ref-marquee-wrap" style={{ marginTop: 6 }}>
            <div className="ref-marquee-track rev">
              {[...audienceBottom, ...audienceBottom].map((item, index) => (
                <Fragment key={`bottom-${item}-${index}`}>
                  <span className="ref-marquee-item" style={{ color: 'var(--coral)' }}>{item}</span>
                  <span className="ref-marquee-sep" style={{ color: 'rgba(255,107,82,.35)' }}> / </span>
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="ref-sec-marble" style={{ padding: '80px 40px' }}>
        <div className="ref-container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="ref-launch-badge">Lançamento grátis por tempo limitado</div>
            <h2 style={{ fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 700, letterSpacing: '-1.5px', marginTop: 16 }}>Anuncie sem pagar nada agora.</h2>
            <p style={{ fontSize: 17, color: '#666', marginTop: 12, maxWidth: 480, margin: '12px auto 0' }}>Todos os recursos estão liberados. Depois, você escolhe se quer escalar.</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Link href="/anunciar-carro" className="ref-btn ref-btn-chartreuse ref-btn-wide" style={{ padding: '16px 40px', fontSize: 17 }}>Começar grátis</Link>
            <Link href="/carros-a-venda" className="ref-btn ref-btn-ghost ref-btn-wide" style={{ padding: '16px 40px', fontSize: 17 }}>Ver anúncios</Link>
          </div>
        </div>
      </section>

      <section className="ref-sec-marble" style={{ padding: '0 40px 80px' }}>
        <div className="ref-container">
          <div className="ref-brands-header">
            <div>
              <div className="ref-sec-label">Marcas</div>
              <h2>Comece pela marca</h2>
            </div>
            <Link href="/marcas" className="ref-btn ref-btn-ghost">Ver todas</Link>
          </div>
          <div className="ref-brands-grid">{brandStats.map(({ brand, count }) => <Link key={brand} href={`/carros-a-venda?brand=${encodeURIComponent(brand)}`} className="ref-brand-item"><div className="ref-brand-logo">{brandInitials(brand)}</div><span className="ref-brand-name">{brand}</span><span className="ref-brand-count">{count} anúncio{count === 1 ? '' : 's'}</span></Link>)}</div>
        </div>
      </section>

      <ScrollReveal>
        <section className="ref-sec-marble" style={{ padding: '0 40px 100px' }}>
          <div className="ref-container"><div style={{ textAlign: 'center', marginBottom: 56 }}><div className="ref-sec-label" style={{ justifyContent: 'center' }}>Quem usa, recomenda</div><h2 style={{ fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 700, letterSpacing: '-1.5px' }}>Direto de quem anuncia</h2></div><div className="ref-testimonials-grid ref-stagger">
            <div className="ref-testimonial-card ref-tc-lavender"><div className="ref-testimonial-bar" /><div className="ref-testimonial-body"><div className="ref-testimonial-quote">"Vendi meu HR-V em 12 dias. O comprador viu o anúncio pelo Google e veio direto pelo chat da plataforma."</div><div className="ref-testimonial-author"><div className="name">Marcos, São Paulo</div><div className="role">Vendeu um Honda HR-V 2021</div></div></div></div>
            <div className="ref-testimonial-card ref-tc-chartreuse"><div className="ref-testimonial-bar" /><div className="ref-testimonial-body"><div className="ref-testimonial-quote">"Comparei 8 Onix antes de decidir. A tabela FIPE junto do preço me deu confiança pra fechar negócio."</div><div className="ref-testimonial-author"><div className="name">Ana, Belo Horizonte</div><div className="role">Comprou um Chevrolet Onix 2022</div></div></div></div>
            <div className="ref-testimonial-card ref-tc-coral"><div className="ref-testimonial-bar" /><div className="ref-testimonial-body"><div className="ref-testimonial-quote">"Já tentei OLX e WebMotors. A Carbi é mais simples e o tráfego grátis fez a diferença nos contatos."</div><div className="ref-testimonial-author"><div className="name">Pedro, Rio de Janeiro</div><div className="role">Revendedor de seminovos</div></div></div></div>
          </div></div>
        </section>
      </ScrollReveal>

      <FAQSection />

      <section className="ref-sec-footer-cta">
        <h2>Pronto para anunciar?</h2>
        <p>Cadastre seu carro grátis e comece a receber contatos hoje.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 24 }}><Link href="/anunciar-carro" className="ref-btn ref-btn-chartreuse ref-btn-wide" style={{ padding: '16px 40px', fontSize: 17 }}>Anunciar grátis agora</Link></div>
      </section>
    </div>
  )
}
