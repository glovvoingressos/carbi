'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Check, ChevronRight, Zap, ShieldCheck, Heart, ArrowRight } from 'lucide-react'

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
    <section className={`py-20 ${dark ? 'bg-dark text-white' : 'bg-white text-dark'}`}>
      <div className="container mx-auto max-w-6xl px-4">
        <div className={`flex flex-col lg:flex-row items-center gap-16 ${reversed ? 'lg:flex-row-reverse' : ''}`}>
          <div className="flex-1 space-y-8">
            {badge && (
              <span className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${dark ? 'bg-white/10 text-white' : 'bg-black/5 text-dark/40'}`}>
                {badge}
              </span>
            )}
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-[0.95]">
              {title}
            </h2>
            {subtitle && (
              <p className={`text-xl font-bold leading-relaxed ${dark ? 'text-white/60' : 'text-dark/50'}`}>
                {subtitle}
              </p>
            )}
            <div className={`space-y-6 text-lg font-medium leading-relaxed ${dark ? 'text-white/40' : 'text-dark/40'}`}>
              {children}
            </div>
          </div>
          {image && (
            <div className="flex-1 w-full aspect-square rounded-[40px] bg-black/5 overflow-hidden border border-black/5">
              <img src={image} alt={title} className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export function FAQSection({ items }: { items: { q: string, a: string }[] }) {
  return (
    <section className="py-24 bg-[#f5f5f3]">
      <div className="container mx-auto max-w-4xl px-4 text-center mb-16">
        <span className="text-[10px] font-black uppercase tracking-widest text-dark/30 mb-4 block">Dúvidas Frequentes</span>
        <h2 className="text-4xl sm:text-5xl font-black text-dark tracking-tight">Tudo o que você precisa saber</h2>
      </div>
      <div className="container mx-auto max-w-4xl px-4 grid gap-4">
        {items.map((item, idx) => (
          <div key={idx} className="bg-white rounded-[32px] p-8 border border-black/5 shadow-sm">
            <h3 className="text-xl font-black text-dark mb-4">{item.q}</h3>
            <p className="text-lg font-bold text-dark/40 leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function SEOCallToAction({ title, description, buttonText, buttonHref }: { title: string, description: string, buttonText: string, buttonHref: string }) {
  return (
    <section className="py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="bg-dark rounded-[48px] p-12 sm:p-20 text-center relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full -ml-48 -mb-48 blur-3xl" />
          
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl sm:text-7xl font-black text-white tracking-tight leading-[0.9]">
              {title}
            </h2>
            <p className="text-xl sm:text-2xl font-bold text-white/40 max-w-2xl mx-auto">
              {description}
            </p>
            <div className="pt-8">
              <Link 
                href={buttonHref}
                className="inline-flex h-20 items-center justify-center rounded-full bg-white px-12 text-lg font-black uppercase tracking-widest text-dark hover:scale-105 transition-all shadow-2xl shadow-white/10"
              >
                {buttonText} <ArrowRight className="ml-3 w-6 h-6" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function BenefitGrid({ items }: { items: { icon: any, title: string, description: string }[] }) {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto max-w-6xl px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {items.map((item, idx) => (
          <div key={idx} className="bg-[#f5f5f3] rounded-[40px] p-10 border border-black/5 group hover:bg-dark transition-all duration-500">
            <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
              <item.icon className="w-8 h-8 text-dark" />
            </div>
            <h3 className="text-2xl font-black text-dark tracking-tight mb-4 group-hover:text-white transition-colors">{item.title}</h3>
            <p className="text-lg font-bold text-dark/40 leading-relaxed group-hover:text-white/40 transition-colors">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
