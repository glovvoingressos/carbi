'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
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
  Gauge,
  Car,
  ChevronRight,
} from 'lucide-react'
import { ListingPublic } from '@/lib/marketplace'
import { formatBRL } from '@/data/cars'
import { trackEvent } from '@/lib/analytics'
import ListingImageGallery from './ListingImageGallery'
import ChatStarter from './ChatStarter'
import OfferModal from './OfferModal'
import OfferHistory from './OfferHistory'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import MarketplaceListingImage from './MarketplaceListingImage'
import ConfirmModal from '@/components/animations/ConfirmModal'
import Tooltip from '@/components/animations/Tooltip'

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enrichment?: any
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

function firstName(name: string | null | undefined) {
  if (!name) return 'Vendedor particular'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts[0] || 'Vendedor particular'
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
  const [showReportModal, setShowReportModal] = useState(false)
  const [viewCount, setViewCount] = useState(listing.view_count || 0)
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

    // Track view (non-blocking)
    fetch(`/api/marketplace/listings/${listing.id}/views`, { method: 'POST' })
      .then(() => setViewCount((v) => v + 1))
      .catch(() => {})

    // GA event: view_item
    trackEvent('view_item', {
      item_id: listing.id,
      item_name: listing.title,
      item_brand: listing.brand,
      item_category: listing.body_type || 'vehicle',
      price: Number(listing.price),
      currency: 'BRL',
    })
  }, [listing.id])

  const listingImages = useMemo(() => listing.images?.map((img) => img.url).filter(Boolean) || [], [listing.images])
  const fipePrice = listing.fipe_price ? Number(listing.fipe_price) : null
  const price = Number(listing.price)
  const diffValue = fipePrice ? price - fipePrice : null
  const diffPercent = fipePrice ? (diffValue! / fipePrice) * 100 : null
  const fipeStatus = getFipeLabel(comparison.status)
  const dealPercentLabel = diffPercent == null ? null : `${diffPercent > 0 ? '+' : ''}${diffPercent.toFixed(1).replace('.', ',')}%`

  const detailItems = [
    { icon: Calendar, label: 'Ano', value: `${listing.year}/${listing.year_model}` },
    { icon: Gauge, label: 'Quilometragem', value: `${listing.mileage.toLocaleString('pt-BR')} km` },
    { icon: Car, label: 'Câmbio', value: Array.isArray(listing.transmission) ? listing.transmission.join(', ') : listing.transmission },
    { icon: Fuel, label: 'Combustível', value: listing.fuel },
    { icon: null, label: 'Cor', value: listing.color },
    { icon: null, label: 'Carroceria', value: listing.body_type || 'Não informado' },
    { icon: null, label: 'Motor', value: listing.engine || enrichment?.powertrain?.engine || 'Não informado' },
  ]

  const sellerName = sellerInfo?.name || 'Vendedor particular'
  const sellerFirstName = firstName(sellerInfo?.name)
  const sellerYears = Math.max(0, new Date().getFullYear() - new Date(sellerInfo?.memberSince || Date.now()).getFullYear())
  const publicPath = pageUrl ? pageUrl.replace(/^https?:\/\//, '') : `carbi.com.br/anuncios/${listing.slug}`

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: listing.title, url: window.location.href })
        return
      }
      await navigator.clipboard?.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard or share failed - silently ignore
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard write failed - silently ignore
    }
  }

  return (
    <div className="fingen-detail-page">
      {/* Header */}
      <header className="fingen-detail-header">
        <Link href="/carros-a-venda" className="fingen-detail-back" aria-label="Voltar para carros à venda">
          <ArrowLeft size={20} />
        </Link>
        <div className="fingen-detail-header-actions">
          <button type="button" onClick={() => setIsFavorite(!isFavorite)} className="fingen-detail-action-btn" aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}>
            <Heart size={18} className={isFavorite ? 'fill-current' : ''} />
          </button>
          <button type="button" onClick={handleShare} className="fingen-detail-action-btn" aria-label="Compartilhar anúncio">
            <Share2 size={18} />
          </button>
        </div>
      </header>

      {/* Top: Gallery + Summary side-by-side (desktop) */}
      <div className="fingen-detail-layout">
        {/* Gallery */}
        <div className="fingen-detail-gallery">
          <ListingImageGallery
            images={listingImages}
            title={listing.title}
          />
        </div>

        {/* Ad Summary */}
        <div className="fingen-detail-summary">
          {/* Price Card */}
          <section className="fingen-detail-price-card">
            <div className="fingen-detail-price-header">
              <div className="fingen-detail-price-make">{listing.brand}</div>
              <h1 className="fingen-detail-price-title">{listing.model} {listing.version || ''}</h1>
              <div className="fingen-detail-price-sub">{listing.year}/{listing.year_model} · {listing.color}</div>
            </div>

            <div className="fingen-detail-price-row">
              <div className="fingen-detail-price-main">{formatBRL(price)}</div>
              {fipePrice && (
                <div className="fingen-detail-price-fipe">
                  <span>FIPE {formatBRL(fipePrice)}</span>
                  {dealPercentLabel && (
                    <span className="fingen-detail-price-badge">
                      {dealPercentLabel}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="fingen-detail-specs-row">
              <span><Calendar size={14} /> {listing.year_model}</span>
              <span><Gauge size={14} /> {listing.mileage.toLocaleString('pt-BR')} km</span>
              <span><Car size={14} /> {Array.isArray(listing.transmission) ? listing.transmission[0] : listing.transmission}</span>
              <span><Fuel size={14} /> {listing.fuel}</span>
            </div>

            <div className="fingen-detail-location">
              <MapPin size={14} />
              {listing.city} / {listing.state}
            </div>

            {/* View count - only for seller */}
            {isSeller && (
              <div className="fingen-detail-view-count">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                {viewCount.toLocaleString('pt-BR')} visualizações
              </div>
            )}
          </section>

          {/* CTA Buttons */}
          <section className="fingen-detail-cta">
            <button type="button" className="fingen-detail-cta-primary" onClick={() => setShowOfferModal(true)}>
              <HandCoins size={18} />
              Fazer oferta
            </button>
            <div className="fingen-detail-cta-chat">
              <ChatStarter listingId={listing.id} label="Chat na Carbi" />
            </div>
          </section>
        </div>
      </div>

      {/* Below: the rest of the listing, full width */}
      <div className="fingen-detail-rest">
        {/* FIPE Comparison */}
        {fipePrice && (
          <section className="fingen-detail-card-dark">
            <div className="fingen-detail-dark-header">
              <h3>Comparativo FIPE</h3>
              <span className={`fingen-detail-dark-badge ${comparison.status === 'below' ? 'success' : ''}`}>
                {fipeStatus}
              </span>
            </div>
            <div className="fingen-detail-dark-value">{formatBRL(fipePrice)}</div>
            <div className="fingen-detail-dark-label">Tabela FIPE referência</div>
            {diffValue !== null && (
              <div className="fingen-detail-dark-diff">
                <span className={diffValue <= 0 ? 'positive' : 'negative'}>
                  {diffValue <= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                  {diffValue > 0 ? '+' : ''}{formatBRL(diffValue)}
                </span>
              </div>
            )}
          </section>
        )}

        {/* Details */}
        <section className="fingen-detail-card">
          <h3 className="fingen-detail-card-title">Detalhes do veículo</h3>
          <div className="fingen-detail-specs-grid">
            {detailItems.map((item) => (
              <div className="fingen-detail-spec-item" key={item.label}>
                <div className="fingen-detail-spec-label">{item.label}</div>
                <div className="fingen-detail-spec-value">{item.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Optionals */}
        {listing.optional_items && listing.optional_items.length > 0 && (
          <section className="fingen-detail-card">
            <h3 className="fingen-detail-card-title">Opcionais</h3>
            <div className="fingen-detail-optionals-grid">
              {listing.optional_items.map((item) => (
                <div className="fingen-detail-optional-item" key={item}>
                  <Check size={14} className="text-[var(--color-trust)]" />
                  {item}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Description */}
        {listing.description && (
          <section className="fingen-detail-card fingen-detail-card--full">
            <h3 className="fingen-detail-card-title">Descrição</h3>
            <p className="fingen-detail-description">{listing.description}</p>
          </section>
        )}

        {/* Safety */}
        <section className="fingen-detail-card">
          <h3 className="fingen-detail-card-title">Segurança na compra</h3>
          <div className="fingen-detail-safety-list">
            <div className="fingen-detail-safety-item">
              <ShieldCheck size={16} className="text-[var(--color-trust)]" />
              <span>Negocie pelo chat interno. Evite compartilhar telefone antes de verificar o veículo.</span>
            </div>
            <div className="fingen-detail-safety-item">
              <Calendar size={16} className="text-[var(--color-trust)]" />
              <span>Faça test drive e vistoria antes de fechar negócio.</span>
            </div>
            <div className="fingen-detail-safety-item">
              <BadgeCheck size={16} className="text-[var(--color-trust)]" />
              <span>Confira documentação, chassi e histórico antes de transferir.</span>
            </div>
          </div>
        </section>

        {/* Seller */}
        <section className="fingen-detail-card">
          <h3 className="fingen-detail-card-title">Vendedor</h3>
          <div className="fingen-detail-seller">
            <div className="fingen-detail-seller-avatar">
              {sellerInfo?.avatarUrl ? (
                <img src={sellerInfo.avatarUrl} alt={sellerFirstName} />
              ) : (
                initials(sellerName)
              )}
            </div>
            <div className="fingen-detail-seller-info">
              <div className="fingen-detail-seller-name">{sellerFirstName}</div>
              <div className="fingen-detail-seller-type">Vendedor particular</div>
            </div>
          </div>
          <div className="fingen-detail-seller-stats">
            <div><strong>{sellerInfo?.activeListings ?? 1}</strong><span>anúncios</span></div>
            <div><strong>{sellerYears || 1}</strong><span>no Carbi</span></div>
          </div>
        </section>

        {/* Share */}
        <section className="fingen-detail-card">
          <h3 className="fingen-detail-card-title">Compartilhar</h3>
          <div className="fingen-detail-share">
            <button type="button" onClick={handleCopy} className="fingen-detail-share-btn" aria-label={copied ? 'Link copiado' : 'Copiar link do anúncio'}>
              <Copy size={14} />
              {copied ? 'Copiado!' : 'Copiar link'}
            </button>
          </div>
        </section>

        {/* Report */}
        <button type="button" onClick={() => setShowReportModal(true)} className="fingen-detail-report fingen-detail-report--full" aria-label="Denunciar este anúncio">
          Denunciar anúncio
        </button>
      </div>

      {/* Similar Cars */}
      {relatedListings.length > 0 && (
        <section className="fingen-detail-similar-section">
          <div className="fingen-detail-section-header">
            <h3>Similares</h3>
            <Link href="/carros-a-venda">Ver todos <ChevronRight size={14} /></Link>
          </div>
          <div className="fingen-detail-similar-grid">
            {relatedListings.slice(0, 4).map((item) => (
              <Link href={`/anuncios/${item.slug}`} className="fingen-detail-similar-card" key={item.id}>
                <div className="fingen-detail-similar-img">
                  <MarketplaceListingImage
                    brand={item.brand}
                    model={item.model}
                    year={item.year_model}
                    imageUrls={item.images?.map((image) => image.url) || []}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="fingen-detail-similar-body">
                  <div className="fingen-detail-similar-brand">{item.brand}</div>
                  <div className="fingen-detail-similar-name">{item.model}</div>
                  <div className="fingen-detail-similar-price">{formatBRL(Number(item.price))}</div>
                  <div className="fingen-detail-similar-meta">{item.year_model} · {item.mileage.toLocaleString('pt-BR')} km</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Mobile Bottom Bar */}
      <div className="fingen-detail-mobile-bar">
        <div className="fingen-detail-mobile-price">
          <strong>{formatBRL(price)}</strong>
          {fipePrice && <span>FIPE {formatBRL(fipePrice)}</span>}
        </div>
        <button type="button" className="fingen-detail-mobile-offer" onClick={() => setShowOfferModal(true)}>
          <HandCoins size={16} /> Oferta
        </button>
        <div className="fingen-detail-mobile-chat">
          <ChatStarter listingId={listing.id} label="Chat" />
        </div>
      </div>

      {/* Modals */}
      <OfferHistory listingId={listing.id} isSeller={isSeller} accessToken={accessToken} />

      <OfferModal
        listingId={listing.id}
        listingPrice={price}
        listingTitle={`${listing.brand} ${listing.model} ${listing.year_model}`}
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
      />

      <ConfirmModal
        isOpen={showReportModal}
        title="Denunciar anúncio"
        message="Tem certeza que deseja denunciar este anúncio?"
        confirmLabel="Denunciar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={() => setShowReportModal(false)}
        onCancel={() => setShowReportModal(false)}
      />
    </div>
  )
}
