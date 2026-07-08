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
    <section className={`fingen-section ${dark ? 'fingen-card-dark' : ''}`} style={dark ? { borderRadius: 0, margin: 0 } : undefined}>
      <div className="fingen-shell-content">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', alignItems: reversed ? 'flex-end' : 'flex-start', textAlign: reversed ? 'right' : 'left' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {badge && (
              <div className="fingen-section-label" style={dark ? { color: 'rgba(255,255,255,0.5)' } : undefined}>{badge}</div>
            )}
            <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 700, color: dark ? 'var(--color-accent)' : 'var(--color-text-primary)', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '12px', textAlign: 'left' }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{ fontSize: '15px', color: dark ? 'rgba(255,255,255,0.7)' : 'var(--color-text-secondary)', lineHeight: 1.7, textAlign: 'left' }}>
                {subtitle}
              </p>
            )}
            <div style={{ fontSize: '14px', color: dark ? 'rgba(255,255,255,0.7)' : 'var(--color-text-secondary)', lineHeight: 1.7, marginTop: '16px', textAlign: 'left' }}>
              {children}
            </div>
          </div>
          {image && (
            <div style={{ flex: 1, minWidth: 0, borderRadius: 'var(--radius-xl)', overflow: 'hidden', aspectRatio: '1' }}>
              <img src={getCarImageUrl(image) || image} alt={title} width={1080} height={1080} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export function FAQSection({ items }: { items: { q: string, a: string }[] }) {
  return (
    <section className="fingen-section">
      <div className="fingen-shell-content" style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="fingen-section-label">Dúvidas frequentes</div>
          <h2 className="fingen-section-title" style={{ marginTop: '8px' }}>Tudo o que você precisa saber</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map((item, idx) => (
            <div key={idx} className="fingen-card-white" style={{ padding: '20px 24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>{item.q}</h3>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function SEOCallToAction({ title, description, buttonText, buttonHref }: { title: string, description: string, buttonText: string, buttonHref: string }) {
  return (
    <section className="fingen-section">
      <div className="fingen-shell-content">
        <div className="fingen-card-dark" style={{ textAlign: 'center', padding: 'clamp(40px, 6vw, 80px) 32px' }}>
          <h2 style={{ fontSize: 'clamp(24px, 5vw, 40px)', fontWeight: 700, color: '#fff', marginBottom: '12px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>{title}</h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, maxWidth: '500px', margin: '0 auto 28px' }}>{description}</p>
          <Link
            href={buttonHref}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: 'var(--radius-full)', background: 'var(--color-accent)', color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '15px', textDecoration: 'none', transition: 'all 0.2s ease' }}
          >
            {buttonText} <ArrowRight size={16} />
          </Link>
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
    <section className="fingen-section">
      <div className="fingen-shell-content">
        <div className="fingen-grid-3">
          {items.map((item, idx) => (
            <div key={idx} className="fingen-card-white" style={{ padding: '28px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--color-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: 'var(--color-text-primary)' }}>
                <IconResolver icon={item.icon} className="w-6 h-6" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px' }}>{item.title}</h3>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
