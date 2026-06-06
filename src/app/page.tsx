import type { Metadata } from 'next'
import { Fragment } from 'react'
import Link from 'next/link'
import FAQSection from '@/components/layout/FAQSection'
import MarketplaceListingImage from '@/components/marketplace/MarketplaceListingImage'
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
  { key: '50k', label: 'Entrada acessível', price: 'Até R$ 50.000', max: 50000, className: 'ref-band-c1' },
  { key: '100k', label: 'Custo-benefício', price: 'Até R$ 100.000', max: 100000, className: 'ref-band-c2' },
  { key: '200k', label: 'Intermediário', price: 'Até R$ 200.000', max: 200000, className: 'ref-band-c3' },
  { key: '500k', label: 'Premium', price: 'Até R$ 500.000', max: 500000, className: 'ref-band-c4' },
  { key: '1m', label: 'Alto luxo', price: 'Até R$ 1.000.000', max: 1000000, className: 'ref-band-c5' },
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

function QrMock() {
  const cells = [
    [10,10,30,30],[60,10,30,30],[10,60,30,30],[44,10,6,6],[52,10,6,6],[44,18,6,6],[44,26,6,6],[52,26,6,6],
    [44,44,6,6],[52,44,6,6],[60,44,6,6],[68,44,6,6],[44,52,6,6],[60,52,6,6],[68,52,6,6],[76,52,6,6],
    [44,60,6,6],[52,60,6,6],[76,60,6,6],[60,68,6,6],[68,68,6,6],[44,76,6,6],[60,76,6,6],[76,76,6,6],
  ]
  return (
    <svg className="ref-qr-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {cells.map(([x, y, w, h], i) => (
        <rect key={`${x}-${y}-${i}`} x={x} y={y} width={w} height={h} rx={w > 10 ? 3 : 1} fill="#1e2330" />
      ))}
      {[10, 60, 10].map((x, i) => {
        const y = i === 2 ? 60 : 10
        return (
          <g key={`${x}-${y}`}>
            <rect x={x + 4} y={y + 4} width="22" height="22" rx="2" fill="#fbfbf9" />
            <rect x={x + 8} y={y + 8} width="14" height="14" rx="1" fill="#1e2330" />
          </g>
        )
      })}
    </svg>
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
            <form className="ref-search-bar" action="/carros-a-venda">
              <input name="q" type="text" placeholder="Busque por marca, modelo ou cidade…" />
              <button type="submit">Buscar</button>
            </form>
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

      <section className="ref-sec-price-bands">
        <div className="ref-container">
          <div className="ref-price-bands-header">
            <div>
              <div className="ref-sec-label">Explorar por orçamento</div>
              <h2>Encontre pelo<br />seu orçamento</h2>
            </div>
            <Link href="/carros-a-venda" className="ref-btn ref-btn-ghost">Ver todos os anúncios</Link>
          </div>
          <div className="ref-bands-grid">
            {priceBands.map((band) => {
              const count = listings.filter((listing) => Number(listing.price) <= band.max).length
              return (
                <Link href={`/carros-a-venda?priceMax=${band.max}`} key={band.key} className={`ref-band-card ${band.className}`}>
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
            {priceBands.map((band) => <Link key={`tab-${band.key}`} className="ref-price-tab" href={`/carros-a-venda?priceMax=${band.max}`}>{band.price}</Link>)}
          </div>
          <div className="ref-cars-grid">
            {shownListings.map((listing, index) => <ListingReferenceCard key={listing.id} listing={listing} index={index} />)}
          </div>
        </div>
      </section>

      <section className="ref-sec-hydrangea ref-pad">
        <div className="ref-container ref-flex-h">
          <div className="ref-img-half">
            <div className="ref-dashboard-mock">
              <div className="ref-analytics-title">// painel do anúncio</div>
              <div className="ref-dash-bar-row">
                {dashData.map((height, index) => <div key={index} style={{ flex: 1, height: `${height}%`, borderRadius: '4px 4px 0 0', background: index === 5 ? 'var(--lavender)' : 'rgba(201,184,255,.3)' }} />)}
              </div>
              <div className="ref-dash-stat-row">
                <div className="ref-dash-stat"><div className="val">{listings.length}</div><div className="lbl">anúncios</div></div>
                <div className="ref-dash-stat"><div className="val">{brandStats.length}</div><div className="lbl">marcas</div></div>
                <div className="ref-dash-stat"><div className="val">FIPE</div><div className="lbl">integrada</div></div>
              </div>
            </div>
          </div>
          <div className="ref-content-half">
            <div className="ref-sec-label" style={{ color: 'rgba(255,255,255,.5)' }}>Anunciar</div>
            <h2 className="ref-section-h2">Crie seu anúncio com cara de produto premium</h2>
            <p className="ref-section-p">Fotos, dados técnicos, preço e comparação com FIPE organizados em uma apresentação limpa. Pronta para converter em minutos.</p>
            <div className="ref-features-list">
              <div className="ref-feature-item"><h3>Upload múltiplo de fotos</h3><p>Ordenação automática e galeria responsiva para todos os dispositivos.</p></div>
              <div className="ref-feature-item"><h3>FIPE integrado automaticamente</h3><p>Preço de tabela aparece ao lado do seu preço pedido. Transparência total.</p></div>
              <div className="ref-feature-item"><h3>Chat interno com compradores</h3><p>Conecte-se diretamente sem expor seu contato. Histórico salvo na plataforma.</p></div>
            </div>
            <div style={{ marginTop: 32 }}><Link href="/anunciar-carro" className="ref-btn ref-btn-chartreuse ref-btn-wide">Começar anúncio grátis</Link></div>
          </div>
        </div>
      </section>

      <section className="ref-sec-red ref-pad">
        <div className="ref-container ref-flex-h reverse">
          <div className="ref-content-half">
            <div className="ref-sec-label" style={{ color: 'rgba(255,255,255,.5)' }}>Alcançar</div>
            <h2 className="ref-section-h2" style={{ color: 'var(--chartreuse)' }}>Compartilhe seu anúncio em qualquer lugar</h2>
            <p className="ref-section-p">Link único para seu anúncio. QR code para impressão ou compartilhamento no WhatsApp em um toque.</p>
            <div className="ref-ctas-row">
              <Link href="/anunciar-carro" className="ref-cta-link">Link único para cada anúncio <span>→</span></Link>
              <Link href="/carros-a-venda" className="ref-cta-link">QR code em alta resolução <span>→</span></Link>
              <Link href="/entrar" className="ref-cta-link">Compartilhe direto pelo WhatsApp <span>→</span></Link>
            </div>
            <div style={{ marginTop: 32 }}><Link href="/anunciar-carro" className="ref-btn ref-btn-chartreuse ref-btn-wide">Criar meu anúncio</Link></div>
          </div>
          <div className="ref-img-half">
            <div className="ref-share-mock">
              <div className="ref-share-url-row"><span className="ref-url-dot" />carbi.com.br/seu-carro</div>
              <div className="ref-qr-block"><QrMock /></div>
              <div className="ref-share-channels"><span className="ref-share-ch ref-ch-wpp">WhatsApp</span><span className="ref-share-ch ref-ch-ig">Instagram</span><span className="ref-share-ch ref-ch-qr">QR Code</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="ref-sec-lightgreen ref-pad">
        <div className="ref-container ref-flex-h">
          <div className="ref-img-half">
            <div className="ref-analytics-mock">
              <div className="ref-analytics-title">Desempenho do anúncio</div>
              <div className="ref-chart-bars">{barsData.map((height, index) => <div className={`ref-bar ${index === 7 ? 'active' : ''}`} style={{ height: `${height}%` }} key={index} />)}</div>
              <div className="ref-stats-row">
                <div className="ref-stat-item"><div className="val">{listings.length}</div><div className="lbl">anúncios</div></div>
                <div className="ref-stat-item"><div className="val">{brandStats.length}</div><div className="lbl">marcas</div></div>
                <div className="ref-stat-item"><div className="val">FIPE</div><div className="lbl">referência</div></div>
              </div>
              <div className="ref-fipe-alert"><div className="ref-fipe-alert-dot" /><div><div className="ref-fipe-alert-title">Comparativo FIPE automático</div><div className="ref-fipe-alert-sub">Preço e referência conectados aos anúncios ativos</div></div></div>
            </div>
          </div>
          <div className="ref-content-half">
            <div className="ref-sec-label">Inteligência</div>
            <h2 className="ref-section-h2">Dados para decidir com confiança</h2>
            <p className="ref-section-p">Acompanhe visualizações, contatos e compare seu preço com a FIPE em tempo real. Descubra oportunidades sem esforço.</p>
            <div className="ref-features-list">
              <div className="ref-feature-item" style={{ background: 'rgba(0,0,0,.04)', borderColor: 'rgba(0,0,0,.07)' }}><h3 style={{ color: 'var(--ink)' }}>Analytics em tempo real</h3><p style={{ color: '#666' }}>Visualizações, interações e taxa de conversão do seu anúncio em um painel simples.</p></div>
              <div className="ref-feature-item" style={{ background: 'rgba(0,0,0,.04)', borderColor: 'rgba(0,0,0,.07)' }}><h3 style={{ color: 'var(--ink)' }}>Comparativo FIPE automático</h3><p style={{ color: '#666' }}>Preço de tabela atualizado mensalmente. Saiba se seu carro está bem precificado.</p></div>
            </div>
            <div style={{ marginTop: 32 }}><Link href="/carros/mais-baratos" className="ref-btn ref-btn-forest ref-btn-wide">Ver oportunidades</Link></div>
          </div>
        </div>
      </section>

      <section className="ref-sec-marble ref-pad">
        <div className="ref-container">
          <div className="ref-trusted-heading"><h2>O único marketplace de seminovos<br />para <em style={{ fontStyle: 'normal', color: 'var(--iris)' }}>quem entende</em></h2></div>
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

      <section className="ref-sec-marble" style={{ padding: '0 40px 80px' }}>
        <div className="ref-container"><div className="ref-cards-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
            <Link href="/anunciar-carro" className="ref-card-block ref-card-lavender" style={{ minWidth: 'unset', width: '100%', gap: 40 }}><div className="ref-card-img-area"><CarSilhouette /></div><h3>Compartilhe tudo em um só link. Acesse de qualquer plataforma.</h3></Link>
            <Link href="/carros-a-venda" className="ref-card-block ref-card-lime" style={{ minWidth: 'unset', width: '100%', gap: 40 }}><div className="ref-card-img-area"><CarSilhouette /></div><h3>Venda, receba pagamentos e monetize seu inventário.</h3></Link>
          </div>
          <Link href="/carros-a-venda" className="ref-card-block ref-card-iris" style={{ flex: 1.2, gap: 40 }}><div className="ref-card-img-area" style={{ height: 240 }}><CarSilhouette dark /></div><h3>Cresça, alcance e engaje compradores em todos os canais.</h3></Link>
        </div></div>
      </section>

      <section className="ref-sec-marble" style={{ padding: '80px 40px' }}>
        <div className="ref-container">
          <div style={{ textAlign: 'center', marginBottom: 60 }}><div className="ref-sec-label" style={{ justifyContent: 'center' }}>Planos</div><h2 style={{ fontSize: 'clamp(32px,3.5vw,52px)', fontWeight: 700, letterSpacing: '-1.5px' }}>Rápido, amigável e poderoso.<br />Escolha seu plano.</h2><p style={{ fontSize: 17, color: '#666', marginTop: 12 }}>Comece grátis. Escale quando precisar.</p></div>
          <div className="ref-plans-grid">
            <div className="ref-plan-card"><div className="ref-plan-name">Gratuito</div><div className="ref-plan-price">R$ 0 <sub>/mês</sub></div><div className="ref-plan-desc">Para quem quer anunciar sem complicação.</div><ul className="ref-plan-features"><li>1 anúncio ativo</li><li>Fotos e dados básicos</li><li>Comparativo FIPE</li><li>Chat com compradores</li></ul><Link href="/anunciar-carro" className="ref-btn ref-btn-forest" style={{ width: '100%', justifyContent: 'center' }}>Começar grátis</Link></div>
            <div className="ref-plan-card featured"><div className="ref-plan-badge">Mais popular</div><div className="ref-plan-name">Pro</div><div className="ref-plan-price">R$ 29 <sub>/mês</sub></div><div className="ref-plan-desc">Para quem vende com frequência ou quer mais destaque.</div><ul className="ref-plan-features"><li>5 anúncios simultâneos</li><li>Destaque nos resultados</li><li>Analytics completo</li><li>QR code de alta resolução</li><li>Selo de vendedor verificado</li></ul><Link href="/anunciar-carro" className="ref-btn ref-btn-chartreuse ref-btn-wide" style={{ width: '100%', justifyContent: 'center' }}>Assinar Pro</Link></div>
            <div className="ref-plan-card"><div className="ref-plan-name">Revendedor</div><div className="ref-plan-price">R$ 89 <sub>/mês</sub></div><div className="ref-plan-desc">Para lojas, revendedoras e corretores.</div><ul className="ref-plan-features"><li>Anúncios ilimitados</li><li>Painel multi-usuário</li><li>API de integração</li><li>Suporte prioritário</li><li>Vitrine de loja própria</li></ul><Link href="/anunciar-carro" className="ref-btn ref-btn-iris" style={{ width: '100%', justifyContent: 'center', color: '#fff' }}>Falar com vendas</Link></div>
          </div>
        </div>
      </section>

      <section className="ref-sec-marble" style={{ padding: '0 40px 80px' }}>
        <div className="ref-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}><div><div className="ref-sec-label">Marcas</div><h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-1.5px', marginBottom: 4 }}>Comece pela marca</h2><p style={{ color: '#888', fontSize: 15 }}>Clique para ver todos os anúncios disponíveis</p></div><Link href="/marcas" className="ref-btn ref-btn-ghost">Ver todas as marcas</Link></div>
          <div className="ref-brands-grid">{brandStats.map(({ brand, count }) => <Link key={brand} href={`/carros-a-venda?brand=${encodeURIComponent(brand)}`} className="ref-brand-item"><div className="ref-brand-logo">{brandInitials(brand)}</div><span className="ref-brand-name">{brand}</span><span className="ref-brand-count">{count} anúncio{count === 1 ? '' : 's'}</span></Link>)}</div>
        </div>
      </section>

      <section className="ref-sec-marble" style={{ padding: '0 40px 100px' }}>
        <div className="ref-container"><div style={{ textAlign: 'center', marginBottom: 56 }}><div className="ref-sec-label" style={{ justifyContent: 'center' }}>Histórias reais</div><h2 style={{ fontSize: 'clamp(32px,3.5vw,48px)', fontWeight: 700, letterSpacing: '-1.5px' }}>De quem usa o Carbi</h2></div><div className="ref-testimonials-grid">
          <div className="ref-testimonial-card ref-tc-lavender"><div className="ref-testimonial-bar" /><div className="ref-testimonial-body"><div className="ref-testimonial-quote">“A Carbi deixa a busca por seminovo simples. Entendi preço, FIPE e contato sem ficar pulando de tela.”</div><div className="ref-testimonial-author"><div className="name">Compra com contexto</div><div className="role">Dados reais do marketplace</div></div></div></div>
          <div className="ref-testimonial-card ref-tc-chartreuse"><div className="ref-testimonial-bar" /><div className="ref-testimonial-body"><div className="ref-testimonial-quote">“Publiquei o carro com fotos e dados em poucos minutos. O anúncio ficou mais profissional que em classificados tradicionais.”</div><div className="ref-testimonial-author"><div className="name">Anúncio grátis</div><div className="role">Fluxo conectado ao banco</div></div></div></div>
          <div className="ref-testimonial-card ref-tc-coral"><div className="ref-testimonial-bar" /><div className="ref-testimonial-body"><div className="ref-testimonial-quote">“O visual é limpo e rápido. Parece produto global, mas resolve um problema brasileiro: escolher carro com confiança.”</div><div className="ref-testimonial-author"><div className="name">Chat interno</div><div className="role">Contato protegido na plataforma</div></div></div></div>
        </div></div>
      </section>

      <FAQSection />

      <section className="ref-sec-footer-cta">
        <h2>Comece seu próximo<br />capítulo sobre rodas hoje.</h2>
        <p>Busque, compare e anuncie. Tudo em um só lugar.</p>
        <form className="ref-footer-cta-search" action="/carros-a-venda"><input name="q" type="text" placeholder="Busque marca, modelo ou cidade…" /><button type="submit">Buscar</button></form>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}><Link href="/anunciar-carro" className="ref-btn ref-btn-forest ref-btn-wide">Anunciar grátis</Link><Link href="/qual-carro" className="ref-btn ref-btn-ghost ref-btn-wide">Descobrir meu carro ideal</Link></div>
      </section>
    </div>
  )
}
