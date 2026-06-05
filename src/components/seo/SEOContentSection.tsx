'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight, Zap, ShieldCheck, Heart, MapPin, BadgeCheck, MessageCircle, Star, Search, Shield, Clock, BadgeDollarSign, MessageSquare, Car, Check, ChevronRight } from 'lucide-react'
import { getCarImageUrl } from '@/lib/car-image-fallback'
import { FAQSchema } from './JSONLD'

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
    <section className={`py-20 md:py-28 max-[330px]:py-14 ${dark ? 'bg-[#17170F] text-white' : 'bg-transparent text-[#0A0A0A]'}`}>
      <div className="container">
        <div className={`flex flex-col items-center gap-12 lg:flex-row lg:gap-16 max-[330px]:gap-7 ${reversed ? 'lg:flex-row-reverse' : ''}`}>
          <div className="flex-1 space-y-6 max-[330px]:space-y-4">
            {badge && (
              <span className={`eyebrow ${dark ? 'text-white/50' : 'text-[#A3A3A3]'}`}>{badge}</span>
            )}
            <h2 className="text-balance">{title}</h2>
            {subtitle && (
              <p className={`body-large text-pretty ${dark ? 'text-white/60' : 'text-[#525252]'}`}>
                {subtitle}
              </p>
            )}
            <div className={`space-y-4 text-[15px] leading-relaxed max-[330px]:text-[13px] ${dark ? 'text-white/70' : 'text-[#525252]'}`}>
              {children}
            </div>
          </div>
          {image && (
            <div className="aspect-square w-full flex-1 overflow-hidden rounded-3xl border border-white/70 bg-white shadow-lg max-[330px]:rounded-2xl">
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
    <section className="bg-transparent py-20 md:py-28 max-[330px]:py-14">
      <FAQSchema items={items} />
      <div className="container max-w-3xl">
        <div className="mb-12 text-center max-[330px]:mb-6">
          <p className="eyebrow mb-3">Dúvidas frequentes</p>
          <h2 className="text-balance">Tudo o que você precisa saber</h2>
        </div>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="surface p-6 md:p-8 max-[330px]:p-4">
              <h3 className="mb-2 text-[16px] font-semibold tracking-normal text-[#0A0A0A] max-[330px]:text-[14px]">{item.q}</h3>
              <p className="text-[15px] leading-relaxed text-[#525252] max-[330px]:text-[13px]">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function SEOCallToAction({ title, description, buttonText, buttonHref }: { title: string, description: string, buttonText: string, buttonHref: string }) {
  return (
    <section className="py-20 md:py-28 max-[330px]:py-14">
      <div className="container">
        <div className="surface-dark p-10 text-center md:p-20 max-[330px]:p-5">
          <div className="mx-auto max-w-2xl space-y-6 max-[330px]:space-y-4">
            <h2 className="text-white text-balance">{title}</h2>
            <p className="body-large text-white/60 text-pretty">{description}</p>
            <div className="pt-4">
              <Link
                href={buttonHref}
                className="inline-flex min-h-[52px] max-w-full items-center justify-center gap-2 rounded-full bg-[#17170F] px-7 text-center text-[15px] font-bold text-[#FFFDF3] shadow-sm transition-colors hover:bg-[#2A2A1D] max-[330px]:min-h-11 max-[330px]:px-4 max-[330px]:text-[13px]"
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
    <section className="bg-transparent py-20 md:py-28 max-[330px]:py-14">
      <div className="container">
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-white/70 bg-white/70 shadow-lg md:grid-cols-3 max-[330px]:rounded-2xl">
          {items.map((item, idx) => (
            <div key={idx} className="group bg-white/90 p-8 md:p-10 max-[330px]:p-4">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D9F85F] transition-colors group-hover:bg-[#17170F] group-hover:text-white max-[330px]:mb-4 max-[330px]:h-9 max-[330px]:w-9">
                <IconResolver icon={item.icon} className="w-6 h-6 text-[#17170F] group-hover:text-white transition-colors" />
              </div>
              <h3 className="mb-2 text-[18px] font-semibold tracking-normal text-[#0A0A0A] max-[330px]:text-[15px]">{item.title}</h3>
              <p className="text-[15px] leading-relaxed text-[#525252] max-[330px]:text-[13px]">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
