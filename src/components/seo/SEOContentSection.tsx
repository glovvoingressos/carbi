'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight, Zap, ShieldCheck, Heart, MapPin, BadgeCheck, MessageCircle, Star, Search, Shield, Clock, BadgeDollarSign, MessageSquare, Car, Check, ChevronRight } from 'lucide-react'
import { getCarImageUrl } from '@/lib/car-image-fallback'

interface SEOSectionProps {
  title: string
  subtitle?: string
  badge?: string
  children: ReactNode
  dark?: boolean
  reversed?: boolean
  image?: string
}

export function SEOSection({ title, subtitle, badge, children, dark, reversed, image }: SEOSectionProps) {
  return (
    <section className={`py-20 md:py-28 ${dark ? 'bg-[#0A0A0A] text-white' : 'bg-white text-[#0A0A0A]'}`}>
      <div className="container">
        <div className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-16 ${reversed ? 'lg:flex-row-reverse' : ''}`}>
          <div className="flex-1 space-y-6">
            {badge && (
              <span className={`eyebrow ${dark ? 'text-white/50' : 'text-[#A3A3A3]'}`}>{badge}</span>
            )}
            <h2 className="text-balance">{title}</h2>
            {subtitle && (
              <p className={`body-large text-pretty ${dark ? 'text-white/60' : 'text-[#525252]'}`}>
                {subtitle}
              </p>
            )}
            <div className={`space-y-4 text-[15px] leading-relaxed ${dark ? 'text-white/70' : 'text-[#525252]'}`}>
              {children}
            </div>
          </div>
          {image && (
            <div className="flex-1 w-full aspect-square rounded-2xl bg-[#FAFAF9] overflow-hidden border border-[#EAEAE8]">
              <img src={getCarImageUrl(image) || image} alt={title} width={1080} height={1080} className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export function FAQSection({ items }: { items: { q: string, a: string }[] }) {
  return (
    <section className="py-20 md:py-28 bg-[#FAFAF9]">
      <div className="container max-w-3xl">
        <div className="text-center mb-12">
          <p className="eyebrow mb-3">Dúvidas frequentes</p>
          <h2 className="text-balance">Tudo o que você precisa saber</h2>
        </div>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 md:p-8 border border-[#EAEAE8]">
              <h3 className="text-[16px] font-semibold text-[#0A0A0A] mb-2 tracking-tight">{item.q}</h3>
              <p className="text-[15px] text-[#525252] leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function SEOCallToAction({ title, description, buttonText, buttonHref }: { title: string, description: string, buttonText: string, buttonHref: string }) {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="bg-[#0A0A0A] rounded-2xl p-10 md:p-20 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-white text-balance">{title}</h2>
            <p className="body-large text-white/60 text-pretty">{description}</p>
            <div className="pt-4">
              <Link
                href={buttonHref}
                className="inline-flex items-center justify-center gap-2 bg-white text-[#0A0A0A] hover:bg-white/90 transition-colors rounded-full min-h-[52px] px-7 text-[15px] font-medium"
              >
                {buttonText} <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const ICON_MAP: Record<string, any> = {
  MapPin, BadgeCheck, MessageCircle, Star, Zap, ShieldCheck,
  Search, Shield, Clock, Heart, BadgeDollarSign, MessageSquare,
  Car, Check, ChevronRight,
}

function IconResolver({ icon, className }: { icon: any, className?: string }) {
  if (!icon) return null
  if (typeof icon === 'string') {
    const IconComponent = ICON_MAP[icon] || Zap
    return <IconComponent className={className} />
  }
  const IconComponent = icon
  return <IconComponent className={className} />
}

export function BenefitGrid({ items }: { items: { icon: any, title: string, description: string }[] }) {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#EAEAE8] border border-[#EAEAE8] rounded-2xl overflow-hidden">
          {items.map((item, idx) => (
            <div key={idx} className="bg-white p-8 md:p-10 group">
              <div className="w-12 h-12 rounded-2xl bg-[#FAFAF9] flex items-center justify-center mb-6 group-hover:bg-[#0A0A0A] group-hover:text-white transition-colors">
                <IconResolver icon={item.icon} className="w-6 h-6 text-[#0A0A0A] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-[18px] font-semibold text-[#0A0A0A] tracking-tight mb-2">{item.title}</h3>
              <p className="text-[15px] text-[#525252] leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
