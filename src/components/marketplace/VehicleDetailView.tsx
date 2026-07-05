'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  BadgeCheck,
  Calendar,
  Check,
  Copy,
  Fuel,
  HandCoins,
  Heart,
  MapPin,
  MessageCircle,
  Share2,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { ListingPublic } from '@/lib/marketplace'
import { formatBRL } from '@/data/cars'
import ListingImageGallery from './ListingImageGallery'
import ChatStarter from './ChatStarter'
import OfferModal from './OfferModal'
import OfferHistory from './OfferHistory'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import MarketplaceListingImage from './MarketplaceListingImage'

interface VehicleDetailViewProps {
  listing: ListingPublic
  sellerInfo: {
    id: string
    name: string | null
    avatarUrl: string | null
    memberSince: string
    activeListings: number
    totalListings: number
  } | null
  relatedListings: ListingPublic[]
  enrichment: any
  comparison: {
    status: 'below' | 'near' | 'above' | 'unknown'
    diffPercent: number | null
    diffValue?: number | null
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Data não informada'
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function initials(name: string | null | undefined) {
  const clean = (name || 'Particular').trim()
  const parts = clean.split(/\s+/).filter(Boolean)
  return `${parts[0]?.[0] || 'P'}${parts[1]?.[0] || ''}`.toUpperCase()
}

function getFipeLabel(status: VehicleDetailViewProps['comparison']['status']) {
  if (status === 'below') return 'Abaixo da FIPE'
  if (status === 'near') return 'Na média da FIPE'
  if (status === 'above') return 'Acima da FIPE'
  return 'FIPE indisponível'
}

export default function VehicleDetailView({
  listing,
  sellerInfo,
  relatedListings,
  enrichment,
  comparison,
}: VehicleDetailViewProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [pageUrl, setPageUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const isSeller = sessionUserId === listing.user_id

  useEffect(() => {
    setPageUrl(window.location.href)
    if (!isSupabaseBrowserConfigured()) return
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        setSessionUserId(session.user.id)
        setAccessToken(session.access_token)
      }
    })
  }, [])

  const listingImages = useMemo(() => listing.images?.map((img) => img.url).filter(Boolean) || [], [listing.images])
  const fipePrice = listing.fipe_price ? Number(listing.fipe_price) : null
  const price = Number(listing.price)
  const diffValue = fipePrice ? price - fipePrice : null
  const diffPercent = fipePrice ? (diffValue! / fipePrice) * 100 : null
  const fipeStatus = getFipeLabel(comparison.status)
  const fipeBarWidth = diffPercent == null ? 50 : Math.max(12, Math.min(88, 50 + diffPercent * 2.5))
  const dealPercentLabel = diffPercent == null ? null : `${diffPercent > 0 ? '+' : ''}${diffPercent.toFixed(1).replace('.', ',')}%`

  const detailItems = [
    { label: 'Ano', value: `${listing.year}/${listing.year_model}` },
    { label: 'Quilometragem', value: `${listing.mileage.toLocaleString('pt-BR')} km` },
    { label: 'Câmbio', value: Array.isArray(listing.transmission) ? listing.transmission.join(', ') : listing.transmission },
    { label: 'Combustível', value: listing.fuel },
    { label: 'Cor', value: listing.color },
    { label: 'Carroceria', value: listing.body_type || 'Não informado' },
    { label: 'Motor', value: listing.engine || enrichment?.powertrain?.engine || 'Não informado' },
    { label: 'Portas', value: listing.doors ? `${listing.doors} portas` : 'Não informado' },
    { label: 'Final da placa', value: listing.plate_final || 'Não informado' },
  ]

  const fipeCompareItems = [
    { label: 'Preço anunciado', value: formatBRL(price), highlight: false },
    { label: 'Diferença', value: diffValue == null ? 'Sem referência' : `${diffValue > 0 ? '+ ' : '- '}${formatBRL(Math.abs(diffValue))}`, highlight: comparison.status === 'below' },
    { label: 'Percentual', value: dealPercentLabel || 'Sem referência', highlight: comparison.status === 'below' },
  ]

