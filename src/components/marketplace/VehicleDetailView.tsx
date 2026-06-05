'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  TrendingDown, TrendingUp, Calendar,
  MapPin, Gauge, Fuel, Zap,
  Settings2, ShieldCheck, Check,
  Share2, Heart, MessageCircle, Phone,
  Info, ArrowRight,
} from 'lucide-react'
import { motion, Variants } from 'framer-motion'
import { ListingPublic } from '@/lib/marketplace'
import { formatBRL } from '@/data/cars'
import ListingImageGallery from './ListingImageGallery'
import ChatStarter from './ChatStarter'
import ListingCard from './ListingCard'

interface VehicleDetailViewProps {
  listing: ListingPublic
  sellerInfo: any
  relatedListings: ListingPublic[]
  enrichment: any
  comparison: {
    status: 'below' | 'near' | 'above' | 'unknown'
    diffPercent: number | null
  }
}

export default function VehicleDetailView({
  listing,
  sellerInfo,
  relatedListings,
  enrichment,
  comparison
}: VehicleDetailViewProps) {
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  const mainSpecs = [
    { label: 'Ano', value: `${listing.year}/${listing.year_model}`, icon: Calendar },
    { label: 'Quilometragem', value: `${listing.mileage.toLocaleString('pt-BR')} km`, icon: Gauge },
    { label: 'Câmbio', value: listing.transmission, icon: Settings2 },
    { label: 'Combustível', value: listing.fuel, icon: Fuel },
  ]

  const technicalSpecs = [
    { label: 'Cor', value: listing.color },
    { label: 'Final da placa', value: listing.plate_final || 'Não informado' },
    ...(listing.vehicle_type === 'truck' ? [
      { label: 'Tipo de caminhão', value: listing.truck_type || 'Não informado' },
      { label: 'Capacidade de carga', value: listing.load_capacity ? `${listing.load_capacity} t` : 'Não informado' },
      { label: 'Número de eixos', value: listing.axles ? `${listing.axles}` : 'Não informado' },
      { label: 'Tipo de carroceria', value: listing.truck_body_type || 'Não informado' },
    ] : [
      { label: 'Carroceria', value: listing.body_type },
      { label: 'Portas', value: listing.doors ? `${listing.doors} portas` : 'Não informado' },
    ]),
    { label: 'Motor', value: listing.engine || 'Não informado' },
    { label: 'Localização', value: `${listing.city}/${listing.state}` },
  ]

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: listing.title,
        url: window.location.href,
      })
    } else {
      navigator.clipboard?.writeText(window.location.href)
    }
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
    }
  }

  const isGoodDeal = comparison.status === 'below'

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen"
    >
      {/* ── HEADER ── */}
      <motion.section variants={itemVariants} className="container pt-8 pb-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              {listing.badges?.slice(0, 3).map(badge => (
                <span key={badge.key} className="badge badge-neutral">
                  {badge.label}
                </span>
              ))}
              {isGoodDeal && (
                <span className="badge badge-brand">
                  {comparison.diffPercent && Math.abs(comparison.diffPercent).toFixed(0)}% abaixo da FIPE
                </span>
              )}
            </div>
            <h1 className="text-balance">
              {listing.brand} {listing.model}
            </h1>
            <p className="mt-2 text-[15px] text-[#525252] tracking-tight">
              {listing.version || 'Versão Standard'} · {listing.year}/{listing.year_model} · {listing.city}, {listing.state}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="btn-icon bg-white/70 border border-white/70 shadow-sm"
              aria-label="Compartilhar"
            >
              <Share2 className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </button>
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="btn-icon bg-white/70 border border-white/70 shadow-sm"
              aria-label="Favoritar"
            >
              <Heart
                className={`w-[18px] h-[18px] ${isFavorite ? 'fill-[#DC2626] text-[#DC2626]' : ''}`}
                strokeWidth={1.75}
              />
            </button>
          </div>
        </div>
      </motion.section>

      {/* ── GALLERY + SIDEBAR ── */}
      <motion.section variants={itemVariants} className="container pb-12">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_400px] lg:gap-8">
          <div>
            <ListingImageGallery
              images={listing.images?.map(img => img.url) || []}
              title={listing.title}
            />
          </div>

          {/* ── Sticky Price & Seller Card ── */}
          <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
            <div className="surface-strong p-6 max-[330px]:p-4">
              <p className="eyebrow mb-2">Preço</p>
              <p className="text-[44px] font-semibold tracking-normal text-[#0A0A0A] leading-none max-[380px]:text-[36px] max-[330px]:text-[30px]">
                {formatBRL(Number(listing.price))}
              </p>

              {/* FIPE comparison */}
              {listing.fipe_price && (
                <div className="mt-5 pt-5 border-t border-white/70">
                  <div className="mb-3 flex items-center justify-between gap-3 text-[13px] max-[330px]:text-[12px]">
                    <span className="text-[#52607A]">Tabela FIPE</span>
                    <span className="text-[#0A0A0A] font-medium">{formatBRL(Number(listing.fipe_price))}</span>
                  </div>
                  {comparison.status !== 'unknown' && (
                    <div className={`flex items-center gap-2 text-[13px] font-medium ${
                      comparison.status === 'below' ? 'text-[#10B981]' :
                      comparison.status === 'near' ? 'text-[#F59E0B]' :
                      'text-[#DC2626]'
                    }`}>
                      {comparison.status === 'below' ? <TrendingDown className="w-4 h-4" strokeWidth={2} /> : <TrendingUp className="w-4 h-4" strokeWidth={2} />}
                      {comparison.status === 'below' ? 'Abaixo da FIPE' :
                       comparison.status === 'near' ? 'Na média da FIPE' : 'Acima da FIPE'}
                    </div>
                  )}
                  {listing.fipe_reference_month && (
                    <p className="mt-2 text-[11px] text-[#8A95A8] tracking-tight">
                      Referência: {listing.fipe_reference_month}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 space-y-2.5">
                <ChatStarter listingId={listing.id} />
                <button className="btn btn-secondary w-full">
                  <Phone className="w-4 h-4" strokeWidth={1.75} /> Ver telefone
                </button>
              </div>
            </div>

            {/* Seller card */}
            <div className="surface p-6 max-[330px]:p-4">
              <p className="eyebrow mb-3">Vendedor</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#FFF8DF] flex items-center justify-center text-[#0A0A0A] border border-[#17170F]/10">
                  {sellerInfo?.avatarUrl ? (
                    <img src={sellerInfo.avatarUrl} alt={sellerInfo.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-[15px] font-semibold">
                      {(sellerInfo?.name || 'P').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#0A0A0A] tracking-tight truncate">
                    {sellerInfo?.name || 'Particular'}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" strokeWidth={2} />
                    <span className="text-[11px] text-[#52607A] tracking-tight">Perfil verificado</span>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-[11px] text-[#8A95A8] tracking-tight">
                Anunciando desde {new Date(sellerInfo?.memberSince || Date.now()).getFullYear()}
              </p>
            </div>
          </aside>
        </div>
      </motion.section>

      {/* ── MAIN SPECS ── */}
      <motion.section variants={itemVariants} className="container py-12 border-t border-white/70">
        <h2 className="text-balance mb-8">Visão geral</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {mainSpecs.map(spec => {
            const Icon = spec.icon
            return (
              <div key={spec.label} className="surface p-6">
                <Icon className="w-5 h-5 text-[#17170F] mb-3" strokeWidth={1.5} />
                <p className="eyebrow mb-1">{spec.label}</p>
                <p className="text-[15px] font-semibold text-[#0A0A0A] tracking-tight">{spec.value}</p>
              </div>
            )
          })}
        </div>
      </motion.section>

      {/* ── TECHNICAL SPECS ── */}
      <motion.section variants={itemVariants} className="container py-12 border-t border-white/70">
        <h2 className="text-balance mb-8">Ficha técnica</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 max-w-4xl">
          {technicalSpecs.map(spec => (
            <div key={spec.label} className="flex items-center justify-between py-4 border-b border-white/70">
              <span className="text-[14px] text-[#52607A] tracking-tight">{spec.label}</span>
              <span className="text-[14px] font-medium text-[#0A0A0A] tracking-tight">{spec.value}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── ENRICHMENT (SPECS) ── */}
      {enrichment && (
        <motion.section variants={itemVariants} className="container py-12 border-t border-white/70">
          <h2 className="text-balance mb-8">Especificações técnicas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl">
            {enrichment.powertrain && (
              <div>
                <p className="eyebrow mb-4">Motor e performance</p>
                <div className="space-y-0">
                  {enrichment.powertrain.engine && (
                    <div className="flex justify-between py-3 border-b border-white/70">
                      <span className="text-[14px] text-[#52607A]">Motor</span>
                      <span className="text-[14px] font-medium text-[#0A0A0A]">{enrichment.powertrain.engine}</span>
                    </div>
                  )}
                  {enrichment.powertrain.horsepower && (
                    <div className="flex justify-between py-3 border-b border-white/70">
                      <span className="text-[14px] text-[#52607A]">Potência</span>
                      <span className="text-[14px] font-medium text-[#0A0A0A]">{enrichment.powertrain.horsepower} cv</span>
                    </div>
                  )}
                  {enrichment.powertrain.transmission && (
                    <div className="flex justify-between py-3 border-b border-white/70">
                      <span className="text-[14px] text-[#52607A]">Transmissão</span>
                      <span className="text-[14px] font-medium text-[#0A0A0A]">{enrichment.powertrain.transmission}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {enrichment.dimensions && (
              <div>
                <p className="eyebrow mb-4">Dimensões e capacidade</p>
                <div className="space-y-0">
                  {enrichment.dimensions.cargoCapacity && (
                    <div className="flex justify-between py-3 border-b border-white/70">
                      <span className="text-[14px] text-[#52607A]">Porta-malas</span>
                      <span className="text-[14px] font-medium text-[#0A0A0A]">{enrichment.dimensions.cargoCapacity}L</span>
                    </div>
                  )}
                  {enrichment.dimensions.curbWeight && (
                    <div className="flex justify-between py-3 border-b border-white/70">
                      <span className="text-[14px] text-[#52607A]">Peso</span>
                      <span className="text-[14px] font-medium text-[#0A0A0A]">{enrichment.dimensions.curbWeight} kg</span>
                    </div>
                  )}
                  {enrichment.dimensions.length && (
                    <div className="flex justify-between py-3 border-b border-white/70">
                      <span className="text-[14px] text-[#52607A]">Comprimento</span>
                      <span className="text-[14px] font-medium text-[#0A0A0A]">{enrichment.dimensions.length} mm</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.section>
      )}

      {/* ── OPTIONALS ── */}
      {listing.optional_items?.length > 0 && (
        <motion.section variants={itemVariants} className="container py-12 border-t border-white/70">
          <h2 className="text-balance mb-8">Opcionais e acessórios</h2>
          <div className="flex flex-wrap gap-2">
            {listing.optional_items.map(item => (
              <div key={item} className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#17170F]/12 rounded-full">
                <Check className="w-3.5 h-3.5 text-[#17170F]" strokeWidth={2.5} />
                <span className="text-[13px] font-medium text-[#0A0A0A] tracking-tight">{item}</span>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── DESCRIPTION ── */}
      {listing.description && (
        <motion.section variants={itemVariants} className="container py-12 border-t border-white/70">
          <h2 className="text-balance mb-6">Descrição do anunciante</h2>
          <div className={`relative ${!showFullDescription && listing.description.length > 500 ? 'max-h-72 overflow-hidden' : ''}`}>
            <p className="text-[16px] text-[#52607A] leading-relaxed whitespace-pre-wrap text-pretty">
              {listing.description}
            </p>
            {!showFullDescription && listing.description.length > 500 && (
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#F6F7FB] to-transparent pointer-events-none" />
            )}
          </div>
          {listing.description.length > 500 && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="mt-5 text-[14px] font-medium text-[#0A0A0A] hover:opacity-70 transition-opacity"
            >
              {showFullDescription ? 'Ver menos' : 'Ver descrição completa →'}
            </button>
          )}
        </motion.section>
      )}

      {/* ── RECALLS ── */}
      {enrichment?.recalls?.count > 0 && (
        <motion.section variants={itemVariants} className="container py-12 border-t border-white/70">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#FEF2F2] rounded-xl flex items-center justify-center">
              <Info className="w-5 h-5 text-[#DC2626]" strokeWidth={1.75} />
            </div>
            <h2>Avisos de recall</h2>
          </div>
          <div className="space-y-3">
            {enrichment.recalls.items.slice(0, 2).map((recall: any, idx: number) => (
              <div key={idx} className="border border-[#FECACA] bg-[#FEF2F2] rounded-2xl p-5">
                <p className="font-semibold text-[#0A0A0A] mb-1.5 tracking-tight">{recall.title}</p>
                <p className="text-[14px] text-[#525252] leading-relaxed">{recall.description}</p>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── RELATED ── */}
      {relatedListings.length > 0 && (
        <motion.section variants={itemVariants} className="container py-12 border-t border-white/70">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="eyebrow mb-2">Veículos semelhantes</p>
              <h2 className="text-balance">Você também pode gostar</h2>
            </div>
            <Link href="/carros-a-venda" className="hidden sm:inline-flex items-center gap-1.5 text-[14px] font-medium text-[#0A0A0A] hover:opacity-70">
              Ver todos <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {relatedListings.slice(0, 4).map(item => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </motion.section>
      )}

      {/* ── MOBILE STICKY CTA ── */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-[60] bg-white/82 backdrop-blur-2xl border-t border-white/70 p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[18px] font-semibold text-[#0A0A0A] tracking-tight truncate">
              {formatBRL(Number(listing.price))}
            </p>
            {isGoodDeal && (
              <p className="text-[11px] text-[#16855C] font-bold tracking-tight">Abaixo da FIPE</p>
            )}
          </div>
          <ChatStarter listingId={listing.id} />
        </div>
      </div>
    </motion.div>
  )
}
