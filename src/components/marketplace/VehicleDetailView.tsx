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
    { label: 'Carroceria', value: listing.body_type },
    { label: 'Motor', value: listing.engine || 'Não informado' },
    { label: 'Portas', value: listing.doors ? `${listing.doors} portas` : 'Não informado' },
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
      <motion.div variants={itemVariants} className="bg-white rounded-[40px] border border-black/5 p-8 sm:p-12 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-4">
              {listing.badges?.map(badge => (
                <span key={badge.key} className="bg-dark text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  {badge.label}
                </span>
              ))}
              {comparison.status === 'below' && (
                <span className="bg-green-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  Abaixo da FIPE
                </span>
              )}
              {listing.mileage < 30000 && (
                <span className="bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  Baixa KM
                </span>
              )}
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-dark tracking-tight leading-[0.9]">
              {listing.brand} {listing.model}
            </h1>
            <p className="mt-4 text-xl font-bold text-dark/40">
              {listing.version || 'Versão Standard'} • {listing.year}/{listing.year_model}
            </p>
            <div className="mt-6 flex items-center gap-2 text-dark/40 font-bold">
              <MapPin className="w-4 h-4" />
              <span>{listing.city}, {listing.state}</span>
            </div>
          </div>

          <div className="flex flex-col md:items-end gap-4">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-dark/30 mb-1">Preço especial</p>
              <p className="text-4xl sm:text-6xl font-black text-dark tracking-tighter">
                {formatBRL(Number(listing.price))}
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleShare}
                className="w-12 h-12 rounded-full border border-black/5 flex items-center justify-center text-dark/40 hover:bg-black/5 transition-all"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setIsFavorite(!isFavorite)}
                className={`w-12 h-12 rounded-full border border-black/5 flex items-center justify-center transition-all ${isFavorite ? 'bg-red-50 border-red-100 text-red-500' : 'text-dark/40 hover:bg-black/5'}`}
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
          <motion.div variants={itemVariants} className="bg-white rounded-[40px] border border-black/5 p-6 shadow-sm overflow-hidden">
            <ListingImageGallery 
              images={listing.images?.map(img => img.url) || []} 
              title={listing.title} 
            />
          </motion.div>

          {/* 3. Card Principal (Specs) */}
          <motion.div variants={itemVariants} className="bg-white rounded-[40px] border border-black/5 p-8 sm:p-12 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-[#f5f5f3] flex items-center justify-center">
                <Info className="w-5 h-5 text-dark/40" />
              </div>
              <h2 className="text-2xl font-black text-dark tracking-tight">Ficha do veículo</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-12">
              {mainSpecs.map(spec => (
                <div key={spec.label} className="bg-[#f5f5f3] rounded-3xl p-6 border border-black/5">
                  <spec.icon className="w-5 h-5 text-dark/20 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-dark/30 mb-1">{spec.label}</p>
                  <p className="text-sm font-bold text-dark">{spec.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
              {technicalSpecs.map(spec => (
                <div key={spec.label} className="flex items-center justify-between py-3 border-b border-black/5 last:sm:border-b last:border-b-0">
                  <span className="text-sm font-bold text-dark/40">{spec.label}</span>
                  <span className="text-sm font-black text-dark">{spec.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Technical Specs from Enrichment */}
          {enrichment && (
            <motion.div variants={itemVariants} className="bg-white rounded-[40px] border border-black/5 p-8 sm:p-12 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-[#f5f5f3] flex items-center justify-center">
                  <Settings2 className="w-5 h-5 text-dark/40" />
                </div>
                <h2 className="text-2xl font-black text-dark tracking-tight">Especificações técnicas</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {enrichment.powertrain && (
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-dark/30 mb-6">Motor e Performance</h3>
                    <div className="space-y-4">
                      {enrichment.powertrain.engine && (
                        <div className="flex justify-between border-b border-black/5 pb-3">
                          <span className="text-sm font-bold text-dark/40">Motor</span>
                          <span className="text-sm font-black text-dark">{enrichment.powertrain.engine}</span>
                        </div>
                      )}
                      {enrichment.powertrain.horsepower && (
                        <div className="flex justify-between border-b border-black/5 pb-3">
                          <span className="text-sm font-bold text-dark/40">Potência</span>
                          <span className="text-sm font-black text-dark">{enrichment.powertrain.horsepower} cv</span>
                        </div>
                      )}
                      {enrichment.powertrain.transmission && (
                        <div className="flex justify-between border-b border-black/5 pb-3">
                          <span className="text-sm font-bold text-dark/40">Transmissão</span>
                          <span className="text-sm font-black text-dark">{enrichment.powertrain.transmission}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {enrichment.dimensions && (
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-dark/30 mb-6">Dimensões e Capacidade</h3>
                    <div className="space-y-4">
                      {enrichment.dimensions.cargoCapacity && (
                        <div className="flex justify-between border-b border-black/5 pb-3">
                          <span className="text-sm font-bold text-dark/40">Porta-malas</span>
                          <span className="text-sm font-black text-dark">{enrichment.dimensions.cargoCapacity}L</span>
                        </div>
                      )}
                      {enrichment.dimensions.curbWeight && (
                        <div className="flex justify-between border-b border-black/5 pb-3">
                          <span className="text-sm font-bold text-dark/40">Peso</span>
                          <span className="text-sm font-black text-dark">{enrichment.dimensions.curbWeight} kg</span>
                        </div>
                      )}
                      {enrichment.dimensions.length && (
                        <div className="flex justify-between border-b border-black/5 pb-3">
                          <span className="text-sm font-bold text-dark/40">Comprimento</span>
                          <span className="text-sm font-black text-dark">{enrichment.dimensions.length} mm</span>
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
            <motion.div variants={itemVariants} className="bg-red-50 rounded-[40px] border border-red-100 p-8 sm:p-12 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-500">
                  <Info className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-black text-red-900 tracking-tight">Avisos de Recall</h2>
              </div>
              <div className="space-y-6">
                {enrichment.recalls.items.slice(0, 2).map((recall: any, idx: number) => (
                  <div key={idx} className="bg-white/50 rounded-3xl p-6 border border-red-100/50">
                    <p className="font-black text-red-900 mb-2">{recall.title}</p>
                    <p className="text-sm font-bold text-red-800/60 leading-relaxed">
                      {recall.description}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 7. Card Opcionais */}
          {listing.optional_items?.length > 0 && (
            <motion.div variants={itemVariants} className="bg-white rounded-[40px] border border-black/5 p-8 sm:p-12 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-[#f5f5f3] flex items-center justify-center">
                  <Settings2 className="w-5 h-5 text-dark/40" />
                </div>
                <h2 className="text-2xl font-black text-dark tracking-tight">Opcionais e acessórios</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {listing.optional_items.map(item => (
                  <div key={item} className="bg-[#f5f5f3] border border-black/5 px-5 py-3 rounded-2xl flex items-center gap-2 group">
                    <Check className="w-3 h-3 text-dark/20 group-hover:text-green-500 transition-colors" />
                    <span className="text-sm font-bold text-dark/60">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 6. Card Descrição */}
          {listing.description && (
            <motion.div variants={itemVariants} className="bg-white rounded-[40px] border border-black/5 p-8 sm:p-12 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-[#f5f5f3] flex items-center justify-center">
                  <Zap className="w-5 h-5 text-dark/40" />
                </div>
                <h2 className="text-2xl font-black text-dark tracking-tight">Descrição do anunciante</h2>
              </div>
              <div className={`relative ${!showFullDescription && listing.description.length > 500 ? 'max-h-48 overflow-hidden' : ''}`}>
                <p className="text-lg font-bold text-dark/60 leading-relaxed whitespace-pre-wrap">
                  {listing.description}
                </p>
                {!showFullDescription && listing.description.length > 500 && (
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
                )}
              </div>
              {listing.description.length > 500 && (
                <button 
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="mt-6 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-dark/40 hover:text-dark transition-colors"
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
          <motion.div variants={itemVariants} className="bg-white rounded-[40px] border border-black/5 p-8 sm:p-12 shadow-sm">
             <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-[#f5f5f3] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-dark/40" />
                </div>
                <h2 className="text-2xl font-black text-dark tracking-tight">Informações adicionais</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-sm font-bold text-dark/60">IPVA 2024 Pago</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-sm font-bold text-dark/60">Veículo Licenciado</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-sm font-bold text-dark/60">Possui Manual e Chave Reserva</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-sm font-bold text-dark/60">Aceita Troca</span>
                  </div>
                </div>
              </div>
          </motion.div>
        </div>

        <aside className="space-y-6">
          {/* 4. Card Preço & FIPE */}
          <motion.div variants={itemVariants} className="bg-white rounded-[40px] border border-black/5 p-8 shadow-sm sticky top-32">
            <div className="mb-8">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-dark/30 mb-2">Valor do anúncio</p>
              <p className="text-4xl font-black text-dark tracking-tighter">
                {formatBRL(Number(listing.price))}
              </p>
            </div>

            <div className="bg-[#f5f5f3] rounded-[32px] p-6 border border-black/5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-dark/40">Tabela FIPE</span>
                <span className="text-sm font-black text-dark">{listing.fipe_price ? formatBRL(Number(listing.fipe_price)) : '---'}</span>
              </div>
              
              {comparison.status !== 'unknown' && (
                <div className={`flex items-center gap-3 p-3 rounded-2xl ${
                  comparison.status === 'below' ? 'bg-green-500/10 text-green-600' :
                  comparison.status === 'near' ? 'bg-orange-500/10 text-orange-600' :
                  'bg-red-500/10 text-red-600'
                }`}>
                  {comparison.status === 'below' ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  <span className="text-xs font-black uppercase tracking-widest">
                    {comparison.status === 'below' ? 'Abaixo da FIPE' : 
                     comparison.status === 'near' ? 'Na média da FIPE' : 'Acima da FIPE'}
                  </span>
                </div>
              )}
              {listing.fipe_reference_month && (
                <p className="mt-4 text-[10px] font-bold text-dark/30 text-center uppercase tracking-widest">
                  Ref: {listing.fipe_reference_month}
                </p>
              )}
            </div>

            {/* 5. Card Vendedor */}
            <div className="mt-8 pt-8 border-t border-black/5">
              <div className="flex items-center gap-4 mb-6">
                {sellerInfo?.avatarUrl ? (
                  <img 
                    src={sellerInfo.avatarUrl} 
                    alt={sellerInfo.name} 
                    className="w-14 h-14 rounded-2xl object-cover border border-black/5" 
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#f5f5f3] flex items-center justify-center border border-black/5 text-dark/20">
                    <Zap className="w-6 h-6 fill-current" />
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-dark/30 mb-0.5">Vendedor</p>
                  <p className="text-lg font-black text-dark tracking-tight leading-none">{sellerInfo?.name || 'Particular'}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <ShieldCheck className="w-3 h-3 text-green-500" />
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Perfil Verificado</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <ChatStarter listingId={listing.id} />
                <button className="w-full h-14 bg-white border border-black/5 rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest text-dark hover:bg-[#f5f5f3] transition-all">
                  <Phone className="w-4 h-4" /> WhatsApp
                </button>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-[10px] font-bold text-dark/30 uppercase tracking-widest">
                  Anunciando desde {new Date(sellerInfo?.memberSince || Date.now()).getFullYear()}
                </p>
              </div>
            </div>
          </motion.div>
        </aside>
      </div>

      {/* 9. Área de Carros Semelhantes */}
      {relatedListings.length > 0 && (
        <motion.section variants={itemVariants} className="mt-20 pt-20 border-t border-black/5">
          <div className="flex items-center justify-between mb-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-dark/30 mb-2">Marketplace</p>
              <h2 className="text-4xl font-black text-dark tracking-tight">Veículos semelhantes</h2>
            </div>
            <Link href="/carros-a-venda" className="text-sm font-black uppercase tracking-widest text-dark/40 hover:text-dark transition-colors">
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
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 p-6 bg-white/80 backdrop-blur-xl border-t border-black/5">
        <div className="max-w-md mx-auto flex gap-4">
          <button className="flex-1 h-14 bg-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-dark/20">
            Tenho Interesse
          </button>
          <button className="w-14 h-14 bg-[#f5f5f3] text-dark rounded-2xl flex items-center justify-center border border-black/5">
            <MessageCircle className="w-6 h-6" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