  const sellerName = sellerInfo?.name || 'Vendedor particular'
  const sellerYears = Math.max(0, new Date().getFullYear() - new Date(sellerInfo?.memberSince || Date.now()).getFullYear())
  const publicPath = pageUrl ? pageUrl.replace(/^https?:\/\//, '') : `carbi.com.br/anuncios/${listing.slug}`

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: listing.title, url: window.location.href })
      return
    }
    await navigator.clipboard?.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const handleCopy = async () => {
    await navigator.clipboard?.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="ref-ad-detail">
      <div className="ref-ad-page-container">
        <div className="ref-ad-left-col">
          <ListingImageGallery
            images={listingImages}
            title={listing.title}
            badgeLabel={listing.badges?.[0]?.label || 'Anúncio Carbi'}
            fipeBadgeLabel={fipePrice ? fipeStatus : undefined}
          />

          <section className="ref-ad-card">
            <div className="ref-ad-card-title">Detalhes do veículo</div>
            <div className="ref-ad-details-grid ref-stagger">
              {detailItems.map((item) => (
                <div className="ref-ad-detail-item" key={item.label}>
                  <div className="ref-ad-detail-label">{item.label}</div>
                  <div className="ref-ad-detail-value">{item.value}</div>
                </div>
              ))}
            </div>
          </section>

          {fipePrice ? (
            <section className="ref-ad-fipe-card">
              <div className="ref-ad-fipe-header">
                <h3>Comparativo FIPE</h3>
                <span className="ref-ad-fipe-badge">{fipeStatus}</span>
              </div>
              <div className="ref-ad-fipe-row">
                <span className="ref-ad-fipe-val-main">{formatBRL(fipePrice)}</span>
                <span className="ref-ad-fipe-val-label">Tabela FIPE</span>
              </div>
              <div className="ref-ad-fipe-compare">
                {fipeCompareItems.map((item) => (
                  <div className="ref-ad-fipe-compare-item" key={item.label}>
                    <div className="lbl">{item.label}</div>
                    <div className={`val ${item.highlight ? 'green' : ''}`}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="ref-ad-fipe-bar-wrap">
                <div className="ref-ad-fipe-bar-label">
                  <span>Abaixo da FIPE</span>
                  <span>Acima da FIPE</span>
                </div>
                <div className="ref-ad-fipe-bar-track">
                  <div className="ref-ad-fipe-bar-fill" style={{ width: `${fipeBarWidth}%` }} />
                  <div className="ref-ad-fipe-bar-marker" style={{ left: '50%' }} />
                </div>
              </div>
              <div className="ref-ad-fipe-ref">
                Referência {listing.fipe_reference_month || 'mensal'} · Atualizado pela FIPE
              </div>
            </section>
          ) : null}

          {listing.optional_items?.length > 0 ? (
            <section className="ref-ad-card">
              <div className="ref-ad-card-title">Opcionais e equipamentos</div>
              <div className="ref-ad-optionals-grid ref-stagger">
                {listing.optional_items.map((item) => (
                  <div className="ref-ad-optional-item" key={item}>
                    <div className="ref-ad-optional-check"><Check size={12} strokeWidth={2.4} /></div>
                    {item}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {listing.description ? (
            <section className="ref-ad-card">
              <div className="ref-ad-card-title">Descrição do vendedor</div>
              <p className="ref-ad-desc-text">{listing.description}</p>
            </section>
          ) : null}

          <section className="ref-ad-card-sm">
            <div className="ref-ad-card-title">Histórico de preço</div>
            <div className="ref-ad-price-history-head">
              <span>{formatBRL(price)}</span>
              <small>preço atual</small>
              <em>{listing.price_history?.has_changes ? `${listing.price_history.changes_last_30d} alterações registradas` : 'Sem alterações registradas'}</em>
            </div>
            <svg viewBox="0 0 400 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="ref-ad-price-svg">
              <defs>
                <linearGradient id={`priceGrad-${listing.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5a47d1" stopOpacity=".18" />
                  <stop offset="100%" stopColor="#5a47d1" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0 44 L80 43 L160 44 L240 43 L320 44 L400 43 L400 80 L0 80 Z" fill={`url(#priceGrad-${listing.id})`} />
              <path d="M0 44 L80 43 L160 44 L240 43 L320 44 L400 43" stroke="#5a47d1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <circle cx="400" cy="43" r="5" fill="#5a47d1" />
              <line x1="0" y1="70" x2="400" y2="70" stroke="rgba(0,0,0,.06)" strokeWidth="1" />
            </svg>
          </section>

          <section className="ref-ad-card-sm">
            <div className="ref-ad-card-title">Segurança na compra</div>
            <div className="ref-ad-safety-list">
              <div className="ref-ad-safety-item">
                <div className="ref-ad-safety-icon"><ShieldCheck size={16} /></div>
                <div><strong>Negocie pelo chat interno.</strong> Evite compartilhar telefone, e-mail ou dados bancários antes de verificar o veículo.</div>
              </div>
              <div className="ref-ad-safety-item">
                <div className="ref-ad-safety-icon"><Calendar size={16} /></div>
                <div>Faça test drive e vistoria antes de fechar negócio. Prefira encontros em locais movimentados.</div>
              </div>
              <div className="ref-ad-safety-item">
                <div className="ref-ad-safety-icon"><BadgeCheck size={16} /></div>
                <div>Confira documentação, chassi e histórico antes de transferir qualquer valor.</div>
              </div>
            </div>
          </section>

          {relatedListings.length > 0 ? (
            <section className="ref-ad-similar-section">
              <div className="ref-ad-similar-header">
                <div>
                  <div className="ref-ad-card-title">Similares</div>
                  <h2>Você também pode gostar</h2>
                </div>
                <Link href="/carros-a-venda" className="ref-ad-btn ref-ad-btn-ghost">Ver mais</Link>
              </div>
              <div className="ref-ad-similar-grid ref-stagger">
                {relatedListings.slice(0, 3).map((item) => (
                    <Link href={`/anuncios/${item.slug}`} className="ref-ad-sim-card" key={item.id}>
                      <div className="ref-ad-sim-img">
                        <MarketplaceListingImage
                          brand={item.brand}
                          model={item.model}
                          year={item.year_model}
                          imageUrls={item.images?.map((image) => image.url) || []}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="ref-ad-sim-body">
                        <div className="ref-ad-sim-make">{item.brand}</div>
                        <div className="ref-ad-sim-name">{item.model} {item.version}</div>
                        <div className="ref-ad-sim-price">{formatBRL(Number(item.price))}</div>
                        {item.fipe_price ? <div className="ref-ad-sim-fipe">FIPE {formatBRL(Number(item.fipe_price))}</div> : null}
                        <div className="ref-ad-sim-meta"><span>{item.year_model}</span><span>·</span><span>{item.mileage.toLocaleString('pt-BR')} km</span><span>·</span><span>{item.state}</span></div>
                      </div>
                    </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="ref-ad-right-col">
          <section className="ref-ad-price-panel">
            <div className="ref-ad-price-panel-make">{listing.brand} · {listing.model}</div>
            <h1 className="ref-ad-price-panel-name">{listing.version || 'Versão não informada'}</h1>
            <div className="ref-ad-price-panel-version">{listing.year}/{listing.year_model} · {listing.color} · {listing.body_type || 'Particular'}</div>
            <div className="ref-ad-price-main">{formatBRL(price)}</div>
            {fipePrice ? (
              <div className="ref-ad-price-fipe-row">
                <span className="ref-ad-price-fipe-val">FIPE {formatBRL(fipePrice)}</span>
                {dealPercentLabel ? <span className="ref-ad-price-fipe-chip">{dealPercentLabel}</span> : null}
              </div>
            ) : null}
            <div className="ref-ad-price-panel-divider" />
            <div className="ref-ad-spec-pills">
              <span>{listing.year_model}</span>
              <span>{listing.mileage.toLocaleString('pt-BR')} km</span>
              <span>{Array.isArray(listing.transmission) ? listing.transmission[0] : listing.transmission}</span>
              <span>{listing.fuel}</span>
            </div>
            <div className="ref-ad-location-row"><span /> {listing.city} / {listing.state}</div>
            <div className="ref-ad-views-row">
              <div><span /> Anúncio ativo</div>
              <span>Anunciado em {formatDate(listing.created_at)}</span>
            </div>
            <div className="ref-ad-cta-block">
              <button type="button" className="ref-ad-cta-offer" onClick={() => setShowOfferModal(true)} aria-label="Fazer oferta para este veículo">
                <HandCoins size={18} /> Fazer oferta
              </button>
              <div className="ref-ad-chat-wrap">
                <ChatStarter listingId={listing.id} label="Chat na Carbi" />
              </div>
              <div className="ref-ad-cta-secondary">
                <button type="button" onClick={() => setIsFavorite((value) => !value)} aria-label={isFavorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}>
                  <Heart size={14} className={isFavorite ? 'fill-current' : ''} /> {isFavorite ? 'Salvo' : 'Salvar'}
                </button>
                <button type="button" onClick={handleShare} aria-label="Compartilhar este anúncio"><Share2 size={14} /> Compartilhar</button>
              </div>
              <div className="ref-ad-cta-notice">Contato protegido pelo chat interno</div>
            </div>
          </section>

          <section className="ref-ad-card ref-ad-seller-card">
            <div className="ref-ad-card-title">Vendedor</div>
            <div className="ref-ad-seller-top">
              <div className="ref-ad-seller-avatar">
                {sellerInfo?.avatarUrl ? <img src={sellerInfo.avatarUrl} alt={sellerName} /> : initials(sellerName)}
              </div>
              <div>
                <div className="ref-ad-seller-name">{sellerName}</div>
                <div className="ref-ad-seller-type">Vendedor particular</div>
              </div>
            </div>
            <div className="ref-ad-seller-badges">
              <span><i /> Chat interno</span>
              <span><i /> Dados protegidos</span>
            </div>
            <div className="ref-ad-seller-stats">
              <div><span>{sellerInfo?.activeListings ?? 1}</span><small>anúncios</small></div>
              <div><span>{sellerInfo?.totalListings ?? 1}</span><small>total</small></div>
              <div><span>{sellerYears || 1} ano{sellerYears > 1 ? 's' : ''}</span><small>no Carbi</small></div>
            </div>
          </section>

          <section className="ref-ad-card-sm">
            <div className="ref-ad-card-title">Compartilhar anúncio</div>
            <div className="ref-ad-share-row">
              <span>Link</span>
              <button type="button" className="ref-ad-copy-link" onClick={handleCopy}>{copied ? 'Link copiado!' : publicPath}</button>
              <button type="button" className="ref-ad-share-btn" onClick={handleCopy} title="Copiar link"><Copy size={14} /></button>
            </div>
          </section>

          <div className="ref-ad-report-wrap">
            <button type="button">Denunciar este anúncio</button>
          </div>
        </aside>
      </div>

      <div className="ref-ad-mobile-cta" role="complementary" aria-label="Ações rápidas">
        <div>
          <strong>{formatBRL(price)}</strong>
          {fipePrice ? <span>FIPE {formatBRL(fipePrice)}</span> : null}
        </div>
        <button type="button" onClick={() => setShowOfferModal(true)} aria-label="Fazer oferta"><HandCoins size={16} /> Oferta</button>
        <div className="ref-ad-mobile-chat"><ChatStarter listingId={listing.id} label="Chat" /></div>
      </div>

      {accessToken ? (
        <OfferHistory listingId={listing.id} isSeller={isSeller} accessToken={accessToken} />
      ) : null}

      <OfferModal
        listingId={listing.id}
        listingPrice={price}
        listingTitle={`${listing.brand} ${listing.model} ${listing.year_model}`}
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
      />
    </div>
  )
}
