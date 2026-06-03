'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  TrendingDown, TrendingUp, Calendar, 
  MapPin, Gauge, Fuel, Zap, 
  Settings2, ShieldCheck, Check,
  ChevronDown, ChevronUp, Share2,
  Heart, MessageCircle, Phone,
  Info
} from 'lucide-react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
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
    }
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6"
    >
      {/* 1. Header Section */}
      <motion.div variants={itemVariants} className="bg-white rounded-[32px] border border-border p-8 sm:p-12 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-4">
              {listing.badges?.map(badge => (
                <span key={badge.key} className="bg-bg-alt text-text-primary border border-border text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  {badge.label}
                </span>
              ))}
              {comparison.status === 'below' && (
                <span className="bg-green-50 text-green-600 border border-green-100 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  Abaixo da FIPE
                </span>
              )}
              {listing.mileage < 30000 && (
                <span className="bg-bg-alt text-text-secondary border border-border text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  Baixa KM
                </span>
              )}
            </div>
            <h1 className="text-4xl sm:text-6xl font-heading font-black text-text-primary tracking-tight leading-[0.9]">
              {listing.brand} {listing.model}
            </h1>
            <p className="mt-4 text-xl font-bold text-text-secondary">
              {listing.version || 'Versão Standard'} • {listing.year}/{listing.year_model}
            </p>
            <div className="mt-6 flex items-center gap-2 text-text-tertiary font-bold">
              <MapPin className="w-4 h-4" />
              <span>{listing.city}, {listing.state}</span>
            </div>
          </div>

          <div className="flex flex-col md:items-end gap-4">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-1">Preço especial</p>
              <p className="text-4xl sm:text-6xl font-black text-text-primary tracking-tighter">
                {formatBRL(Number(listing.price))}
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleShare}
                className="w-12 h-12 rounded-full border border-border bg-bg-alt flex items-center justify-center text-text-secondary hover:text-accent hover:border-accent transition-all shadow-sm"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setIsFavorite(!isFavorite)}
                className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all ${isFavorite ? 'bg-red-50 border-red-200 text-red-500' : 'border-border bg-bg-alt text-text-secondary hover:text-red-500 hover:border-red-200'}`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-8">
          {/* 2. Gallery */}
          <motion.div variants={itemVariants} className="bg-white rounded-[32px] border border-black/5 p-4 sm:p-6 shadow-sm overflow-hidden">
            <ListingImageGallery 
              images={listing.images?.map(img => img.url) || []} 
              title={listing.title} 
            />
          </motion.div>

          {/* 3. Card Principal (Specs) */}
          <motion.div variants={itemVariants} className="bg-white rounded-[32px] border border-border p-8 sm:p-12 shadow-sm">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-bg-alt flex items-center justify-center">
                <Info className="w-6 h-6 text-accent" />
              </div>
              <h2 className="text-3xl font-heading font-black text-text-primary tracking-tight">Ficha do veículo</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
              {mainSpecs.map(spec => (
                <div key={spec.label} className="bg-bg-alt rounded-[24px] p-6 border border-border group hover:border-accent transition-colors">
                  <spec.icon className="w-6 h-6 text-text-tertiary mb-4 group-hover:text-accent transition-colors" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">{spec.label}</p>
                  <p className="text-sm font-black text-text-primary">{spec.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
              {technicalSpecs.map(spec => (
                <div key={spec.label} className="flex items-center justify-between py-4 border-b border-border last:sm:border-b last:border-b-0 group">
                  <span className="text-sm font-bold text-text-secondary/70 group-hover:text-text-primary transition-colors">{spec.label}</span>
                  <span className="text-sm font-black text-text-primary">{spec.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Technical Specs from Enrichment */}
          {enrichment && (
            <motion.div variants={itemVariants} className="bg-white rounded-[32px] border border-border p-8 sm:p-12 shadow-sm">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-bg-alt flex items-center justify-center">
                  <Settings2 className="w-6 h-6 text-accent" />
                </div>
                <h2 className="text-3xl font-heading font-black text-text-primary tracking-tight">Especificações técnicas</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {enrichment.powertrain && (
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-accent mb-6 bg-bg-alt inline-block px-3 py-1 rounded-full border border-border">Motor e Performance</h3>
                    <div className="space-y-4">
                      {enrichment.powertrain.engine && (
                        <div className="flex justify-between border-b border-border pb-4">
                          <span className="text-sm font-bold text-text-secondary/70">Motor</span>
                          <span className="text-sm font-black text-text-primary">{enrichment.powertrain.engine}</span>
                        </div>
                      )}
                      {enrichment.powertrain.horsepower && (
                        <div className="flex justify-between border-b border-border pb-4">
                          <span className="text-sm font-bold text-text-secondary/70">Potência</span>
                          <span className="text-sm font-black text-text-primary">{enrichment.powertrain.horsepower} cv</span>
                        </div>
                      )}
                      {enrichment.powertrain.transmission && (
                        <div className="flex justify-between border-b border-border pb-4">
                          <span className="text-sm font-bold text-text-secondary/70">Transmissão</span>
                          <span className="text-sm font-black text-text-primary">{enrichment.powertrain.transmission}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {enrichment.dimensions && (
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-accent mb-6 bg-bg-alt inline-block px-3 py-1 rounded-full border border-border">Dimensões e Capacidade</h3>
                    <div className="space-y-4">
                      {enrichment.dimensions.cargoCapacity && (
                        <div className="flex justify-between border-b border-border pb-4">
                          <span className="text-sm font-bold text-text-secondary/70">Porta-malas</span>
                          <span className="text-sm font-black text-text-primary">{enrichment.dimensions.cargoCapacity}L</span>
                        </div>
                      )}
                      {enrichment.dimensions.curbWeight && (
                        <div className="flex justify-between border-b border-border pb-4">
                          <span className="text-sm font-bold text-text-secondary/70">Peso</span>
                          <span className="text-sm font-black text-text-primary">{enrichment.dimensions.curbWeight} kg</span>
                        </div>
                      )}
                      {enrichment.dimensions.length && (
                        <div className="flex justify-between border-b border-border pb-4">
                          <span className="text-sm font-bold text-text-secondary/70">Comprimento</span>
                          <span className="text-sm font-black text-text-primary">{enrichment.dimensions.length} mm</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Recalls */}
          {enrichment?.recalls?.count > 0 && (
            <motion.div variants={itemVariants} className="bg-red-50 rounded-[32px] border border-red-100 p-8 sm:p-12 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shadow-sm shadow-red-500/20">
                  <Info className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-heading font-black text-red-900 tracking-tight">Avisos de Recall</h2>
              </div>
              <div className="space-y-6">
                {enrichment.recalls.items.slice(0, 2).map((recall: any, idx: number) => (
                  <div key={idx} className="bg-white rounded-3xl p-6 border border-red-100 shadow-sm">
                    <p className="font-black text-red-900 mb-2">{recall.title}</p>
                    <p className="text-sm font-bold text-red-800/70 leading-relaxed">
                      {recall.description}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 7. Card Opcionais */}
          {listing.optional_items?.length > 0 && (
            <motion.div variants={itemVariants} className="bg-white rounded-[32px] border border-border p-8 sm:p-12 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-bg-alt flex items-center justify-center">
                  <Settings2 className="w-6 h-6 text-accent" />
                </div>
                <h2 className="text-3xl font-heading font-black text-text-primary tracking-tight">Opcionais e acessórios</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {listing.optional_items.map(item => (
                  <div key={item} className="bg-bg-alt border border-border px-5 py-3 rounded-2xl flex items-center gap-3 group hover:border-accent hover:bg-white transition-all shadow-sm hover:shadow-md">
                    <Check className="w-4 h-4 text-text-tertiary group-hover:text-accent transition-colors" />
                    <span className="text-sm font-bold text-text-secondary group-hover:text-text-primary">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 6. Card Descrição */}
          {listing.description && (
            <motion.div variants={itemVariants} className="bg-white rounded-[32px] border border-border p-8 sm:p-12 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-bg-alt flex items-center justify-center">
                  <Zap className="w-6 h-6 text-accent" />
                </div>
                <h2 className="text-3xl font-heading font-black text-text-primary tracking-tight">Descrição do anunciante</h2>
              </div>
              <div className={`relative ${!showFullDescription && listing.description.length > 500 ? 'max-h-64 overflow-hidden' : ''}`}>
                <p className="text-base sm:text-lg font-medium text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {listing.description}
                </p>
                {!showFullDescription && listing.description.length > 500 && (
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent" />
                )}
              </div>
              {listing.description.length > 500 && (
                <button 
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-accent hover:text-accent-dark transition-colors"
                >
                  {showFullDescription ? (
                    <>Ver menos <ChevronUp className="w-4 h-4" /></>
                  ) : (
                    <>Ver descrição completa <ChevronDown className="w-4 h-4" /></>
                  )}
                </button>
              )}
            </motion.div>
          )}

          {/* 8. Informações Adicionais */}
          <motion.div variants={itemVariants} className="bg-white rounded-[32px] border border-border p-8 sm:p-12 shadow-sm">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-bg-alt flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-accent" />
                </div>
                <h2 className="text-3xl font-heading font-black text-text-primary tracking-tight">Informações adicionais</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shadow-sm shadow-green-500/10">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-base font-bold text-text-secondary">IPVA 2024 Pago</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shadow-sm shadow-green-500/10">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-base font-bold text-text-secondary">Veículo Licenciado</span>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shadow-sm shadow-green-500/10">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-base font-bold text-text-secondary">Possui Manual e Chave Reserva</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shadow-sm shadow-green-500/10">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-base font-bold text-text-secondary">Aceita Troca</span>
                  </div>
                </div>
              </div>
          </motion.div>
        </div>

        <aside className="space-y-6">
          {/* 4. Card Preço & FIPE */}
          <motion.div variants={itemVariants} className="bg-white rounded-[32px] border border-border p-8 shadow-sm sticky top-32">
            <div className="mb-8">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary mb-2">Valor do anúncio</p>
              <p className="text-5xl font-black text-text-primary tracking-tighter">
                {formatBRL(Number(listing.price))}
              </p>
            </div>

            <div className="bg-bg-alt rounded-[24px] p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Tabela FIPE</span>
                <span className="text-base font-black text-text-primary">{listing.fipe_price ? formatBRL(Number(listing.fipe_price)) : '---'}</span>
              </div>
              
              {comparison.status !== 'unknown' && (
                <div className={`flex items-center gap-3 p-4 rounded-2xl shadow-sm ${
                  comparison.status === 'below' ? 'bg-white border border-green-100 text-green-600' :
                  comparison.status === 'near' ? 'bg-white border border-orange-100 text-orange-600' :
                  'bg-white border border-red-100 text-red-600'
                }`}>
                  {comparison.status === 'below' ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                  <span className="text-xs font-black uppercase tracking-widest">
                    {comparison.status === 'below' ? 'Abaixo da FIPE' : 
                     comparison.status === 'near' ? 'Na média da FIPE' : 'Acima da FIPE'}
                  </span>
                </div>
              )}
              {listing.fipe_reference_month && (
                <p className="mt-4 text-[10px] font-bold text-text-tertiary text-center uppercase tracking-widest">
                  Ref: {listing.fipe_reference_month}
                </p>
              )}
            </div>

            {/* 5. Card Vendedor */}
            <div className="mt-8 pt-8 border-t border-border">
              <div className="flex items-center gap-4 mb-6">
                {sellerInfo?.avatarUrl ? (
                  <img 
                    src={sellerInfo.avatarUrl} 
                    alt={sellerInfo.name} 
                    className="w-16 h-16 rounded-2xl object-cover border border-border shadow-sm" 
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-bg-alt flex items-center justify-center border border-border text-accent shadow-sm">
                    <Zap className="w-8 h-8 fill-current" />
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">Vendedor Parceiro</p>
                  <p className="text-xl font-heading font-black text-text-primary tracking-tight leading-none mb-2">{sellerInfo?.name || 'Particular'}</p>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Perfil Verificado</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <ChatStarter listingId={listing.id} />
                <button className="w-full h-14 bg-white border border-border rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest text-text-primary hover:bg-bg-alt hover:border-text-secondary shadow-sm transition-all">
                  <Phone className="w-5 h-5 text-text-secondary" /> Mostrar Telefone
                </button>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                  Anunciando desde {new Date(sellerInfo?.memberSince || Date.now()).getFullYear()}
                </p>
              </div>
            </div>
          </motion.div>
        </aside>
      </div>

      {/* 9. Área de Carros Semelhantes */}
      {relatedListings.length > 0 && (
        <motion.section variants={itemVariants} className="mt-20 pt-20 border-t border-border">
          <div className="flex items-center justify-between mb-10">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-accent mb-2">Marketplace Premium</p>
              <h2 className="text-4xl font-heading font-black text-text-primary tracking-tight">Veículos semelhantes</h2>
            </div>
            <Link href="/carros-a-venda" className="btn btn-secondary px-6 py-3">
              Ver todos
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedListings.map(item => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </motion.section>
      )}

      {/* Mobile Floating CTA */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 p-6 bg-white/90 backdrop-blur-xl border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto flex gap-4">
          <button className="btn btn-primary flex-1">
            Tenho Interesse
          </button>
          <button className="w-14 h-14 bg-bg-alt text-text-secondary rounded-2xl flex items-center justify-center border border-border hover:text-accent hover:border-accent transition-colors shadow-sm">
            <MessageCircle className="w-6 h-6" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
